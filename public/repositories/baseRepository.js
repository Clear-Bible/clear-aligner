const { DataSource } = require('typeorm');
const isDev = require('electron-is-dev');
const path = require('path');
const { app } = require('electron');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const { platform } = require('os');
const isMac = platform() === 'darwin';


class DataSourceStatus {
  constructor() {
    this.isLoading = false;
    this.isLoaded = false;
    this.dataSource = undefined;
  }
}

class BaseRepository {
  static DB_WAIT_IN_MS = 1000;

  constructor() {
    this.isLoggingTime = true;
    this.dataSources = new Map();
  }

  logDatabaseTime = (label) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label, ...args) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  getDataDirectory = () => {
    return isDev ? 'sql' : app.getPath('userData');
  };

  getTemplatesDirectory = () => {
    if (isDev) {
      return 'sql';
    }
    return path.join((isMac
      ? path.join(path.dirname(app.getPath('exe')), '..')
      : path.dirname(app.getPath('exe'))), 'sql');
  };


  getDataSourceWithEntities = async (sourceName, entities, generationFile = '', databaseDirectory = '') => {
    if (!sourceName || sourceName.length < 1) {
      throw new Error('sourceName cannot be empty or undefined!');
    }
    const sourceStatus = this.dataSources.get(sourceName) ?? new DataSourceStatus();
    if (sourceStatus.isLoaded) {
      return sourceStatus.dataSource;
    }
    this.logDatabaseTime('getDataSourceWithEntities()');
    try {
      while (sourceStatus.isLoading) {
        await new Promise(resolve => setTimeout(resolve, BaseRepository.DB_WAIT_IN_MS));
      }
      if (sourceStatus.isLoaded) {
        this.logDatabaseTimeLog('getDataSourceWithEntities()', sourceName, sourceStatus.isLoaded);
        return sourceStatus.dataSource;
      }
      sourceStatus.isLoading = true;
      this.dataSources.set(sourceName, sourceStatus);

      const fileName = `${sanitize(app.getName()).slice(0, 40)}-${sanitize(sourceName).slice(0, 200)}.sqlite`;
      const workDatabaseDirectory = databaseDirectory ? databaseDirectory : this.getDataDirectory();
      const databaseFile = path.join(workDatabaseDirectory, fileName);

      this.logDatabaseTime('getDataSourceWithEntities(): copied template');
      try {
        fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
        if (!fs.existsSync(databaseFile) && generationFile) {
          fs.copyFileSync(generationFile, databaseFile);
          this.logDatabaseTimeLog('getDataSourceWithEntities(): copied template', sourceName, databaseFile, generationFile);
        }
      } finally {
        this.logDatabaseTimeEnd('getDataSourceWithEntities(): copied template');
      }

      this.logDatabaseTime('getDataSourceWithEntities(): created data source');
      try {
        const newDataSource = new DataSource({
          type: 'better-sqlite3',
          database: databaseFile,
          synchronize: false,
          statementCacheSize: 1000,
          prepareDatabase: (db) => {
            db.pragma('journal_mode = MEMORY');
            db.pragma('synchronous = normal');
            db.pragma('cache_size = -8000000');
            db.pragma('read_uncommitted = true');
            db.pragma('defer_foreign_keys = true');
            db.pragma('synchronous = 0');
          },
          entities
        });
        await newDataSource.initialize();

        sourceStatus.dataSource = newDataSource;
        sourceStatus.isLoaded = true;

        this.logDatabaseTimeLog('getDataSourceWithEntities(): created data source', sourceName, databaseFile);
        return sourceStatus.dataSource;
      } finally {
        this.logDatabaseTimeEnd('getDataSourceWithEntities(): created data source');
      }
    } catch (ex) {
      console.error('getDataSourceWithEntities()', ex);
    } finally {
      sourceStatus.isLoading = false;
      this.logDatabaseTimeEnd('getDataSourceWithEntities()');
    }
  };
}

module.exports = {
  BaseRepository
};