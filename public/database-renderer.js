// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');

contextBridge.exposeInMainWorld('databaseApi', {
  // User
  getPreferences: () => ipcRenderer.invoke(`${ChannelPrefix}:getPreferences`),
  createOrUpdatePreferences: (preferences) => ipcRenderer.invoke(`${ChannelPrefix}:createOrUpdatePreferences`, preferences),
  // Projects
  getDataSources: () => ipcRenderer.invoke(`${ChannelPrefix}:getDataSources`),
  getDataSource: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:getDataSource`, sourceName),
  createSourceFromProject: (project) => ipcRenderer.invoke(`${ChannelPrefix}:createSourceFromProject`, project),
  updateSourceFromProject: (project) => ipcRenderer.invoke(`${ChannelPrefix}:updateSourceFromProject`, project),
  removeSource: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:removeSource`, sourceName),
  removeTargetWordsOrParts: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:removeTargetWordsOrParts`, sourceName),
  getFirstBcvFromSource: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:getFirstBcvFromSource`, sourceName),
  hasBcvInSource: (sourceName, bcvId) => ipcRenderer.invoke(`${ChannelPrefix}:hasBcvInSource`, sourceName, bcvId),

  createDataSource: (database) => ipcRenderer.invoke(`${ChannelPrefix}:createDataSource`, database),
  insert: (database, table, itemOrItems, chunkSize) => ipcRenderer.invoke(`${ChannelPrefix}:insert`, database, table, itemOrItems, chunkSize),
  deleteAll: (database, table) => ipcRenderer.invoke(`${ChannelPrefix}:deleteAll`, database, table),
  save: (database, table, itemOrItems) => ipcRenderer.invoke(`${ChannelPrefix}:save`, database, table, itemOrItems),
  existsById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:existsById`, database, table, itemId),
  findByIds: (database, table, itemIds) => ipcRenderer.invoke(`${ChannelPrefix}:findByIds`, database, table, itemIds),
  getAll: (database, table, linkLimit, linkSkip) => ipcRenderer.invoke(`${ChannelPrefix}:getAll`, database, table, linkLimit, linkSkip),
  findOneById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:findOneById`, database, table, itemId),
  deleteByIds: (database, table, itemIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:deleteByIds`, database, table, itemIdOrIds),
  findBetweenIds: (database, table, fromId, toId) => ipcRenderer.invoke(`${ChannelPrefix}:findBetweenIds`, database, table, fromId, toId),
  corporaGetPivotWords: (sourceName, side, filter, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetPivotWords`, sourceName, side, filter, sort),
  languageFindByIds: (sourceName, languageIds) => ipcRenderer.invoke(`${ChannelPrefix}:languageFindByIds`, sourceName, languageIds),
  languageGetAll: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:languageGetAll`, sourceName),
  corporaGetAlignedWordsByPivotWord: (sourceName, side, normalizedText, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`, sourceName, side, normalizedText, sort),
  corporaGetLinksByAlignedWord: (sourceName, sourcesText, targetsText, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetLinksByAlignedWord`, sourceName, sourcesText, targetsText, sort),
  updateLinkText: (database, linkIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:updateLinkText`, database, linkIdOrIds),
  updateAllLinkText: (database) => ipcRenderer.invoke(`${ChannelPrefix}:updateAllLinkText`, database),
  findLinksByWordId: (database, side, wordId) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByWordId`, database, side, wordId),
  findLinksByBCV: (sourceName, side, bookNum, chapterNum, verseNum) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByBCV`, sourceName, side, bookNum, chapterNum, verseNum),
  findWordsByBCV: (database, side, bookNum, chapterNum, verseNum) => ipcRenderer.invoke(`${ChannelPrefix}:findWordsByBCV`, database, side, bookNum, chapterNum, verseNum),
  getAllWordsByCorpus: (database, side, corpusId, wordLimit, wordSkip) => ipcRenderer.invoke(`${ChannelPrefix}:getAllWordsByCorpus`, database, side, corpusId, wordLimit, wordSkip),
  getAllCorpora: (database) => ipcRenderer.invoke(`${ChannelPrefix}:getAllCorpora`, database)
});
