import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import React, { useContext, useEffect } from 'react';
import ProjectDialog from './projectDialog';
import { Project } from '../../state/projects/tableManager';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';
import { DefaultProjectName } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { UserPreference } from '../../state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { InitializationStates } from '../../workbench/query';
import { LayoutContext } from '../../AppLayout';

interface ProjectsViewProps {
}

const ProjectsView: React.FC<ProjectsViewProps> = () => {
  const { projects, preferences  } = React.useContext(AppContext);
  const [openProjectDialog, setOpenProjectDialog] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const selectProject = React.useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setOpenProjectDialog(true);
  }, [setSelectedProjectId, setOpenProjectDialog]);
  const layoutCtx = useContext(LayoutContext);

  useEffect(() => {
    layoutCtx.setMenuBarDelegate(
      <Typography sx={{ textAlign: 'center' }}>
        Projects
      </Typography>
    )
  }, [layoutCtx, preferences?.currentProject]);

  return (
    <>
      <Grid container flexDirection="column" flexWrap={'nowrap'} sx={{ height: '100%', width: '100%', paddingTop: '.1rem', overflow: 'hidden' }}>
        <Grid container sx={{ marginBottom: '.25rem', paddingX: '1.1rem', marginLeft: '1.1rem' }}>
          <Typography variant="h4" sx={{ marginRight: 5, fontWeight: 'bold' }}>Projects</Typography>
          <Button
            variant="contained"
            onClick={() => setOpenProjectDialog(true)}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >Create New</Button>
        </Grid>
        <Grid container sx={{ width: '100%', paddingX: '1.1rem', overflow: 'auto' }}>
          {projects.sort((p1: Project) => p1.id === DefaultProjectName ? -1 : projects.indexOf(p1))
            .map((project: Project) => (
              <ProjectCard
                key={project.id ?? project.name}
                project={project}
                onClick={selectProject}
                currentProject={projects.find((p: Project) =>
                    p.id === preferences?.currentProject) ?? projects?.[0]}
              />
            ))}
        </Grid>
      </Grid>
      <ProjectDialog
        open={openProjectDialog}
        projectId={selectedProjectId}
        closeCallback={() => {
          setOpenProjectDialog(false);
          setSelectedProjectId(null);
        }}
      />
    </>
  );
};

interface ProjectCardProps {
  project: Project;
  currentProject: Project | undefined;
  onClick: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentProject, onClick }) => {
  useCorpusContainers();
  const { setPreferences, projectState, preferences } = React.useContext(AppContext);
  const isCurrentProject = React.useMemo(() => project.id === currentProject?.id, [project.id, currentProject?.id]);

  const updateCurrentProject = React.useCallback(() => {
    projectState.linksTable.reset().catch(console.error);
    projectState.linksTable.setSourceName(project.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: project.id,
      initialized: InitializationStates.UNINITIALIZED
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreferences, preferences, project.id, projectState.userPreferenceTable, projectState.linksTable]);

  return (
    <Card sx={theme => ({
      height: 250, width: 250, m: 2.5, '&:hover': {
        boxShadow: (theme.palette as unknown as { mode: string; }).mode === 'dark'
          ? '0px 2px 4px -1px rgba(255,255,255,0.2), 0px 4px 5px 0px rgba(255,255,255,0.14), 0px 1px 10px 0px rgba(255,255,255,0.12)'
          : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
      }, transition: 'box-shadow 0.25s ease', '*': { cursor: 'pointer' }
    })}>
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '100%'
      }}>
        <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}
              onClick={() => onClick(project.id)}>
          <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>{project.name}</Typography>
        </Grid>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            {
              isCurrentProject ? (
                <Typography variant="subtitle2">Current Project</Typography>
              ) : (
                <Button variant="text" size="small" sx={{ textTransform: 'none' }}
                        onClick={e => {
                          e.preventDefault();
                          updateCurrentProject();
                        }}
                >Open</Button>
              )
            }
          </Grid>
          <Grid item>
            <UploadAlignmentGroup
              projectId={project.id}
              size="small"
              containers={[
                ...(project.sourceCorpora ? [project.sourceCorpora] : []),
                ...(project.targetCorpora ? [project.targetCorpora] : [])
              ]}
              allowImport={isCurrentProject}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ProjectsView;
