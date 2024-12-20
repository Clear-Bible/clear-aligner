/**
 * This file contains a collection of interfaces and helper functions to support navigation
 */

import { Word } from '../../structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { BookInfo } from '../../workbench/books';

export interface Verse {
  reference: number;
}

export interface Chapter {
  reference: number;
  verses: Verse[];
}

export interface NavigableBook extends BookInfo {
  index: number;
  chapters: Chapter[];
}

/**
 * Generate navigable tree of books from a word list
 * @param words contains the list of references to generate books, chapters and verses from
 */
export const getReferenceListFromWords = (words: Word[]): NavigableBook[] =>
  words
    .map((word) => word.id)
    .map(BCVWP.parseFromString)
    .filter((ref) =>
      ref.hasFields(
        BCVWPField.Book,
        BCVWPField.Chapter,
        BCVWPField.Verse,
        BCVWPField.Word
      )
    )
    .map(
      (ref): NavigableBook => ({
        index: ref.book! - 1,
        ...ref.getBookInfo()!,
        chapters: [
          {
            reference: ref.chapter ?? 0,
            verses: [
              {
                reference: ref.verse ?? 0,
              },
            ],
          },
        ],
      })
    )
    /**
     * merge the individual verse references into books with lists of available chapters and verses
     */
    .reduce((accumulator, currentReference): NavigableBook[] => {
      const book = accumulator.find(
        (book) => book.index === currentReference.index
      );
      if (!book) {
        // add book
        return [...accumulator, currentReference];
      }
      const currentChapter = currentReference.chapters[0];
      const chapter = book.chapters.find(
        (chapter) => chapter.reference === currentChapter.reference
      );
      if (!chapter) {
        // add chapter
        book.chapters = [...book.chapters, currentChapter].sort(
          (a, b): number => a.reference - b.reference
        );
        return [
          ...accumulator.filter((b) => b.index !== currentReference.index),
          book,
        ];
      }
      const currentVerse = currentChapter.verses[0];
      const verse = chapter.verses.find(
        (verse) => verse.reference === currentVerse.reference
      );
      if (!verse) {
        // add verse
        chapter.verses = [...chapter.verses, currentVerse].sort(
          (a, b): number => a.reference - b.reference
        );
        return [
          ...accumulator.filter((b) => b.index !== currentReference.index),
          book,
        ];
      }
      return accumulator;
    }, [] as NavigableBook[])
    .sort((a, b): number => a.BookNumber - b.BookNumber);

export const findBookInNavigableBooksByBookNumber = (
  navigableBooks: NavigableBook[],
  bookNumber?: number
): NavigableBook | null =>
  bookNumber
    ? navigableBooks.find((book) => book.BookNumber === bookNumber) ?? null
    : null;

/**
 * container object for computed state based on navigable books and a position
 */
export interface BookChapterVerseState {
  selectedBook: NavigableBook | null;
  availableChapters?: Chapter[];
  selectedChapter?: Chapter;
  availableVerses?: Verse[];
}

/**
 * compute state from navigable books and a given position
 * @param availableBooks navigable tree of books
 * @param position position to compute state from
 */
export const computeAvailableChaptersAndVersesFromNavigableBooksAndPosition = (
  availableBooks: NavigableBook[],
  position: BCVWP
): BookChapterVerseState => {
  const selectedBook = findBookInNavigableBooksByBookNumber(
    availableBooks,
    position.book
  );

  const availableChapters = selectedBook?.chapters;

  const selectedChapter = availableChapters?.find(
    (chapter) => chapter.reference === position?.chapter
  );

  const availableVerses = selectedChapter
    ? availableChapters?.find(
        (chapter) => chapter.reference === selectedChapter?.reference
      )?.verses
    : undefined;

  return {
    selectedBook,
    availableChapters,
    selectedChapter,
    availableVerses,
  };
};

/**
 * look at the list of words and find the verse preceding the given verse that is available in the given corpora
 * @param availableBooks available books (based on current corpus)
 * @param availableChapters chapters in current book (based on currentPosition)
 * @param availableVerses verses in current chapters (based on currentPosition)
 * @param currentPosition position from which to find the previous verse
 */
export const findPreviousNavigableVerse = (
  availableBooks: NavigableBook[],
  availableChapters?: Chapter[],
  availableVerses?: Verse[],
  currentPosition?: BCVWP
): BCVWP | null => {
  if (
    !availableBooks ||
    !currentPosition ||
    !currentPosition?.hasFields(
      BCVWPField.Book,
      BCVWPField.Chapter,
      BCVWPField.Verse
    )
  ) {
    return null;
  }

  if (availableVerses) {
    const selectedVerse = availableVerses.toReversed().find(
      (verse) =>
        // catch the cases where previous verse number in sequence is missing
        verse.reference < currentPosition.verse!
    );
    if (selectedVerse) {
      return new BCVWP(
        currentPosition.book,
        currentPosition.chapter,
        selectedVerse.reference
      );
    }
  }

  if (availableChapters) {
    // must go back to end of previous chapter
    const previousChapter = availableChapters.find(
      (chapter) => chapter.reference === (currentPosition?.chapter ?? 0) - 1
    );
    if (previousChapter) {
      return new BCVWP(
        currentPosition.book,
        previousChapter.reference,
        previousChapter.verses.at(-1)?.reference
      );
    }
  }

  const selectedBookIndex = availableBooks.findIndex(
    (book) => book.BookNumber === currentPosition?.book
  );
  if (selectedBookIndex < 0) {
    return null;
  }
  if (selectedBookIndex > 0) {
    const book = availableBooks[selectedBookIndex - 1]; // go back one book
    const chapter = book.chapters.at(-1);
    const verse = chapter?.verses.at(-1);
    return new BCVWP(book.BookNumber, chapter?.reference, verse?.reference);
  }
  return null;
};

/**
 * look at the list of words and find the verse after the given verse that is available in the given corpora
 * @param availableBooks available books (based on current corpus)
 * @param availableChapters chapters in current book (based on currentPosition)
 * @param availableVerses verses in current chapters (based on currentPosition)
 * @param currentPosition position from which to find the next verse
 */
export const findNextNavigableVerse = (
  availableBooks?: NavigableBook[],
  availableChapters?: Chapter[],
  availableVerses?: Verse[],
  currentPosition?: BCVWP
): BCVWP | null => {
  if (
    !availableBooks ||
    !currentPosition ||
    !currentPosition?.hasUpToField(BCVWPField.Verse)
  ) {
    return null;
  }

  if (availableVerses) {
    const selectedVerse = availableVerses.find(
      (verse) =>
        // catch the cases where next verse number in sequence is missing
        verse.reference > currentPosition.verse!
    );
    if (selectedVerse) {
      // if not the last verse in the chapter
      return new BCVWP(
        currentPosition?.book,
        currentPosition?.chapter,
        selectedVerse.reference
      );
    }
  }

  if (availableChapters) {
    // must go to next chapter
    const nextChapter = availableChapters.find(
      (chapter) => chapter.reference === currentPosition.chapter! + 1
    );
    if (nextChapter) {
      return new BCVWP(
        currentPosition.book,
        nextChapter.reference,
        nextChapter.verses[0].reference
      );
    }
  }

  const selectedBookIndex = availableBooks.findIndex(
    (book) => book.BookNumber === currentPosition?.book
  );
  if (selectedBookIndex < 0) {
    return null;
  }
  if (selectedBookIndex < availableBooks.length - 1) {
    // if not the last book
    const book = availableBooks[selectedBookIndex + 1]; // go forward one book
    const chapter = book.chapters[0];
    const verse = chapter?.verses[0];
    return new BCVWP(book.BookNumber, chapter?.reference, verse?.reference);
  }
  return null;
};
