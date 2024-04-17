import React, { useContext, useEffect, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { UserPreference } from 'state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import _ from 'lodash';
import { useAppDispatch } from '../../app/index';
import { resetTextSegments } from '../../state/alignment.slice';
import { Stack } from '@mui/material';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({ showNavigation = true }) => {
  const layoutCtx = useContext(LayoutContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );
  const appCtx = useContext(AppContext);
  const dispatch = useAppDispatch();
  const currentPosition = useMemo<BCVWP>(() => appCtx.preferences?.bcv ?? new BCVWP(1,1,1), [appCtx.preferences?.bcv]);

  useEffect(() => {
    if (sourceContainer && targetContainer)
      setSelectedCorporaContainers([ sourceContainer, targetContainer ]);
  }, [sourceContainer, targetContainer]);

  useEffect(() => {
    if (currentPosition) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          currentPosition.getBookInfo()?.EnglishBookName
        } ${currentPosition?.chapter}:${currentPosition?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [currentPosition, layoutCtx]);

  useEffect(() => {
    if (!targetContainer) {
      return;
    }
    const loadSourceWords = async () => {
      setAvailableWords(
        targetContainer?.corpora.flatMap(({ words }) => words) ?? []
      );
    };
    void loadSourceWords().catch(console.error);
  }, [targetContainer?.corpora, setAvailableWords, targetContainer]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={appCtx.preferences?.bcv} />
    );
  }, [layoutCtx, appCtx.preferences?.bcv]);

  // reset selected tokens when the book, chapter or verse changes
  useEffect(() => {
    dispatch(resetTextSegments())
  }, [appCtx.preferences?.bcv, dispatch])

  return (
    <Stack direction={'column'} minWidth={'100%'} height={'100%'}>
      {
        showNavigation && (
          <div style={{ display: 'grid', justifyContent: 'center' }}>
            <br />
            <BCVNavigation
              horizontal
              disabled={!availableWords || availableWords.length < 1}
              words={availableWords}
              currentPosition={currentPosition}
              onNavigate={bcv => {
                if (!_.isEqual(bcv, currentPosition)) {
                  appCtx.setPreferences((previousState): UserPreference => {
                    return {
                      ...previousState as UserPreference,
                      bcv
                    };
                  });
                }
              }}
            />
          </div>
        )
      }
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={currentPosition}
      />
    </Stack>
  );
};
