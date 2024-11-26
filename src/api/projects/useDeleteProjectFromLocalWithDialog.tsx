import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Dialog, DialogContent, Grid, Typography } from '@mui/material';
import { Project } from '../../state/projects/tableManager';
import { DefaultProjectId } from '../../state/links/tableManager';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { AppContext } from '../../App';
import { useDatabase } from '../../hooks/useDatabase';
import { ProjectLocation } from '../../common/data/project/project';
import { pickDeFactoCurrentProject } from './pickDeFactoCurrentProject';

/**
 * props for the hook
 */
export interface UseDeleteProjectFromLocalWithDialogProps {
  project: Project;
}

/**
 * state returned by the hook
 */
export interface UseDeleteProjectFromLocalWithDialogState {
  isOpen: boolean;
  showDeleteProjectDialog: () => void;
  dialog: JSX.Element;
}

export const deleteLocalProject = async (projectId: string, { projectState, preferences, setPreferences, setProjects }: Partial<AppContextProps>) => {
  await projectState!.projectTable?.remove?.(projectId);
  setProjects!((ps: Project[]) => (ps || []).filter(p => (p.id || '').trim() !== (projectId || '').trim()));
  if (preferences?.currentProject === projectId) {
    projectState!.linksTable.reset().catch(console.error);
    projectState!.linksTable.setSourceName(DefaultProjectId);
    setPreferences!((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: DefaultProjectId,
      initialized: InitializationStates.UNINITIALIZED
    }));
  }
};

/**
 * hook to delete a local project with a confirmation dialog
 * @param project project the hook would be used to delete
 */
export const useDeleteProjectFromLocalWithDialog = ({ project }: UseDeleteProjectFromLocalWithDialogProps): UseDeleteProjectFromLocalWithDialogState => {
  const { projectState, projects, setProjects, preferences, setPreferences } = useContext(AppContext);
  const [ isDialogOpen, setIsDialogOpen ] = useState<boolean>(false);
  const dbApi = useDatabase();

  const handleDelete = useCallback(async () => {
    if (project.id) {
      switch (project.location) {
        case ProjectLocation.REMOTE: // do nothing
          break;
        case ProjectLocation.LOCAL:
          await projectState.projectTable?.remove?.(project.id);
          break;
        case ProjectLocation.SYNCED:
          await projectState.projectTable?.sync({
            ...project,
            lastSyncTime: null,
            lastSyncServerTime: null,
            location: ProjectLocation.REMOTE
          });
          break;
      }
      const cleanupDbFile = () => {
        console.debug('Remove db file', project.id);
        dbApi.removeSource(project.id)
          .then(() => { })
          .then(() => { });
      };
      setProjects((ps: Project[]) => {
        const newProjectsList = (ps ?? []).filter(p => p.id !== project.id);
        if (project.location === ProjectLocation.SYNCED) {
          return [ ...newProjectsList, {
            ...project,
            lastSyncTime: null,
            lastSyncServerTime: null,
            location: ProjectLocation.REMOTE
          } ];
        }
        return newProjectsList;
      });
      const currentProjectId = pickDeFactoCurrentProject((projects ?? []).filter(p => p.id !== project.id), preferences?.currentProject === project.id ? DefaultProjectId : preferences?.currentProject);
      projectState.linksTable.reset().catch(console.error);
      projectState.linksTable.setSourceName(currentProjectId);
      setPreferences((p: UserPreference | undefined) => ({
        ...(p ?? {}) as UserPreference,
        currentProject: currentProjectId,
        initialized: InitializationStates.UNINITIALIZED,
        onInitialized: [ ...(p?.onInitialized ?? []), cleanupDbFile ]
      }));
      setIsDialogOpen(false);
    }
  }, [project, projectState.projectTable, projects, setProjects, preferences?.currentProject, projectState.linksTable, setPreferences, dbApi]);

  const dialog = useMemo(() => (
    <Dialog
      maxWidth="xl"
      open={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
    >
      <DialogContent sx={{ width: 650 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
          <Grid item>
            <Grid container>
              <Button variant="text" onClick={() => setIsDialogOpen(false)}>
                Go Back
              </Button>
              <Button variant="contained" onClick={handleDelete} sx={{ ml: 2, borderRadius: 10 }}>Delete</Button>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  ), [isDialogOpen, handleDelete]);

  return {
    isOpen: isDialogOpen,
    showDeleteProjectDialog: () => setIsDialogOpen(true),
    dialog
  };
}
