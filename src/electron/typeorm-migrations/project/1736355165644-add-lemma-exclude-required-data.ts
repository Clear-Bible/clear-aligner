import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const WORDS_OR_PARTS_TABLE_NAME = 'words_or_parts';
const REQUIRED_COLUMN_NAME = 'required';
const LEMMA_COLUMN_NAME = 'lemma';
const EXCLUDE_COLUMN_NAME = 'exclude';
const ID_COLUMN_NAME = 'id'
const SIDE_COLUMN_NAME = 'side';

export class AddLemmaExcludeRequiredData1736355165644 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      console.log('inside up method in migration')
      const table = await queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME);
      console.log('table is: ', table)
      const tableColumns = (table?.columns?? []).map((tc) => tc.name);
      console.log('tableColumns is: ')



        await queryRunner.query(`UPDATE '${WORDS_OR_PARTS_TABLE_NAME}'
                                SET '${LEMMA_COLUMN_NAME}' = 'lemxxxxxx',
                                    '${EXCLUDE_COLUMN_NAME}' = 'excl111',
                                    '${REQUIRED_COLUMN_NAME}' = 'req11122'
                                WHERE ${WORDS_OR_PARTS_TABLE_NAME}.${ID_COLUMN_NAME} = 'sources:010010010011';
                                `)

      const needToRunMigration = await queryRunner.query(`select count(1) == 0 from words_or_parts
                     where ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} is not null`)

      console.log('needtoRunMigration is: ', needToRunMigration)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      console.log('inside down method in migration')
    }

}
