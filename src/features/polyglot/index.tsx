import React, { useMemo, useRef } from 'react';
import { Box, Card, Grid, Stack } from '@mui/material';

import { useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import CorpusComponent from 'features/corpus';
import { AlignmentSide, CorpusContainer, CorpusViewport } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppContext } from '../../App';
import { ControlPanelFormat } from '../../state/preferences/tableManager';

interface PolyglotProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

export const Polyglot: React.FC<PolyglotProps> = ({ containers, position }) => {
  useDebug('PolyglotComponent');
  const { preferences } = React.useContext(AppContext);
  const containerViewportRefs = useRef<HTMLDivElement[]>([]);
  const scrollLock = useAppSelector((state) => state.app.scrollLock);
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
      minHeight={'17rem'}
      flexGrow={1}
    >
      <Stack
        display={'flex'}
        flexGrow={1}
        direction={preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? 'column' : 'row'}
        spacing={2}
        style={{ minHeight: preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? '30rem' : '17rem' }}
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
                style={{
                  flexGrow: '1',
                  flexBasis: '0',
                  minWidth: '16rem',
                  position: 'relative'
                }}
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
