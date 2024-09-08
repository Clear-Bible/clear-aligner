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

/**
 * Wrapper component that makes up the Alignment Editor page
 *
 * @param containers contains the full source and target corpora currently being used
 * @param position the current Bible, Chapter and Verse that should be visible
 * @param usePaddingForEditorContainer
 */
const Editor = ({containers, position, usePaddingForEditorContainer}: EditorProps): ReactElement => {
  useDebug('Editor');

  const [visibleVerses, setVisibleVerses] = useState<Verse[]>([]);

  return (
    <Container maxWidth={false} disableGutters sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      flexShrink: 1,
      marginBottom: '1rem',
      px: usePaddingForEditorContainer ? '12px' : '0px'
    }}>
            <Polyglot containers={containers} position={position} />
            <ControlPanel containers={containers} position={position} />
            <ContextPanel
              containers={containers}
              position={position}
              visibleVerses={visibleVerses}
              setVisibleVerses={setVisibleVerses}
            />
    </Container>
  );
};

export default Editor;
