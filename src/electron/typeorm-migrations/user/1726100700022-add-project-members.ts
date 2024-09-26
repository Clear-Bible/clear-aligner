import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { ProjectTableName } from '../../../common/data/project/project';

const memberColumn = 'members';

export class AddProjectMembers1726100700022 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
      // add members column
      await queryRunner.addColumn(ProjectTableName,
        new TableColumn({
          name: memberColumn,
          type: 'TEXT',
          isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn(ProjectTableName, memberColumn);
    }
}
