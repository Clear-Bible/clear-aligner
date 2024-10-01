import { CorpusContainer, NamedContainers, Verse } from '../../structs';
import React, { Fragment, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import useDebug from '../../hooks/useDebug';
import { Grid, Stack, Typography } from '@mui/material';
import { InterlinearVerseDisplay } from './interlinearVerseDisplay';

interface InterlinearProps {
  containers: CorpusContainer[];
  verses: Verse[];
}

const determineInterlinearView = async (
  verses: Verse[],
  containers: NamedContainers
) => {
  if (verses.length < 1
    || !containers.isComplete()) {
    return [];
  }
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
                                                                   verses
                                                                 }): ReactElement => {
  useDebug('InterlinearComponent');

  const namedContainers = useMemo(() => {
    return new NamedContainers(containers);
  }, [containers]);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [interlinearElements, setInterlinearElements] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!namedContainers
      || !namedContainers.isComplete()) {
      return;
    }
    determineInterlinearView(
      verses,
      namedContainers)
      .then(setInterlinearElements);
  }, [containers, namedContainers, verses]);

  return (
    <Fragment>
      <Grid
        ref={textContainerRef}
        container
        sx={{ pl: 4, flex: 8, overflow: 'auto' }}
      >
        {
          (interlinearElements?.length ?? 0) > 0
            ? interlinearElements
            : <Typography>No verse data for this reference.</Typography>
        }
      </Grid>
    </Fragment>
  );
};
