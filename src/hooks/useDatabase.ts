import { AlignmentSide, LanguageInfo, Link } from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';
import { useMemo } from 'react';

export interface DatabaseApi {
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
  insert: <T,>(sourceName: string, table: string, itemOrItems: T[], chunkSize?: number) => Promise<boolean>;
  getAll: <T,>(sourceName: string, table: string, itemLimit: number, itemSkip?: number) => Promise<T[]>;
  updateAllLinkText: (sourceName: string) => Promise<boolean>;
  corporaGetLinksByAlignedWord: (sourceName: string, sourcesText: string, targetsText: string, sort?: GridSortItem | null) => Promise<Link[]>;
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
  findLinksByBCV: (sourceName: string, side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => Promise<Link[]>;
  findLinksByWordId: (sourceName: string, side: AlignmentSide, referenceString: string) => Promise<Link[]>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
}

export const useDatabase = (): DatabaseApi => {
  // @ts-ignore
  const dbDelegate = useMemo(() => window.databaseApi, []);
  return dbDelegate as DatabaseApi;
}
