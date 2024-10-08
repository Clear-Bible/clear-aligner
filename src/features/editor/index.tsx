/**
 * This file contains the Editor component which is used in Alignment Editor
 * mode and wraps Polyglot, ControlPanel and ContextPanel.
 */
import { ReactElement, useCallback, useState } from 'react';
import { Container } from '@mui/material';
import _ from 'lodash';

import useDebug from 'hooks/useDebug';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { CorpusContainer, NamedContainers, Verse } from 'structs';

import '../../styles/theme.css';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';
import { SuggestionsContext, useSuggestionsContextInitializer } from '../../hooks/useSuggestions';
import { useAppSelector } from '../../app';

interface EditorProps {
  containers: NamedContainers;
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

  // callback used to capture what's visible in the upper half
  // of the editor display, in order to keep the interlinear
  // and anything like it in sync.
  const setNewVisibleVerses = useCallback((inputVerses: Verse[], corpus: CorpusContainer) => {
    if (corpus.id === AlignmentSide.SOURCE
      && !_.isEqual(visibleSourceVerses, inputVerses)) {
      setVisibleSourceVerses(inputVerses);
    }
  }, [visibleSourceVerses]);

  const inProgressLink = useAppSelector(state => state.alignment.present.inProgressLink);

  const suggestionsContextValues = useSuggestionsContextInitializer(inProgressLink);

  return (
    <SuggestionsContext.Provider
      value={suggestionsContextValues}>
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
          setNewVisibleVerses={setNewVisibleVerses} />
        <ControlPanel />
        <ContextPanel
          containers={containers}
          position={position}
          visibleSourceVerses={visibleSourceVerses} />
      </Container>
    </SuggestionsContext.Provider>
  );
};

export default Editor;
