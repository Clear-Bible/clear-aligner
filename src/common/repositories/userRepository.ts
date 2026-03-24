import { ProjectEntity } from '../data/project/project';

export interface UserRepositoryIFace {
  projectPersist: (p: ProjectEntity) => Promise<ProjectEntity>;
  projectSave: (p: ProjectEntity) => Promise<ProjectEntity>;
}
