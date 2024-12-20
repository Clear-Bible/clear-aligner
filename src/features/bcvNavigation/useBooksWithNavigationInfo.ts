/**
 * This file contains the useBooksWithNavigationInfo hook
 * which returns the list of all currently available books
 */
import { Word } from '../../structs';
import { getReferenceListFromWords, NavigableBook } from './structs';
import { useEffect, useMemo, useState } from 'react';

export const useBooksWithNavigationInfo = (words?: Word[]): NavigableBook[] => {
  const [availableBooks, setAvailableBooks] = useState<
    NavigableBook[] | undefined
  >(undefined);
  const getBooksWithNavigationInfo = useMemo(
    () => async (words: Word[]) => {
      const referenceList = getReferenceListFromWords(words);
      setAvailableBooks(referenceList ?? []);
    },
    [setAvailableBooks]
  );

  /**
   * asynchronously initialize the book->chapter->verse listings from the given word list
   */
  useEffect(() => {
    if (words) {
      void getBooksWithNavigationInfo(words ?? []);
    }
  }, [getBooksWithNavigationInfo, words]);

  return [...(availableBooks ?? [])];
};
