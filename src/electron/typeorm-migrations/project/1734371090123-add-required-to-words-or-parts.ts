import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const WORDS_OR_PARTS_TABLE_NAME = "words_or_parts";
const REQUIRED_COLUMN_NAME = "required";

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This adds the `required` column to the `words_or_parts` table
 */
export class AddRequiredToWordsOrParts1734371090123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME);
    const tableColumns = (table?.columns ?? []).map(tc => tc.name);
    if(!tableColumns.includes(REQUIRED_COLUMN_NAME)) {
      await queryRunner.addColumn(WORDS_OR_PARTS_TABLE_NAME, new TableColumn({
        name: REQUIRED_COLUMN_NAME,
        isNullable: true,
        type: 'INTEGER',
        //default: '1'
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME).then(t => {
      const tableColumns = (t?.columns ?? []).map(t => t.name);
      if(tableColumns.includes(REQUIRED_COLUMN_NAME)) {
        queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, REQUIRED_COLUMN_NAME);
      }
    });
  }
}
