import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';
import { JournalEntryTableName } from '../../repositories/projectRepository';

export class AddBulkInserts1720060108764 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      JournalEntryTableName,
      new TableColumn({
        name: 'bulk_insert_file',
        type: 'TEXT',
        isNullable: true,
      } as TableColumnOptions)
    );
    await queryRunner.changeColumn(
      JournalEntryTableName,
      new TableColumn({
        name: 'diff',
        type: 'TEXT',
        isNullable: false,
      }),
      new TableColumn({
        name: 'diff',
        type: 'TEXT',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      JournalEntryTableName,
      new TableColumn({
        name: 'linkId',
        type: 'text',
      }),
      new TableColumn({
        name: 'linkId',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(JournalEntryTableName, 'bulk_insert_file');
  }
}
