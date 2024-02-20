import { AlignedWord } from './structs';
import { GridSortItem } from '@mui/x-data-grid';
import { Link } from '../../structs';
import { useContext, useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { DefaultProjectName, useDataLastUpdated } from '../../state/links/tableManager';
import { AppContext } from '../../App';

export const useLinksFromAlignedWord = (alignedWord?: AlignedWord, sort?: GridSortItem | null): Link[] | undefined => {
  const { preferences } = useContext(AppContext);
  const db = useDatabase();
  const lastUpdate = useDataLastUpdated();
  const [links, setLinks] = useState<Link[] | undefined>(undefined);
  const [currentAlignedWord, setCurrentAlignedWord] = useState<AlignedWord | undefined>();

  useEffect(() => {
    if (currentAlignedWord !== alignedWord) {
      setCurrentAlignedWord(alignedWord);
      setLinks(undefined);
    }
  }, [currentAlignedWord, alignedWord]);

  useEffect(() => {
    if (!currentAlignedWord) return;
    const load = async () => {
      console.time(`useLinksFromAlignedWord(alignedWord: '${currentAlignedWord.id}')`);
      try {
        const links = await db.corporaGetLinksByAlignedWord(
          preferences?.currentProject ?? DefaultProjectName,
          currentAlignedWord.sourceWordTexts.text,
          currentAlignedWord.targetWordTexts.text, sort);
        setLinks(links);
      } finally {
        console.timeEnd(`useLinksFromAlignedWord(alignedWord: '${currentAlignedWord.id}')`);
      }
    };

    void load();
  }, [db, currentAlignedWord, sort, setLinks, preferences?.currentProject, lastUpdate]);

  return links;
};
