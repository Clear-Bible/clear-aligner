import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ProjectTableName } from '../../../common/data/project/project';

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This one adds `id`, `name`, `location` and `server_state` columns to the `project` table.
 * These columns are used to defined project information for local, synced, and remote project types.
 */
export class AddProjectsTable1718861542573 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: ProjectTableName,
        columns: [
          {
            name: 'id',
            type: 'text',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'location',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'server_state',
            type: 'text',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropTable(ProjectTableName);
  }
}
