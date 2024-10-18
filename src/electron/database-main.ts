/**
 * This sets up the node.js side of the Electron IPC calls used for DB access.
 */
//@ts-nocheck
import { ipcMain } from 'electron';
import { ChannelPrefix } from './database-shared';
import { ProjectRepository } from './repositories/projectRepository';
import { UserRepository } from './repositories/userRepository';

const ProjectRepositoryInstance = new ProjectRepository();
const UserRepositoryInstance = new UserRepository();

export const setUpIpcMain = (): void => {
  try {
    // User Database Methods
    //@ts-ignore
    ipcMain.handle(`${ChannelPrefix}:getPreferences`, async (event, ...args) => {return await UserRepositoryInstance.getPreferences(...args);});
    ipcMain.handle(`${ChannelPrefix}:createOrUpdatePreferences`, async (event, ...args) => {return await UserRepositoryInstance.createOrUpdatePreferences(...args);});
    ipcMain.handle(`${ChannelPrefix}:projectSave`, async (event, ...args) => {return await UserRepositoryInstance.projectSave(...args);});
    ipcMain.handle(`${ChannelPrefix}:projectRemove`, async (event, ...args) => {return await UserRepositoryInstance.projectRemove(...args);});
    ipcMain.handle(`${ChannelPrefix}:getProjects`, async (event, ...args) => {return await UserRepositoryInstance.getProjects(...args);});

    // Project Database methods
    ipcMain.handle(`${ChannelPrefix}:createDataSource`, async (event, ...args) => await ProjectRepositoryInstance.createDataSource(...args));
    ipcMain.handle(`${ChannelPrefix}:insert`, async (event, ...args) => await ProjectRepositoryInstance.insert(...args));
    ipcMain.handle(`${ChannelPrefix}:deleteAll`, async (event, ...args) => await ProjectRepositoryInstance.deleteAll(...args));
    ipcMain.handle(`${ChannelPrefix}:save`, async (event, ...args) => await ProjectRepositoryInstance.save(...args));
    ipcMain.handle(`${ChannelPrefix}:existsById`, async (event, ...args) => await ProjectRepositoryInstance.existsById(...args));
    ipcMain.handle(`${ChannelPrefix}:findByIds`, async (event, ...args) => await ProjectRepositoryInstance.findByIds(...args));
    ipcMain.handle(`${ChannelPrefix}:getAll`, async (event, ...args) => await ProjectRepositoryInstance.getAll(...args));
    ipcMain.handle(`${ChannelPrefix}:getAllJournalEntries`, async (event, ...args) => await ProjectRepositoryInstance.getAllJournalEntries(...args));
    ipcMain.handle(`${ChannelPrefix}:findOneById`, async (event, ...args) => await ProjectRepositoryInstance.findOneById(...args));
    ipcMain.handle(`${ChannelPrefix}:deleteByIds`, async (event, ...args) => await ProjectRepositoryInstance.deleteByIds(...args));
    ipcMain.handle(`${ChannelPrefix}:findBetweenIds`, async (event, ...args) => await ProjectRepositoryInstance.findBetweenIds(...args));
    ipcMain.handle(`${ChannelPrefix}:updateLinkText`, async (event, ...args) => await ProjectRepositoryInstance.updateLinkText(...args));
    ipcMain.handle(`${ChannelPrefix}:updateAllLinkText`, async (event, ...args) => await ProjectRepositoryInstance.updateAllLinkText(...args));
    ipcMain.handle(`${ChannelPrefix}:findLinksByWordId`, async (event, ...args) => await ProjectRepositoryInstance.findLinksByWordId(...args));
    ipcMain.handle(`${ChannelPrefix}:findLinksByBCV`, async (event, ...args) => await ProjectRepositoryInstance.findLinksByBCV(...args));
    ipcMain.handle(`${ChannelPrefix}:findWordsByBCV`, async (event, ...args) => await ProjectRepositoryInstance.findWordsByBCV(...args));
    ipcMain.handle(`${ChannelPrefix}:getAllWordsByCorpus`, async (event, ...args) => await ProjectRepositoryInstance.getAllWordsByCorpus(...args));
    ipcMain.handle(`${ChannelPrefix}:getAllCorpora`, async (event, ...args) => await ProjectRepositoryInstance.getAllCorpora(...args));
    ipcMain.handle(`${ChannelPrefix}:corporaGetPivotWords`, async (event, ...args) => await ProjectRepositoryInstance.corporaGetPivotWords(...args));
    ipcMain.handle(`${ChannelPrefix}:languageFindByIds`, async (event, ...args) => await ProjectRepositoryInstance.languageFindByIds(...args));
    ipcMain.handle(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`, async (event, ...args) => await ProjectRepositoryInstance.corporaGetAlignedWordsByPivotWord(...args));
    ipcMain.handle(`${ChannelPrefix}:languageGetAll`, async (event, ...args) => await ProjectRepositoryInstance.languageGetAll(...args));
    ipcMain.handle(`${ChannelPrefix}:corporaGetLinksByAlignedWord`, async (event, ...args) => await ProjectRepositoryInstance.corporaGetLinksByAlignedWord(...args));
    ipcMain.handle(`${ChannelPrefix}:findLinkStatusesByAlignedWord`, async (event, ...args) => await ProjectRepositoryInstance.findLinkStatusesByAlignedWord(...args));
    ipcMain.handle(`${ChannelPrefix}:updateSourceFromProject`, async (event, ...args) => {return await ProjectRepositoryInstance.updateSourceFromProject(...args);});
    ipcMain.handle(`${ChannelPrefix}:removeSource`, async (event, ...args) => {return await ProjectRepositoryInstance.removeSource(...args);});
    ipcMain.handle(`${ChannelPrefix}:createBulkInsertJournalEntry`, async (event, ...args) => await ProjectRepositoryInstance.createBulkInsertJournalEntry(...args));
    ipcMain.handle(`${ChannelPrefix}:getFirstJournalEntryUploadChunk`, async (event, ...args) => await ProjectRepositoryInstance.getFirstJournalEntryUploadChunk(...args));
    ipcMain.handle(`${ChannelPrefix}:getCount`, async (event, ...args) => await ProjectRepositoryInstance.getCount(...args));
    ipcMain.handle(`${ChannelPrefix}:toggleCorporaUpdatedFlagOff`, async (event, projectId: string) => await ProjectRepositoryInstance.toggleCorporaUpdatedFlagOff(projectId));
    //@ts-ignore
    ipcMain.handle(`${ChannelPrefix}:getDataSources`, async (event, ...args) => {return await ProjectRepositoryInstance.getDataSources(...args);});
    ipcMain.handle(`${ChannelPrefix}:createSourceFromProject`, async (event, ...args) => {return await ProjectRepositoryInstance.createSourceFromProject(...args);});
    ipcMain.handle(`${ChannelPrefix}:removeTargetWordsOrParts`, async (event, ...args) => {return await ProjectRepositoryInstance.removeTargetWordsOrParts(...args);});
    ipcMain.handle(`${ChannelPrefix}:getFirstBcvFromSource`, async (event, ...args) => {return await ProjectRepositoryInstance.getFirstBcvFromSource(...args);});
    ipcMain.handle(`${ChannelPrefix}:hasBcvInSource`, async (event, ...args) => {return await ProjectRepositoryInstance.hasBcvInSource(...args);});
  } catch (ex) {
    console.error('ipcMain.handle()', ex);
  }
}
