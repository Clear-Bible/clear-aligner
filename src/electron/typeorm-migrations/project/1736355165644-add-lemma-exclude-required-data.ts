import { MigrationInterface, QueryRunner } from 'typeorm';

const WORDS_OR_PARTS_TABLE_NAME = 'words_or_parts';
const REQUIRED_COLUMN_NAME = 'required';
const LEMMA_COLUMN_NAME = 'lemma';
const EXCLUDE_COLUMN_NAME = 'exclude';
const ID_COLUMN_NAME = 'id'

export class AddLemmaExcludeRequiredData1736355165644 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      console.log('inside AddLemmaExcludeRequiredData1736355165644 migration')
      const table = await queryRunner.getTable(WORDS_OR_PARTS_TABLE_NAME);
      console.log('table is: ', table)
      const tableColumns = (table?.columns?? []).map((tc) => tc.name);
      console.log('tableColumns is: ')

      /*
       * Check to see if data has already been changed from the default value. If it hasn't, then
       * we should run this migration
       */
      const needToRunMigration = await queryRunner.query(`select count(1) == 0 from ${WORDS_OR_PARTS_TABLE_NAME}
                     where ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} is not null and ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} != '' `)

      console.log('needtoRunMigration is: ', needToRunMigration)


      if(needToRunMigration[0]['count(1) == 0'] == 1){
        console.log('inside if')
        const promises = [];

        promises.push(queryRunner.query(`UPDATE '${WORDS_OR_PARTS_TABLE_NAME}'
                                SET '${LEMMA_COLUMN_NAME}' = 'lem1',
                                    '${EXCLUDE_COLUMN_NAME}' = 'ex2',
                                    '${REQUIRED_COLUMN_NAME}' = 'req3'
                                WHERE ${WORDS_OR_PARTS_TABLE_NAME}.${ID_COLUMN_NAME} = 'sources:010010010011';
                                `));

      await Promise.all(promises);
      }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      console.log('inside down method in migration')
    }

}
