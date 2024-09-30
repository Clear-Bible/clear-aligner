/**
 * This file contains the ProjectsView Component which is responsible for the
 * Project Mode of the CA application.
 */
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Theme, Typography } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Project } from '../../state/projects/tableManager';
import { DefaultProjectId } from '../../state/links/tableManager';
import { AppContext, THEME_PREFERENCE } from '../../App';
import { LayoutContext } from '../../AppLayout';
import { Box } from '@mui/system';
import { Refresh } from '@mui/icons-material';
import { useProjectsFromServer } from '../../api/projects/useProjectsFromServer';
import { Progress } from '../../api/ApiModels';
import { ProfileAvatar, userState } from '../profileAvatar/profileAvatar';
import { useCurrentUserGroups, useIsSignedIn } from '../../hooks/userInfoHooks';
import uuid from 'uuid-random';
import { CreateProjectCard } from './createProjectCard';
import { ProjectCard } from './projectCard';

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
export const projectCardMargin = '4px';
/**
 * width of project cards
 */
export const projectCardWidth = 391;
/**
 * height of project cards
 */
export const projectCardHeight = 320;

export const currentProjectBorderIndicatorHeight = '4px';

export default ProjectsView;
