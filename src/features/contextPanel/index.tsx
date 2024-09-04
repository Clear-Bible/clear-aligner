/**
 * This file contains the ContextPanel component which renders the LinkBuilder
 * component that is used in the AlignmentEditor
 */
import React, { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import { CorpusContainer } from 'structs';
import LiveInterlinear from '../liveInterlinear';
import BCVWP from '../bcvwp/BCVWPSupport';

interface ContextPanelProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  containers, position
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
        sx={ (theme) => ({
          flexGrow: '1',
          flexBasis: '0',
          backgroundColor: theme.palette.primary.contrastText,
          backgroundImage: 'none'
        })}
      >
        <LiveInterlinear containers={containers} position={position}/>
      </Card>
    </Stack>
  );
};

export default ContextPanel;
