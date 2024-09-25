/**
 * This file contains the ContextPanel component which renders the LinkBuilder
 * component that is used in the AlignmentEditor
 */
import React, { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import { CorpusContainer, Verse } from 'structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LiveInterlinear } from '../liveInterlinear';

interface ContextPanelProps {
  containers: CorpusContainer[];
  position?: BCVWP;
  visibleSourceVerses: Verse[];
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
                                                            containers,
                                                            position,
                                                            visibleSourceVerses
                                                          }): ReactElement => {
  useDebug('ContextPanel');

  return (
    <Stack
      direction="row"
      spacing={2}
      style={{
        height: '18.7rem',
        flexGrow: 0,
        flexShrink: 0
      }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      <Card
        elevation={6}
        key="a"
        sx={(theme) => ({
          flexGrow: '1',
          flexBasis: '0',
          backgroundColor: theme.palette.primary.contrastText,
          backgroundImage: 'none',
          overflow: 'auto',
          paddingTop: '21px'
        })}
      >
        <LiveInterlinear
          containers={containers}
          position={position}
          visibleSourceVerses={visibleSourceVerses}
        />
      </Card>
    </Stack>
  );
};

export default ContextPanel;
