import { WordDisplay } from '../wordDisplay';
import { Link, NamedContainers, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { Grid } from '@mui/material';
import { AppContext } from '../../App';
import { createInterlinearMap, InterlinearMap } from '../../helpers/createInterlinearMap';
import { useDataLastUpdated } from '../../state/links/tableManager';

export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers: NamedContainers;
  verse: Verse;
}

const REPEATED_LINK_PLACEHOLDER_CHAR = '\u2022';

/**
 * Renders the target word side of the interlinear map.
 * @param interlinearMap
 * @param sourceTokens
 * @param displayedLinkIds
 */
const determineInterlinearVerseTargetView = (
  interlinearMap: InterlinearMap,
  sourceTokens: Word[],
  displayedLinkIds: Set<string>
) => {
  if (!interlinearMap.containers.isComplete()
    || interlinearMap.sourceMap.size < 1) {
    return <></>;
  }

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
      leftWords.id.localeCompare(rightWords.id));

  // build single 'token' consisting of the concatenated elements
  const outputToken = {
    ...sortedTokens[0],
    text: sortedTokens.map(sortedToken => sortedToken.text).join(' '),
    after: undefined
  } as Word;

  // obtain target corpus
  const targetCorpus = interlinearMap.containers.targets?.corpusAtReferenceString(outputToken.id);
  if (!targetCorpus) {
    return <></>;
  }

  // render target words
  return (
    <Grid item
          key={`interlinear/${targetCorpus?.id}/${sortedTokens.map(sortedToken => sortedToken.id).join('+')}.id}`}>
      <WordDisplay
        links={targetLinkMap}
        corpus={targetCorpus}
        parts={[outputToken]}
        fillWidth={true}
      />
    </Grid>);
};

/**
 * Renders the source and target words for a given verse.
 * @param interlinearMap
 */
const determineInterlinearVerseView = (
  interlinearMap: InterlinearMap
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
    .map((sourceTokens: Word[]): ReactElement =>
      <Grid container
            direction={'column'}
            spacing={0}>
        <Grid item
              key={`interlinear/${sourceCorpus?.id}/${sourceTokens.map(sourceToken => sourceToken.id).join('+')}`}>
          <WordDisplay
            links={sourceLinkMap}
            corpus={sourceCorpus}
            parts={sourceTokens}
            fillWidth={true}
          />
        </Grid>
        {determineInterlinearVerseTargetView(
          interlinearMap, sourceTokens, displayedLinkIds)}
      </Grid>);
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
                                          verse
                                        }: InterlinearVerseDisplayProps) => {
  const dataLastUpdated = useDataLastUpdated();
  const { projectState } = useContext(AppContext);
  const [interlinearMap, setInterlinearMap] = useState<InterlinearMap | undefined>();
  const [verseElements, setVerseElements] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!containers.isComplete()) {
      return;
    }
    createInterlinearMap(projectState.linksTable, verse, containers)
      .then(setInterlinearMap);
    // we want dataLastUpdated in the dep array, to force
    // re-render when alignments are created/modified/deleted
  }, [projectState.linksTable, verse, containers, dataLastUpdated]);

  useEffect(() => {
    if (!interlinearMap) {
      return;
    }
    setVerseElements(
      determineInterlinearVerseView(
        interlinearMap));
  }, [containers, verse, interlinearMap]);

  if ((verseElements?.length ?? 0) < 1) {
    return <></>;
  }

  return <Grid
    container
    direction={'row'}
    spacing={0}
    rowSpacing={1}>
    {verseElements?.map((verseElement) => (
      <Grid item>
        {verseElement}
      </Grid>
    ))}
  </Grid>;
};
