/**
 * This file supports the User Repository, mainly used for user preferences.
 */
import { BaseRepository } from './baseRepository';
import { DataSource, EntitySchema, Repository } from 'typeorm';
import path from 'path';
import { ControlPanelFormat, UserPreferenceDto } from '../../state/preferences/tableManager';
import { AddProjectsTable1718861542573 } from '../typeorm-migrations/user/1718861542573-add-projects-table';
import { ProjectEntity } from '../../common/data/project/project';
import { UserRepositoryIFace } from '../../common/repositories/userRepository';
import uuid from 'uuid-random';
import { AddProjectSync1719514157111 } from '../typeorm-migrations/user/1719514157111-add-project-sync';
import { ProjectsUpdatedAt1720240767826 } from '../typeorm-migrations/user/1720240767826-projects-updated-at';
import { AddServerUpdatedAt1721874829506 } from '../typeorm-migrations/user/1721874829506-add-server-updated-at';
import { MakeServerStateNullable1721933880644 } from '../typeorm-migrations/user/1721933880644-make-server-state-nullable';
import { AddProjectMembers1726100700022 } from '../typeorm-migrations/user/1726100700022-add-project-members';

export const ProjectTableName = 'project';

/**
 * This class encapsulates the user preferences
 */
export class PreferenceEntity {
  id?: string;
  alignment_view: ''|ControlPanelFormat;
  bcv: string;
  page: string;
  current_project: string;

  constructor() {
    this.id = undefined;
    this.alignment_view = '';
    this.bcv = '';
    this.page = '';
    this.current_project = '';

  }
}

const preferenceEntity = new EntitySchema({
  name: 'preference', tableName: 'preference', target: PreferenceEntity, columns: {
    id: {
      //@ts-ignore
      primary: true, type: 'varchar', generated: false
    }, alignment_view: {
      type: 'varchar'
    }, current_project: {
      type: 'varchar', nullable: true
    }, bcv: {
      type: 'varchar', nullable: true
    }, page: {
      type: 'varchar', nullable: true
    }, show_gloss: {
      type: 'integer'
    }
  }
});

const projectEntitySchema = new EntitySchema<ProjectEntity>({
  name: 'project', tableName: ProjectTableName, target: ProjectEntity, columns: {
    id: {
      primary: true, type: 'varchar', generated: undefined
    },
    name: {
      type: 'varchar'
    },
    members: {
      type: 'varchar',
      nullable: true
    },
    location: {
      type: 'varchar'
    },
    serverState: {
      name: 'server_state',
      type: 'varchar',
      nullable: true
    },
    lastSyncTime: {
      name: 'last_sync_time',
      type: 'bigint',
      nullable: true
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      nullable: true
    },
    updatedAt: {
      name: 'updated_at',
      type: 'bigint',
      nullable: true
    },
    serverUpdatedAt: {
      name: 'server_updated_at',
      type: 'bigint',
      nullable: true
    },
    lastSyncServerTime: {
      name: 'last_sync_server_time',
      type: 'bigint',
      nullable: true
    }
  }
})


/**
 * This class sets up the User Repository
 */
export class UserRepository extends BaseRepository implements UserRepositoryIFace {
  static USER_DB_NAME = 'user';

  getDataSource: () => Promise<DataSource>;

  getMigrations = async (): Promise<any[]> => ([
    AddProjectsTable1718861542573,
    AddProjectSync1719514157111,
    ProjectsUpdatedAt1720240767826,
    AddServerUpdatedAt1721874829506,
    MakeServerStateNullable1721933880644,
    AddProjectMembers1726100700022,
  ]);

  constructor() {
    super();
    this.getDataSource = async () =>
      await this.getDataSourceWithEntities(
        UserRepository.USER_DB_NAME,
        [
          preferenceEntity,
          projectEntitySchema
        ],
        path.join(this.getTemplatesDirectory(), 'clear-aligner-user.sqlite'),
        this.getDataDirectory());
  }
  getProjects = async (): Promise<ProjectEntity[]> => {
    const repo: Repository<ProjectEntity> = (await this.getDataSource()).getRepository(ProjectEntity);
    return await repo.createQueryBuilder(ProjectTableName).getMany() || [];
  };
  projectPersist = async (p: ProjectEntity): Promise<ProjectEntity> => {
    const repo: Repository<ProjectEntity> = (await this.getDataSource()).getRepository(ProjectEntity);
    if (!p.id) {
      p.id = uuid();
    }
    await repo.insert(p);
    return (await repo.findOneBy({ id: p.id }))!;
  };
  projectSave = async (p: ProjectEntity): Promise<ProjectEntity> => {
    const repo: Repository<ProjectEntity> = (await this.getDataSource()).getRepository(ProjectEntity);
    return await repo.save(p);
  };

  projectRemove = async (projectId: string): Promise<ProjectEntity | null> => {
    const repo: Repository<ProjectEntity> = (await this.getDataSource()).getRepository(ProjectEntity);
    const project = await repo.findOneBy({ id: projectId });
    if (project) {
      return await repo.remove(project);
    }
    return null;
  };

  getPreferences = async () => {
    const preferences = await (await this.getDataSource())
      .getRepository('preference')
      .createQueryBuilder('preference')
      .getMany();
    return (preferences || [])[0];
  };

  createOrUpdatePreferences = async (preferenceData: UserPreferenceDto) => {
    const preferenceRepository = (await this.getDataSource()).getRepository('preference');
    // Clear all rows to ensure no duplicates exist
    await preferenceRepository.clear();
    const newPreference = preferenceRepository.create(preferenceData);
    return await preferenceRepository.save(newPreference);
  };
}

module.exports = {
  UserRepository
};
