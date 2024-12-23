/**
 * This file contains the useAlignedWordsFromPivotWord hook
 * which returns an array of aligned words
 */
import { AlignedWord, PivotWord } from './structs';
import { useContext, useEffect, useRef, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import {
  DefaultProjectId,
  useDataLastUpdated,
} from '../../state/links/tableManager';
import { GridSortItem } from '@mui/x-data-grid';
import { useLanguages } from '../../hooks/useLanguages';
import { AppContext } from '../../App';
import { ConcordanceAlignedWord } from '../../common/repositories/projectRepository';

export const useAlignedWordsFromPivotWord = (
  pivotWord?: PivotWord,
  sort?: GridSortItem | null,
  useLemma = false
): AlignedWord[] | undefined => {
  const { preferences } = useContext(AppContext);
  const lastUpdate = useDataLastUpdated();
  const languages = useLanguages();
  const db = useDatabase();
  const [alignedWords, setAlignedWords] = useState<AlignedWord[] | undefined>(
    undefined
  );
  const setAlignedWordsRef = useRef(setAlignedWords);

  useEffect(() => {
    setAlignedWordsRef.current = setAlignedWords;
  }, [setAlignedWordsRef, setAlignedWords]);

  useEffect(() => {
    if (!pivotWord || !languages) return;
    const load = async () => {
      console.time(`useAlignedWordsFromPivotWord('${pivotWord.word}')`);
      let alignedWords: ConcordanceAlignedWord[] = [];
      if (useLemma) {
        alignedWords = await db.corporaGetAlignedWordsByLemma(
          preferences?.currentProject ?? DefaultProjectId,
          pivotWord.word,
          sort
        );
      } else {
        alignedWords = await db.corporaGetAlignedWordsBySourceWord(
          preferences?.currentProject ?? DefaultProjectId,
          pivotWord.side,
          pivotWord.word,
          sort
        );
      }
      console.timeEnd(`useAlignedWordsFromPivotWord('${pivotWord.word}')`);
      setAlignedWords(
        alignedWords.map(
          (aw): AlignedWord => ({
            id: `${aw.t}:${aw.st}-${aw.tt}`,
            sourceWordTexts: {
              languageInfo: languages.get(aw.sl),
              text: aw.st,
            },
            targetWordTexts: {
              languageInfo: languages.get(aw.tl),
              text: aw.tt,
            },
            frequency: aw.c,
          })
        )
      );
    };

    void load();
  }, [
    db,
    sort,
    setAlignedWords,
    pivotWord,
    languages,
    preferences?.currentProject,
    lastUpdate,
    useLemma,
  ]);

  return alignedWords;
};
