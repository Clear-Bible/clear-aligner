import { mapProjectDtoToProject, ProjectDTO, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { Progress } from '../ApiModels';
import { Project, ProjectTable } from '../../state/projects/tableManager';
import { DateTime } from 'luxon';
import { ApiUtils } from '../utils';
import RequestType = ApiUtils.RequestType;

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

      const projectsResponse = await ApiUtils.generateRequest<ProjectDTO[]>({
        requestPath: '/api/projects',
        requestType: RequestType.GET
      });
      const projectDtos = (projectsResponse.body ?? []) as ProjectDTO[];
      const serverProjects = (
        Array.isArray(projectDtos)
          ? projectDtos
            .filter(p => p.state === ProjectState.PUBLISHED)
            .map(p => mapProjectDtoToProject(p, ProjectLocation.REMOTE))
          : []
      ).filter(p => p?.targetCorpora?.corpora) as Project[];

      // Save in local database if persist is specified.
      if (persist) {
        const localProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
        for (const serverProject of serverProjects
          .filter(foundProject => ProjectTable.projectHasTargetCorpora(foundProject))) {
          serverProject.sourceCorpora = undefined;
          const localProject: Project = localProjects.get(serverProject.id);
          // Update valid projects stored locally that are local or synced.
          if (localProject?.lastSyncTime) serverProject.lastSyncTime = localProject.lastSyncTime;
          if (localProject?.updatedAt) serverProject.updatedAt = localProject.updatedAt;
          if (ProjectTable.projectHasTargetCorpora(localProject)) {
            serverProject.location = ProjectLocation.SYNCED;
            await projectState.projectTable?.update?.(serverProject, false);
          } else {
            await projectState.projectTable?.save?.(serverProject, false);
          }
        }
        const localOnlyProjects: Project[] = Array.from(localProjects.values())
          .filter((localProject: Project) =>
            !serverProjects.some(serverProject => localProject.id === serverProject.id));
        const localizedServerProjects: Project[] = localOnlyProjects.filter((foundProject: Project) =>
          ProjectTable.projectHasTargetCorpora(foundProject));
        for (const localizedServerProject of localizedServerProjects) {
          localizedServerProject.location = ProjectLocation.LOCAL;
          localizedServerProject.lastSyncTime = 0;
          localizedServerProject.updatedAt = DateTime.now().toMillis();
          await projectState.projectTable?.update?.(localizedServerProject, false);
        }
        const removedServerProjects: Project[] = localOnlyProjects.filter((foundProject: Project) =>
          !ProjectTable.projectHasTargetCorpora(foundProject));
        for (const removedServerProject of removedServerProjects) {
          await projectState.projectTable?.remove(removedServerProject?.id);
        }
      }
      const updatedLocalProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
      setProjects(prevResults => Array.from(updatedLocalProjects.values() ?? prevResults));
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
