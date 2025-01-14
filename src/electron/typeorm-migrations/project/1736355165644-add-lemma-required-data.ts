import { MigrationInterface, QueryRunner } from 'typeorm';
import * as d3 from "d3";
import fs from 'fs';


const WORDS_OR_PARTS_TABLE_NAME = 'words_or_parts';
const LEMMA_COLUMN_NAME = 'lemma';

export class AddLemmaRequiredData1736355165644 implements MigrationInterface {

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
      console.log('inside AddLemmaRequiredData1736355165644 migration')

      /*
       * Check to see if data has already been changed from the default value. If it hasn't, then
       * we should run this migration
       */
      const needToRunMigration = await queryRunner.query(`select count(1) == 0 from ${WORDS_OR_PARTS_TABLE_NAME}
                     where ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} is not null and ${WORDS_OR_PARTS_TABLE_NAME}.${LEMMA_COLUMN_NAME} != '' `)


      if(needToRunMigration[0]['count(1) == 0'] == 1){
        const dataGreek = d3.tsvParse(fs.readFileSync('src/tsv/source_macula_greek_SBLGNT+required.tsv', 'utf-8'));
        const dataHebrew = d3.tsvParse(fs.readFileSync('src/tsv/source_macula_hebrew+required.tsv', 'utf-8'));
        const fullParsedData = [...dataHebrew, ...dataGreek]

        const queryBuilderPromisesArray: Promise<any>[] = [];

        await queryRunner.startTransaction();

        fullParsedData.forEach((row) => {
            const workingRef = 'sources:' + row['xml:id'].slice(1);
            const workingRequiredValue = this.sanitizeColumnInput(row.required, '1')
            queryBuilderPromisesArray.push(queryRunner.manager.createQueryBuilder().update(WORDS_OR_PARTS_TABLE_NAME)
              .set({ lemma: row.lemma, required: workingRequiredValue})
              .where("id = :id", {id: workingRef}).execute());
          })

      await Promise.all(queryBuilderPromisesArray);
      await queryRunner.commitTransaction();
      }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
