import { Alignment, CorpusContainer, Link } from '../../structs';
import {
  AlignedWord,
  LocalizedWordEntry,
  NormalizedTextToAlignmentLink,
  NormalizedTextToPivotWord,
  NormalizedWordsToFrequencyAndLocalization,
  PivotWord,
} from './structs';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';
import findWord from '../../helpers/findWord';
import { WordSource } from './concordanceView';

/**
 * generate words and frequencies from a word source
 * @param wordSource word source to generate words keyed to frequencies and correct language info
 */
export const generateAllWordsAndFrequencies = (
  wordSource?: CorpusContainer
): NormalizedWordsToFrequencyAndLocalization | undefined =>
  wordSource?.corpora
    ?.flatMap((corpus) => {
      return corpus.words
        .map((word) => word.text)
        .filter((value) => !!value)
        .map((text) => ({
          text,
          languageInfo: corpus.language,
        }));
    })
    .reduce((accumulator, currentValue) => {
      const key = currentValue.text.toLowerCase();
      if (!accumulator[key]) {
        accumulator[key] = {
          count: 0,
          languageInfo: currentValue.languageInfo,
        };
      }
      ++accumulator[key].count;
      return accumulator;
    }, {} as NormalizedWordsToFrequencyAndLocalization);

/**
 * generate a map of normalized pivot word text to the corresponding pivot words, used to generate the data displayed
 * in tables in the concordance view
 * @param wordsAndFrequencies
 */
export const generatePivotWordsMap = (
  wordsAndFrequencies: NormalizedWordsToFrequencyAndLocalization
): NormalizedTextToPivotWord =>
  Object.keys(wordsAndFrequencies)
    .filter((key) => !!wordsAndFrequencies[key])
    .map((key) => {
      return {
        normalizedText: key,
        frequency: wordsAndFrequencies[key].count,
        languageInfo: wordsAndFrequencies[key].languageInfo,
      } as PivotWord;
    })
    .reduce((accumulator, currentValue) => {
      accumulator[currentValue.normalizedText] = currentValue;
      return accumulator;
    }, {} as NormalizedTextToPivotWord);

/**
 * gnerate a map of normalized text to alignment links
 * @param alignmentState application state
 * @param sourceContainer corpus container for sources
 * @param targetContainer corpus container for targets
 * @param wordSource selected word source
 */
export const generateAlignedWordsMap = (
  alignmentState: Alignment[],
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  wordSource: WordSource
): NormalizedTextToAlignmentLink =>
  alignmentState
    ?.map((alignmentData: Alignment) => {
      const src = wordSource === 'source' ? sourceContainer : targetContainer;
      return alignmentData.links.reduce((accumulator, singleAlignment) => {
        const uniqueAlignedWords = _.uniqWith(
          singleAlignment[wordSource === 'source' ? 'sources' : 'targets']
            .map(BCVWP.parseFromString) // get references to all words on selected side of the alignment
            .map((wordReference: BCVWP) => findWord(src.corpora, wordReference))
            .filter((word) => !!word)
            .map((word) => word!.text.toLowerCase()),
          _.isEqual
        );

        const alignedWordsString = uniqueAlignedWords.sort().join(',');

        if (!accumulator[alignedWordsString]) {
          accumulator[alignedWordsString] = [];
        }

        accumulator[alignedWordsString].push(singleAlignment);
        return accumulator;
      }, {} as { [key: string]: Link[] });
    })
    ?.reduce((accumulator, linkMap) => {
      Object.keys(linkMap)
        .filter((key) => !!linkMap[key] && Array.isArray(linkMap[key]))
        .forEach((key) => {
          if (!accumulator[key]) {
            accumulator[key] = linkMap[key];
          } else {
            linkMap[key].forEach((link) => accumulator[key].push(link));
          }
        });
      return accumulator;
    }, {} as NormalizedTextToAlignmentLink);

/**
 * generates a list of pivot words with aligned words and alignment links
 * @param pivotWordsMap map of word text to pivot words
 * @param sourceContainer source corpora
 * @param targetContainer target corpora
 * @param normalizedTextToAlignmentLinks text to alignment link map
 * @param wordSource 'source' or 'target'
 */
export const generateListOfNavigablePivotWords = (
  pivotWordsMap: NormalizedTextToPivotWord,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  normalizedTextToAlignmentLinks: NormalizedTextToAlignmentLink,
  wordSource: WordSource
): PivotWord[] => {
  const sourceTextId = sourceContainer.id;
  const targetTextId = targetContainer.id;

  Object.keys(normalizedTextToAlignmentLinks)
    .filter((key) => !!normalizedTextToAlignmentLinks[key])
    .map((key: string): AlignedWord => {
      const frequency = normalizedTextToAlignmentLinks[key].length;

      const sourceAndTargetWords = normalizedTextToAlignmentLinks[key]
        .map((value: Link) => {
          const sourceWords = value.sources
            .map(BCVWP.parseFromString)
            .map((ref: BCVWP) => {
              const wort = findWord(sourceContainer.corpora, ref);
              const languageInfo =
                sourceContainer.corpusAtReference(ref)?.language;
              if (!wort) return undefined;
              return {
                text: wort.text.toLowerCase(),
                languageInfo,
              };
            })
            .filter((v) => !!v);
          const targetWords = value.targets
            .map(BCVWP.parseFromString)
            .map((ref: BCVWP) => {
              const wort = findWord(targetContainer.corpora, ref);
              const languageInfo =
                targetContainer.corpusAtReference(ref)?.language;
              if (!wort) return undefined;
              return {
                text: wort.text.toLowerCase(),
                languageInfo,
              };
            })
            .filter((v) => !!v);
          return {
            sourceWords,
            targetWords,
          } as {
            sourceWords: LocalizedWordEntry[];
            targetWords: LocalizedWordEntry[];
          };
        })
        .reduce(
          (accumulator, currentValue) => {
            currentValue.sourceWords.forEach((current) =>
              accumulator.sourceWords.push(current)
            );
            currentValue.targetWords.forEach((current) =>
              accumulator.targetWords.push(current)
            );
            return accumulator;
          },
          {
            sourceWords: [] as LocalizedWordEntry[],
            targetWords: [] as LocalizedWordEntry[],
          }
        );

      return {
        id: key,
        frequency,
        sourceTextId,
        targetTextId,
        sourceWordTexts: _.uniqWith(
          sourceAndTargetWords.sourceWords,
          _.isEqual
        ).sort(),
        targetWordTexts: _.uniqWith(
          sourceAndTargetWords.targetWords,
          _.isEqual
        ).sort(),
        alignments: normalizedTextToAlignmentLinks[key],
      };
    })
    .forEach((alignedWord: AlignedWord) => {
      (wordSource === 'source'
        ? alignedWord.sourceWordTexts
        : alignedWord.targetWordTexts
      ).forEach((wordEntry: LocalizedWordEntry) => {
        if (!pivotWordsMap[wordEntry.text]) {
          return;
        }
        if (!pivotWordsMap[wordEntry.text].alignedWords) {
          pivotWordsMap[wordEntry.text].alignedWords = [];
        }
        if (
          !pivotWordsMap[wordEntry.text].alignedWords!.includes(alignedWord)
        ) {
          pivotWordsMap[wordEntry.text].alignedWords!.push(alignedWord);
        }
      });
    });

  return Object.values(pivotWordsMap);
};
