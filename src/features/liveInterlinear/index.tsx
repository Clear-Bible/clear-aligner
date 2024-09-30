import { CorpusContainer, NamedContainers, Verse, Word } from '../../structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import useDebug from '../../hooks/useDebug';
import { AppContext } from '../../App';
import { LinksTable } from '../../state/links/tableManager';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Grid, Stack, Typography } from '@mui/material';
import { VerseDisplay } from '../corpus/verseDisplay';
import { WordDisplayVariant } from '../wordDisplay';

interface LiveInterlinearProps {
  containers: CorpusContainer[];
  position?: BCVWP;
  visibleSourceVerses: Verse[];
}

const createInterLinearMap = async (linksTable: LinksTable, verses: Verse[], targetContainer: CorpusContainer): Promise<Map<string, Word[]>> => {
  const result = new Map<string, Word[]>();

  for (const verse of verses) {
    const bcvId = verse.bcvId;
    const links = await linksTable.findByBCV(AlignmentSide.SOURCE, bcvId.book!, bcvId.chapter!, bcvId.verse!); //database query
    for (const link of links) {
      for (const sourceWordId of link.sources) {
        const targetWords = result.get(sourceWordId) ?? [];
        for (const targetWordId of link.targets) {
          const targetWord = targetContainer.wordByReferenceString(targetWordId);
          if (targetWord) {
            targetWords.push(targetWord);
          }
        }
        if (targetWords.length > 0) {
          result.set(sourceWordId, targetWords);
        }
      }
    }
  }
  return result;
};

const determineInterLinearView = async (
  viewCorpora: CorpusContainer,
  verses: Verse[],
  bcvId: BCVWP | null,
  isCitationVisible: boolean,
  wordMap: Map<string, Word[]> | undefined,
  containers: {
    sources?: CorpusContainer;
    targets?: CorpusContainer;
  }) => {

  return verses.map((verse) => {
    const languageInfo = viewCorpora.languageAtReferenceString(verse.bcvId.toReferenceString());
    return (
      <Grid
        container
        key={`${viewCorpora.id}/${verse.bcvId.toReferenceString()}`}
        sx={{ marginRight: '.7em' }}
        flexDirection={languageInfo?.textDirection === 'ltr' ? 'row' : 'row-reverse'}  //direction set by languageInfo
      >
        <Grid
          item xs={1}
          sx={{ p: '1px', width: '53px', height: '16px', justifyContent: 'center', marginTop: '20px'}}
          display={'flex'}
        >
          <Typography
            sx={
              bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                ? { fontStyle : 'italic' }
                : {}
            }
          >
            {isCitationVisible? verse.citation : ""}
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
                paddingBottom: '0.5rem',
              }}

            >
              <Stack direction={'row'}>
                <VerseDisplay corpus={viewCorpora.corpusAtReferenceString(verse.bcvId.toReferenceString())}
                              containers={containers}
                              verse={verse}
                              variant={WordDisplayVariant.BUTTON}
                              allowGloss
                              isPartOfInterlinear={true}
                              wordMap={wordMap}

                />
              </Stack>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

export const LiveInterlinear: React.FC<LiveInterlinearProps> = ({
                                                                  containers,
                                                                  position,
                                                                  visibleSourceVerses
                                                                }): ReactElement => {
  useDebug('LiveInterlinear');

  const { projectState } = useContext(AppContext);
  const [wordMap, setWordMap] = useState<Map<string, Word[]> | undefined>();
  const namedContainers = useMemo(() => {
    return new NamedContainers(containers);
  }, [containers]);

  useEffect(() => {
    if (!namedContainers.targets) {
      return;
    }
    createInterLinearMap(projectState.linksTable, visibleSourceVerses, namedContainers.targets)
      .then(setWordMap);
  }, [projectState.linksTable, visibleSourceVerses, namedContainers]);

  return (<></>);
};
