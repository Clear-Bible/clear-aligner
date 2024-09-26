import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Dialog, DialogContent, Grid, Typography } from '@mui/material';
import { Project } from '../../state/projects/tableManager';
import { DefaultProjectId } from '../../state/links/tableManager';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { AppContext } from '../../App';

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

/**
 * hook to delete a local project with a confirmation dialog
 * @param project project the hook would be used to delete
 */
export const useDeleteProjectFromLocalWithDialog = ({ project }: UseDeleteProjectFromLocalWithDialogProps): UseDeleteProjectFromLocalWithDialogState => {
  const { projectState, setProjects, preferences, setPreferences } = useContext(AppContext);
  const [ isDialogOpen, setIsDialogOpen ] = useState<boolean>(false);

  const handleDelete = useCallback(async () => {
    if (project.id) {
      await projectState.projectTable?.remove?.(project.id);
      setProjects((ps: Project[]) => (ps || []).filter(p => (p.id || '').trim() !== (project.id || '').trim()));
      if (preferences?.currentProject === project.id) {
        projectState.linksTable.reset().catch(console.error);
        projectState.linksTable.setSourceName(DefaultProjectId);
        setPreferences((p: UserPreference | undefined) => ({
          ...(p ?? {}) as UserPreference,
          currentProject: DefaultProjectId,
          initialized: InitializationStates.UNINITIALIZED
        }));
      }
      setIsDialogOpen(false);
    }
  }, [project.id, projectState.projectTable, setProjects, preferences?.currentProject, projectState.linksTable, setPreferences]);

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
