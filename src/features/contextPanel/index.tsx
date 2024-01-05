import React, { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import LinkBuilderComponent from 'features/linkBuilder';
import { CorpusContainer } from 'structs';

interface ContextPanelProps {
  containers: CorpusContainer[];
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  containers,
}): ReactElement => {
  useDebug('ContextPanel');

  return (
    <Stack
      direction="row"
      spacing={2}
      style={{ height: '17rem' }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      <Card
        elevation={6}
        key="a"
        style={{
          flexGrow: '1',
          flexBasis: '0',
        }}
      >
        <LinkBuilderComponent containers={containers} />
      </Card>
    </Stack>
  );
};

export default ContextPanel;
