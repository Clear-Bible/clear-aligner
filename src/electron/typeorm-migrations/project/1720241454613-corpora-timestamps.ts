import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { CORPORA_TABLE_NAME } from '../../../common/data/project/corpus';

export class CorporaTimestamps1720241454613 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(CORPORA_TABLE_NAME, [
      new TableColumn({
        name: 'created_at',
        type: 'timestamptz',
        default: 'CURRENT_TIMESTAMP',
      }),
      new TableColumn({
        name: 'updated_since_sync',
        type: 'INTEGER',
        default: '0',
        isNullable: true,
      }),
    ]);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(CORPORA_TABLE_NAME, [
      'created_at',
      'updated_since_sync',
    ]);
  }
}
