/**
 * This file contains the usePivotWords hook which returns an array of pivot
 * words
 */
import { PivotWord } from './structs';
import { useContext, useEffect, useState } from 'react';
import { useDataLastUpdated } from '../../state/links/tableManager';
import { useDatabase } from '../../hooks/useDatabase';
import { GridSortItem } from '@mui/x-data-grid';
import { PivotWordFilter } from './concordanceView';
import { useLanguages } from '../../hooks/useLanguages';
import { AppContext } from '../../App';
import { AlignmentSide } from '../../common/data/project/corpus';
import { ConcordancePivotWord } from '../../common/repositories/projectRepository';

export const usePivotWords = (side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null, useLemma = false): {
  pivotWords: PivotWord[] | undefined;
} => {
  const {preferences} = useContext(AppContext);
  const databaseApi = useDatabase();
  const lastUpdate = useDataLastUpdated();
  const languages = useLanguages();
  const [pivotWords, setPivotWords] = useState<PivotWord[] | undefined>(undefined);

  useEffect(() => {
    if (!languages) return;
    const load = async () => {
      console.time(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);
      let pivotWordList: ConcordancePivotWord[] = [];
      if(preferences?.currentProject) {
        pivotWordList = useLemma
          ? await databaseApi.corporaGetLemmas(preferences?.currentProject, filter, sort)
          : await databaseApi.corporaGetSourceWords(preferences?.currentProject, side, filter, sort)
      }
      console.timeEnd(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);
      setPivotWords(pivotWordList
        .map(({ t, c, l }): PivotWord => ({
          side,
          word: t,
          frequency: c,
          languageInfo: languages?.get?.(l)!
        })));
    };
    void load();
  }, [side, filter, sort, setPivotWords, databaseApi, languages, lastUpdate, preferences?.currentProject, useLemma]);

  return { pivotWords };
};
