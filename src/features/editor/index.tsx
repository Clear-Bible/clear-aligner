/**
 * This file contains the Editor component which is used in Alignment Editor
 * mode and wraps Polyglot, ControlPanel and ContextPanel.
 */
import { ReactElement, useState } from 'react';
import { Container } from '@mui/material';

import useDebug from 'hooks/useDebug';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { CorpusContainer, Verse } from 'structs';

import '../../styles/theme.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorProps {
  containers: CorpusContainer[];
  position: BCVWP;
  usePaddingForEditorContainer?: boolean,
}

const Editor = ({
                  containers,
                  position,
                  usePaddingForEditorContainer
                }: EditorProps): ReactElement => {
  useDebug('Editor');

  const [visibleSourceVerses, setVisibleSourceVerses] = useState<Verse[]>([]);

  return (
    <Container maxWidth={false} disableGutters sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      flexShrink: 1,
      marginBottom: '1rem',
      px: usePaddingForEditorContainer ? '12px' : '0px'
    }}>
      <Polyglot
        containers={containers}
        position={position}
        setVisibleSourceVerses={setVisibleSourceVerses} />
      <ControlPanel />
      <ContextPanel
        containers={containers}
        position={position}
        visibleSourceVerses={visibleSourceVerses} />
    </Container>
  );
};

export default Editor;
