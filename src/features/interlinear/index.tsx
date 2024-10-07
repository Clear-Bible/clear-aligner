import { NamedContainers, Verse } from '../../structs';
import React, { Fragment, ReactElement, useEffect, useRef, useState } from 'react';
import useDebug from '../../hooks/useDebug';
import { Grid, Typography } from '@mui/material';
import { InterlinearVerseDisplay } from './interlinearVerseDisplay';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';

interface InterlinearProps {
  containers: NamedContainers;
  position: BCVWP;
  verses: Verse[];
}

/**
 * Generates interlinear view contents.
 * @param containers Corpus containers (required).
 * @param position Current position (required).
 * @param verses List of verses to display (required).
 */
const determineInterlinearView = (
  containers: NamedContainers,
  position: BCVWP,
  verses: Verse[]
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
          <Typography sx={
            position?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
              ? { fontStyle: 'italic' }
              : {}
          }>
            {verse.citation}
          </Typography>
        </Grid>

        <Grid item xs={11}>
          <Grid
            container
            sx={{
              flexGrow: 1,
              overflowX: 'hidden',
              overflowY: 'auto',
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
              <InterlinearVerseDisplay containers={containers}
                                       verse={verse}
              />
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

/**
 * Component that displays interlinear elements (linked source/target tokens) for a supplied set of verses.
 * @param containers Corpus containers (required).
 * @param position Current position (required).
 * @param verses List of verses to display (required).
 * @constructor
 */
export const InterlinearComponent: React.FC<InterlinearProps> = ({
                                                                   containers,
                                                                   position,
                                                                   verses
                                                                 }: InterlinearProps): ReactElement => {
  useDebug('InterlinearComponent');

  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [interlinearElements, setInterlinearElements] = useState<JSX.Element[]>();

  useEffect(() => {
    setInterlinearElements(
      determineInterlinearView(
        containers,
        position,
        verses));
  }, [containers, position, verses]);

  return (
    <Fragment>
      <Grid
        ref={textContainerRef}
        container
        sx={{ pl: 0, flex: 8, overflow: 'auto' }}
      >
        {(interlinearElements?.length ?? 0) > 0
          ? interlinearElements
          : <Typography>No verse data for this reference.</Typography>}
      </Grid>
    </Fragment>
  );
};
