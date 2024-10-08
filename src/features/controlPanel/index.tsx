/**
 * This file contains the ControlPanel component which contains buttons like
 * create link, delete link, toggle glosses, swap to vertical mode, etc.
 */
import { ReactElement, useMemo, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import { AddLink, LinkOff, RestartAlt } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { CorpusContainer, EditedLink } from '../../structs';
import { useRemoveLink, useSaveLink } from '../../state/links/tableManager';

import uuid from 'uuid-random';
import { resetTextSegments } from '../../state/alignment.slice';
import { useHotkeys } from 'react-hotkeys-hook';

export const ControlPanel = (): ReactElement => {
  useDebug('ControlPanel');

  const dispatch = useAppDispatch();
  const [linkRemoveState, setLinkRemoveState] = useState<{
    linkId?: string,
    removeKey?: string,
  }>();
  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  const { saveLink } = useSaveLink(true);
  useRemoveLink(linkRemoveState?.linkId, linkRemoveState?.removeKey);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);
  const linkHasBothSides = useMemo(
    () => {
      return (
        (Number(inProgressLink?.sources.length) > 0 || Number(inProgressLink?.suggestedSources.length) > 0) &&
        (Number(inProgressLink?.targets.length) > 0 || Number(inProgressLink?.suggestedTargets.length) > 0)
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inProgressLink?.sources.length, inProgressLink?.targets.length, inProgressLink?.suggestedSources.length, inProgressLink?.suggestedTargets.length]
  );

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }

  const deleteLink = () => {
    if (inProgressLink?.id) {
      setLinkRemoveState({
        linkId: inProgressLink.id,
        removeKey: uuid()
      });
      dispatch(resetTextSegments());
    }
  };

  const createLink = () => {
    if (inProgressLink) {
      const newLink = EditedLink.toLink(inProgressLink)!;
      if (Number(inProgressLink.suggestedSources.length) > 0 && inProgressLink.sources.length < 1) {
        newLink.sources.push(inProgressLink.suggestedSources?.at(0)!)
      } else if (Number(inProgressLink.suggestedTargets.length) > 0 && inProgressLink.targets.length < 1) {
        newLink.targets.push(inProgressLink.suggestedTargets?.at(0)!)
      }
      saveLink(newLink);
    }
    dispatch(resetTextSegments());
  };

  // keyboard shortcuts
  useHotkeys('space', () => createLink(), {enabled: linkHasBothSides})
  useHotkeys('backspace', () => deleteLink(), {enabled: !!inProgressLink?.id})
  useHotkeys('shift+esc', () => dispatch(resetTextSegments()), {enabled: anySegmentsSelected})

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="baseline"
        style={{
          marginTop: '6px',
          marginBottom: '6px',
          flexGrow: 0,
          flexShrink: 0
        }}>
        <ButtonGroup>
          <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!linkHasBothSides}
              onClick={() => createLink()}
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
              onClick={() => deleteLink()}
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
              }}
            >
              <RestartAlt />
            </Button>
          </span>
          </Tooltip>
        </ButtonGroup>
      </Stack>
    </>
  );
};

export default ControlPanel;
