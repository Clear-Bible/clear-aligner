import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { LINKS_TABLE_NAME } from '../../../common/data/serverAlignmentLinkDTO';

const NOTES_COLUMN_NAME = "notes";

export class AddNotesToLinks1728604421335 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(LINKS_TABLE_NAME, new TableColumn({
        name: NOTES_COLUMN_NAME,
        isNullable: true,
        type: 'TEXT'
      }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn(LINKS_TABLE_NAME, NOTES_COLUMN_NAME);
    }
}
