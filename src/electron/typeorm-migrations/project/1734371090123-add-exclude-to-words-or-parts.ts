import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const WORDS_OR_PARTS_TABLE_NAME = "words_or_parts";
const EXCLUDE_COLUMN_NAME = "exclude";

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This adds the `exclude` column to the `words_or_parts` table
 */
export class AddExcludeToWordsOrParts1734561207123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME);
    const tableColumns = (table?.columns ?? []).map(tc => tc.name);
    if(!tableColumns.includes(EXCLUDE_COLUMN_NAME)) {
      await queryRunner.addColumn(WORDS_OR_PARTS_TABLE_NAME, new TableColumn({
        name: EXCLUDE_COLUMN_NAME,
        isNullable: true,
        type: 'INTEGER',
        default: '0'
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME).then(t => {
      const tableColumns = (t?.columns ?? []).map(t => t.name);
      if(tableColumns.includes(EXCLUDE_COLUMN_NAME)) {
        queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, EXCLUDE_COLUMN_NAME);
      }
    });
  }
}
