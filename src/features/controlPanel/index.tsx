import {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import {
  AddLink,
  LinkOff,
  RestartAlt,
  SwapHoriz,
  SwapVert,
  Translate,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { CorpusContainer, Link, AlignmentSide } from '../../structs';
import { AppContext } from '../../App';
import { useRemoveLink, useSaveLink } from '../../state/links/tableManager';
import BCVWP from '../bcvwp/BCVWPSupport';
import {
  ControlPanelFormat,
  UserPreference,
} from '../../state/preferences/tableManager';

import uuid from 'uuid-random';
import {
  resetTextSegments,
  clearSuggestions,
} from '../../state/alignment.slice';

interface ControlPanelProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();
  const [linkSaveState, setLinkSaveState] = useState<{
    link?: Link;
    saveKey?: string;
  }>();
  const [linkRemoveState, setLinkRemoveState] = useState<{
    linkId?: string;
    removeKey?: string;
  }>();
  const { projectState, preferences, setPreferences } = useContext(AppContext);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const suggestions = useAppSelector(
    (state) => state.alignment.present.suggestedTokens
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  useSaveLink(linkSaveState?.link, linkSaveState?.saveKey);
  useRemoveLink(linkRemoveState?.linkId, linkRemoveState?.removeKey);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);
  const linkHasBothSides = useMemo(
    () => {
      return (
        Number(inProgressLink?.sources.length) > 0 &&
        Number(inProgressLink?.targets.length) > 0
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inProgressLink?.sources.length, inProgressLink?.targets.length]
  );

  const isLinkSuggested = useAppSelector((state) => {
    const hasSource =
      Number(state.alignment.present.inProgressLink?.sources.length) > 0 ||
      state.alignment.present.suggestedTokens.some((word) => {
        return word.side === AlignmentSide.SOURCE;
      });

    const hasTarget =
      Number(state.alignment.present.inProgressLink?.targets.length) > 0 ||
      state.alignment.present.suggestedTokens.some((word) => {
        return word.side === AlignmentSide.TARGET;
      });

    const hasSuggestion = state.alignment.present.suggestedTokens.length > 0;

    return hasSource && hasTarget && hasSuggestion;
  });

  const saveControlPanelFormat = useCallback(async () => {
    const alignmentDirection =
      preferences?.alignmentDirection ===
      ControlPanelFormat[ControlPanelFormat.VERTICAL]
        ? ControlPanelFormat[ControlPanelFormat.HORIZONTAL]
        : ControlPanelFormat[ControlPanelFormat.VERTICAL];
    const updatedPreferences = {
      ...preferences,
      alignmentDirection,
    } as UserPreference;
    projectState.userPreferenceTable?.saveOrUpdate(updatedPreferences);
    setPreferences(updatedPreferences);
  }, [preferences, projectState.userPreferenceTable, setPreferences]);

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="baseline"
      style={{ marginTop: '16px', marginBottom: '16px' }}
    >
      <ButtonGroup>
        <Tooltip title="Toggle Glosses" arrow describeChild>
          <span>
            <Button
              variant={preferences?.showGloss ? 'contained' : 'outlined'}
              disabled={
                !props.containers.some(
                  (container) =>
                    container.corpusAtReferenceString(
                      props.position?.toReferenceString?.() ?? ''
                    )?.hasGloss
                )
              }
              onClick={() => {
                const updatedPreferences = {
                  ...((preferences ?? {}) as UserPreference),
                  showGloss: !preferences?.showGloss,
                };
                setPreferences(updatedPreferences);
              }}
            >
              <Translate />
            </Button>
          </span>
        </Tooltip>
        <Tooltip
          title={`Swap to ${
            preferences?.alignmentDirection ===
            ControlPanelFormat[ControlPanelFormat.VERTICAL]
              ? 'horizontal'
              : 'vertical'
          } view mode`}
          arrow
          describeChild
        >
          <span>
            <Button
              variant="contained"
              onClick={() => void saveControlPanelFormat()}
            >
              {preferences?.alignmentDirection ===
              ControlPanelFormat[ControlPanelFormat.VERTICAL] ? (
                <SwapHoriz />
              ) : (
                <SwapVert />
              )}
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={isLinkSuggested ? false : !linkHasBothSides}
              onClick={() => {
                if (isLinkSuggested) {
                  const selectedSources = inProgressLink?.sources ?? [];
                  const selectedTargets = inProgressLink?.targets ?? [];
                  const link: Link = {
                    sources: selectedSources.concat(
                      suggestions
                        .filter(
                          (suggestion) =>
                            suggestion.side === AlignmentSide.SOURCE
                        )
                        .map((suggestion) => suggestion.id)
                    ),

                    targets: selectedTargets.concat(
                      suggestions
                        .filter(
                          (suggestion) =>
                            suggestion.side === AlignmentSide.TARGET
                        )
                        .map((suggestion) => suggestion.id)
                    ),
                  };
                  setLinkSaveState({
                    link,
                    saveKey: uuid(),
                  });
                } else {
                  setLinkSaveState({
                    link: inProgressLink ?? undefined,
                    saveKey: uuid(),
                  });
                }
                dispatch(resetTextSegments());
                dispatch(clearSuggestions());
              }}
            >
              <AddLink />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Delete Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!inProgressLink?.id}
              onClick={() => {
                if (inProgressLink?.id) {
                  setLinkRemoveState({
                    linkId: inProgressLink.id,
                    removeKey: uuid(),
                  });
                  dispatch(resetTextSegments());
                  dispatch(clearSuggestions());
                }
              }}
            >
              <LinkOff />
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
                dispatch(clearSuggestions());
              }}
            >
              <RestartAlt />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
    </Stack>
  );
};

export default ControlPanel;
