import {
  mapProjectDtoToProject, ProjectDTO,
  ProjectLocation, ProjectState
} from '../../common/data/project/project';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { Progress } from '../ApiModels';
import { Project } from '../../state/projects/tableManager';
import { DateTime } from 'luxon';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  OverrideCaApiEndpoint
} from '../../server/amplifySetup';
import { get } from 'aws-amplify/api';

/**
 * Interface used to define the properties of the useProjectsFromServer hook.
 */
export interface UseProjectsFromServerProps {
  syncProjectsKey?: string;
  enabled?: boolean;
}

/**
 * Custom hook used to query remote projects and optionally persist those in the local database.
 * When refetch is called with persist = true, remote projects are queried and added to the project table. Remote corpora
 * are added in a new project database to populate additional project information.
 *
 * @param syncProjectsKey Used to requery project information when updated in the component that invokes this hook.
 * @param enabled Prevents automatically requerying remote projects when set to false.
 */
export const useProjectsFromServer = ({ syncProjectsKey, enabled = true }: UseProjectsFromServerProps): {
  refetch: (args?: { persist: boolean; currentProjects: any }) => Promise<ProjectDTO[] | undefined>,
  progress: Progress
} => {
  const { projectState, setProjects } = useContext(AppContext);
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);

  const getProjects = useCallback(async ({ persist, currentProjects } = { persist: false, currentProjects: [] }) => {
    try {
      setProgress(Progress.IN_PROGRESS);

      let projectDtos: ProjectDTO[];
      const requestPath = `/api/projects`;
      if (OverrideCaApiEndpoint) {
        const projectsResponse = await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          }
        });
        projectDtos = await projectsResponse.json();
      } else {
        const responseOperation = get({
          apiName: ClearAlignerApi,
          path: requestPath,
          options: getApiOptionsWithAuth()
        });
        const response = await responseOperation.response;
        projectDtos = (await response.body.json() as unknown as ProjectDTO[] | undefined) ?? [];
      }

      const projects = (
        Array.isArray(projectDtos)
          ? projectDtos
            .filter(p => p.state === ProjectState.PUBLISHED)
            .map(p => mapProjectDtoToProject(p, ProjectLocation.REMOTE))
          : []
      ).filter(p => p?.targetCorpora?.corpora) as Project[];

      // Save in local database if persist is specified.
      if (persist) {
        const localProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
        for (const project of projects.filter(p => p?.targetCorpora?.corpora?.length)) {
          project.sourceCorpora = undefined;

          const localProject: Project = localProjects.get(project.id);
          const projectInUpdatedState = !!project.lastSyncTime && !!project.lastUpdated
            && project.lastSyncTime !== project.lastUpdated;
          const syncTime = DateTime.now().toMillis();
          if(!projectInUpdatedState) {
            project.lastUpdated = syncTime;
          }
          // Update valid projects stored locally that are local or synced.
          if (localProject?.targetCorpora?.corpora?.[0] && localProject.location !== ProjectLocation.REMOTE) {
            project.lastSyncTime = syncTime;
            project.location = ProjectLocation.SYNCED;
            await projectState.projectTable?.update?.(project, false);
          } else {
            await projectState.projectTable?.save?.(project, false);
          }
        }
        const removedProjects: Project[] = Array.from(localProjects.values()).filter((lp: Project) =>
          !projects.some(p => lp.id === p.id) && lp.targetCorpora?.corpora?.reduce((a, b) => a && b)
        );
        for (const removedProject of removedProjects) {
          removedProject.location = ProjectLocation.LOCAL;
          removedProject.lastSyncTime = 0;
          removedProject.lastUpdated = DateTime.now().toMillis();
          await projectState.projectTable?.update?.(removedProject, false);
        }
      }
      const updatedProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
      setProjects(p => Array.from(updatedProjects.values() ?? p));
      setProgress(Progress.SUCCESS);
      return projectDtos;
    } catch (x) {
      console.error(x);
      setProgress(Progress.FAILED);
    } finally {
      setTimeout(() => setProgress(Progress.IDLE), 5000);
    }
  }, [projectState, setProjects]);

  useEffect(() => {
    enabled && void getProjects();
  }, [getProjects, syncProjectsKey, enabled]);

  return { refetch: getProjects, progress };
};