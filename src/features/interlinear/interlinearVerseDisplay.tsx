import { WordDisplay } from '../wordDisplay';
import { Corpus, Link, NamedContainers, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { Grid } from '@mui/material';
import { AppContext } from '../../App';
import { createInterlinearMap, InterlinearMap } from '../../helpers/createInterlinearMap';
import { useDataLastUpdated } from '../../state/links/tableManager';
import { ZERO_BCVWP } from '../bcvwp/BCVWPSupport';

/**
 * Display props for an interlinear display.
 */
export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers: NamedContainers;
  verse: Verse;
}

/**
 * Placeholder character for repeated mappings.
 */
const REPEATED_LINK_PLACEHOLDER_CHAR = '\u2022';

/**
 * Render a default (empty) target view.
 * @param sourceCorpus Source corpus (required).
 * @param sourceTokens Source tokens to use for metadata (required).
 */
const determineDefaultTargetView = (
  sourceCorpus: Corpus,
  sourceTokens: Word[]
) => {
  return (
    <Grid item
          key={`interlinear/${sourceCorpus?.id}/${sourceTokens.map(sourceToken => sourceToken.id).join('+')}/default`}>
      <WordDisplay
        links={new Map<string, Link[]>()}
        corpus={sourceCorpus}
        readonly={true}
        parts={[{
          ...sourceTokens[0],
          id: ZERO_BCVWP,
          text: '',
          normalizedText: '',
          after: undefined
        }]}
        suppressGloss={true}
        fillWidth={true}
      />
    </Grid>);
};

/**
 * Renders the target word side of the interlinear mapping.
 * @param sourceCorpus Source corpus (required).
 * @param sourceTokens Source tokens to map (required).
 * @param interlinearMap Interlinear mapping information (required).
 * @param displayedLinkIds Set of link IDs already displayed (used for placeholder rendering)
 */
const determineTargetView = (
  sourceCorpus: Corpus,
  sourceTokens: Word[],
  interlinearMap: InterlinearMap,
  displayedLinkIds: Set<string>) => {
  if (!interlinearMap.containers.isComplete()
    || interlinearMap.sourceMap.size < 1) {
    return determineDefaultTargetView(sourceCorpus, sourceTokens);
  }

  // build link map and target tokens, pre-concatenated
  // and compressed with placeholders
  const targetLinkMap = new Map<string, Link[]>();
  const targetTokens = sourceTokens.map(sourceToken => {
    const linkWords = interlinearMap.sourceMap?.get(sourceToken.id)?.at(0);
    if (!linkWords
      || (!linkWords.link?.id)
      || (linkWords?.words.length ?? 0) < 1) {
      return {
        ...sourceToken,
        id: ZERO_BCVWP,
        text: '',
        normalizedText: '',
        after: undefined
      } as Word;
    }

    linkWords.words.forEach(targetToken => {
      const targetLinks = targetLinkMap.get(targetToken.id) ?? [];
      targetLinks.push(linkWords.link);
      targetLinkMap.set(targetToken.id, targetLinks);
    });

    const sortedTokens = [...linkWords.words]
      .sort((leftWord, rightWord) =>
        leftWord.id.localeCompare(rightWord.id));

    const compressedTokens
      = (displayedLinkIds?.has(linkWords.link.id!)
      ? [{
        ...sortedTokens[0],
        text: REPEATED_LINK_PLACEHOLDER_CHAR,
        normalizedText: REPEATED_LINK_PLACEHOLDER_CHAR,
        after: undefined
      } as Word]
      : sortedTokens)
      .filter(Boolean);
    displayedLinkIds.add(linkWords.link.id!);

    const outputText = compressedTokens.map(compressedToken => compressedToken.text).join(' ');
    return {
      ...compressedTokens[0],
      text: outputText,
      normalizedText: outputText,
      after: undefined
    } as Word;
  }).filter(Boolean);

  // obtain target corpus
  const targetCorpus = interlinearMap.containers.targets?.corpusAtReferenceString(targetTokens[0].id);

  // no links or corpus = empty target cell
  if (targetLinkMap.size < 1
    || !targetCorpus) {
    return determineDefaultTargetView(sourceCorpus, sourceTokens);
  }

  // render target words
  return (
    <Grid item
          key={`interlinear/${targetCorpus?.id}/${targetTokens.map(targetToken => targetToken.id).join('+')}.id}`}>
      <WordDisplay
        links={targetLinkMap}
        corpus={targetCorpus}
        parts={targetTokens}
        fillWidth={true}
      />
    </Grid>);
};

/**
 * Renders the source and target words for a given verse.
 * @param interlinearMap Interlinear mapping information.
 */
const determineVerseView = (
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
        {determineTargetView(
          sourceCorpus, sourceTokens,
          interlinearMap, displayedLinkIds)}
      </Grid>);
};

/**
 * Display the text of a verse and highlight the words included in alignments.
 * @param containers Corpus containers (required).
 * @param verse Verse to display (required).
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
      determineVerseView(
        interlinearMap));
  }, [containers, verse, interlinearMap]);

  if ((verseElements?.length ?? 0) < 1) {
    return <></>;
  }

  return <Grid
    container
    direction={'row'}
    spacing={0}
    rowSpacing={1}
    columnSpacing={0.5}>
    {verseElements?.map((verseElement, verseIndex) => (
      <Grid item
            key={`interlinear/${verseIndex}`}>
        {verseElement}
      </Grid>
    ))}
  </Grid>;
};
