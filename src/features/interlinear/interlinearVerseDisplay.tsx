import { WordDisplay } from '../wordDisplay';
import { Corpus, Link, NamedContainers, TextDirection, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { Stack } from '@mui/material';
import { AppContext } from '../../App';
import { createInterlinearMap, LinkWords } from '../../helpers/createInterlinearMap';

export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers: NamedContainers;
  verse: Verse;
  allowGloss?: boolean;
}

const REPEATED_LINK_PLACEHOLDER_CHAR = '\u2022';

const determineInterlinearVerseTargetView = (
  corpus: Corpus,
  wordMap: Map<string, LinkWords[]>,
  displayedLinkIds: Set<string>,
  sourceTokens: Word[],
  differentLanguageDirections = false,
  allowGloss = false
) => {
  if (!wordMap || wordMap.size < 1) {
    return <></>;
  }
  const targetLinkWords =
    (sourceTokens?.map(token => wordMap?.get(token.id) ?? [])
      .filter(Boolean) ?? [])
      .flat();
  if (targetLinkWords.length < 1) {
    return <></>;
  }
  const targetLinkMap = new Map<string, Link[]>();
  wordMap.values().forEach(linkWords =>
    linkWords.forEach(linkWord =>
      linkWord.words.forEach(targetWord => {
        const targetLinks = targetLinkMap.get(targetWord.id) ?? [];
        targetLinks.push(linkWord.link);
        targetLinkMap.set(targetWord.id, targetLinks);
      })));
  return <Stack
    direction={'row'}
    useFlexGap
    spacing={0}>
    {(targetLinkWords.map((linkWords, linkWordIndex) => {
      const workTokenWords = displayedLinkIds?.has(linkWords.link.id!)
        ? [linkWords.words[0]]
          .map(linkWord => ({
            ...linkWord,
            text: REPEATED_LINK_PLACEHOLDER_CHAR,
            after: undefined
          }))
        : linkWords.words;
      displayedLinkIds?.add(linkWords.link.id!);
      const targetTokenWords = groupPartsIntoWords(workTokenWords);
      return targetTokenWords
        .sort((leftWords, rightWords) =>
          (leftWords.at(0)?.id ?? '')
            .localeCompare(rightWords.at(0)?.id ?? '')
          * (differentLanguageDirections ? -1 : 1))
        .map((tokens, tokensIndex) =>
          <WordDisplay
            key={`interlinear/${corpus?.id}/${linkWordIndex}/${tokensIndex}/${tokens.at(0)?.id}`}
            links={targetLinkMap}
            corpus={corpus}
            parts={tokens}
            allowGloss={allowGloss}
          />);
    }).filter(Boolean) ?? [])
      .flat()}
  </Stack>;
};

const determineInterlinearVerseView = (
  containers: NamedContainers,
  verse: Verse,
  wordMap?: Map<string, LinkWords[]>,
  allowGloss: boolean = false
) => {
  if (!containers.isComplete() || !wordMap) {
    return [];
  }
  const verseRef = verse.bcvId.toReferenceString();
  const sourceCorpus = containers?.sources?.corpusAtReferenceString(verseRef);
  const targetCorpus = containers?.targets?.corpusAtReferenceString(verseRef);
  const differentLanguageDirections =
    (sourceCorpus?.language.textDirection ?? TextDirection.LTR)
    !== (targetCorpus?.language.textDirection ?? TextDirection.LTR);
  const verseTokens: Word[][] = groupPartsIntoWords(verse.words);
  const sourceLinkMap = new Map<string, Link[]>();
  wordMap.forEach((linkWords, sourceWordId) => {
    const sourceLinks = sourceLinkMap.get(sourceWordId) ?? [];
    sourceLinks.push(...linkWords.map(linkWord => linkWord.link));
    sourceLinkMap.set(sourceWordId, sourceLinks);
  });
  const displayedLinkIds = new Set<string>();
  return (verseTokens || [])
    .map((wordTokens: Word[], wordIndex): ReactElement =>
      <Stack
        direction={'row'}
        useFlexGap
        spacing={2}>
        <Stack
          direction={'column'}
          useFlexGap
          spacing={0}>
          <WordDisplay
            key={`interlinear/${sourceCorpus?.id}/${wordIndex}/${wordTokens.at(0)?.id}`}
            links={sourceLinkMap}
            corpus={sourceCorpus}
            parts={wordTokens}
            allowGloss={allowGloss}
          />
          {targetCorpus && determineInterlinearVerseTargetView(
            targetCorpus, wordMap,
            displayedLinkIds, wordTokens,
            differentLanguageDirections, allowGloss)}
        </Stack>
      </Stack>
    );
};

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param verse verse to be displayed
 * @param allowGloss boolean denoting whether to display gloss information if available.
 * @constructor
 */
export const InterlinearVerseDisplay = ({
                                          containers,
                                          verse,
                                          allowGloss = false
                                        }: InterlinearVerseDisplayProps) => {
  const { projectState } = useContext(AppContext);
  const [wordMap, setWordMap] = useState<Map<string, LinkWords[]> | undefined>();
  const [verseElements, setVerseElements] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!containers.isComplete()) {
      return;
    }
    createInterlinearMap(projectState.linksTable, [verse], containers?.targets!)
      .then(setWordMap);
  }, [projectState.linksTable, verse, containers]);

  useEffect(() => {
    if (!containers.isComplete()) {
      return;
    }
    setVerseElements(
      determineInterlinearVerseView(
        containers, verse, wordMap, allowGloss));
  }, [allowGloss, containers, verse, wordMap]);

  return <>
    {(verseElements?.length ?? 0) > 0
      ? verseElements
      : <></>}
  </>;
};
