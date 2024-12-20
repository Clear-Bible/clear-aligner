import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';
import { LinkTableName } from '../../repositories/projectRepository';
import { LinkOriginManual, LinkStatus } from '../../../structs';

/**
 * typeorm migration file generated according to the docs on the official site.
 *
 * This one adds `origin` and `status` columns to the `links` table
 */
export class AddLinkStatus1715305810421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      LinkTableName,
      new TableColumn({
        name: 'origin',
        type: 'TEXT',
        default: `'${LinkOriginManual}'`,
      } as TableColumnOptions)
    );
    await queryRunner.addColumn(
      LinkTableName,
      new TableColumn({
        name: 'status',
        type: 'TEXT',
        default: `'${LinkStatus.CREATED}'`,
      })
    );
    await queryRunner.query(
      `UPDATE ${LinkTableName} SET origin = '${LinkOriginManual}' WHERE ${LinkTableName}.origin IS NULL`
    );
    await queryRunner.query(
      `UPDATE ${LinkTableName} SET status = '${LinkStatus.CREATED}' WHERE ${LinkTableName}.status IS NULL`
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(LinkTableName, ['origin', 'status']);
  }
}
