import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { JournalEntryTableName } from '../../repositories/projectRepository';

export class JournalEntriesDiffToBody1720419515419
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      JournalEntryTableName,
      new TableColumn({
        name: 'diff',
        type: 'TEXT',
        isNullable: true,
      }),
      new TableColumn({
        name: 'body',
        type: 'TEXT',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      JournalEntryTableName,
      new TableColumn({
        name: 'body',
        type: 'TEXT',
        isNullable: true,
      }),
      new TableColumn({
        name: 'diff',
        type: 'TEXT',
        isNullable: true,
      })
    );
  }
}
