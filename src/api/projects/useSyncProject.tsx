import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  mapProjectEntityToProjectDTO,
  ProjectLocation,
  ProjectState,
} from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { ProjectTokenReport, useSyncWordsOrParts } from './useSyncWordsOrParts';
import { InitializationStates } from '../../workbench/query';
import {
  Button,
  CircularProgress,
  Dialog,
  Grid,
  Typography,
} from '@mui/material';
import { useDeleteRemoteProject } from './useDeleteRemoteProject';
import { usePublishProject } from './usePublishProject';
import { DateTime } from 'luxon';
import { useProjectsFromServer } from './useProjectsFromServer';
import { ApiUtils } from '../utils';
import { UserPreference } from '../../state/preferences/tableManager';
import { DatabaseApi, useDatabase } from '../../hooks/useDatabase';
import { getUserGroups } from '../../server/amplifySetup';
import { ProjectState as ProjectStateType } from '../../state/databaseManagement';
import { Containers } from '../../hooks/useCorpusContainers';
import { AlignmentSide } from '../../common/data/project/corpus';
import { JournalEntryTableName } from '../../state/links/tableManager';
import ResponseObject = ApiUtils.ResponseObject;
import { AlignmentFile } from '../../structs/alignmentFile';
import { SnackBarObjectInterface } from '../../features/snackbar';

/**
 * enum for indicating which step of the sync operation is in progress
 */
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
  CANCELED,
}

/**
 * current synchronization state
 */
export interface SyncState {
  sync: (project: Project) => void;
  progress: SyncProgress;
  dialog: any;
  syncedAlignments?: AlignmentFile;
  uniqueNameError: boolean;
  setUniqueNameError: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * switch to project step, only used when the current project in {@link AppContext}
 * isn't equal to the project id being synced
 *
 * WARNING: exported for testing, not intended for reuse in other parts of the application
 * @param progress current progress
 * @param setProgress setter callback
 * @param preferences current {@link UserPreference}
 * @param setPreferences callback for setting preferences
 * @param project project being operated on
 * @param projectState {@link ProjectStateType}
 */
export const stepSwitchToProject = async (
  progress: SyncProgress,
  setProgress: (s: SyncProgress) => void,
  preferences: UserPreference | undefined,
  setPreferences: React.Dispatch<
    React.SetStateAction<UserPreference | undefined>
  >,
  project: Project,
  projectState: ProjectStateType
) => {
  if (
    preferences?.currentProject &&
    preferences?.currentProject === project?.id &&
    preferences?.initialized === InitializationStates.INITIALIZED
  ) {
    setProgress(SyncProgress.SYNCING_PROJECT);
  } else {
    try {
      await projectState.linksTable.reset();
    } catch (x) {
      console.error(x);
    }
    projectState.linksTable.setSourceName(project.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...((p ?? {}) as UserPreference),
      currentProject: project.id,
      initialized: InitializationStates.UNINITIALIZED,
      onInitialized: [
        ...(p?.onInitialized ?? []),
        () => setProgress(SyncProgress.SYNCING_PROJECT),
      ],
    }));
  }
};

/**
 * synchronization of project metadata step
 *
 * WARNING: exported for testing, not intended for reuse in other parts of the application
 * @param progress current progress
 * @param setProgress setter callback
 * @param project project being operated on
 * @param abortController React ref for a {@link AbortController}
 * @param setUniqueNameError dependency, callback for setting an error state
 * @param setSnackBarObject dependency for setting the snackbar message
 * @param setIsSnackBarOpen dependency for opening the snackbar
 */
export const stepSyncingProject = async (
  progress: SyncProgress,
  setProgress: (s: SyncProgress) => void,
  project: Project,
  abortController: React.MutableRefObject<AbortController | undefined>,
  setUniqueNameError: (s: boolean) => void,
  setSnackBarObject: React.Dispatch<
    React.SetStateAction<SnackBarObjectInterface>
  >,
  setIsSnackBarOpen: Function
) => {
  if (
    project.location === ProjectLocation.SYNCED ||
    project.location === ProjectLocation.LOCAL
  ) {
    const projectsResponse = await ApiUtils.generateRequest<any>({
      requestPath: '/api/projects',
      requestType:
        project.location === ProjectLocation.SYNCED
          ? ApiUtils.RequestType.PATCH
          : ApiUtils.RequestType.POST,
      signal: abortController.current?.signal,
      payload: mapProjectEntityToProjectDTO(project),
    });
    if (projectsResponse.success) {
      setProgress(SyncProgress.SYNCING_CORPORA);
    } else {
      if (projectsResponse.response.statusCode === 403) {
        setSnackBarObject({
          message: 'You do not have permission to complete this operation.',
          variant: 'error',
        });
      } else if (
        (projectsResponse.body?.message ?? '').includes('duplicate key')
      ) {
        setUniqueNameError(true);
        setSnackBarObject({
          message: 'Failed to sync project. Project name already exists.',
          variant: 'error',
        });
      } else {
        setSnackBarObject({
          message: 'Failed to sync project.',
          variant: 'error',
        });
      }
      console.error('Response failed: ', projectsResponse.body);
      setIsSnackBarOpen(true);
      setProgress(SyncProgress.FAILED);
    }
  } else {
    setProgress(SyncProgress.SYNCING_CORPORA);
  }
};

/**
 * corpora synchronization step
 *
 * WARNING: exported for testing, not intended for reuse in other parts of the application
 * @param progress current progress
 * @param setProgress setter callback
 * @param project project being operated on
 * @param containers dependency, corpus {@link Containers}
 * @param setSnackBarObject dependency for setting the snackbar message
 * @param setIsSnackBarOpen dependency for opening the snackbar
 * @param syncWordsOrParts dependency for synchronization callback from {@link useSyncWordsOrParts}
 */
export const stepSyncingCorpora = async (
  progress: SyncProgress,
  setProgress: (s: SyncProgress) => void,
  project: Project,
  containers: Containers,
  setSnackBarObject: React.Dispatch<
    React.SetStateAction<SnackBarObjectInterface>
  >,
  setIsSnackBarOpen: Function,
  syncWordsOrParts: (
    project: Project,
    side?: AlignmentSide
  ) => Promise<ResponseObject<ProjectTokenReport> | undefined>
) => {
  if (
    project.sourceCorpora?.corpora.some(
      (c) => !c.words || c.words.length < 1
    ) ||
    !project.targetCorpora?.corpora.some((c) => !c.words || c.words.length < 1)
  ) {
    if (
      project.id !== containers.projectId ||
      containers.sourceContainer?.corpora.some(
        (c) => !c.words || c.words.length < 1
      ) ||
      containers.targetContainer?.corpora.some(
        (c) => !c.words || c.words.length < 1
      )
    ) {
      setProgress(SyncProgress.FAILED);
      return;
    }
    project.sourceCorpora = containers.sourceContainer;
    project.targetCorpora = containers.targetContainer;
  }
  const res = await syncWordsOrParts(project);
  if (!res?.success) {
    if (res?.response.statusCode === 403) {
      setSnackBarObject({
        message:
          'You do not have permission to sync corpora. Skipping corpora.',
        variant: 'error',
      });
    } else {
      setSnackBarObject({
        message:
          'An unknown error occurred while attempting to sync corpora. Skipping corpora.',
        variant: 'error',
      });
    }
    setIsSnackBarOpen(true);
  }
  setProgress(SyncProgress.SYNCING_ALIGNMENTS);
};

/**
 * alignment sync step
 *
 * WARNING: exported for testing, not intended for reuse in other parts of the application
 * @param progress current progress
 * @param dbApi database API access
 * @param setProgress setter callback
 * @param project project being operated on
 * @param setSnackBarObject dependency for setting the snackbar message
 * @param setIsSnackBarOpen dependency for opening the snackbar
 * @param uploadAlignments dependency for uploading alignments to the server
 * @param syncAlignments dependency for performing a synchronization (journal entry upload)
 */
export const stepSyncingAlignments = async (
  progress: SyncProgress,
  dbApi: DatabaseApi,
  setProgress: (s: SyncProgress) => void,
  project: Project,
  setSnackBarObject: React.Dispatch<
    React.SetStateAction<SnackBarObjectInterface>
  >,
  setIsSnackBarOpen: Function,
  uploadAlignments: (
    projectId?: string,
    controller?: AbortController
  ) => Promise<ResponseObject<{}> | undefined>,
  syncAlignments: (
    projectId?: string,
    controller?: AbortController
  ) => Promise<boolean>
) => {
  if (project.location === ProjectLocation.LOCAL) {
    const uploadResponse = await uploadAlignments(project.id);
    if (!uploadResponse?.success) {
      if (uploadResponse?.response.statusCode === 403) {
        setSnackBarObject({
          message:
            'You do not have permission to upload alignment links. Skipping links.',
          variant: 'error',
        });
      } else {
        setSnackBarObject({
          message:
            'An unknown error occurred while attempting to upload alignment links. Skipping links.',
          variant: 'error',
        });
      }
      setIsSnackBarOpen(true);
    } else {
      const allJournalEntries = await dbApi.getAllJournalEntries(project.id!);
      await dbApi.deleteByIds({
        projectId: project.id!,
        table: JournalEntryTableName,
        itemIdOrIds: allJournalEntries.map((journalEntry) => journalEntry.id!),
      });
    }
  } else {
    const syncResponse = await syncAlignments(project.id);
    if (!syncResponse) {
      setSnackBarObject({
        message:
          'An error occurred while attempting to synchronize alignment links. Skipping links.',
        variant: 'error',
      });
      setIsSnackBarOpen(true);
    }
  }
  setProgress(SyncProgress.UPDATING_PROJECT);
};

/**
 * performs the updating project step
 *
 * WARNING: exported for testing, not intended for reuse in other parts of the application
 * @param progress current progress
 * @param setProgress setter callback
 * @param inputProject project being operated on
 * @param dbApi {@link DatabaseApi}
 * @param publishProject publish project dependency from {@link usePublishProject}
 * @param projectState {@link ProjectStateType}
 * @param setProjects dependency for the setProjects callback from {@link AppContext}
 */
export const stepUpdatingProject = async (
  progress: SyncProgress,
  setProgress: (s: SyncProgress) => void,
  inputProject: Project,
  dbApi: DatabaseApi,
  publishProject: (
    project: Project,
    state: ProjectState
  ) => Promise<Project | undefined>,
  projectState: ProjectStateType,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const currentTime = DateTime.now().toMillis();
  inputProject.updatedAt = currentTime;
  inputProject.lastSyncTime = currentTime;
  inputProject.location = ProjectLocation.SYNCED;
  await dbApi.toggleCorporaUpdatedFlagOff(inputProject.id);
  // Update project state to Published.
  const publishedProject = await publishProject(
    inputProject,
    ProjectState.PUBLISHED
  );
  inputProject.lastSyncServerTime = publishedProject?.serverUpdatedAt;
  inputProject.serverUpdatedAt = publishedProject?.serverUpdatedAt;
  await projectState.projectTable?.sync?.(inputProject).catch(console.error);
  setProjects((projects) =>
    projects.map((foundProject) => {
      if (foundProject.id !== inputProject.id) return foundProject;
      foundProject.updatedAt = inputProject.updatedAt;
      foundProject.lastSyncTime = inputProject.lastSyncTime;
      foundProject.serverUpdatedAt = inputProject.serverUpdatedAt;
      foundProject.lastSyncServerTime = inputProject.lastSyncServerTime;
      return foundProject;
    })
  );
  setProgress(SyncProgress.IDLE);
};

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProject = (): SyncState => {
  const dbApi = useDatabase();
  const { publishProject } = usePublishProject();
  const { refetch: getProjects } = useProjectsFromServer({ enabled: false });
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const {
    sync: syncAlignments,
    upload: uploadAlignments,
    syncedAlignments,
  } = useSyncAlignments();
  const { deleteProject } = useDeleteRemoteProject();
  const {
    projectState,
    containers,
    setIsProjectDialogOpen,
    isBusyDialogOpen,
    setIsSnackBarOpen,
    setSnackBarObject,
    preferences,
    setPreferences,
    setProjects,
  } = useContext(AppContext);
  const [initialProjectState, setInitialProjectState] = useState<Project>();
  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const [syncTime, setSyncTime] = useState<number>(0);
  const [canceled, setCanceled] = useState<boolean>(false);
  const [uniqueNameError, setUniqueNameError] = useState<boolean>(false);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(async () => {
    if (initialProjectState) {
      const project = { ...initialProjectState };
      if (project.location === ProjectLocation.LOCAL) {
        project.lastSyncTime = 0;
        // Remove the remote project if it exists on the server.
        const remoteProjects = await getProjects();
        if ((remoteProjects ?? []).some((p) => p.id === project.id)) {
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
  }, [
    initialProjectState,
    deleteProject,
    projectState.projectTable,
    getProjects,
  ]);

  const onCancel = useCallback(() => {
    setProgress(SyncProgress.CANCELED);
  }, []);

  const syncProject = useCallback(async () => {
    const project = { ...(initialProjectState ?? {}) } as Project;
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
          setProgress(SyncProgress.SWITCH_TO_PROJECT);
          break;
        }
        case SyncProgress.SWITCH_TO_PROJECT: {
          await stepSwitchToProject(
            progress,
            setProgress,
            preferences,
            setPreferences,
            project,
            projectState
          );
          break;
        }
        case SyncProgress.SYNCING_PROJECT: {
          await stepSyncingProject(
            progress,
            setProgress,
            project,
            abortController,
            setUniqueNameError,
            setSnackBarObject,
            setIsSnackBarOpen
          );
          break;
        }
        case SyncProgress.SYNCING_CORPORA: {
          await stepSyncingCorpora(
            progress,
            setProgress,
            project,
            containers,
            setSnackBarObject,
            setIsSnackBarOpen,
            syncWordsOrParts
          );
          break;
        }
        case SyncProgress.SYNCING_ALIGNMENTS: {
          await stepSyncingAlignments(
            progress,
            dbApi,
            setProgress,
            project,
            setSnackBarObject,
            setIsSnackBarOpen,
            uploadAlignments,
            syncAlignments
          );
          break;
        }
        case SyncProgress.UPDATING_PROJECT: {
          await stepUpdatingProject(
            progress,
            setProgress,
            project,
            dbApi,
            publishProject,
            projectState,
            setProjects
          );
          break;
        }
      }
    } catch (x) {
      setProgress(SyncProgress.FAILED);
      console.error('Failed to sync this project: ', x);
      await publishProject(project, ProjectState.PUBLISHED);
    }
  }, [
    progress,
    projectState,
    cleanupRequest,
    publishProject,
    setIsSnackBarOpen,
    setSnackBarObject,
    syncAlignments,
    syncWordsOrParts,
    dbApi,
    setProjects,
    preferences,
    containers,
    setPreferences,
    uploadAlignments,
    initialProjectState,
  ]);

  useEffect(() => {
    if (syncTime && initialProjectState && !canceled) {
      syncProject().catch(console.error);
    } else if (canceled) {
      setProgress(SyncProgress.IDLE);
    }
    // The useEffect should only be called on progress changes,
    // allowing the single threaded process to be cancelable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    // Prevent the Database busyDialog from showing concurrently
    // with this project dialog
    setIsProjectDialogOpen(
      ![SyncProgress.IDLE, SyncProgress.SUCCESS, SyncProgress.FAILED].includes(
        progress
      )
    );
  }, [progress, setIsProjectDialogOpen]);

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
        dialogMessage = 'Resetting project changes...';
    }

    return (
      <Dialog
        scroll="paper"
        open={
          ![
            SyncProgress.IDLE,
            SyncProgress.SUCCESS,
            SyncProgress.FAILED,
          ].includes(progress) && !isBusyDialogOpen
        }
      >
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          sx={{ minWidth: 500, height: 'fit-content', p: 2 }}
        >
          <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
          <Typography variant="subtitle1">
            {canceled ? 'Resetting project changes...' : dialogMessage}
          </Typography>
          {progress !== SyncProgress.CANCELED && !canceled ? (
            <Button
              variant="text"
              sx={{ textTransform: 'none', ml: 2 }}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : (
            <Grid />
          )}
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
    syncedAlignments,
    uniqueNameError,
    setUniqueNameError,
  };
};
