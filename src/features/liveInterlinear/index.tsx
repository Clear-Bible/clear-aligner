/**
 * This file contains the Live Interlinear Component.
 */
import React, { ReactElement, Fragment, useMemo, useRef } from 'react';
import { CorpusContainer, CorpusViewport, Verse } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Grid } from '@mui/material';
import { useAppSelector } from '../../app';
import InterLinearComponent from './interLinearComponent';

interface LiveInterLinearProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
  visibleVersesInterlinear: Verse[];
  setVisibleVersesInterlinear: React.Dispatch<React.SetStateAction<Verse[]>>;
}

export const LiveInterlinear = ({containers, position, visibleVersesInterlinear, setVisibleVersesInterlinear}: LiveInterLinearProps ): ReactElement => {

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  const containerViewportRefs = useRef<HTMLDivElement[]>([]);

  // Setting up an array of the corpus viewports. Currently, the UI has 2 - previously there were more
  const corpusViewports: CorpusViewport[] | null = useMemo(
    () =>
      containers?.map(
        (container): CorpusViewport => ({
          containerId: container.id
        })
      ) ?? null,
    [containers]
  );

  if (corpusViewports[0]) {
    const corpusId = corpusViewports[0].containerId ?? "";
    const key = `text_${corpusId}`;
    const container = containers.find(
      (c) => c.id === corpusViewports[0].containerId ?? ""
    );

    if (!container) {
      return <Grid key={key} />;
    }

    return (
      <InterLinearComponent
        viewCorpora={container}
        viewportIndex={0}
        position={position}
        containers={{
          sources: containers?.find(c => c.id === AlignmentSide.SOURCE),
          targets: containers?.find(c => c.id === AlignmentSide.TARGET)
        }}
        visibleVerses={visibleVersesInterlinear}
        setVisibleVerses={setVisibleVersesInterlinear}
      />
    );
  }
  return (
    <></>
  )
};

export default LiveInterlinear;
