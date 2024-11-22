/**
 * This file contains the VirtualTable class which contains methods for
 * interacting with the database.
 */
import { DefaultProjectId, LinksTable } from './links/tableManager';
import { UserPreferenceTable } from './preferences/tableManager';
import { ProjectTable } from './projects/tableManager';
import _ from 'lodash';
import { DatabaseApi } from '../hooks/useDatabase';

const dbApi = (window as any).databaseApi as DatabaseApi;

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface ProjectState {
  linksTable: LinksTable;
  projectTable: ProjectTable;
  userPreferenceTable: UserPreferenceTable;
}

const DatabaseWaitInMs = 1_000;

export interface DatabaseLoadState {
  isLoaded: boolean,
  isLoading: boolean
}

export interface DatabaseBusyInfo {
  isBusy?: boolean,
  userText?: string,
  progressCtr?: number,
  progressMax?: number,
}

export interface DatabaseStatus {
  busyInfo: DatabaseBusyInfo,
  databaseLoadState: DatabaseLoadState,
  lastUpdateTime?: number,
  lastStatusUpdateTime?: number,
}

export const InitialDatabaseStatus = {
  busyInfo: { isBusy: false, progressCtr: 0, progressMax: 0 },
  databaseLoadState: { isLoaded: false, isLoading: false }
} as DatabaseStatus;


/**
 * intended to provide functionality common to any virtual table
 *
 * A virtual table will be implemented to support storing data across one or more pouchdb databases and should provide a
 * higher level abstraction that allows the application code to interface directly with the objects that it consumes
 * or produces without performing any pre- or post-processing
 */
export abstract class VirtualTable {
  protected static readonly isLoggingTime = true;
  // Note: If you need last update time:
  // - For the links table, use the static: LinksTable.getLatestLastUpdateTime()
  // - For other tables, use table.getLastUpdateTime()
  protected lastUpdateTime: number;
  // Note: If you need database status
  // - For the links table, use the static: LinksTable.getLatestDatabaseStatus()
  // - For other tables, use table.getDatabaseStatus()
  protected databaseStatus: DatabaseStatus;
  protected databaseBusyCtr = 0;

  protected constructor() {
    this.lastUpdateTime = Date.now();
    this.databaseStatus = { ..._.cloneDeep(InitialDatabaseStatus) };
  }

  getDatabaseStatus = (): DatabaseStatus => ({
    ..._.cloneDeep(this.databaseStatus)
  });

  getLastUpdateTime = (): number | undefined => this.lastUpdateTime;

  setDatabaseStatus = (databaseStatus: DatabaseStatus, isReplace = false) => {
    this.databaseStatus = isReplace
      ? { ..._.cloneDeep(databaseStatus) }
      : { ...this.databaseStatus, ..._.cloneDeep(databaseStatus) };
    this._onStatusUpdate();
  };

  getDatabaseBusyInfo = (): DatabaseBusyInfo => ({
    ..._.cloneDeep(this.databaseStatus.busyInfo)
  });

  setDatabaseBusyInfo = (databaseBusyInfo: DatabaseBusyInfo, isReplace = false) => {
    this.databaseStatus.busyInfo = isReplace
      ? { ..._.cloneDeep(databaseBusyInfo) }
      : { ...this.databaseStatus.busyInfo, ..._.cloneDeep(databaseBusyInfo) };
    this._onStatusUpdate();
  };

  setDatabaseBusyText = (busyText?: string) => {
    this.databaseStatus.busyInfo.userText = busyText;
    this._onStatusUpdate();
  };

  setDatabaseBusyProgress = (progressCtr?: number, progressMax?: number) => {
    this.databaseStatus.busyInfo.progressCtr = progressCtr;
    this.databaseStatus.busyInfo.progressMax = progressMax;
    this._onStatusUpdate();
  };

  protected _onStatusUpdate = () => {
    this.databaseStatus.lastStatusUpdateTime = Date.now();
    this._onStatusUpdateImpl();
  };

  protected _onStatusUpdateImpl = () => {
  };

  isDatabaseBusy = () => this.databaseBusyCtr > 0;

  incrDatabaseBusyCtr = () => this.updateDatabaseBusyCtr(+1);

  decrDatabaseBusyCtr = () => this.updateDatabaseBusyCtr(-1);

  updateDatabaseBusyCtr = (ctrDelta: number) => {
    const busyInfo = this.databaseStatus.busyInfo;
    const wasBusy = busyInfo.isBusy;
    this.databaseBusyCtr = Math.max(this.databaseBusyCtr + ctrDelta, 0);
    busyInfo.isBusy = this.databaseBusyCtr > 0;
    if (wasBusy !== busyInfo.isBusy) {
      if (wasBusy && !busyInfo.isBusy) {
        busyInfo.userText = undefined;
        busyInfo.progressCtr = 0;
        busyInfo.progressMax = 0;
      }
      this._onStatusUpdate();
    }
  };

  /**
   * Checks to see if the database is loaded and,
   * if not, loads it.
   *
   * Returns true if the database was loaded in this step,
   * false otherwise.
   */
  public checkDatabase = async (): Promise<boolean> => {
    const loadState = this.databaseStatus.databaseLoadState;
    if (loadState.isLoading) {
      await this.waitForDatabase();
    }
    if (loadState.isLoaded) return false;

    this.logDatabaseTime('checkDatabase(): loading');
    loadState.isLoading = true;
    try {
      //@ts-ignore
      await dbApi.createDataSource(this.sourceName ?? DefaultProjectId);
      loadState.isLoaded = true;

      return true;
    } catch (ex) {
      console.error('error checking database', ex);
      return false;
    } finally {
      loadState.isLoading = false;
      this.logDatabaseTimeEnd('checkDatabase(): loading');
    }
  };

  waitForDatabase = async () => {
    while (this.databaseStatus.databaseLoadState.isLoading) {
      await new Promise(resolve => window.setTimeout(resolve, DatabaseWaitInMs));
    }
  };

  logDatabaseTime = (label: string) => {
    if (VirtualTable.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label: string, ...args: any[]) => {
    if (VirtualTable.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label: string) => {
    if (VirtualTable.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  /**
   * internal function to be called when performing a mutating operation
   * @param suppressOnUpdate
   */
  protected _onUpdate = async (suppressOnUpdate = false) => {
    if (!suppressOnUpdate) {
      this.lastUpdateTime = Date.now();
    }
    await this._onUpdateImpl(suppressOnUpdate);
  };

  protected _onUpdateImpl = async (suppressOnUpdate = false) => {
  };
}

// Table factories
