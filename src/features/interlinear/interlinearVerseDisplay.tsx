import { WordDisplay } from '../wordDisplay';
import { Corpus, Link, NamedContainers, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { Stack } from '@mui/material';
import { AppContext } from '../../App';
import { createInterlinearMap, InterlinearMap } from '../../helpers/createInterlinearMap';

export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers: NamedContainers;
  verse: Verse;
  allowGloss?: boolean;
}

const REPEATED_LINK_PLACEHOLDER_CHAR = '\u2022';

/**
 * Renders the target word side of the interlinear map.
 * @param interlinearMap
 * @param sourceCorpus
 * @param sourceTokens
 * @param displayedLinkIds
 * @param allowGloss
 */
const determineInterlinearVerseTargetView = (
  interlinearMap: InterlinearMap,
  sourceCorpus: Corpus,
  sourceTokens: Word[],
  displayedLinkIds: Set<string>,
  allowGloss = false
) => {
  if (!interlinearMap.containers.isComplete()
    || interlinearMap.sourceMap.size < 1) {
    return <></>;
  }

  /**
   * Nuts and bolts of render code.
   */
  const createView = () => {
    // reduce source map to lists of links and words
    const targetLinkWords =
      (sourceTokens?.map(sourceToken => interlinearMap.sourceMap?.get(sourceToken.id) ?? [])
        .filter(Boolean) ?? [])
        .flat();

    // reduce lists of links and words to tokens
    const targetTokens =
      (targetLinkWords.map(targetLinkWord => targetLinkWord.words)
        .filter(Boolean) ?? [])
        .flat();
    if (targetTokens.length < 1) {
      return <></>;
    }

    // figure out if there's source/target language direction mismatch
    const targetCorpus = interlinearMap.containers.targets?.corpusAtReferenceString(targetTokens[0].id);
    if (!targetCorpus) {
      return <></>;
    }
    const differentLanguageDirections =
      sourceCorpus.language.textDirection
      !== targetCorpus.language.textDirection;

    // reduce lists of links and words to a map of word IDs to links
    const targetLinkMap = new Map<string, Link[]>();
    targetLinkWords.forEach(linkWords =>
      linkWords.words.forEach(targetToken => {
        const targetLinks = targetLinkMap.get(targetToken.id) ?? [];
        targetLinks.push(linkWords.link);
        targetLinkMap.set(targetToken.id, targetLinks);
      }));

    // replace with placeholder, as needed
    const compressedTokens =
      targetLinkWords.some(linkWords =>
        displayedLinkIds?.has(linkWords.link.id!))
        ? [targetTokens[0]]
          .map(linkWord => ({
            ...linkWord,
            text: REPEATED_LINK_PLACEHOLDER_CHAR,
            after: undefined
          }))
        : targetTokens;
    targetLinkWords.forEach(linkWords =>
      displayedLinkIds?.add(linkWords.link.id!));

    // sort what's left and concatenate
    const sortedTokens = compressedTokens
      .sort((leftWords, rightWords) =>
        leftWords.id.localeCompare(rightWords.id)
        * (differentLanguageDirections ? -1 : 1));
    const outputToken = {
      ...sortedTokens[0],
      text: sortedTokens.map(sortedToken => sortedToken.text).join(' '),
      after: undefined
    } as Word;

    // render target words
    return (
      <WordDisplay
        key={`interlinear/${targetCorpus?.id}/${outputToken}.id}`}
        links={targetLinkMap}
        corpus={targetCorpus}
        parts={[outputToken]}
        allowGloss={allowGloss}
      />);
  };
  return <Stack
    direction={'row'}
    useFlexGap
    spacing={0}>
    {createView()}
  </Stack>;
};

/**
 * Renders the source and target words for a given verse.
 * @param interlinearMap
 * @param allowGloss
 */
const determineInterlinearVerseView = (
  interlinearMap: InterlinearMap,
  allowGloss: boolean = false
) => {
  if (!interlinearMap.containers.isComplete()) {
    return [];
  }
  // fetch source corpus, if available
  const verseRef = interlinearMap.sourceVerse.bcvId.toReferenceString();
  const sourceCorpus = interlinearMap.containers.sources?.corpusAtReferenceString(verseRef);
  if (!sourceCorpus) {
    return [];
  }
  // reduce source map into map of word IDs to links
  const sourceLinkMap = new Map<string, Link[]>();
  interlinearMap.sourceMap.forEach((linkWords, sourceWordId) => {
    const sourceLinks = sourceLinkMap.get(sourceWordId) ?? [];
    sourceLinks.push(...linkWords.map(linkWord => linkWord.link));
    sourceLinkMap.set(sourceWordId, sourceLinks);
  });
  // render source and target words
  const displayedLinkIds = new Set<string>();
  const verseTokens: Word[][] = groupPartsIntoWords(interlinearMap.sourceVerse.words);
  return (verseTokens || [])
    .map((sourceTokens: Word[], sourceIndex): ReactElement =>
      <Stack
        direction={'row'}
        useFlexGap
        spacing={2}>
        <Stack
          direction={'column'}
          useFlexGap
          spacing={0}>
          <WordDisplay
            key={`interlinear/${sourceCorpus?.id}/${sourceIndex}/${sourceTokens.at(0)?.id}`}
            links={sourceLinkMap}
            corpus={sourceCorpus}
            parts={sourceTokens}
            allowGloss={allowGloss}
          />
          {determineInterlinearVerseTargetView(
            interlinearMap, sourceCorpus, sourceTokens,
            displayedLinkIds, allowGloss)}
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
  const [interlinearMap, setInterlinearMap] = useState<InterlinearMap | undefined>();
  const [verseElements, setVerseElements] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!containers.isComplete()) {
      return;
    }
    createInterlinearMap(projectState.linksTable, verse, containers)
      .then(setInterlinearMap);
  }, [projectState.linksTable, verse, containers]);

  useEffect(() => {
    if (!interlinearMap) {
      return;
    }
    setVerseElements(
      determineInterlinearVerseView(
        interlinearMap, allowGloss));
  }, [allowGloss, containers, verse, interlinearMap]);

  return <>
    {(verseElements?.length ?? 0) > 0
      ? verseElements
      : <></>}
  </>;
};
