import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const WORDS_OR_PARTS_TABLE_NAME = 'words_or_parts';
const LEMMA_COLUMN_NAME = 'lemma';
const EXCLUDE_COLUMN_NAME = 'exclude';

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This adds `lemma` and `exclude` columns to the `words_or_parts` table
 */
export class AddLemmaToWordsOrParts1734038034739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME);
    const tableColumns = (table?.columns ?? []).map((tc) => tc.name);
    if (!tableColumns.includes(LEMMA_COLUMN_NAME)) {
      await queryRunner.addColumn(
        WORDS_OR_PARTS_TABLE_NAME,
        new TableColumn({
          name: LEMMA_COLUMN_NAME,
          isNullable: true,
          type: 'TEXT',
        })
      );
    }
    if (!tableColumns.includes(EXCLUDE_COLUMN_NAME)) {
      await queryRunner.addColumn(
        WORDS_OR_PARTS_TABLE_NAME,
        new TableColumn({
          name: EXCLUDE_COLUMN_NAME,
          isNullable: true,
          type: 'INTEGER',
          default: '0',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME).then((t) => {
      const tableColumns = (t?.columns ?? []).map((t) => t.name);
      if (tableColumns.includes(LEMMA_COLUMN_NAME)) {
        queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, LEMMA_COLUMN_NAME);
      }
      if (tableColumns.includes(EXCLUDE_COLUMN_NAME)) {
        queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, EXCLUDE_COLUMN_NAME);
      }
    });
  }
}
