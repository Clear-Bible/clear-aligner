import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { JournalEntryTableName } from '../../repositories/projectRepository';

/**
 * Create journal entries table
 */
export class AddJournalLinkTable1718060579447 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: JournalEntryTableName,
        columns: [
          {
            name: 'id',
            type: 'text',
            isPrimary: true,
          },
          {
            name: 'linkId',
            type: 'text',
          },
          {
            name: 'type',
            type: 'text',
          },
          {
            name: 'date',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'diff',
            type: 'TEXT',
            isNullable: false,
          },
        ],
      })
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropTable(JournalEntryTableName);
  }
}
