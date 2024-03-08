import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import {
  AddLink,
  LinkOff,
  RestartAlt,
  SwapHoriz,
  SwapVert,
  Translate
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { resetTextSegments } from 'state/alignment.slice';
import { AlignmentSide, CorpusContainer } from '../../structs';
import { AppContext } from '../../App';
import BCVWP from '../bcvwp/BCVWPSupport';
import { ControlPanelFormat, PreferenceKey, UserPreference } from '../../state/preferences/tableManager';

import { usePivotWords } from '../concordanceView/usePivotWords';
import UploadAlignmentGroup from './uploadAlignmentGroup';
import { useHotkeys } from 'react-hotkeys-hook';

interface ControlPanelProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _initializeTargetPivotWords = usePivotWords(AlignmentSide.TARGET);

  const {appState, preferences, setPreferences} = useContext(AppContext);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);

  const linkHasBothSides = useMemo(
    () => {
      return (
        Number(inProgressLink?.sources.length) > 0 &&
        Number(inProgressLink?.targets.length) > 0
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inProgressLink,
      inProgressLink?.sources.length,
      inProgressLink?.targets.length,
    ]
  );

  const saveControlPanelFormat = useCallback(() => {
    const updatedUserPreference = appState.userPreferences?.save({
      name: PreferenceKey.CONTROL_PANEL_FORMAT,
      value: (preferences[PreferenceKey.CONTROL_PANEL_FORMAT] as UserPreference | undefined)?.value === ControlPanelFormat.HORIZONTAL
        ? ControlPanelFormat.VERTICAL
        : ControlPanelFormat.HORIZONTAL
    });
    if(updatedUserPreference) {
      setPreferences(p => ({
        ...p,
        [updatedUserPreference.name]: updatedUserPreference
      }));
    }
  }, [preferences, appState.userPreferences, setPreferences]);

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }

  const controlPanelFormat = useMemo(() => (
    preferences[PreferenceKey.CONTROL_PANEL_FORMAT] as UserPreference | undefined
  )?.value, [preferences]);


  const createLink = useCallback(() => {
    if (!appState.currentProject?.linksTable || !inProgressLink) {
      return;
    }

    appState.currentProject?.linksTable.save(inProgressLink);

    dispatch(resetTextSegments());
  }, [appState.currentProject, inProgressLink, dispatch]);

  const deleteLink = useCallback(() => {
    if (!appState.currentProject?.linksTable || !inProgressLink) {
      return;
    }
    if (inProgressLink?.id) {
      const linksTable = appState.currentProject?.linksTable;
      linksTable.remove(inProgressLink.id);
      dispatch(resetTextSegments());
    }
  },[appState.currentProject, inProgressLink, dispatch])


  const enableToggle = useMemo(() => {
    const positions = props.containers.map(viewCorpora => {
      let bcvwp = props.position;
      if (viewCorpora.id !== 'target') {
        const target = props.containers.find(c => c.id === "target");
        if (!props.position || !target) return null;
        const verseString = target.verseByReference(props.position)?.sourceVerse;
        if (verseString) {
          bcvwp = BCVWP.parseFromString(verseString);
        }
      }
      return viewCorpora.corpusAtReferenceString(bcvwp.toReferenceString())?.hasGloss
    });
    return positions.some(p => p);
  }, [props]);

  // keyboard shortcuts
  useHotkeys('space', () => createLink())
  useHotkeys('backspace', () => deleteLink())
  useHotkeys('shift+esc', () => dispatch(resetTextSegments()))

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="baseline"
      style={{marginTop: '16px', marginBottom: '16px'}}
    >
      <ButtonGroup>
        <Tooltip title="Toggle Glosses" arrow describeChild>
          <span>
            <Button
              variant={preferences.showGloss ? 'contained' : 'outlined'}
              disabled={!enableToggle}
              onClick={() => setPreferences(p => ({
                ...p,
                showGloss: !p.showGloss
              }))}
            >
              <Translate/>
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={`Swap to ${controlPanelFormat === ControlPanelFormat.VERTICAL ? 'horizontal' : 'vertical'} view mode`} arrow describeChild>
          <span>
            <Button
              variant="contained"
              onClick={saveControlPanelFormat}
            >
              {
                controlPanelFormat === ControlPanelFormat.HORIZONTAL
                  ? <SwapVert/>
                  : <SwapHoriz/>
              }
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!linkHasBothSides}
              onClick={() => createLink()}
            >
              <AddLink/>
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Delete Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!inProgressLink?.id}
              onClick={() => deleteLink() }
            >
              <LinkOff/>
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Reset" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!anySegmentsSelected}
              onClick={() => {
                dispatch(resetTextSegments());
              }}
            >
              <RestartAlt/>
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
      <UploadAlignmentGroup containers={props.containers} />
    </Stack>
  );
};

export default ControlPanel;
