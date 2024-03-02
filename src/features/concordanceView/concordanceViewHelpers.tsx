import { AlignmentSide, CorpusContainer, Link, Word } from '../../structs';
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
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

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
 * generate list (alphabetical) of word texts from alignment link, container and side directive
 * @param container corpora with data to reference strings from
 * @param link link data to where word ids are listed
 * @param side side to pull word ids from
 */
const generateWordListFromCorpusContainerAndLink = (
  container: CorpusContainer,
  link: Link,
  side: AlignmentSide
): string[] => {
  const partsList = link[side]
    .map(BCVWP.parseFromString)
    .map((reference) => findWord(container.corpora, reference))
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList).map((parts) =>
    parts.map(({ text }) => text.trim().toLowerCase()).join('')
  );
};

/**
 * gnerate a map of normalized text to alignment links
 * @param alignmentState application state
 * @param sourceContainer corpus container for sources
 * @param targetContainer corpus container for targets
 */
export const generateAlignedWordsMap = (
  links: Link[],
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer
): NormalizedTextToAlignmentLink => {
  const linkMap = links.reduce((accumulator, singleAlignment) => {
    const srcWordsList = _.uniqWith(
      generateWordListFromCorpusContainerAndLink(
        sourceContainer,
        singleAlignment,
        'sources'
      ),
      _.isEqual
    ).sort();
    const tgtWordsList = _.uniqWith(
      generateWordListFromCorpusContainerAndLink(
        targetContainer,
        singleAlignment,
        'targets'
      ),
      _.isEqual
    ).sort();
    const uniqueAlignedWords = [...srcWordsList, ...tgtWordsList];

    const alignedWordsString = uniqueAlignedWords.sort().join(',');

    if (!accumulator[alignedWordsString]) {
      accumulator[alignedWordsString] = [];
    }

    accumulator[alignedWordsString].push(singleAlignment);
    return accumulator;
  }, {} as { [key: string]: Link[] });

  const accumulator = {} as NormalizedTextToAlignmentLink;

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
};

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
                position: wort.id,
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
                position: wort.id,
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
          (a, b): boolean => a.text === b.text
        ).sort(),
        targetWordTexts: _.uniqWith(
          sourceAndTargetWords.targetWords,
          (a, b): boolean => a.text === b.text
        ).sort(),
        alignments: normalizedTextToAlignmentLinks[key],
      };
    })
    .forEach((alignedWord: AlignedWord) => {
      (wordSource === WordSource.SOURCE
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
