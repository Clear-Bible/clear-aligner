import { CorpusContainer, LinkStatus, LinkWords, NamedContainers, Verse } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import React, { Fragment, ReactElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useDebug from '../../hooks/useDebug';
import { AppContext } from '../../App';
import { LinksTable } from '../../state/links/tableManager';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Grid, Stack, Typography } from '@mui/material';
import { InterlinearVerseDisplay } from './interlinearVerseDisplay';

interface InterlinearProps {
  containers: CorpusContainer[];
  position?: BCVWP;
  visibleSourceVerses: Verse[];
}


const createInterLinearMap = async (
  linksTable: LinksTable,
  verses: Verse[],
  targetContainer: CorpusContainer,
  includeRejected = false):
  Promise<Map<string, LinkWords[]>> => {
  const result = new Map<string, LinkWords[]>();

  for (const verse of verses) {
    const bcvId = verse.bcvId;
    const links = await linksTable.findByBCV(AlignmentSide.SOURCE, bcvId.book!, bcvId.chapter!, bcvId.verse!); //database query
    for (const link of links) {
      if (!includeRejected
        && link.metadata.status === LinkStatus.REJECTED) {
        continue;
      }
      for (const sourceWordId of link.sources) {
        const linkWord = {
          link,
          words: []
        } as LinkWords;
        for (const targetWordId of link.targets) {
          const targetWord = targetContainer.wordByReferenceString(targetWordId);
          if (targetWord) {
            linkWord.words.push(targetWord);
          }
        }
        if (linkWord.words.length > 0) {
          const linkWords = result.get(sourceWordId) ?? [];
          linkWords.push(linkWord);
          result.set(sourceWordId, linkWords);
        }
      }
    }
  }
  return result;
};

const determineInterLinearView = async (
  verses: Verse[],
  wordMap: Map<string, LinkWords[]> | undefined,
  containers: NamedContainers) => {
  return verses.map((verse, verseIndex) => {
    const languageInfo = containers.sources?.languageAtReferenceString(verse.bcvId.toReferenceString());
    return (
      <Grid
        container
        key={`${containers?.sources?.id}/${verseIndex}/${verse.bcvId.toReferenceString()}`}
        sx={{ marginRight: '.7em' }}
        flexDirection={languageInfo?.textDirection === 'ltr' ? 'row' : 'row-reverse'}  //direction set by languageInfo
      >
        <Grid
          item xs={1}
          sx={{ p: '1px', width: '53px', height: '16px', justifyContent: 'center', marginTop: '20px' }}
          display={'flex'}>
          <Typography>
            {verse.citation}
          </Typography>
        </Grid>

        <Grid item xs={11}>
          <Grid
            container
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              ...(languageInfo?.textDirection
                ? { direction: languageInfo?.textDirection }
                : {})
            }}
          >
            <Typography
              component={'span'}
              lang={languageInfo?.code}
              style={{
                paddingBottom: '0.5rem'
              }}

            >
              <Stack direction={'row'}>
                <InterlinearVerseDisplay containers={containers}
                                         verse={verse}
                                         wordMap={wordMap}
                                         allowGloss
                />
              </Stack>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

export const InterlinearComponent: React.FC<InterlinearProps> = ({
                                                                   containers,
                                                                   position,
                                                                   visibleSourceVerses
                                                                 }): ReactElement => {
  useDebug('InterlinearComponent');

  const { projectState } = useContext(AppContext);
  const [wordMap, setWordMap] = useState<Map<string, LinkWords[]> | undefined>();
  const namedContainers = useMemo(() => {
    return new NamedContainers(containers);
  }, [containers]);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [verseElement, setVerseElement] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!namedContainers.targets) {
      return;
    }
    createInterLinearMap(projectState.linksTable, visibleSourceVerses, namedContainers.targets)
      .then(setWordMap);
  }, [projectState.linksTable, visibleSourceVerses, namedContainers]);

  useEffect(() => {
    determineInterLinearView(
      visibleSourceVerses,
      wordMap,
      namedContainers)
      .then(setVerseElement);
  }, [containers, namedContainers, visibleSourceVerses, wordMap]);

  return (
    <Fragment>
      <Grid
        ref={textContainerRef}
        container
        sx={{ pl: 4, flex: 8, overflow: 'auto' }}
      >
        {
          (verseElement?.length ?? 0) > 0
            ? verseElement
            : <Typography>No verse data for this reference.</Typography>
        }
      </Grid>
    </Fragment>
  );
};
