import React, { useMemo, useRef } from 'react';
import { Card, CircularProgress, Stack, Grid, Typography } from '@mui/material';

import { useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import CorpusComponent from 'features/corpus';
import { CorpusContainer, CorpusViewport } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface PolyglotProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

export const Polyglot: React.FC<PolyglotProps> = ({ containers, position }) => {
  useDebug('PolyglotComponent');
  const containerViewportRefs = useRef<HTMLDivElement[]>([]);

  const scrollLock = useAppSelector((state) => state.app.scrollLock);

  const corpusViewports: CorpusViewport[] | null = useMemo(
    () =>
      containers?.map(
        (container): CorpusViewport => ({
          containerId: container.id,
        })
      ) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containers, containers.length]
  );

  return (
    <Stack
      direction="row"
      spacing={2}
      style={{ height: '16rem' }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      {(!corpusViewports || corpusViewports.length < 1) && (
        <Grid container flexDirection="column" alignItems="center">
          <Typography variant="h6" style={{ margin: 'auto' }}>
            Loading corpora.
          </Typography>
          <CircularProgress variant="indeterminate" />
        </Grid>
      )}

      {corpusViewports &&
        corpusViewports.map((corpusViewport: CorpusViewport, index: number) => {
          const corpusId = corpusViewport.containerId;
          const key = `text_${index}`;
          const container = containers.find(
            (c) => c.id === corpusViewport.containerId
          );
          if (!container) return <Grid />;
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
                position: 'relative',
              }}
            >
              <CorpusComponent
                key={corpusId}
                viewCorpora={container}
                viewportIndex={index}
                corpora={
                  containers.flatMap((container) => container.corpora) ?? []
                }
                position={position}
              />
            </Card>
          );
        })}
    </Stack>
  );
};

export default Polyglot;
