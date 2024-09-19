import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mapProjectEntityToProjectDTO, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { useSyncWordsOrParts } from './useSyncWordsOrParts';
import { InitializationStates } from '../../workbench/query';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { useDeleteProject } from './useDeleteProject';
import { usePublishProject } from './usePublishProject';
import { DateTime } from 'luxon';
import { useProjectsFromServer } from './useProjectsFromServer';
import { ApiUtils } from '../utils';
import { UserPreference } from '../../state/preferences/tableManager';
import { useDatabase } from '../../hooks/useDatabase';
import { ADMIN_GROUP, useCurrentUserGroups } from '../../hooks/userInfoHooks';
import { getUserGroups } from '../../server/amplifySetup';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SYNCING_LOCAL,
  REFRESHING_PERMISSIONS,
  SWITCH_TO_PROJECT,
  SYNCING_PROJECT,
  SYNCING_CORPORA,
  SYNCING_ALIGNMENTS,
  UPDATING_PROJECT,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  sync: (project: Project) => void;
  progress: SyncProgress;
  dialog: any;
  file: any;
  uniqueNameError: boolean;
  setUniqueNameError: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProject = (): SyncState => {
  const dbApi = useDatabase();
  const { publishProject } = usePublishProject();
  const { refetch: getProjects } = useProjectsFromServer({enabled: false});
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const { sync: syncAlignments, upload: uploadAlignments, file } = useSyncAlignments();
  const { deleteProject } = useDeleteProject();
  const { projectState, containers, setIsProjectDialogOpen, isBusyDialogOpen, setIsSnackBarOpen, setSnackBarMessage, preferences, setPreferences, setProjects } = useContext(AppContext);
  const [initialProjectState, setInitialProjectState] = useState<Project>();
  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const [syncTime, setSyncTime] = useState<number>(0);
  const [canceled, setCanceled] = useState<boolean>(false);
  const [uniqueNameError, setUniqueNameError] = useState<boolean>(false);
  const abortController = useRef<AbortController | undefined>();
  const groups = useCurrentUserGroups({ forceRefresh: true });
  const isAdmin = useMemo<boolean>(() => (groups ?? []).includes(ADMIN_GROUP), [groups]);

  const cleanupRequest = useCallback(async () => {
    if(initialProjectState) {
      const project = {...initialProjectState};
      if(project.location === ProjectLocation.LOCAL) {
        project.lastSyncTime = 0;
        // Remove the remote project if it exists on the server.
        const remoteProjects = await getProjects();
        if((remoteProjects ?? []).some(p => p.id === project.id)) {
          await deleteProject(project.id);
        }
      }
      await projectState.projectTable?.update?.(project, false);
      await projectState.projectTable?.sync(project);
    }
    setProgress(SyncProgress.IDLE);
    setInitialProjectState(undefined);
    setSyncTime(0);
    abortController.current = undefined;
  }, [initialProjectState, deleteProject, projectState.projectTable, getProjects]);

  const onCancel = useCallback(() => {
    setProgress(SyncProgress.CANCELED);
  }, []);

  const syncProject = useCallback(async () => {
    const project = {...(initialProjectState ?? {})} as Project;
    try {
      // Fallthrough cases are intentional
      /* eslint-disable no-fallthrough */
      switch (progress) {
        case SyncProgress.CANCELED:
          setCanceled(true);
        case SyncProgress.FAILED: {
          abortController.current?.abort?.();
          await cleanupRequest();
          break;
        }
        case SyncProgress.REFRESHING_PERMISSIONS: {
          await getUserGroups(true);
          setProgress(SyncProgress.SWITCH_TO_PROJECT); /// test
          break;
        }
        case SyncProgress.SWITCH_TO_PROJECT: {
          if (preferences?.currentProject && preferences?.currentProject === project?.id && preferences?.initialized === InitializationStates.INITIALIZED) {
            setProgress(SyncProgress.SYNCING_PROJECT);
          } else {
            try {
              await projectState.linksTable.reset();
            } catch(x) {
              console.error(x);
            }
            projectState.linksTable.setSourceName(project.id);
            setPreferences((p: UserPreference | undefined) => ({
              ...(p ?? {}) as UserPreference,
              currentProject: project.id,
              initialized: InitializationStates.UNINITIALIZED,
              onInitialized: [ ...(p?.onInitialized ?? []), () => setProgress(SyncProgress.SYNCING_PROJECT) ]
            }));
          }
          break;
        }
        case SyncProgress.SYNCING_PROJECT: {
          if ((project.location === ProjectLocation.SYNCED && isAdmin)
              || (project.location === ProjectLocation.LOCAL)) {
            const res = await ApiUtils.generateRequest<any>({
              requestPath: '/api/projects',
              requestType: ApiUtils.RequestType.POST,
              signal: abortController.current?.signal,
              payload: mapProjectEntityToProjectDTO(project)
            });
            if (res.success) {
              setProgress(SyncProgress.SYNCING_CORPORA);
            } else {
              if (res.response.statusCode === 403) {
                setSnackBarMessage('You do not have permission to complete this operation');
              } else if ((res.body?.message ?? "").includes("duplicate key")) {
                setUniqueNameError(true);
                setSnackBarMessage("Failed to sync project. Project name already exists");
              } else {
                setSnackBarMessage("Failed to sync project.");
              }
              console.error("Response failed: ", res.body);
              setIsSnackBarOpen(true);
              setProgress(SyncProgress.FAILED);
            }
          } else {
            setProgress(SyncProgress.SYNCING_CORPORA);
          }
          break;
        }
        case SyncProgress.SYNCING_CORPORA: {
          if (project.sourceCorpora?.corpora.some((c) => !c.words || c.words.length < 1) || !project.targetCorpora?.corpora.some((c) => !c.words || c.words.length < 1)) {
            if (project.id !== containers.projectId || containers.sourceContainer?.corpora.some((c) => !c.words || c.words.length < 1) || containers.targetContainer?.corpora.some((c) => !c.words || c.words.length < 1)) {
              setProgress(SyncProgress.FAILED);
              break;
            }
            project.sourceCorpora = containers.sourceContainer;
            project.targetCorpora = containers.targetContainer;
          }
          const res = await syncWordsOrParts(project);
          if (!res?.success) {
            if (res?.response.statusCode === 403) {
              setSnackBarMessage('You do not have permission to sync corpora. Skipping corpora');
            } else {
              setSnackBarMessage('An unknown error occurred while attempting to sync corpora. Skipping corpora');
            }
            setIsSnackBarOpen(true);
          }
          setProgress(SyncProgress.SYNCING_ALIGNMENTS);
          break;
        }
        case SyncProgress.SYNCING_ALIGNMENTS: {
          if (project.location === ProjectLocation.LOCAL) {
            const uploadResponse = await uploadAlignments(project.id);
            if (!uploadResponse?.success) {
              if (uploadResponse?.response.statusCode === 403) {
                setSnackBarMessage('You do not have permission to upload alignment links. Skipping links');
              } else {
                setSnackBarMessage('An unknown error occurred while attempting to upload alignment links. Skipping links');
              }
              setIsSnackBarOpen(true);
            }
          } else {
            const syncResponse = await syncAlignments(project.id);
            if (!syncResponse) {
              setSnackBarMessage('An error occurred while attempting to synchronize alignment links. Skipping links');
              setIsSnackBarOpen(true);
            }
          }
          setProgress(SyncProgress.UPDATING_PROJECT);
          break;
        }
        case SyncProgress.UPDATING_PROJECT: {
          const currentTime = DateTime.now().toMillis();
          project.updatedAt = currentTime;
          project.lastSyncTime = currentTime;
          project.location = ProjectLocation.SYNCED;
          await dbApi.toggleCorporaUpdatedFlagOff(project.id);
          // Update project state to Published.
          const publishedProject = await publishProject(project, ProjectState.PUBLISHED);
          project.lastSyncServerTime = publishedProject?.serverUpdatedAt;
          project.serverUpdatedAt = publishedProject?.serverUpdatedAt;
          await projectState.projectTable?.sync?.(project).catch(console.error);
          setProjects((projects) =>
            projects.map((p) => {
              if (p.id !== project.id) return p;
              p.updatedAt = project.updatedAt;
              p.lastSyncTime = project.lastSyncTime;
              p.serverUpdatedAt = project.serverUpdatedAt;
              p.lastSyncServerTime = project.lastSyncServerTime;
              return p;
            }));
          setProgress(SyncProgress.IDLE);
          break;
        }
      }
    } catch (x) {
      setProgress(SyncProgress.FAILED);
      console.error("Failed to sync this project: ", x);
      await publishProject(project, ProjectState.PUBLISHED);
    }
  }, [progress, projectState, cleanupRequest, publishProject,
    setIsSnackBarOpen,
    isAdmin,
    setSnackBarMessage, syncAlignments, syncWordsOrParts,
    dbApi,
    setProjects,
    preferences,
    containers,
    setPreferences,
    uploadAlignments,
    initialProjectState]);

  useEffect(() => {
    if(syncTime && initialProjectState && !canceled) {
      syncProject().catch(console.error);
    } else if (canceled) {
      setProgress(SyncProgress.IDLE);
    }
    // The useEffect should only be called on progress changes,
    // allowing the single threaded process to be cancelable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() =>{
    // Prevent the Database busyDialog from showing concurrently
    // with this project dialog
    setIsProjectDialogOpen(![
      SyncProgress.IDLE,
      SyncProgress.SUCCESS,
      SyncProgress.FAILED
    ].includes(progress))
  }, [progress, setIsProjectDialogOpen])

  const dialog = useMemo(() => {
    let dialogMessage = 'Loading...';
    switch (progress) {
      case SyncProgress.SYNCING_LOCAL:
        dialogMessage = 'Syncing local project data...';
        break;
      case SyncProgress.SWITCH_TO_PROJECT:
        dialogMessage = 'Opening project';
        break;
      case SyncProgress.SYNCING_PROJECT:
      case SyncProgress.SYNCING_CORPORA:
      case SyncProgress.SYNCING_ALIGNMENTS:
        dialogMessage = 'Syncing with the server...';
        break;
      case SyncProgress.CANCELED:
        dialogMessage = 'Resetting project changes...'
    }

    return (
      <Dialog
        scroll="paper"
        open={![
          SyncProgress.IDLE,
          SyncProgress.SUCCESS,
          SyncProgress.FAILED
        ].includes(progress) && !isBusyDialogOpen}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
          <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
          <Typography variant="subtitle1">
            {canceled ? 'Resetting project changes...' : dialogMessage}
          </Typography>
          {
            progress !== SyncProgress.CANCELED && !canceled
              ? <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={onCancel}>Cancel</Button>
              : <Grid />
          }
        </Grid>
      </Dialog>
    );
  }, [progress, onCancel, canceled, isBusyDialogOpen]);

  return {
    sync: (project) => {
      setCanceled(false);
      setInitialProjectState(project);
      setSyncTime(DateTime.now().toMillis());
      setProgress(SyncProgress.REFRESHING_PERMISSIONS);
    },
    progress,
    dialog: dialog,
    file,
    uniqueNameError,
    setUniqueNameError
  };
};
