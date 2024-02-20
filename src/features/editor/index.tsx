import { ReactElement } from 'react';
import { Container } from '@mui/material';

import useDebug from 'hooks/useDebug';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { CorpusContainer } from 'structs';

import '../../styles/theme.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

const Editor = (props: EditorProps): ReactElement => {
  useDebug('Editor');

  return (
    <Container maxWidth={false} sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      flexShrink: 1,
      marginBottom: '1rem'
    }}>
            <Polyglot containers={props.containers} position={props.position} />
            <ControlPanel containers={props.containers} position={props.position} />
            <ContextPanel containers={props.containers} />
    </Container>
  );
};

export default Editor;
