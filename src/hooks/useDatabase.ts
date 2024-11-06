/**
 * This file contains the useDatabase hook, which returns the collection of
 * APIs to the database.
 */
import {
  Corpus,
  CreateBulkJournalEntryParams,
  DeleteByIdParams,
  DeleteParams,
  InsertParams,
  LanguageInfo,
  RepositoryLink, LinkStatus,
  SaveParams, Word
} from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { UserPreferenceDto } from '../state/preferences/tableManager';
import { ProjectEntity } from '../common/data/project/project';
import { JournalEntryDTO } from '../common/data/journalEntryDTO';
import { AlignmentSide } from '../common/data/project/corpus';

export interface ListedProjectDto {
  id: string;
  corpora: Corpus[]
}

export interface DatabaseApi {
  getPreferences: () => Promise<UserPreferenceDto|undefined>;
  createOrUpdatePreferences: (preferences: UserPreferenceDto) => Promise<void>;
  createBulkInsertJournalEntry: ({ projectId, links }: CreateBulkJournalEntryParams) => Promise<void>;
  /**
   * Get the first chunk of journal entries sorted by date
   * @param sourceName source to retrieve journal entries for
   */
  getFirstJournalEntryUploadChunk: (sourceName: string) => Promise<JournalEntryDTO[]>;
  getAllJournalEntries: (projectId: string, itemLimit?: number, itemSkip?: number) => Promise<JournalEntryDTO[]>;
  getCount: (sourceName: string, tableName: string) => Promise<number>;
  getDataSources: () => Promise<ListedProjectDto[]|undefined>;
  getProjects: () => Promise<ProjectEntity[]|undefined>;
  projectSave: (project: ProjectEntity) => Promise<ProjectEntity>;
  removeSource: (sourceName: string) => Promise<undefined>;
  projectRemove: (sourceName: string) => Promise<undefined>;
  corporaGetPivotWords: (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<{
    t: string, // normalized text
    l: string, // language id
    c: number  // frequency
  }[]>;
  corporaGetAlignedWordsByPivotWord: (sourceName: string, side: AlignmentSide, normalizedText: string, sort?: GridSortItem | null) => Promise<{
    t: string, // normalized text (pivot word)
    sl: string, // sources text language id
    st: string, // sources text
    tl: string, // targets text language id
    tt: string, // targets text
    c: number // frequency
  }[]>;
  removeTargetWordsOrParts: (sourceName: string) => Promise<void>;
  insert: <T,>({ projectId, table, itemOrItems, chunkSize, disableJournaling }: InsertParams<T>) => Promise<boolean>;
  deleteAll: ({ projectId, table }: DeleteParams) => Promise<boolean>;
  deleteByIds: ({ projectId, table, itemIdOrIds, disableJournaling }: DeleteByIdParams) => Promise<boolean>;
  /**
   * Persist/update an entity (or entities) in a database
   * @param projectId datasource name to be accessed
   * @param table table to save into
   * @param itemOrItems entities to persist
   */
  save: <T,>({ projectId, table, itemOrItems, disableJournaling }: SaveParams<T>) => Promise<boolean>;
  getAll: <T,>(sourceName: string, table: string, itemLimit?: number, itemSkip?: number) => Promise<T[]>;
  /**
   * Call to trigger an update to the `sources_text` and `targets_text` fields
   * in the `links` table
   * @param sourceName datasource to be accessed
   * @param linkIdOrIds links for which to update the text fields
   */
  updateLinkText: (sourceName: string, linkIdOrIds: string|string[]) => Promise<boolean|any[]>;
  updateAllLinkText: (sourceName: string) => Promise<boolean>;
  /**
   * Retrieve links by source text, target text or both
   * @param sourceName source being queried
   * @param sourcesText optional source text to search for
   * @param targetsText optional target text to search for
   * @param sort optional sorting information
   * @param excludeRejected whether rejected links should be returned
   * @param itemLimit number of results to return
   * @param itemSkip number of items to skip when returning results (for paging)
   */
  corporaGetLinksByAlignedWord: (sourceName: string,
                                 sourcesText?: string,
                                 targetsText?: string,
                                 sort?: GridSortItem | null,
                                 excludeRejected?: boolean,
                                 itemLimit?: number,
                                 itemSkip?: number) => Promise<RepositoryLink[]>;
  /**
   * find link statuses given an aligned word
   * @param sourceName source being queried
   * @param sourcesText optional source text to search for
   * @param targetsText optional target text to search for
   * @param excludeRejected whether rejected links should be included
   */
  findLinkStatusesByAlignedWord: (sourceName: string,
                                  sourcesText?: string,
                                  targetsText?: string,
                                  excludeRejected?: boolean) => Promise<{ status: LinkStatus, count: number }[]>;
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
  findOneById: <T,>(sourceName: string, table: string, itemId: string) => Promise<T | undefined>;
  existsById:  (sourceName: string, table: string, itemId: string) => Promise<Boolean>;
  findLinksByBCV: (sourceName: string, side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => Promise<RepositoryLink[]>;
  findLinksByWordId: (sourceName: string, side: AlignmentSide, referenceString: string) => Promise<RepositoryLink[]>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
  getAllWordsByCorpus: (sourceName: string, linkSide: AlignmentSide, corpusId: string, wordLimit: number, wordSkip: number) => Promise<Word[]>;
  createDataSource: (sourceName: string) => Promise<boolean>;
  /**
   * Retrieve all corpora for the given project
   * @param sourceName project id to query corpora from
   */
  getAllCorpora: (sourceName: string) => Promise<Corpus[]>;
  /**
   * Turns off flag indicating corpora have been updated since last sync
   * @param projectId
   */
  toggleCorporaUpdatedFlagOff: (projectId: string) => Promise<void>;
}

const enableBreakpoints = true;

export const getDatabaseAPIProxy = (dbDelegate: DatabaseApi) : DatabaseApi => ({
  corporaGetAlignedWordsByPivotWord: async (sourceName: string, side: AlignmentSide, normalizedText: string, sort: GridSortItem | null | undefined): Promise<{
    t: string;
    sl: string;
    st: string;
    tl: string;
    tt: string;
    c: number
  }[]> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.corporaGetAlignedWordsByPivotWord(sourceName, side, normalizedText, sort);
  },
  corporaGetLinksByAlignedWord: async (sourceName: string, sourcesText: string | undefined, targetsText: string | undefined, sort: GridSortItem | null | undefined, excludeRejected: boolean | undefined, itemLimit: number | undefined, itemSkip: number | undefined): Promise<RepositoryLink[]> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.corporaGetLinksByAlignedWord(sourceName, sourcesText, targetsText, sort, excludeRejected, itemLimit, itemSkip);
  },
  corporaGetPivotWords: dbDelegate.corporaGetPivotWords,
  createBulkInsertJournalEntry: async ({ projectId, links }: CreateBulkJournalEntryParams) : Promise<void> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.createBulkInsertJournalEntry({ projectId, links });
  },
  createOrUpdatePreferences: async (preferences: UserPreferenceDto) : Promise<void> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.createOrUpdatePreferences(preferences);
  },
  deleteAll: async ({ projectId, table }: DeleteParams) : Promise<boolean> => {
    return await dbDelegate.deleteAll({ projectId, table });
  },
  deleteByIds:  async ({ projectId, table, itemIdOrIds, disableJournaling }: DeleteByIdParams) : Promise<boolean> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.deleteByIds({ projectId, table, itemIdOrIds, disableJournaling })
  },
  findByIds: dbDelegate.findByIds,
  findLinkStatusesByAlignedWord: dbDelegate.findLinkStatusesByAlignedWord,
  findLinksByBCV: dbDelegate.findLinksByBCV,
  findLinksByWordId: dbDelegate.findLinksByWordId,
  getAll: dbDelegate.getAll,
  getAllCorpora: dbDelegate.getAllCorpora,
  getAllJournalEntries: dbDelegate.getAllJournalEntries,
  getAllWordsByCorpus: dbDelegate.getAllWordsByCorpus,
  getCount: dbDelegate.getCount,
  getDataSources: dbDelegate.getDataSources,
  getFirstJournalEntryUploadChunk: dbDelegate.getFirstJournalEntryUploadChunk,
  getPreferences: dbDelegate.getPreferences,
  getProjects: async (): Promise<ProjectEntity[] | undefined> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.getProjects();
  },
  insert: async <T>(insertParams: InsertParams<T>): Promise<boolean> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.insert<T>(insertParams);
  },
  languageFindByIds: dbDelegate.languageFindByIds,
  languageGetAll: async (sourceName: string): Promise<LanguageInfo[]> => {
    if(enableBreakpoints){
      debugger;
    }
    return Promise.resolve([]);
  },
  projectRemove: async (sourceName: string): Promise<undefined> => {
    if(enableBreakpoints){
      debugger;
    }
    return dbDelegate.projectRemove(sourceName);
  },
  projectSave: async(project: ProjectEntity): Promise<ProjectEntity> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.projectSave(project);
  },
  removeSource: async (sourceName: string): Promise<undefined> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.removeSource(sourceName);
  },
  removeTargetWordsOrParts: async (sourceName: string): Promise<void> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.removeTargetWordsOrParts(sourceName);
  },
  save: async <T>(params: SaveParams<T>): Promise<boolean> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.save(params);
  },
  toggleCorporaUpdatedFlagOff: async (projectId: string): Promise<void> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.toggleCorporaUpdatedFlagOff(projectId);
  },
  updateAllLinkText: async (sourceName: string): Promise<boolean>  => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.updateAllLinkText(sourceName);
  },
  updateLinkText: async (sourceName: string, linkIdOrIds: string | string[]): Promise<boolean | any[]>  => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.updateLinkText(sourceName, linkIdOrIds);
  },
  createDataSource: async (sourceName: string) : Promise<boolean> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.createDataSource(sourceName);
  },
  existsById: async (sourceName: string, table: string, itemId: string) : Promise<Boolean> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.existsById(sourceName, table, itemId);
  },
  findOneById:  async <T,>(sourceName: string, table: string, itemId: string) : Promise<T | undefined> => {
    if(enableBreakpoints){
      debugger;
    }
    return await dbDelegate.findOneById(sourceName, table, itemId );
  }
});

export const useDatabase = (): DatabaseApi => {
  const dbDelegate = useMemo(() => (window as any).databaseApi as DatabaseApi, []);
  const returnValue = useMemo(() => getDatabaseAPIProxy(dbDelegate),[dbDelegate])
  return returnValue;
}

