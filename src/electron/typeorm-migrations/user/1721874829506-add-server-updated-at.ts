import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { ProjectTableName } from '../../../common/data/project/project';

const serverUpdatedAtColumn = 'server_updated_at';
const lastSyncServerTime = 'last_sync_server_time';

export class AddServerUpdatedAt1721874829506 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(ProjectTableName, [
      new TableColumn({
        name: serverUpdatedAtColumn,
        type: 'BIGINT',
        isNullable: true,
      }),
      new TableColumn({
        name: lastSyncServerTime,
        type: 'BIGINT',
        isNullable: true,
      }),
    ]);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(ProjectTableName, serverUpdatedAtColumn);
    await queryRunner.dropColumn(ProjectTableName, lastSyncServerTime);
  }
}
