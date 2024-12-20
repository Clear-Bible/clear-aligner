import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';
import { ProjectTableName } from '../../repositories/userRepository';

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This one adds `last_updated` and `last_sync_time` columns to the `links` table
 */
export class AddProjectSync1719514157111 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      ProjectTableName,
      new TableColumn({
        name: 'last_updated',
        type: 'BIGINT',
      } as TableColumnOptions)
    );
    await queryRunner.addColumn(
      ProjectTableName,
      new TableColumn({
        name: 'last_sync_time',
        type: 'BIGINT',
        isNullable: true,
      })
    );
    await queryRunner.query(
      `UPDATE ${ProjectTableName} SET last_updated = '' WHERE ${ProjectTableName}.last_updated IS NULL`
    );
    await queryRunner.query(
      `UPDATE ${ProjectTableName} SET last_sync_time = '' WHERE ${ProjectTableName}.last_sync_time IS NULL`
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(ProjectTableName, [
      'last_updated',
      'last_sync_time',
    ]);
  }
}
