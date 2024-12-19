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
  LinkStatus,
  RepositoryLink,
  SaveParams,
  Word
} from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { UserPreferenceDto } from '../state/preferences/tableManager';
import { ProjectEntity } from '../common/data/project/project';
import { JournalEntryDTO } from '../common/data/journalEntryDTO';
import { AlignmentSide } from '../common/data/project/corpus';
import { ConcordanceAlignedWord, ConcordancePivotWord } from '../common/repositories/projectRepository';

export interface ListedProjectDto {
  id: string;
  corpora: Corpus[];
}

export interface DatabaseApi {
  getPreferences: () => Promise<UserPreferenceDto | undefined>;
  createOrUpdatePreferences: (preferences: UserPreferenceDto) => Promise<void>;
  createBulkInsertJournalEntry: ({ projectId, links }: CreateBulkJournalEntryParams) => Promise<void>;
  /**
   * Get the first chunk of journal entries sorted by date
   * @param sourceName source to retrieve journal entries for
   */
  getFirstJournalEntryUploadChunk: (sourceName: string) => Promise<JournalEntryDTO[]>;
  getAllJournalEntries: (projectId: string, itemLimit?: number, itemSkip?: number) => Promise<JournalEntryDTO[]>;
  getCount: (sourceName: string, tableName: string) => Promise<number>;
  getDataSourceLemmaCount: (sourceName: string, side?: string) => Promise<number>;
  createDataSource: (sourceName: string) => Promise<boolean>;
  getDataSources: () => Promise<ListedProjectDto[] | undefined>;
  getProjects: () => Promise<ProjectEntity[] | undefined>;
  projectSave: (project: ProjectEntity) => Promise<ProjectEntity>;
  removeSource: (sourceName: string) => Promise<undefined>;
  projectRemove: (sourceName: string) => Promise<undefined>;
  corporaGetSourceWords: (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<ConcordancePivotWord[]>;
  corporaGetLemmas: (sourceName: string, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<ConcordancePivotWord[]>;
  corporaGetAlignedWordsBySourceWord: (sourceName: string, side: AlignmentSide, normalizedText: string, sort?: GridSortItem | null) => Promise<ConcordanceAlignedWord[]>;
  corporaGetAlignedWordsByLemma: (sourceName: string, lemma: string, sort?: GridSortItem | null) => Promise<ConcordanceAlignedWord[]>;
  removeTargetWordsOrParts: (sourceName: string) => Promise<void>;
  insert: <T, >({ projectId, table, itemOrItems, chunkSize, disableJournaling }: InsertParams<T>) => Promise<boolean>;
  deleteAll: ({ projectId, table }: DeleteParams) => Promise<boolean>;
  deleteByIds: ({ projectId, table, itemIdOrIds, disableJournaling }: DeleteByIdParams) => Promise<boolean>;
  /**
   * Persist/update an entity (or entities) in a database
   * @param projectId datasource name to be accessed
   * @param table table to save into
   * @param itemOrItems entities to persist
   */
  save: <T, >({ projectId, table, itemOrItems, disableJournaling }: SaveParams<T>) => Promise<boolean>;
  getAll: <T, >(sourceName: string, table: string, itemLimit?: number, itemSkip?: number) => Promise<T[]>;
  /**
   * Call to trigger an update to the `sources_text` and `targets_text` fields
   * in the `links` table
   * @param sourceName datasource to be accessed
   * @param linkIdOrIds links for which to update the text fields
   */
  updateLinkText: (sourceName: string, linkIdOrIds: string | string[]) => Promise<boolean | any[]>;
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
  findByIds: <T, K>(sourceName: string, table: string, ids: K[]) => Promise<T[] | undefined>;
  findLinksByBCV: (sourceName: string, side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => Promise<RepositoryLink[]>;
  findLinksByWordId: (sourceName: string, side: AlignmentSide, referenceString: string) => Promise<RepositoryLink[]>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
  getAllWordsByCorpus: (sourceName: string, linkSide: AlignmentSide, corpusId: string, wordLimit: number, wordSkip: number) => Promise<Word[]>;
  /**
   * Retrieve all corpora for the given project
   * @param sourceName project id to query corpora from
   */
  getAllCorpora: (sourceName?: string) => Promise<Corpus[]>;
  /**
   * Turns off flag indicating corpora have been updated since last sync
   * @param projectId
   */
  toggleCorporaUpdatedFlagOff: (projectId: string) => Promise<void>;
}

export const useDatabase = (): DatabaseApi => {
  const dbDelegate = useMemo(() => (window as any).databaseApi as DatabaseApi, []);
  return dbDelegate as DatabaseApi;
};
