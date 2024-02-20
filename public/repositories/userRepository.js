const { BaseRepository } = require('./baseRepository');
const { EntitySchema } = require('typeorm');
const path = require('path');


class Preference {
  constructor() {
    this.id = undefined;
    this.alignment_view = '';
    this.bcv = '';
    this.page = '';
    this.current_project = '';

  }
}

const preferenceEntity = new EntitySchema({
  name: 'preference', tableName: 'preference', target: Preference, columns: {
    id: {
      primary: true, type: 'varchar', generated: false
    }, alignment_view: {
      type: 'varchar'
    }, current_project: {
      type: 'varchar', nullable: true
    }, bcv: {
      type: 'varchar', nullable: true
    }, page: {
      type: 'varchar', nullable: true
    }, show_gloss: {
      type: 'integer'
    }
  }
});


class UserRepository extends BaseRepository {
  static USER_DB_NAME = 'user';

  constructor() {
    super();
    this.getDataSource = async () =>
      await this.getDataSourceWithEntities(
        UserRepository.USER_DB_NAME,
        [preferenceEntity],
        path.join(this.getTemplatesDirectory(), 'clear-aligner-user.sqlite'),
        this.getDataDirectory());
  }

  getPreferences = async () => {
    const preferences = await (await this.getDataSource())
      .getRepository('preference')
      .createQueryBuilder('preference')
      .getMany();
    return (preferences || [])[0];
  };

  createOrUpdatePreferences = async (preferenceData) => {
    const preferenceRepository = (await this.getDataSource()).getRepository('preference');
    // Clear all rows to ensure no duplicates exist
    preferenceRepository.clear();
    const newPreference = preferenceRepository.create(preferenceData);
    return await preferenceRepository.save(newPreference);
  };
}

module.exports = {
  UserRepository
};