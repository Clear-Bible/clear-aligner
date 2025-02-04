/**
 * This file contains the useLinksFromAlignedWord hook
 * which returns an array of links used in the AlignmentEditor
 */
import { AlignedWord } from './structs';
import { GridSortItem } from '@mui/x-data-grid';
import { RepositoryLink } from '../../structs';
import { useContext, useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useDataLastUpdated } from '../../state/links/tableManager';
import { AppContext } from '../../App';

/**
 * Custom hook to retrieve an array of links
 * @param alignedWord - AlignedWord object that is the currently selected aligned word
 * @param sort GridSortItem that contains the sort direction
 */
export const useLinksFromAlignedWord = (
  alignedWord?: AlignedWord,
  sort?: GridSortItem | null
): RepositoryLink[] | undefined => {
  const { preferences } = useContext(AppContext);
  const db = useDatabase();
  const lastUpdate = useDataLastUpdated();
  const [links, setLinks] = useState<RepositoryLink[] | undefined>(undefined);
  const [currentAlignedWord, setCurrentAlignedWord] = useState<
    AlignedWord | undefined
  >();

  useEffect(() => {
    if (currentAlignedWord !== alignedWord) {
      setCurrentAlignedWord(alignedWord);
      setLinks(undefined);
    }
  }, [currentAlignedWord, alignedWord]);

  useEffect(() => {
    if (!currentAlignedWord) return;
    const load = async () => {
      console.time(
        `useLinksFromAlignedWord(alignedWord: '${currentAlignedWord.id}')`
      );
      try {
        const links = !!preferences?.currentProject
          ? await db.corporaGetLinksByAlignedWord(
              preferences?.currentProject,
              currentAlignedWord.sourceWordTexts.text,
              currentAlignedWord.targetWordTexts.text,
              sort
            )
          : [];
        //remove links that are marked as 'rejected
        const nonRejectedLinks = links.filter(
          (item) => item.metadata?.status !== 'rejected'
        );
        setLinks(nonRejectedLinks);
      } finally {
        console.timeEnd(
          `useLinksFromAlignedWord(alignedWord: '${currentAlignedWord.id}')`
        );
      }
    };

    void load();
  }, [
    db,
    currentAlignedWord,
    sort,
    setLinks,
    preferences?.currentProject,
    lastUpdate,
  ]);

  return links;
};
