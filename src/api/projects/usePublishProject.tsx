import React, { useCallback, useContext, useRef, useState } from 'react';
import { ProjectDTO, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { AppContext } from '../../App';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import useCancelTask, { CancelToken } from '../useCancelTask';
import { Progress } from '../ApiModels';
import { ApiUtils } from '../utils';
import RequestType = ApiUtils.RequestType;

export interface PublishState {
  publishProject: (project: Project, state: ProjectState) => Promise<Project|undefined>;
  progress: Progress;
  dialog: any;
}

/**
 * Custom hook to publish/unpublish projects.
 */
export const usePublishProject = (): PublishState => {
  const {cancel, cancelToken, reset} = useCancelTask();
  const { projectState, setProjects } = useContext(AppContext);
  const [publishState, setPublishState] = useState<ProjectState>();
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    setProgress(Progress.IDLE);
    abortController.current = undefined;
    setPublishState(undefined);
    reset();
  }, [reset]);

  const publishProject = useCallback(async (project: Project, state: ProjectState, cancelToken: CancelToken): Promise<Project|undefined> => {
    setPublishState(state);
    try {
      setProgress(Progress.IN_PROGRESS);
      if(cancelToken.canceled) return;
      const updateResponse = await ApiUtils.generateRequest<ProjectDTO>({
        requestPath: `/api/projects/${project.id}/state`,
        requestType: RequestType.POST,
        payload: state,
        contentLengthOptional: true
      });
      project.state = state;
      project.serverUpdatedAt = updateResponse.body.updatedAt;
      if(state === ProjectState.PUBLISHED) {
        await projectState?.projectTable?.update(project, false);
      } else {
        project.location = ProjectLocation.LOCAL;
        project.lastSyncTime = 0;
        await projectState?.projectTable?.update(project, false);
      }
      const updatedProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
      setProjects(p => Array.from(updatedProjects.values() ?? p));
      setProgress(Progress.SUCCESS);
      return project;
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
  }, [projectState, cleanupRequest, setProjects]);

  React.useEffect(() => {
    if(progress === Progress.CANCELED) {
      cancel();
      abortController.current?.abort?.();
      cleanupRequest();
    }
  }, [progress, cleanupRequest, cancel]);

  const onCancel = React.useCallback(() => {
    setProgress(Progress.CANCELED);
  }, []);

  const dialog = React.useMemo(() => {
    return (
      <Dialog
        scroll="paper"
        open={![
          Progress.IDLE,
          Progress.SUCCESS,
          Progress.FAILED,
          Progress.CANCELED
        ].includes(progress) && !!publishState}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
          <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
          <Typography variant="subtitle1">
            {publishState === ProjectState.PUBLISHED ? "Publishing project..." : "Deleting project..."}
          </Typography>
          <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={onCancel}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress, onCancel, publishState]);


  return {
    publishProject: (projectId, state) => new Promise(res => {
      setTimeout(() => {
        res(publishProject(projectId, state, cancelToken));
      }, 2000);
    }),
    progress,
    dialog,
  };
};
