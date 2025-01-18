/**
 * This file contains classes to set up the database with TypeORM.
 */
const path = require('path');

const { DataSource } = require('typeorm');
const isDev = require('electron-is-dev');
const { app } = require('electron');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const { platform } = require('os');
const isMac = platform() === 'darwin';

/**
 * This class contains properties for DataSourceStatus
 */
class DataSourceStatus {
  isLoading: boolean;
  isLoaded: boolean;
  dataSource: typeof DataSource | undefined;

  constructor() {
    this.isLoading = false;
    this.isLoaded = false;
    this.dataSource = undefined;
  }
}

/**
 * Repositories implementing this interface can provide migrations which will
 * automatically be invoked when database connections have been made
 */
export interface RepositoryWithMigrations {
  /**
   * Implement this method to provide migrations to be run for this database
   * schema
   *
   * @returns a list of migrations for the schema, in the same formats accepted
   * by typeorm (strings with globs indicating file paths, migration data
   * classes, etc)
   */
  getMigrations?: (() => Promise<any[]>) | undefined;
}

/**
 * This class facilitates the database initialization
 */
export abstract class BaseRepository implements RepositoryWithMigrations {
  static DB_WAIT_IN_MS = 1000;

  isLoggingTime: boolean;
  dataSources: Map<string, DataSourceStatus>;

  constructor() {
    this.isLoggingTime = true;
    this.dataSources = new Map<string, DataSourceStatus>();
  }

  abstract getMigrations(): Promise<any[]>;

  logDatabaseTime = (label: string) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label: string, ...args: any[]) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label: string) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  getDataDirectory = () => {
    return isDev ? 'sql' : app.getPath('userData');
  };

  getExtraFilesDirectory = (basePath: string, devPath?: string): string => {
    if (isDev) {
      return devPath ?? basePath;
    }
    return path.join(
      isMac
        ? path.join(path.dirname(app.getPath('exe')), '..')
        : path.dirname(app.getPath('exe')),
      basePath
    );
  };

  getTemplatesDirectory = (): string => {
    return this.getExtraFilesDirectory('sql');
  };

  getTsvDirectory = (): string => {
    return this.getExtraFilesDirectory('tsv','src/tsv');
  };

  removeDataSource = async (sourceName: string) => {
    this.logDatabaseTime('removeDataSource()');
    try {
      const sourceStatus = this.dataSources.get(sourceName);
      if (!!sourceStatus) {
        this.dataSources.delete(sourceName);
        if (!!sourceStatus.dataSource) {
          await sourceStatus.dataSource.destroy();
        }
      }
    } finally {
      this.logDatabaseTimeEnd('removeDataSource()');
    }
  };

  getDataSourceWithEntities = async (
    sourceName: string,
    entities: any[],
    generationFile: string = '',
    databaseDirectory: string = '',
    allowCreate: boolean = false
  ) => {
    if (!sourceName || sourceName.length < 1) {
      throw new Error('sourceName cannot be empty or undefined!');
    }
    const sourceStatus =
      this.dataSources.get(sourceName) ?? new DataSourceStatus();
    if (sourceStatus.isLoaded) {
      return sourceStatus.dataSource;
    }
    this.logDatabaseTime('getDataSourceWithEntities()');
    try {
      while (sourceStatus.isLoading) {
        await new Promise((resolve) =>
          setTimeout(resolve, BaseRepository.DB_WAIT_IN_MS)
        );
      }
      if (sourceStatus.isLoaded) {
        this.logDatabaseTimeLog(
          'getDataSourceWithEntities()',
          sourceName,
          sourceStatus.isLoaded
        );
        return sourceStatus.dataSource;
      }
      sourceStatus.isLoading = true;
      this.dataSources.set(sourceName, sourceStatus);

      const fileName = `${sanitize(app.getName()).slice(0, 40)}-${sanitize(
        sourceName
      ).slice(0, 200)}.sqlite`;
      const workDatabaseDirectory = databaseDirectory
        ? databaseDirectory
        : this.getDataDirectory();
      const databaseFile = path.join(workDatabaseDirectory, fileName);

      if (!allowCreate) {
        // if allowCreate isn't allowed
        if (
          !fs.existsSync(path.dirname(databaseFile)) ||
          !fs.existsSync(databaseFile)
        ) {
          // if the directory doesn't exist or the db file doesn't exist
          console.error(
            `Attempted to access '${databaseFile}' but allowCreate is false and it doesn't exist`
          );
          return undefined;
        }
      }

      this.logDatabaseTime('getDataSourceWithEntities(): copied template');
      try {
        fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
        if (!fs.existsSync(databaseFile) && generationFile) {
          fs.copyFileSync(generationFile, databaseFile);
          this.logDatabaseTimeLog(
            'getDataSourceWithEntities(): copied template',
            sourceName,
            databaseFile,
            generationFile
          );
        }
      } finally {
        this.logDatabaseTimeEnd('getDataSourceWithEntities(): copied template');
      }

      const migrations = this.getMigrations
        ? await this.getMigrations()
        : undefined;

      this.logDatabaseTime('getDataSourceWithEntities(): created data source');
      try {
        const newDataSource = new DataSource({
          type: 'better-sqlite3',
          database: databaseFile,
          synchronize: false,
          statementCacheSize: 1000,
          ...(!!migrations
            ? {
                migrationsRun: true,
                migrations: [...migrations],
              }
            : {}),
          prepareDatabase: (db: any) => {
            db.pragma('journal_mode = MEMORY');
            db.pragma('cache_size = -8000000');
            db.pragma('read_uncommitted = true');
            db.pragma('defer_foreign_keys = true');
            db.pragma('synchronous = off');
          },
          entities,
        });
        sourceStatus.dataSource = newDataSource;

        await newDataSource.initialize();

        sourceStatus.isLoaded = true;

        this.logDatabaseTimeLog(
          'getDataSourceWithEntities(): created data source',
          sourceName,
          databaseFile
        );
        return sourceStatus.dataSource;
      } finally {
        this.logDatabaseTimeEnd(
          'getDataSourceWithEntities(): created data source'
        );
      }
    } catch (ex) {
      console.error('getDataSourceWithEntities()', ex);
    } finally {
      sourceStatus.isLoading = false;
      this.logDatabaseTimeEnd('getDataSourceWithEntities()');
    }
  };
}
