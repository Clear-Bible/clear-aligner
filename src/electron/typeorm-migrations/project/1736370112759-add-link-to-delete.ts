import { LinkTableName } from '../../repositories/projectRepository';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TO_DELETE_COLUMN_NAME = 'to_delete';

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This adds a `to_delete` column to the `links` table
 */
export class AddToDeleteToLinkTable1736370112759 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(LinkTableName);
    const tableColumns = (table?.columns ?? []).map((tc) => tc.name);
    if (!tableColumns.includes(TO_DELETE_COLUMN_NAME)) {
      await queryRunner.addColumn(
        LinkTableName,
        new TableColumn({
          name: TO_DELETE_COLUMN_NAME,
          isNullable: true,
          type: 'INTEGER',
          default: '0',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.getTable(LinkTableName).then((t) => {
      const tableColumns = (t?.columns ?? []).map((t) => t.name);
      if (tableColumns.includes(TO_DELETE_COLUMN_NAME)) {
        queryRunner.dropColumn(LinkTableName, TO_DELETE_COLUMN_NAME);
      }
    });
  }
}
