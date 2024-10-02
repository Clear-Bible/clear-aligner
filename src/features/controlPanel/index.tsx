/**
 * This file contains the ControlPanel component which contains buttons like
 * create link, delete link, toggle glosses, swap to vertical mode, etc.
 */
import { ReactElement, useMemo, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import { AddLink, LinkOff, RestartAlt } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { CorpusContainer } from '../../structs';
import { useRemoveLink, useSaveLink } from '../../state/links/tableManager';
import BCVWP from '../bcvwp/BCVWPSupport';

import uuid from 'uuid-random';
import { resetTextSegments } from '../../state/alignment.slice';
import { useHotkeys } from 'react-hotkeys-hook';

interface ControlPanelProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
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
  const {saveLink} = useSaveLink(true);
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
  }

  const createLink = () => {
    inProgressLink && saveLink(inProgressLink.toLink());
    dispatch(resetTextSegments());
  }

  // keyboard shortcuts
  useHotkeys('space', () => createLink())
  useHotkeys('backspace', () => deleteLink())
  useHotkeys('shift+esc', () => dispatch(resetTextSegments()))

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="baseline"
        style={{
          marginTop: '16px',
          marginBottom: '16px',
          flexGrow: 0,
          flexShrink: 0
        }} >
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
