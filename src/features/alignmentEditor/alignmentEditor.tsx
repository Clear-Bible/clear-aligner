/**
 * This file contains the AlignmentEditor component
 * The AlignmentEditor wraps the BCVNavigation and
 * Workbench components
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { ControlPanelFormat, UserPreference } from 'state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import _ from 'lodash';
import { useAppDispatch } from '../../app/index';
import { resetTextSegments } from '../../state/alignment.slice';
import { Button, ButtonGroup, Stack, Toolbar, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import AppBar from '@mui/material/AppBar';
import { ProfileAvatar } from '../profileAvatar/profileAvatar';
import { SwapHoriz, SwapVert, Translate } from '@mui/icons-material';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
  showProfileAvatar?: boolean;
  usePaddingForEditorContainer?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({ showNavigation = true,
                                                                  showProfileAvatar = true,
                                                                  usePaddingForEditorContainer= true

                                                                }) => {
  const layoutCtx = useContext(LayoutContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );
  const appCtx = useContext(AppContext);
  const dispatch = useAppDispatch();
  const currentPosition = useMemo<BCVWP>(() => appCtx.preferences?.bcv ?? new BCVWP(1, 1, 1), [appCtx.preferences?.bcv]);

  useEffect(() => {
    if (sourceContainer && targetContainer)
      setSelectedCorporaContainers([sourceContainer, targetContainer]);
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

  // reset selected tokens when the book, chapter or verse changes
  useEffect(() => {
    dispatch(resetTextSegments());
  }, [appCtx.preferences?.bcv, dispatch]);

  const saveControlPanelFormat = useCallback(async (alignmentDirection: 'VERTICAL' | 'HORIZONTAL') => {
    const updatedPreferences = {
      ...appCtx.preferences,
      alignmentDirection
    } as UserPreference;
    appCtx.projectState.userPreferenceTable?.saveOrUpdate(updatedPreferences);
    appCtx.setPreferences(updatedPreferences);
  }, [appCtx]);

  return (
    <Stack direction={'column'} minWidth={'100%'} height={'100%'}>
      {/*App Bar*/}
      <Box>
        <AppBar
          position="static"
        >
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center'}}>
              <ButtonGroup sx={{ marginRight: '6px'}}>
                <Tooltip
                  title={`Swap to horizontal view mode`}
                  arrow describeChild>
                  <span>
                    <Button
                      variant={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.HORIZONTAL] ? 'contained' : 'outlined' }
                      onClick={() => void saveControlPanelFormat('HORIZONTAL')}
                      sx={{maxWidth: '40px'}}
                    >
                          <SwapHoriz />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={`Swap to vertical view mode`}
                  arrow describeChild>
                  <span>
                    <Button
                      variant={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? 'contained' : 'outlined'}
                      onClick={() => void saveControlPanelFormat('VERTICAL')}
                      sx={{maxWidth: '40px'}}
                    >
                          <SwapVert />
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
              <ButtonGroup>
                <Tooltip title="Toggle Glosses"
                         arrow
                         describeChild
                >
                  <span >
                    <Button
                      variant={appCtx.preferences?.showGloss ? 'contained' : 'outlined'}
                      disabled={!selectedCorporaContainers.some(container => container.corpusAtReferenceString(currentPosition?.toReferenceString?.() ?? '')?.hasGloss)}
                      onClick={() => {
                        const updatedPreferences = {
                          ...((appCtx.preferences ?? {}) as UserPreference),
                          showGloss: !appCtx.preferences?.showGloss
                        };
                        appCtx.setPreferences(updatedPreferences);
                      }}
                      sx={{maxWidth: '40px'}}
                    >
                      <Translate/>
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
              {
                showNavigation && (
                  <div style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingRight: '89px'
                  }}>
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
            </Box>
            {showProfileAvatar &&
              (<ProfileAvatar />)
            }
          </Toolbar>
        </AppBar>
      </Box>
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={currentPosition}
        usePaddingForEditorContainer={usePaddingForEditorContainer}
      />
    </Stack>
  );
};
