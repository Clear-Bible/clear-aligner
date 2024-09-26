import { useDeleteProject } from './useDeleteProject';
import React, { useContext, useMemo, useState } from 'react';
import { Button, Dialog, DialogContent, Grid, Typography } from '@mui/material';
import { getUserGroups } from '../../server/amplifySetup';
import { ADMIN_GROUP } from '../../hooks/userInfoHooks';
import { ProjectState } from '../../common/data/project/project';
import { AppContext } from '../../App';
import { Project } from '../../state/projects/tableManager';
import { usePublishProject } from './usePublishProject';

/**
 * props for the hook
 */
export interface UseDeleteProjectFromServerWithDialogProps {
  project: Project;
}

/**
 * state returned by the hook
 */
export interface UseDeleteProjectFromServerWithDialogState {
  isOpen: boolean;
  showDeleteProjectDialog: () => void;
  dialog: JSX.Element;
}

/**
 * hook to delete a project from the server which includes a confirmation dialog
 * @param project project the hook would be used to delete
 */
export const useDeleteProjectFromServerWithDialog = ({
                                                       project
}: UseDeleteProjectFromServerWithDialogProps): UseDeleteProjectFromServerWithDialogState => {
  const { setSnackBarMessage, setIsSnackBarOpen } =  useContext(AppContext);
  const { deleteProject } = useDeleteProject();
  const { publishProject, dialog: publishDialog } = usePublishProject();
  const [ isDialogOpen, setIsDialogOpen ] = useState<boolean>(false);

  const dialog = useMemo<JSX.Element>(() => {
    return (
      <>
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
                  <Button variant="contained" onClick={() => {
                    getUserGroups(true)
                      .then((groups) => {
                        const isAdmin = (groups ?? [] as string[])?.includes(ADMIN_GROUP);
                        const displayPermissionsErrorMsg = () => {
                          setSnackBarMessage('You do not have permission to complete this operation');
                          setIsSnackBarOpen(true);
                        }
                        if (!isAdmin) {
                          displayPermissionsErrorMsg();
                          setIsDialogOpen(false);
                          return;
                        }
                        setIsDialogOpen(false);
                        const initialProjectState = project.state ?? ProjectState.PUBLISHED;
                        publishProject(project, ProjectState.DRAFT)
                          .then(() => {
                            return deleteProject(project.id)
                              .then((response) => {
                                if (!response || response?.success)
                                  return;
                                if (response?.response.statusCode === 403) {
                                  void publishProject(project, initialProjectState);
                                  displayPermissionsErrorMsg();
                                }
                              });
                          });
                      });
                  }} sx={{ ml: 2, borderRadius: 10 }}>Delete</Button>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
        {publishDialog}
      </>
      );
  }, [isDialogOpen, setSnackBarMessage, setIsSnackBarOpen, publishProject, project, deleteProject, publishDialog]);

  return {
    isOpen: isDialogOpen,
    showDeleteProjectDialog: () => setIsDialogOpen(true),
    dialog
  };
};
