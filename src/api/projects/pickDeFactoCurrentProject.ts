import { ProjectLocation } from '../../common/data/project/project';
import { DefaultProjectId } from '../../state/links/tableManager';
import { Project } from '../../state/projects/tableManager';

/**
 * picks project from the available projects
 * @param projectsList current list of projects to pick from
 * @param preferenceCurrentProject optional, preferred project selection (if available)
 */
export const pickDeFactoCurrentProject = (
  projectsList: Project[],
  preferenceCurrentProject?: string
) => {
  const prefCurrentProject = projectsList.some(
    (p) =>
      p.id === preferenceCurrentProject && p.location !== ProjectLocation.REMOTE
  )
    ? preferenceCurrentProject
    : undefined;
  const firstLocalOrSyncedProject = projectsList.find(
    (p) => p.location !== ProjectLocation.REMOTE
  );
  return (
    prefCurrentProject ??
    firstLocalOrSyncedProject?.id ??
    projectsList.find((p) => DefaultProjectId === p.id)?.id
  );
};
