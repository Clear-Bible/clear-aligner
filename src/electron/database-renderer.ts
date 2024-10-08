/**
 *This sets up the renderer side of the Electron IPC calls used for DB access.
 */

//@ts-nocheck
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import { ChannelPrefix } from './database-shared';
import { DatabaseApi } from '../hooks/useDatabase';
import { EnvironmentVariables } from '../structs/environmentVariables';

contextBridge.exposeInMainWorld('databaseApi', {
  // User
  getPreferences: () => ipcRenderer.invoke(`${ChannelPrefix}:getPreferences`),
  createOrUpdatePreferences: (preferences) => ipcRenderer.invoke(`${ChannelPrefix}:createOrUpdatePreferences`, preferences),
  projectSave: (project) => ipcRenderer.invoke(`${ChannelPrefix}:projectSave`, project),
  projectRemove: (projectId) => ipcRenderer.invoke(`${ChannelPrefix}:projectRemove`, projectId),
  getProjects: () => ipcRenderer.invoke(`${ChannelPrefix}:getProjects`),
  // Projects
  getDataSources: () => ipcRenderer.invoke(`${ChannelPrefix}:getDataSources`),
  getDataSource: (sourceName: string) => ipcRenderer.invoke(`${ChannelPrefix}:getDataSource`, sourceName),
  createSourceFromProject: (project) => ipcRenderer.invoke(`${ChannelPrefix}:createSourceFromProject`, project),
  updateSourceFromProject: (project) => ipcRenderer.invoke(`${ChannelPrefix}:updateSourceFromProject`, project),
  removeSource: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:removeSource`, sourceName),
  removeTargetWordsOrParts: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:removeTargetWordsOrParts`, sourceName),
  getFirstBcvFromSource: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:getFirstBcvFromSource`, sourceName),
  hasBcvInSource: (sourceName, bcvId) => ipcRenderer.invoke(`${ChannelPrefix}:hasBcvInSource`, sourceName, bcvId),

  getFirstJournalEntryUploadChunk: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:getFirstJournalEntryUploadChunk`, sourceName),
  createBulkInsertJournalEntry: (paramObject) => ipcRenderer.invoke(`${ChannelPrefix}:createBulkInsertJournalEntry`, paramObject),
  getCount: (sourceName: string, tableName: string) => ipcRenderer.invoke(`${ChannelPrefix}:getCount`, sourceName, tableName),
  createDataSource: (database) => ipcRenderer.invoke(`${ChannelPrefix}:createDataSource`, database),
  insert: (args) => ipcRenderer.invoke(`${ChannelPrefix}:insert`, args),
  deleteAll: (args) => ipcRenderer.invoke(`${ChannelPrefix}:deleteAll`, args),
  save: (args) => ipcRenderer.invoke(`${ChannelPrefix}:save`, args),
  existsById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:existsById`, database, table, itemId),
  findByIds: (database, table, itemIds) => ipcRenderer.invoke(`${ChannelPrefix}:findByIds`, database, table, itemIds),
  getAll: (database, table, linkLimit, linkSkip) => ipcRenderer.invoke(`${ChannelPrefix}:getAll`, database, table, linkLimit, linkSkip),
  getAllJournalEntries: (projectId: string, itemLimit?: number, itemSkip?: number) => ipcRenderer.invoke(`${ChannelPrefix}:getAllJournalEntries`, projectId, itemLimit, itemSkip),
  findOneById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:findOneById`, database, table, itemId),
  deleteByIds: (args) => ipcRenderer.invoke(`${ChannelPrefix}:deleteByIds`, args),
  findBetweenIds: (database, table, fromId, toId) => ipcRenderer.invoke(`${ChannelPrefix}:findBetweenIds`, database, table, fromId, toId),
  corporaGetPivotWords: (sourceName, side, filter, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetPivotWords`, sourceName, side, filter, sort),
  languageFindByIds: (sourceName, languageIds) => ipcRenderer.invoke(`${ChannelPrefix}:languageFindByIds`, sourceName, languageIds),
  languageGetAll: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:languageGetAll`, sourceName),
  corporaGetAlignedWordsByPivotWord: (sourceName, side, normalizedText, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`, sourceName, side, normalizedText, sort),
  corporaGetLinksByAlignedWord: (sourceName, sourcesText, targetsText, sort, excludeRejected, itemLimit, itemSkip) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetLinksByAlignedWord`, sourceName, sourcesText, targetsText, sort, excludeRejected, itemLimit, itemSkip),
  updateLinkText: (database, linkIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:updateLinkText`, database, linkIdOrIds),
  updateAllLinkText: (database) => ipcRenderer.invoke(`${ChannelPrefix}:updateAllLinkText`, database),
  findLinksByWordId: (database, side, wordId) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByWordId`, database, side, wordId),
  findLinksByBCV: (sourceName, side, bookNum, chapterNum, verseNum) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByBCV`, sourceName, side, bookNum, chapterNum, verseNum),
  findWordsByBCV: (database, side, bookNum, chapterNum, verseNum) => ipcRenderer.invoke(`${ChannelPrefix}:findWordsByBCV`, database, side, bookNum, chapterNum, verseNum),
  getAllWordsByCorpus: (database, side, corpusId, wordLimit, wordSkip) => ipcRenderer.invoke(`${ChannelPrefix}:getAllWordsByCorpus`, database, side, corpusId, wordLimit, wordSkip),
  getAllCorpora: (database) => ipcRenderer.invoke(`${ChannelPrefix}:getAllCorpora`, database),
  toggleCorporaUpdatedFlagOff: (projectId) => ipcRenderer.invoke(`${ChannelPrefix}:toggleCorporaUpdatedFlagOff`, projectId)
} as DatabaseApi);

contextBridge.exposeInMainWorld('environmentVariables', {
  caApiEndpoint: process.env['CA_API_ENDPOINT'],
  caApiEndpointIsDev: process.env['CA_API_ENDPOINT_IS_DEV'],
  userPoolId: process.env['CA_USER_POOL_ID'],
  userPoolClientId: process.env['CA_USER_POOL_CLIENT_ID']
} as EnvironmentVariables);
