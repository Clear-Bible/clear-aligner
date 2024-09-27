/**
 * This file contains the ProjectsView Component which is responsible for the
 * Project Mode of the CA application.
 */
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Theme,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ProjectCreationDialog from './projectCreationDialog';
import { Project } from '../../state/projects/tableManager';
import { DefaultProjectId } from '../../state/links/tableManager';
import { AppContext, THEME_PREFERENCE } from '../../App';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { LayoutContext } from '../../AppLayout';
import { Box } from '@mui/system';
import {
  CloudDoneOutlined,
  CloudOff,
  CloudOutlined,
  CollectionsBookmark,
  Computer,
  Download,
  LibraryAdd,
  Refresh,
  Settings,
  Sync,
  Upload
} from '@mui/icons-material';
import { useProjectsFromServer } from '../../api/projects/useProjectsFromServer';
import { ProjectLocation } from '../../common/data/project/project';
import { SyncProgress, useSyncProject } from '../../api/projects/useSyncProject';
import { DateTime } from 'luxon';
import { Progress } from '../../api/ApiModels';
import { ProfileAvatar, userState } from '../profileAvatar/profileAvatar';
import { grey } from '@mui/material/colors';
import { useDownloadProject } from '../../api/projects/useDownloadProject';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { SystemStyleObject } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { RemovableTooltip } from '../../components/removableTooltip';
import ProjectSettings from './projectSettings';
import { ADMIN_GROUP, useCurrentUserGroups, useIsSignedIn } from '../../hooks/userInfoHooks';
import uuid from 'uuid-random';

export interface ProjectsViewProps {
  preferredTheme: 'night' | 'day' | 'auto';
  setPreferredTheme: Function;
}

const getPaletteFromProgress = (progress: Progress, theme: Theme) => {
  switch (progress) {
    case Progress.FAILED:
      return theme.palette.error.main;
    case Progress.IN_PROGRESS:
      return theme.palette.text.secondary;
    case Progress.IDLE:
    case Progress.SUCCESS:
    default:
      return theme.palette.primary.main;
  }
};

const ProjectsView: React.FC<ProjectsViewProps> = ({ preferredTheme, setPreferredTheme }) => {
  useContext(LayoutContext);
  const { preferences, projects: initialProjects, userStatus } = useContext(AppContext);
  const { refetch: refetchRemoteProjects, progress: remoteFetchProgress } = useProjectsFromServer({
    enabled: false // Prevents immediate and useEffect-based requerying
  });
  const [disableProjectButtons, setDisableProjectButtons] = useState(false);
  const [ groupRefreshKey, setGroupRefreshKey ] = useState<string>(uuid());

  useEffect(() => {
    if (remoteFetchProgress === 0) {
      setDisableProjectButtons(false);
    } else {
      setDisableProjectButtons(true);
    }
  }, [remoteFetchProgress]);

  const isSignedIn = useIsSignedIn();

  useEffect(() => {
    if (isSignedIn) {
      setGroupRefreshKey(uuid());
    }
  }, [isSignedIn, setGroupRefreshKey]);

  const usingCustomEndpoint = useMemo(() => userStatus === userState.CustomEndpoint, [userStatus]);


  const projects = useMemo(() => initialProjects.filter(p => !!p?.name), [initialProjects]);

  const [openProjectDialog, setOpenProjectDialog] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectProject = useCallback((project?: Project) => {
    if (project) {
      setSelectedProjectId(project.id);
      setOpenProjectDialog(true);
    } else {
      setOpenProjectDialog(false);
      setSelectedProjectId(null);
    }
  }, [setSelectedProjectId, setOpenProjectDialog]);
  const unavailableProjectNames: string[] = useMemo(() => (
    projects.map(p => (p.name || '').trim())
  ), [projects]);

  const groups = useCurrentUserGroups({ forceRefresh: true, refreshKey: groupRefreshKey });

  return (
    <>
      <Grid container flexDirection="column" flexWrap={'nowrap'}
            sx={{ height: '100%', width: '100%', paddingTop: '.1rem', overflow: 'hidden', paddingLeft: '8px', paddingBottom: '8px' }}>
        <Grid container justifyContent="space-between" alignItems="center"
              sx={{ marginBottom: '.25rem', paddingX: '1.1rem', paddingLeft: projectCardMargin, width: `calc(100% + ${projectCardMargin})` }}>
          <Grid container sx={{ width: 'fit-content' }}>
            <Typography
              variant="h4"
              color={'primary'}
              sx={{ marginRight: 5, fontWeight: 'bold', fontSize: '24px' }}>Projects</Typography>
          </Grid>
          <Grid item sx={{ px: 2 }}>
            {
              (isSignedIn || usingCustomEndpoint) && (
                <Button variant="text"
                        disabled={disableProjectButtons}
                        onClick={() =>
                          refetchRemoteProjects({ persist: true, currentProjects: projects })
                            .finally(() => setGroupRefreshKey(uuid()))}>
                  <Grid container alignItems="center">
                    <Refresh sx={theme => ({
                      mr: 1,
                      mb: .5,
                      ...(disableProjectButtons ? {
                        '@keyframes rotation': {
                          from: { transform: 'rotate(0deg)' },
                          to: { transform: 'rotate(360deg)' }
                        },
                        animation: '2s linear infinite rotation',
                        fill: theme.palette.text.secondary
                      } : {})
                    })} />
                    <Typography variant="subtitle2" sx={theme => ({
                      textTransform: 'none',
                      fontWeight: 'bold',
                      color: disableProjectButtons ? theme.palette.text.secondary
                        : getPaletteFromProgress(remoteFetchProgress, theme)
                    })}>
                      {disableProjectButtons ? 'Refreshing Remote Projects...' : 'Refresh Remote Projects'}
                    </Typography>
                  </Grid>
                </Button>
              )
            }
            <ProfileAvatar/>
          </Grid>
        </Grid>
        <Grid
          container
          sx={{
            width: `100%`,
            overflowX: 'hidden',
            overflowY: 'auto',
        }}>
          <Grid
            container
            sx={{
              display: 'flex',
              flexDirection: 'row',
              maxWidth: '1400px',
              letterSpacing: '12px',
            }}>
            <CreateProjectCard
              onClick={() => {
                setSelectedProjectId(null);
                setOpenProjectDialog(true);
              }}
              unavailableProjectNames={unavailableProjectNames}
              open={openProjectDialog && !selectedProjectId}
              closeCallback={selectProject}
              isSignedIn={isSignedIn}
            />
            {projects
              .sort((p1: Project) => p1?.id === DefaultProjectId ? -1 : projects.indexOf(p1))
              .map((project: Project) => (
                <ProjectCard
                  key={`${project?.id ?? project?.name}-${project?.lastSyncTime}-${project?.updatedAt}`}
                  project={project}
                  groups={groups}
                  onOpenProjectSettings={disableProjectButtons ? () => {} : selectProject}
                  currentProject={projects.find((p: Project) =>
                    p.id === preferences?.currentProject) ?? projects?.[0]}
                  unavailableProjectNames={unavailableProjectNames}
                  disableProjectButtons={disableProjectButtons}
                  isProjectDialogOpen={openProjectDialog && selectedProjectId === project.id}
                />
              ))}
          </Grid>
        </Grid>

        <Stack direction={'row'}>
          {/* Theme Preference */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingTop: '8px',
            paddingBottom: projectCardMargin,
            paddingLeft: projectCardMargin
          }}>
            <FormControl sx={{ width: 175 }}>
              <InputLabel id={'theme-label'}>Theme</InputLabel>
              <Select
                labelId={'theme-label'}
                id={'theme-select'}
                value={preferredTheme}
                label={'Theme'}
                onChange={({ target: { value } }) =>
                  setPreferredTheme(value as THEME_PREFERENCE)
                }
              >
                <MenuItem value={'auto' as THEME_PREFERENCE}>
                  Follow System
                </MenuItem>
                <MenuItem value={'night' as THEME_PREFERENCE}>Dark</MenuItem>
                <MenuItem value={'day' as THEME_PREFERENCE}>Light</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Grid>
    </>
  );
};

/**
 * margin used by project cards
 */
const projectCardMargin = '4px';
const projectCardWidth = 391;
const projectCardHeight = 320;

/**
 * card component which allows users to create projects
 * @param onClick action performed when the card is clicked
 * @param unavailableProjectNames project names that can't be used because they already exist
 * @param open if the project settings display is open (in this case, the project creation display)
 * @param closeCallback callback when the creation display is dismissed
 * @param isSignedIn whether the user is currently signed in
 */
export const CreateProjectCard: React.FC<{
  onClick?: (e: React.MouseEvent) => void,
  unavailableProjectNames?: string[],
  open: boolean,
  closeCallback: () => void,
  isSignedIn: boolean
}> = ({ onClick, unavailableProjectNames, open, closeCallback, isSignedIn }) => {
  const cardContents: JSX.Element = (
    <CardContent
      id={'create-card-content'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        alignItems: 'center',
        height: '100%',
        margin: projectCardMargin
      }}>
      {open ?
        <ProjectSettings closeCallback={closeCallback} isSignedIn={isSignedIn} unavailableProjectNames={unavailableProjectNames} projectId={null}/>
        :
        <Grid container justifyContent="center" alignItems="center" sx={{
          height: '100%',
          margin: '0 auto'
        }}>
          <LibraryAdd color={'primary'} />
        </Grid>}
    </CardContent>);
  return (<>
    <Card
      variant={'outlined'}
      sx={theme => ({
        width: projectCardWidth,
        height: projectCardHeight,
        m: '3px',
        backgroundColor: theme.palette.primary.contrastText,
        position: 'relative'
      })}>
      {open
        ? <>
          {cardContents}
        </>
        : <CardActionArea
            sx={{
              width: '100%',
              height: '100%'
            }}
            onClick={(e) => onClick?.(e)}>
          {cardContents}
        </CardActionArea>
      }
    </Card>
  </>);
}

/**
 * props for the project card component
 */
export interface ProjectCardProps {
  /**
   * project being represented by the project card
   */
  project: Project;
  /**
   * groups the current user belongs to
   */
  groups?: string[];
  /**
   * the currently open project
   */
  currentProject: Project | undefined;
  /**
   * callback when the user requests to open the project settings display (the {@link ProjectCard} component does not keep track of whether the dialog is open)
   * @param project project to open the settings dialog for
   */
  onOpenProjectSettings: (project?: Project) => void;
  /**
   * project names this can't be set to because they already exist
   */
  unavailableProjectNames: string[];
  /**
   * whether the project action buttons should be disabled (import/export/etc.)
   */
  disableProjectButtons: boolean;
  /**
   * whether the project settings display is currently enabled
   */
  isProjectDialogOpen: boolean;
}

const currentProjectBorderIndicatorHeight = '4px';

/**
 * component displaying a project
 * @param project project being displayed
 * @param groups current groups the user belongs to
 * @param currentProject current project
 * @param onOpenProjectSettings callback for the project settings display
 * @param unavailableProjectNames unavailable names
 * @param disableProjectButtons whether project buttons should be disabled
 * @param isProjectDialogOpen whether the project settings display is being shown
 * @constructor
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
                                                          project,
                                                          groups,
                                                          currentProject,
                                                          onOpenProjectSettings,
                                                          unavailableProjectNames,
                                                          disableProjectButtons,
                                                          isProjectDialogOpen
                                                        }) => {
  useCorpusContainers();

  const isAdmin = useMemo<boolean>(() => (groups ?? []).includes(ADMIN_GROUP), [groups]);

  const { downloadProject, dialog: downloadProjectDialog } = useDownloadProject();
  const {
    sync: syncProject,
    progress: syncingProject,
    dialog: syncDialog,
    uniqueNameError,
    setUniqueNameError
  } = useSyncProject();

  const { setPreferences, projectState, preferences, userStatus } = useContext(AppContext);
  const isCurrentProject = useMemo(() => project.id === currentProject?.id, [project.id, currentProject?.id]);

  const isSignedIn = useIsSignedIn();
  const usingCustomEndpoint = useMemo(() => userStatus === userState.CustomEndpoint, [userStatus]);

  const updateCurrentProject = useCallback(() => {
    projectState.linksTable.reset().catch(console.error);
    projectState.linksTable.setSourceName(project.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: project.id,
      initialized: InitializationStates.UNINITIALIZED
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreferences, preferences, project.id, projectState.userPreferenceTable, projectState.linksTable]);

  const syncLocalProjectWithServer = useCallback(() => {
    syncProject(project);
  }, [project, syncProject]);

  const locationIndicator = useMemo<JSX.Element>(() => {
    const propCompute = (theme: Theme): SystemStyleObject<Theme> => ({
      fill: theme.palette.text.secondary,
      mt: .5
    });

    switch (project.location) {
      case ProjectLocation.LOCAL:
        return (<Computer sx={propCompute} />);
      case ProjectLocation.REMOTE:
        return (<CloudOutlined sx={propCompute} />);
      case ProjectLocation.SYNCED:
        return (<CloudDoneOutlined sx={propCompute} />);
    }
  }, [project.location]);

  const serverActionButton = useMemo(() => {
    const signedOutIcon = (
      <Grid container justifyContent="flex-end" alignItems="center">
        <Tooltip title="Sign in to connect to manage remote projects">
          <span>
            <Button
              variant="text"
              disabled
              sx={{
                margin: 0,
                padding: 0,
                textTransform: 'none',
                minWidth: '0px !important'
              }}>
            <span style={{ color: grey['500'] }}>Unavailable</span>
            <CloudOff sx={theme => ({ fill: theme.palette.text.secondary, mb: .5, ml: .5 })} />
          </Button>
          </span>
        </Tooltip>
      </Grid>
    );
    if (!(isSignedIn || usingCustomEndpoint)) {
      return signedOutIcon;
    }

    const tooltipText = (() => {
      switch(project.location) {
        case ProjectLocation.LOCAL:
          return `Upload ${project.name}`;
        case ProjectLocation.REMOTE:
          return `Download ${project.name}`;
        case ProjectLocation.SYNCED:
          return `Sync ${project.name}`;
        default:
          return '';
      }
    })();

    const buttonDisabled: boolean = (() => {
      switch (project.location) {
        case ProjectLocation.SYNCED:
          if (!project) {
            return true;
          }
          if (disableProjectButtons) {
            return true;
          }
          const containers = [ project.sourceCorpora, project.targetCorpora ];
          if (!isSignedIn || containers.length < 1) {
            return true;
          }
          if ((project.updatedAt ?? 0) > (project.lastSyncTime ?? 0)) {
            return false;
          }
          if ((project.serverUpdatedAt ?? 0) > (project.lastSyncServerTime ?? 0)) {
            return false;
          }
          return !([...(project.sourceCorpora?.corpora ?? []), ...(project.targetCorpora?.corpora ?? [])]
            .some((corpus) => !!corpus.updatedSinceSync));
        default:
          return ![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProject) || disableProjectButtons;
      }
    })();

    const actionButton = (() => {
      const buttonStyle = {
        margin: 0,
        padding: 0,
        textTransform: 'none',
        minWidth: '0px !important'
      };
      const iconStyle = (theme: Theme) => ({
        fill: buttonDisabled ? theme.palette.text.secondary : theme.palette.primary.main
      });
      switch (project.location) {
        case ProjectLocation.LOCAL:
          if (!isAdmin) return (<></>);
          return (
            <Button variant="text"
                    disabled={buttonDisabled || !isAdmin}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      syncLocalProjectWithServer();
                    }}>
              <Upload sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.REMOTE:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      void downloadProject(project.id);
                    }}>
              <Download sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.SYNCED:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      syncProject(project);
                    }}>
              <Sync sx={iconStyle} />
            </Button>
          );
        default:
          return (<></>);
      }
    })();

    return (
      <RemovableTooltip
        removed={buttonDisabled}
        title={tooltipText}>
        {actionButton}
      </RemovableTooltip>
    );
  }, [isSignedIn, usingCustomEndpoint, syncingProject, disableProjectButtons, syncLocalProjectWithServer, downloadProject, syncProject, project, isAdmin]);

  const settingsButton = useMemo(() => (
    <Button variant="text"
            size="small"
            sx={{
              margin: 0,
              padding: 0,
              textTransform: 'none',
              minWidth: '0px !important'
            }}
            disabled={disableProjectButtons}
            onClick={e => {
              e.stopPropagation();
              onOpenProjectSettings(project);
            }}
    ><Settings/></Button>
  ), [project, onOpenProjectSettings, disableProjectButtons]);

  const cardContents: JSX.Element = (
    <CardContent sx={{
      margin: projectCardMargin,
      display: 'flex',
      flexDirection: 'column',
      height: isCurrentProject ? `calc(100% + ${currentProjectBorderIndicatorHeight})` : '100%',
    }}>
      {isProjectDialogOpen ?
        (<>
          <ProjectSettings closeCallback={() => onOpenProjectSettings(undefined)} projectId={project.id} isSignedIn={isSignedIn} />
        </>) : (
          <>
            <Box
              id={'project-title'}
              sx={{
                position: 'absolute',
                width: `calc(100% - 10 * ${projectCardMargin})`,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                fontWeight: 'fontWeightMedium'
              }}>
              <Typography
                sx={{ color: 'text.primary' }}
                variant={'h6'}>
                {project.name}
              </Typography>
              {locationIndicator}
            </Box>
            <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
              <Typography variant="h6"
                          sx={{ textAlign: 'center', mt: 4 }}>
                <CollectionsBookmark sx={theme => ({
                  color: theme.palette.text.secondary
                })} />
              </Typography>
            </Grid>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                fontWeight: 'fontWeightMedium',
                marginBottom: `calc(${projectCardMargin}/2)`,
                ...(isCurrentProject ? {
                  transform: `translate(0, 7px)`
                } : {})
              }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'initial'
                }}>
                {settingsButton}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'initial'
                }}>
                <Box
                  sx={{
                    height: '100%',
                    marginRight: '1em'
                  }}>
                  {
                    (!!project.lastSyncTime && syncingProject !== SyncProgress.FAILED) && (
                      <Typography
                        variant="caption"
                        color="text.secondary">
                        <span style={{ fontWeight: 'bold' }}>Last sync</span>
                        &nbsp;{DateTime.fromJSDate(new Date(project.lastSyncTime)).toFormat('MMMM dd yyyy, hh:mm:ss a')}
                      </Typography>
                    )
                  }
                  {
                    syncingProject === SyncProgress.FAILED && (
                      <Typography
                        variant="caption"
                        color="error">
                        There was an error uploading this project.
                      </Typography>
                    )
                  }
                </Box>
                {serverActionButton}
              </Box>
            </Box>
          </>
        )}
    </CardContent>
  );

  return (
    <>
      <Card
          variant={'outlined'}
          sx={theme => ({
            width: projectCardWidth,
            height: projectCardHeight,
            m: '3px',
            backgroundColor: theme.palette.primary.contrastText,
            ...(isCurrentProject ? {
              borderBottomWidth: currentProjectBorderIndicatorHeight,
              borderBottomStyle: 'solid',
              borderBottomColor: 'success.main'
            } : {}),
            position: 'relative'
          })}>
        {(project.location !== ProjectLocation.REMOTE && !isCurrentProject && !isProjectDialogOpen)
          ? <>
            <CardActionArea
              component={'div'}
              sx={{
                width: '100%',
                height: '100%'
              }}
              onClick={(e) => {
                e.preventDefault();
                !isCurrentProject && updateCurrentProject();
              }}>
              {cardContents}
            </CardActionArea>
          </>
          : <>
            {cardContents}
          </>
        }
      </Card>
      {syncDialog}
      {downloadProjectDialog}
      <ProjectCreationDialog
        open={uniqueNameError}
        projectId={project.id}
        closeCallback={() => setUniqueNameError(false)}
        unavailableProjectNames={[project.name, ...unavailableProjectNames]}
        isSignedIn={isSignedIn}
      />
    </>
  );
};

export default ProjectsView;
