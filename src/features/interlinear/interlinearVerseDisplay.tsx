import { WordDisplay } from '../wordDisplay';
import { Corpus, Link, LinkWords, NamedContainers, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { useDataLastUpdated, useFindLinksByBCV } from '../../state/links/tableManager';
import React, { ReactElement, useMemo } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Stack } from '@mui/material';

export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers?: NamedContainers;
  verse: Verse;
  allowGloss?: boolean;
  wordMap: Map<string, LinkWords[]> | undefined;
}

const REPEATED_LINK_PLACEHOLDER_CHAR = '\u2022';

const determineInterlinearTargetView = (targetCorpus: Corpus,
                                        linkMap: Map<string, Link[]>,
                                        wordMap: Map<string, LinkWords[]>,
                                        displayedLinkIds: Set<string>,
                                        sourceTokens: Word[],
                                        allowGloss: boolean = false) => {
  const targetLinkWords =
    (sourceTokens?.map(token => wordMap?.get(token.id) ?? [])
      .filter(Boolean) ?? [])
      .flat();
  if (targetLinkWords.length < 1) {
    return <></>;
  }
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
        .map((tokens, tokensIndex) =>
          <WordDisplay
            key={`${targetCorpus?.id}/${linkWordIndex}/${tokensIndex}/${tokens.at(0)?.id}`}
            links={linkMap}
            corpus={targetCorpus}
            parts={tokens}
            allowGloss={allowGloss}
          />);
    }).filter(Boolean) ?? [])
      .flat()}
  </Stack>;
};

const determineInterlinearView = (
  sourceCorpus: Corpus,
  targetCorpus: Corpus,
  linkMap: Map<string, Link[]>,
  wordMap: Map<string, LinkWords[]>,
  verseTokens: Word[][],
  allowGloss: boolean = false) => {
  const displayedLinkIds = new Set<string>();
  return (verseTokens || [])
    .map((wordTokens: Word[], wordIndex): ReactElement =>
      <>
        <Stack
          direction={'row'}
          useFlexGap
          spacing={2}>
          <Stack
            direction={'column'}
            useFlexGap
            spacing={0}>
            <WordDisplay
              key={`${sourceCorpus?.id}/${wordIndex}/${wordTokens.at(0)?.id}`}
              links={linkMap}
              corpus={sourceCorpus}
              parts={wordTokens}
              allowGloss={allowGloss}
            />
            {determineInterlinearTargetView(
              targetCorpus, linkMap,
              wordMap, displayedLinkIds,
              wordTokens, allowGloss)}
          </Stack>
        </Stack>
      </>
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
                                          allowGloss = false,
                                          wordMap
                                        }: InterlinearVerseDisplayProps) => {
  const dataLastUpdated = useDataLastUpdated();
  const [sourceCorpus, targetCorpus] = useMemo(() => {
    const verseRef = verse.bcvId.toReferenceString();
    return [
      containers?.sources?.corpusAtReferenceString(verseRef),
      containers?.targets?.corpusAtReferenceString(verseRef)
    ];
  }, [containers?.sources, containers?.targets, verse.bcvId]);
  const verseTokens: Word[][] = useMemo(
    () => groupPartsIntoWords(verse.words),
    [verse?.words]
  );
  const { result: allLinks } = useFindLinksByBCV(
    AlignmentSide.SOURCE,
    verse.bcvId.book,
    verse.bcvId.chapter,
    verse.bcvId.verse,
    false,
    `${verse.bcvId?.toReferenceString()}-${dataLastUpdated}`
  );
  const linkMap = useMemo(() => {
    if (!allLinks || allLinks.length < 1) {
      return;
    }
    const result = new Map<string, Link[]>();
    allLinks
      .forEach(link => (link!.sources ?? [])
        .forEach(wordId => {
          if (!result.has(wordId)) {
            result.set(wordId, []);
          }
          result.get(wordId)!.push(link!);
        }));
    return result;
  }, [allLinks]);

  return <>
    {determineInterlinearView(
      sourceCorpus!, targetCorpus!,
      linkMap!, wordMap!,
      verseTokens!, allowGloss)}
  </>;
};
