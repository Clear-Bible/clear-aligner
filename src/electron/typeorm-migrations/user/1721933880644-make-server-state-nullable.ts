import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { ProjectTableName } from '../../../common/data/project/project';

export class MakeServerStateNullable1721933880644
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      ProjectTableName,
      new TableColumn({
        name: 'server_state',
        type: 'text',
      }),
      new TableColumn({
        name: 'server_state',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
