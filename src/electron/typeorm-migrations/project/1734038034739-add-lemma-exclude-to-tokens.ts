import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { LINKS_TABLE_NAME } from '../../../common/data/serverAlignmentLinkDTO';

const WORDS_OR_PARTS_TABLE_NAME = "words_or_parts";
const LEMMA_COLUMN_NAME = "lemma";
const EXCLUDE_COLUMN_NAME = "exclude";

export class AddLemmaToWordsOrParts1734038034739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(WORDS_OR_PARTS_TABLE_NAME, new TableColumn({
      name: LEMMA_COLUMN_NAME,
      isNullable: true,
      type: 'TEXT'
    }));
    await queryRunner.addColumn(WORDS_OR_PARTS_TABLE_NAME, new TableColumn({
      name: EXCLUDE_COLUMN_NAME,
      isNullable: true,
      type: 'INTEGER',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, LEMMA_COLUMN_NAME);
    await queryRunner.dropColumn(WORDS_OR_PARTS_TABLE_NAME, EXCLUDE_COLUMN_NAME);
  }
}
