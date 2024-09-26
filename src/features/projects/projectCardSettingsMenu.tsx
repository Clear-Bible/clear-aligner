import { Project } from '../../state/projects/tableManager';
import { Divider, IconButton, MenuItem, MenuList, Popover } from '@mui/material';
import { DeleteOutlined, EditOutlined, MoreVertOutlined, PeopleAltOutlined, SyncOutlined } from '@mui/icons-material';
import React, { useCallback, useMemo, useState } from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { ProjectLocation } from '../../common/data/project/project';

/**
 * Props for the settings menu displayed on project cards
 */
export interface ProjectCardSettingsMenuProps {
  disabled?: boolean;
  project: Project;
  onEdit?: () => void;
  onShare?: () => void;
  onSync?: () => void;
  showDeleteFromServer?: boolean;
  onDeleteFromServer?: () => void;
  showDeleteLocalProject?: boolean;
  onDeleteLocalProject?: () => void;
}

/**
 * Hook to retrieve the settings menu for a project card
 * @param disabled whether the menu controls should be disabled
 * @param project project this settings card applies to
 * @param onEdit callback for the edit action
 * @param onShare callback for sharing action
 * @param onSync callback for sync action
 * @param showDeleteFromServer whether the delete froms server action should be displayed
 * @param onDeleteFromServer callback for delete from server action
 * @param showDeleteLocalProject whether the project is eligible for deletion
 * @param onDeleteLocalProject callback for delete local project action
 */
const useProjectCardSettingsMenu = ({
  disabled,
  project,
  onEdit,
  onShare,
  onSync,
  showDeleteFromServer,
  onDeleteFromServer,
  showDeleteLocalProject,
  onDeleteLocalProject
                                 }: ProjectCardSettingsMenuProps) => {
  const [ isSettingsMenuOpen, setIsSettingsMenuOpen ] = useState(false);
  const [ settingsMenuRef, setSettingsMenuRef ] = useState<Element>();
  const closeSettingsMenu = useCallback(() => setIsSettingsMenuOpen(false), [setIsSettingsMenuOpen]);

  const showEdit = useMemo<boolean>(() => project.location !== ProjectLocation.REMOTE, [project?.location]);
  const showShare = useMemo<boolean>(() => project.location === ProjectLocation.SYNCED, [project?.location]);
  const showSync = useMemo<boolean>(() => project.location === ProjectLocation.SYNCED, [project?.location]);

  const settingsMenu = useMemo(() => (
    <>
      <IconButton
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSettingsMenuRef(e.currentTarget);
          setIsSettingsMenuOpen(!isSettingsMenuOpen);
        }}>
        <MoreVertOutlined
          sx={(theme) => ({
            fill: theme.palette.text.secondary
          })}/>
      </IconButton>
      <Popover
        anchorEl={settingsMenuRef}
        open={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}>
        <MenuList>
          {showEdit && <MenuItem
            disabled={!onEdit}
            onClick={(e) => {
              closeSettingsMenu();
              onEdit?.();
            }}>
            <ListItemIcon>
              <EditOutlined/>
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>}
          {showShare && <MenuItem
            disabled={!onShare}
            onClick={() => {
              closeSettingsMenu();
              onShare?.();
            }}>
            <ListItemIcon>
              <PeopleAltOutlined/>
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>}
          {showSync && <MenuItem
            disabled={!onSync}
            onClick={() => {
              closeSettingsMenu();
              onSync?.();
            }}>
            <ListItemIcon>
              <SyncOutlined/>
            </ListItemIcon>
            <ListItemText>Sync</ListItemText>
          </MenuItem>}
          {(showDeleteFromServer || showDeleteLocalProject) &&
            <Divider />}
          {showDeleteFromServer &&
            <MenuItem
              disabled={!onDeleteFromServer}
              onClick={() => {
                closeSettingsMenu();
                onDeleteFromServer?.();
              }}>
              <ListItemIcon>
                <DeleteOutlined/>
              </ListItemIcon>
              <ListItemText>Delete from Server</ListItemText>
            </MenuItem>}
          {showDeleteLocalProject &&
            <MenuItem
              disabled={!onDeleteLocalProject}
              onClick={() => {
                closeSettingsMenu();
                onDeleteLocalProject?.();
              }}>
              <ListItemIcon>
                <DeleteOutlined sx={(theme) => ({
                  fill: theme.palette.error.main
                })}/>
              </ListItemIcon>
              <ListItemText sx={(theme) => ({
                color: theme.palette.error.main
              })}>Delete Local Project</ListItemText>
            </MenuItem>}
        </MenuList>
      </Popover>
    </>
  ), [
    disabled,
    isSettingsMenuOpen,
    settingsMenuRef,
    onEdit,
    onShare,
    onSync,
    closeSettingsMenu,
    onDeleteFromServer,
    onDeleteLocalProject,
    showDeleteFromServer,
    showDeleteLocalProject,
    showEdit,
    showShare,
    showSync
  ]);

  return {
    settingsMenu,
    isSettingsMenuOpen
  };
}

export default useProjectCardSettingsMenu;
