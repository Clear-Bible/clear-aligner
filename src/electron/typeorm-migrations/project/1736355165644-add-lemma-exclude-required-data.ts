import { MigrationInterface, QueryRunner } from 'typeorm';
import * as d3 from "d3";
import fs from 'fs';

const WORDS_OR_PARTS_TABLE_NAME = 'words_or_parts';
const REQUIRED_COLUMN_NAME = 'required';
const LEMMA_COLUMN_NAME = 'lemma';
const EXCLUDE_COLUMN_NAME = 'exclude';
const ID_COLUMN_NAME = 'id'

export class AddLemmaExcludeRequiredData1736355165644 implements MigrationInterface {

    private sanitizeColumnInput (columnInput: string, defaultValue: string){
      const workingColumnInput = columnInput.trim().toLowerCase();
      if(workingColumnInput.length < 1){
        return defaultValue;
      }
      const firstLetter = workingColumnInput[0];
      if(firstLetter == 'n' || firstLetter == 'f'){
        return 0;
      }
      return 1;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
      console.log('inside AddLemmaExcludeRequiredData1736355165644 migration')

      /*
       * Check to see if data has already been changed from the default value. If it hasn't, then
       * we should run this migration
       */
      const needToRunMigration = await queryRunner.query(`select count(1) == 0 from ${WORDS_OR_PARTS_TABLE_NAME}
                     where ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} is not null and ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} != '' `)

      console.log('needtoRunMigration is: ', needToRunMigration)


      if(needToRunMigration[0]['count(1) == 0'] == 1){
        console.log('inside if')
        const dataGreek = d3.tsvParse(fs.readFileSync('src/tsv/source_macula_greek_SBLGNT+required.tsv', 'utf-8'));
        const dataHebrew = d3.tsvParse(fs.readFileSync('src/tsv/source_macula_hebrew+required.tsv', 'utf-8'));
        console.log('dataGreek.length is: ', dataGreek.length)
        console.log('dataHebrew.length is: ', dataHebrew.length)

        const promises: Promise<any>[] = [];


        dataGreek.forEach((row) => {
          const workingRef = 'sources:' + row['xml:id'].slice(1);
          const workingRequiredValue = this.sanitizeColumnInput(row.required, '1')
          promises.push(queryRunner.query(`UPDATE '${WORDS_OR_PARTS_TABLE_NAME}'
                                  SET '${LEMMA_COLUMN_NAME}' = '${row.lemma}',
                                      '${REQUIRED_COLUMN_NAME}' = '${workingRequiredValue}'
                                  WHERE ${WORDS_OR_PARTS_TABLE_NAME}.${ID_COLUMN_NAME} = '${workingRef}';
                                  `));
        })

        dataHebrew.forEach((row) => {
          const workingRef = 'sources:' + row['xml:id'].slice(1);
          const workingRequiredValue = this.sanitizeColumnInput(row.required, '1')
          promises.push(queryRunner.query(`UPDATE '${WORDS_OR_PARTS_TABLE_NAME}'
                                  SET '${LEMMA_COLUMN_NAME}' = '${row.lemma}',
                                      '${REQUIRED_COLUMN_NAME}' = '${workingRequiredValue}'
                                  WHERE ${WORDS_OR_PARTS_TABLE_NAME}.${ID_COLUMN_NAME} = '${workingRef}';
                                  `));
        })


      await Promise.all(promises);
      }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      console.log('inside down method in migration')
    }

}
