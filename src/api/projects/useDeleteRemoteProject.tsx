import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { Progress } from '../ApiModels';
import { ApiUtils } from '../utils';
import { AppContext } from '../../App';
import { ProjectLocation } from '../../common/data/project/project';
import { deleteLocalProject } from './useDeleteProjectFromLocalWithDialog';
import ResponseObject = ApiUtils.ResponseObject;

/**
 * Return values for hook {@link useDeleteRemoteProject}
 */
export interface DeleteState {
  deleteProject: (projectId: string) => Promise<ResponseObject<{}> | undefined>;
  progress: Progress;
  dialog: any;
}

/**
 * hook to delete a specified project from the server.
 */
export const useDeleteRemoteProject = (): DeleteState => {
  const { projectState, preferences, setPreferences, setProjects } = useContext(AppContext);
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current?.abort?.();
    abortController.current = undefined;
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const projectToDelete = (await projectState.projectTable.getProjects(true))?.get(projectId);
      const shouldDeleteLocalProject = !!(projectToDelete &&
        (projectToDelete.location === ProjectLocation.LOCAL && projectToDelete.lastSyncServerTime === null));

      setProgress(Progress.IN_PROGRESS);
      const projectsResponse = await ApiUtils.generateRequest<{}>({
        requestPath: `/api/projects/${projectId}`,
        requestType: ApiUtils.RequestType.DELETE,
        signal: abortController.current?.signal
      });

      setProgress(projectsResponse.success ? Progress.SUCCESS : Progress.FAILED);
      if (!projectToDelete) {
        return projectsResponse;
      } else if (shouldDeleteLocalProject) {
        await deleteLocalProject(projectId, { projectState, preferences, setPreferences, setProjects });
      }

      return projectsResponse;
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
    return undefined;
  }, [cleanupRequest, preferences, projectState, setPreferences, setProjects]);

  const dialog = useMemo(() => (
    <Dialog
      scroll="paper"
      open={progress === Progress.IN_PROGRESS}
    >
      <Grid container alignItems="center" justifyContent="space-between"
            sx={{ minWidth: 500, height: 'fit-content', p: 2 }}>
        <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
        <Typography variant="subtitle1">
          Deleting project...
        </Typography>
        <Button variant="text" sx={{ textTransform: 'none', ml: 2 }} onClick={cleanupRequest}>Cancel</Button>
      </Grid>
    </Dialog>
  ), [progress, cleanupRequest]);

  return {
    deleteProject,
    progress,
    dialog
  };
};
