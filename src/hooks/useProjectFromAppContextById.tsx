import { useContext } from 'react';
import { AppContext } from '../App';
import { Project } from '../state/projects/tableManager';

/**
 * use project from {@link AppContext} by its {@link Project#id}
 * @param projectId
 */
export const useProjectFromAppContextById = (projectId: string) => {
  const { projects } = useContext(AppContext);
  return projects.find((project: Project) => project.id === projectId);
};
