/**
 * This file contains the ContextPanel component which renders the LinkBuilder
 * component that is used in the AlignmentEditor
 */
import React, { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import { NamedContainers, Verse } from 'structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import { InterlinearComponent } from '../interlinear';

interface ContextPanelProps {
  containers: NamedContainers;
  position?: BCVWP;
  visibleSourceVerses: Verse[];
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
                                                            containers,
                                                            position,
                                                            visibleSourceVerses
                                                          }): ReactElement => {
  useDebug('ContextPanel');

  if (!position
    || (visibleSourceVerses?.length ?? 0) < 1) {
    return <></>;
  }

  return (
    <Stack
      direction='row'
      spacing={2}
      style={{
        height: '18.7rem',
        flexGrow: 0,
        flexShrink: 0
      }}
      justifyContent='stretch'
      alignItems='stretch'
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
        <InterlinearComponent
          containers={containers}
          position={position}
          verses={visibleSourceVerses}
        />
      </Card>
    </Stack>
  );
};

export default ContextPanel;
