/**
 * This file contains the Live Interlinear Component.
 */
import React, { ReactElement, Fragment, useMemo, useRef } from 'react';
import { CorpusContainer, CorpusViewport } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';
import CorpusComponent from '../corpus';
import { Card, Grid } from '@mui/material';
import { useAppSelector } from '../../app';

interface LiveInterLinearProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

export const LiveInterlinear = ({containers, position}: LiveInterLinearProps ): ReactElement => {

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

  console.log('*corpusViewports is: ', corpusViewports)


  return (
    <Fragment>
      {corpusViewports &&
        corpusViewports.sort(c => c.containerId === AlignmentSide.SOURCE ? -1 : 1).map((corpusViewport: CorpusViewport, index: number) => {
          const corpusId = corpusViewport.containerId;
          const key = `text_${index}`;
          const container = containers.find(
            (c) => c.id === corpusViewport.containerId
          );
          if (!container) return <Grid key={key} />;
          return (
            <Card
              onScroll={(e) => {
                if (scrollLock) {
                  const newScrollTop = (e.target as HTMLDivElement).scrollTop;
                  containerViewportRefs.current.forEach((ref) => {
                    ref.scrollTop = newScrollTop;
                  });
                }
              }}
              ref={(el) => {
                if (el) {
                  containerViewportRefs.current[index] = el;
                }
              }}
              elevation={2}
              className="corpus-container corpus-scroll-container"
              key={key}
              sx={ (theme) => ({
                flexGrow: '1',
                flexBasis: '0',
                minWidth: '16rem',
                position: 'relative',
                backgroundColor: theme.palette.primary.contrastText,
                backgroundImage: 'none'
              })}
            >
              <CorpusComponent
                key={corpusId}
                viewCorpora={container}
                viewportIndex={index}
                containers={{
                  sources: containers?.find(c => c.id === AlignmentSide.SOURCE),
                  targets: containers?.find(c => c.id === AlignmentSide.TARGET)
                }}
                position={position}
                isLiveInterLinear={true}
              />
            </Card>
          );
        })}


    </Fragment>
  );
};

export default LiveInterlinear;
