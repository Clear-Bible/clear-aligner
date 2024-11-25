import React, { useCallback, useContext, useRef, useState } from 'react';
import { mapWordOrPartDtoToWordOrPart, WordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from '../../state/projects/tableManager';
import { mapProjectDtoToProject, ProjectDTO, ProjectLocation } from '../../common/data/project/project';
import { AppContext } from '../../App';
import { DateTime } from 'luxon';
import { InitializationStates } from '../../workbench/query';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { useDeleteRemoteProject } from './useDeleteRemoteProject';
import useCancelTask, { CancelToken } from '../useCancelTask';
import {
  mapServerAlignmentLinkToLinkEntity,
  ServerAlignmentLinkDTO,
  ServerLinksDTO
} from '../../common/data/serverAlignmentLinkDTO';
import { AlignmentSide, CORPORA_TABLE_NAME } from '../../common/data/project/corpus';
import { ApiUtils } from '../utils';
import { useDatabase } from '../../hooks/useDatabase';
import _ from 'lodash';
import { UserPreference } from '../../state/preferences/tableManager';

enum ProjectDownloadProgress {
  IDLE,
  RETRIEVING_PROJECT,
  RETRIEVING_TOKENS,
  FORMATTING_RESPONSE,
  UPDATING,
  REFRESHING_CONTAINERS,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  downloadProject: (projectId: string) => Promise<unknown>;
  progress: ProjectDownloadProgress;
  dialog: any;
}

/**
 * hook to download a specified project from the server.
 */
export const useDownloadProject = (): SyncState => {
  const { projectState, setProjects, isBusyDialogOpen, ...appCtx } = useContext(AppContext);
  const { deleteProject } = useDeleteRemoteProject();
  const { cancel, reset, cancelToken } = useCancelTask();
  const [progress, setProgress] = useState<ProjectDownloadProgress>(ProjectDownloadProgress.IDLE);
  const [projectId, setProjectId] = useState<string>();
  const abortController = useRef<AbortController | undefined>();

  const dbApi = useDatabase();

  const cleanupRequest = useCallback(async () => {
    abortController.current = undefined;
    reset();
    if (projectId) {
      const projectMap = await projectState.projectTable?.getProjects(true);
      const savedProject = Array.from(projectMap?.values?.() ?? []).find(p => p.id === projectId);
      if (savedProject) {
        await deleteProject(projectId);
        savedProject.lastSyncTime = 0;
        savedProject.updatedAt = DateTime.now().toMillis();
        savedProject.location = ProjectLocation.REMOTE;
        projectState.projectTable?.save(savedProject, false);
      }
      setProjectId(undefined);
    }
  }, [projectState, deleteProject, projectId, reset]);

  const downloadProject = async (projectId: string, cancelToken: CancelToken) => {
    setProjectId(projectId);
    try {
      if (cancelToken.canceled) return;
      setProgress(ProjectDownloadProgress.RETRIEVING_PROJECT);

      const projectResponse = await ApiUtils.generateRequest<ProjectDTO>({
        requestPath: `/api/projects/${projectId}`,
        requestType: ApiUtils.RequestType.GET,
        signal: abortController.current?.signal
      });
      const projectData = projectResponse.body;
      const tmpProject = mapProjectDtoToProject(projectData, ProjectLocation.SYNCED)!;
      tmpProject.lastSyncServerTime = tmpProject.serverUpdatedAt;
      Array.from((await projectState.projectTable?.getProjects(true))?.values?.() ?? [])
        .map(p => p.id).includes(projectData.id!)
        ? await projectState.projectTable?.update?.(tmpProject, true, false, true)
        : await projectState.projectTable?.save?.(tmpProject, true, false, true);

      if (cancelToken.canceled) return;
      setProgress(ProjectDownloadProgress.RETRIEVING_TOKENS);

      const resultTokens = ((await ApiUtils.generateRequest<any>({
        requestPath: `/api/projects/${projectId}/tokens?side=targets`,
        requestType: ApiUtils.RequestType.GET,
          signal: abortController.current?.signal,
      })).body?.tokens ?? []) as WordOrPartDTO[];

      if (projectResponse.success) {
        if (cancelToken.canceled) return;
        const targetCorpora = projectData.corpora
          .filter((c) => c.side === AlignmentSide.TARGET);
        await dbApi.insert({
          projectId,
          table: CORPORA_TABLE_NAME,
          itemOrItems: targetCorpora
        });
        targetCorpora.forEach((c) => c.words = []);
        const targetCorporaMap = new Map(targetCorpora.map(c => [c.id, c]));
        setProgress(ProjectDownloadProgress.FORMATTING_RESPONSE);
        for (const chunk of _.chunk(resultTokens, 2_000)) {
          chunk
            .map(mapWordOrPartDtoToWordOrPart)
            .forEach((w) => targetCorporaMap.get(w.corpusId)?.words!.push(w));
        }
        const currentTime = DateTime.now().toMillis();
        projectData.updatedAt = currentTime;
        projectData.lastSyncTime = currentTime;
        if (cancelToken.canceled) return;
        const project: Project | undefined = projectData ? mapProjectDtoToProject(projectData, ProjectLocation.SYNCED) : undefined;
        if (!project) {
          setProgress(ProjectDownloadProgress.FAILED);
          return;
        }
        project.lastSyncServerTime = project.serverUpdatedAt;
        if (cancelToken.canceled) return;
        setProgress(ProjectDownloadProgress.UPDATING);
        Array.from((await projectState.projectTable?.getProjects(true))?.values?.() ?? [])
          .map(p => p.id).includes(project.id)
          ? await projectState.projectTable?.update?.(project, true)
          : await projectState.projectTable?.save?.(project, true);

        const alignmentResponse = await ApiUtils.generateRequest<ServerLinksDTO>({
          requestPath: `/api/projects/${project.id}/alignment_links`,
          requestType: ApiUtils.RequestType.GET,
          signal: abortController.current?.signal
        });

        const linksBody: {
          links: ServerAlignmentLinkDTO[]
        } | undefined = alignmentResponse.body;
        const prevSourceName = projectState.linksTable.getSourceName();
        if (prevSourceName !== project.id) {
          projectState.linksTable.setSourceName(project.id);
        }
        await projectState.linksTable.saveAll(
          (linksBody?.links ?? []).map(mapServerAlignmentLinkToLinkEntity),
          false, true,
          true, true);

        project.lastSyncTime = DateTime.now().toMillis();
        await projectState.projectTable?.update(project, false);
        appCtx.setPreferences((p?: UserPreference) => ({
          ...(p ?? {}) as UserPreference,
          currentProject: project.id,
          initialized: InitializationStates.INITIALIZED
        }));
        if (cancelToken.canceled) return;
        setProgress(ProjectDownloadProgress.REFRESHING_CONTAINERS);
        const localProjects = await projectState.projectTable?.getProjects?.(true);
        setProjects(p => Array.from(localProjects?.values?.() ?? p));
      }
      if (cancelToken.canceled) return;
      setProgress(ProjectDownloadProgress.SUCCESS);
      return projectData;
    } catch (x) {
      console.error("Unable to download project: ", x);
      cleanupRequest().catch(console.error);
      setProgress(ProjectDownloadProgress.FAILED);
      setTimeout(() => {
        setProgress(ProjectDownloadProgress.IDLE);
      }, 5000);
    }
  };

  const onCancel = React.useCallback(async () => {
    setProgress(ProjectDownloadProgress.CANCELED);
    cancel();
    abortController.current?.abort?.();
    await cleanupRequest();
  }, [cleanupRequest, cancel]);

  const dialog = React.useMemo(() => {
    let dialogMessage = 'Loading...';
    switch (progress) {
      case ProjectDownloadProgress.RETRIEVING_PROJECT:
        dialogMessage = 'Retrieving project from server...';
        break;
      case ProjectDownloadProgress.RETRIEVING_TOKENS:
        dialogMessage = 'Retrieving tokens from server...';
        break;
      case ProjectDownloadProgress.FORMATTING_RESPONSE:
        dialogMessage = 'Preparing to update the local database...';
        break;
      case ProjectDownloadProgress.UPDATING:
        dialogMessage = 'Updating the local database...';
        break;
      case ProjectDownloadProgress.REFRESHING_CONTAINERS:
        dialogMessage = 'Refreshing corpora...';
        break;
    }

    return (
      <Dialog
        scroll="paper"
        open={![
          ProjectDownloadProgress.IDLE,
          ProjectDownloadProgress.SUCCESS,
          ProjectDownloadProgress.FAILED,
          ProjectDownloadProgress.CANCELED
        ].includes(progress) && !isBusyDialogOpen}
      >
        <Grid container alignItems="center" justifyContent="space-between"
              sx={{ minWidth: 500, height: 'fit-content', p: 2 }}>
          <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
          <Typography variant="subtitle1">
            {dialogMessage}
          </Typography>
          <Button variant="text" sx={{ textTransform: 'none', ml: 2 }} onClick={onCancel}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress, onCancel, isBusyDialogOpen]);

  return {
    downloadProject: (projectId) => downloadProject(projectId, cancelToken),
    progress,
    dialog
  };
};
