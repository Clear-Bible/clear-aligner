/**
 * This file contains the Polyglot component which is used in Alignment Editor
 * mode to wrap the CorpusComponent component(s).
 */
import React, { useMemo, useRef } from 'react';
import { Box, Card, Grid, Stack } from '@mui/material';

import { useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import CorpusComponent from 'features/corpus';
import { CorpusContainer, CorpusViewport } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppContext } from '../../App';
import { ControlPanelFormat } from '../../state/preferences/tableManager';
import { AlignmentSide } from '../../common/data/project/corpus';

interface PolyglotProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

export const Polyglot: React.FC<PolyglotProps> = ({ containers, position }) => {
  useDebug('PolyglotComponent');
  const { preferences } = React.useContext(AppContext);
  const containerViewportRefs = useRef<HTMLDivElement[]>([]);
  const scrollLock = useAppSelector((state) => state.app.scrollLock);


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

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      minHeight={'2rem'}
      flexGrow={1}
    >
      <Stack
        display={'flex'}
        flexGrow={1}
        direction={preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? 'column' : 'row'}
        spacing={'8px'}
        style={{ minHeight: preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? undefined : '2rem' }}
        justifyContent="stretch"
        alignItems="stretch"
      >

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
                />
              </Card>
            );
          })}
      </Stack>
    </Box>
  );
};

export default Polyglot;
