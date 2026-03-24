import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { ProjectTableName } from '../../../common/data/project/project';

export class ProjectsUpdatedAt1720240767826 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      ProjectTableName,
      new TableColumn({
        name: 'last_updated',
        type: 'BIGINT',
      }),
      new TableColumn({
        name: 'updated_at',
        type: 'BIGINT',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      ProjectTableName,
      new TableColumn({
        name: 'created_at',
        type: 'timestamptz',
        default: 'CURRENT_TIMESTAMP',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      ProjectTableName,
      new TableColumn({
        name: 'updated_at',
        type: 'BIGINT',
      }),
      new TableColumn({
        name: 'last_updated',
        type: 'BIGINT',
        isNullable: false,
      })
    );
  }
}
