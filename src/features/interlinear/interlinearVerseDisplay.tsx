import { WordDisplay } from '../wordDisplay';
import { Corpus, Link, NamedContainers, Verse, Word } from '../../structs';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { useDataLastUpdated, useFindLinksByBCV } from '../../state/links/tableManager';
import React, { ReactElement, useMemo } from 'react';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Box, Stack } from '@mui/material';

export interface InterlinearVerseDisplayProps extends LimitedToLinks {
  containers?: NamedContainers;
  verse: Verse;
  allowGloss?: boolean;
  wordMap: Map<string, Word[]> | undefined;
}

const determineInterlinearTargetView = (
  corpus: Corpus | undefined,
  linkMap: Map<string, Link[]> | undefined,
  sourceTokens: Word[],
  wordMap: Map<string, Word[]> | undefined,
  allowGloss: boolean | undefined) => {
  const targetTokens =
    (sourceTokens?.map(token => {
      return wordMap?.get(token.id) ?? [];
    }).filter(Boolean) ?? [])
      .flat();
  if (targetTokens.length < 1) {
    return <></>;
  }
  return targetTokens
    .map((token, tokenIndex) =>
      <WordDisplay
        key={`${corpus?.id}/${tokenIndex}/${token?.id}`}
        links={linkMap}
        corpus={corpus}
        parts={targetTokens}
        allowGloss={allowGloss}
      />);
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

  console.log('verseTokens', verseTokens);
  console.log('wordMap', wordMap);
  console.log('allLinks', allLinks);
  console.log('linkMap', linkMap);

  return <>
    {(verseTokens || []).map(
      (wordTokens: Word[], wordIndex): ReactElement =>
        <>
          <Stack spacing={2}>
            <Box>
              <WordDisplay
                key={`${sourceCorpus?.id}/${wordIndex}/${wordTokens.at(0)?.id}`}
                links={linkMap}
                corpus={sourceCorpus}
                parts={wordTokens}
                allowGloss={allowGloss}
              />
            </Box>
            <Box>
              {determineInterlinearTargetView(targetCorpus, linkMap, wordTokens, wordMap, allowGloss)}
            </Box>
          </Stack>
        </>
    )}
  </>;
};
