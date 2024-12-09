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

export const usePivotWords = (side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null): {
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
      const pivotWordList = !!preferences?.currentProject ? (await databaseApi.corporaGetPivotWords(
        preferences?.currentProject,
        side, filter, sort)) : [];
      console.timeEnd(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);

      setPivotWords(pivotWordList
        .map(({ t, c, l }): PivotWord => ({
          side,
          normalizedText: t,
          frequency: c,
          languageInfo: languages?.get?.(l)!
        })));
    };
    void load();
  }, [side, filter, sort, setPivotWords, databaseApi, languages, lastUpdate, preferences?.currentProject]);

  return { pivotWords };
};
