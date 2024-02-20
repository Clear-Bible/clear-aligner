import { AlignedWord, PivotWord } from './structs';
import { useContext, useEffect, useRef, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { DefaultProjectName, useDataLastUpdated } from '../../state/links/tableManager';
import { GridSortItem } from '@mui/x-data-grid';
import { useLanguages } from '../../hooks/useLanguages';
import { AppContext } from '../../App';

export const useAlignedWordsFromPivotWord = (pivotWord?: PivotWord, sort?: GridSortItem | null): AlignedWord[] | undefined => {
  const { preferences } = useContext(AppContext);
  const lastUpdate = useDataLastUpdated();
  const languages = useLanguages();
  const db = useDatabase();
  const [alignedWords, setAlignedWords] = useState<AlignedWord[] | undefined>(undefined);
  const setAlignedWordsRef = useRef(setAlignedWords);

  useEffect(() => {
    setAlignedWordsRef.current = setAlignedWords;
  }, [setAlignedWordsRef, setAlignedWords]);

  useEffect(() => {
    if (!pivotWord || !languages) return;
    const load = async () => {
      console.time(`useAlignedWordsFromPivotWord('${pivotWord.normalizedText}')`);
      const alignedWords = (await db.corporaGetAlignedWordsByPivotWord(
        preferences?.currentProject ?? DefaultProjectName,
        pivotWord.side,
        pivotWord.normalizedText,
        sort))
        .map((aw): AlignedWord => {
          return {
            id: `${aw.t}:${aw.st}-${aw.tt}`,
            sourceWordTexts: {
              languageInfo: languages.get(aw.sl),
              text: aw.st
            },
            targetWordTexts: {
              languageInfo: languages.get(aw.tl),
              text: aw.tt
            },
            frequency: aw.c
          };
        });
      console.timeEnd(`useAlignedWordsFromPivotWord('${pivotWord.normalizedText}')`);
      setAlignedWords(alignedWords);
    };

    void load();
  }, [db, sort, setAlignedWords, pivotWord, languages, preferences?.currentProject, lastUpdate]);

  return alignedWords;
};
