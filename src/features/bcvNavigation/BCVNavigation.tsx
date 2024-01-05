import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Button, IconButton, SxProps, TextField, Theme, Tooltip } from '@mui/material';
import { Word } from '../../structs';
import { Box } from '@mui/system';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import BCVWP from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import {
  Chapter,
  findBookInNavigableBooksByBookNumber,
  findNextNavigableVerse,
  findPreviousNavigableVerse,
  NavigableBook,
  Verse
} from './structs';
import { useBooksWithNavigationInfo } from './useBooksWithNavigationInfo';

export interface BCVNavigationProps {
  sx?: SxProps<Theme>;
  disabled?: boolean;
  horizontal?: boolean;
  words?: Word[];
  currentPosition?: BCVWP;
  onNavigate?: (selection: BCVWP) => void;
}

const ICON_BTN_VERT_MARGIN = '.5em';

/**
 * BCVNavigation component for use in React
 * @param sx style configuration
 * @param disabled optional parameter to indicate whether input should be disabled
 * @param words list of references available for navigation
 * @param currentPosition optional prop to specify current position
 * @param onNavigate callback function which will receive division, book, chapter and verse coordinates
 * @param horizontal optional parameter to specify horizontal layout
 */
const BCVNavigation = ({
                         sx,
                         disabled,
                         words,
                         currentPosition,
                         onNavigate,
                         horizontal
                       }: BCVNavigationProps) => {
  const allAvailableBooks = useBooksWithNavigationInfo(words);
  const [selectedBook, setSelectedBook] = useState<NavigableBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [availableBooks, setAvailableBooks] = useState<NavigableBook[]>([]);
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [availableVerses, setAvailableVerses] = useState<Verse[]>([]);
  const isPositionReset = useRef<boolean>(true);

  const findAvailableChaptersByBook = (books?: NavigableBook[], bookNum?: number) => {
    return (books && bookNum
      ? books.find((book) => book.BookNumber === bookNum)?.chapters : []) ?? [];
  };
  const findAvailableVersesByChapter = (chapters?: Chapter[], chapterNum?: number) => {
    return (chapters && chapterNum
      ? chapters.find((chapter) => chapter.reference === chapterNum)?.verses : []) ?? [];
  };

  useEffect(() => {
    if (!currentPosition
      || !allAvailableBooks?.length
      || !isPositionReset.current) {
      return;
    }
    isPositionReset.current = false;

    const nextAvailableBooks = [...allAvailableBooks];
    const nextSelectedBook = findBookInNavigableBooksByBookNumber(nextAvailableBooks, currentPosition?.book);
    setAvailableBooks(nextAvailableBooks);
    setSelectedBook(nextSelectedBook);

    const nextAvailableChapters = findAvailableChaptersByBook(nextAvailableBooks, nextSelectedBook?.BookNumber);
    const nextSelectedChapter = nextAvailableChapters.find(chapter =>
      !currentPosition?.chapter || chapter.reference === currentPosition?.chapter) ?? null;
    setAvailableChapters(nextAvailableChapters);
    setSelectedChapter(nextSelectedChapter);

    const nextAvailableVerses = findAvailableVersesByChapter(nextAvailableChapters, nextSelectedChapter?.reference);
    const nextSelectedVerse = nextAvailableVerses.find(verse =>
      !currentPosition?.verse || verse.reference === currentPosition?.verse) ?? null;
    setAvailableVerses(nextAvailableVerses);
    setSelectedVerse(nextSelectedVerse);
  }, [allAvailableBooks, currentPosition, isPositionReset, words]);

  useEffect(() => {
    setAvailableChapters(findAvailableChaptersByBook(availableBooks, selectedBook?.BookNumber));
  }, [availableBooks, selectedBook]);
  useEffect(() => {
    setAvailableVerses(findAvailableVersesByChapter(availableChapters, selectedChapter?.reference));
  }, [availableChapters, selectedChapter]);

  const handleSetBook = (book: NavigableBook | null) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
  };

  const handleSetChapter = (chapter: Chapter | null) => {
    setSelectedChapter(chapter);
    setSelectedVerse(null);
  };

  const resetSelectedPosition = () => {
    isPositionReset.current = true;
  };

  const previousNavigableVerse: BCVWP | null = useMemo(
    () =>
      findPreviousNavigableVerse(
        availableBooks,
        availableChapters,
        availableVerses,
        currentPosition
      ),
    [currentPosition, availableBooks, availableChapters, availableVerses]
  );

  const navigateBack: (() => void) | null = useMemo(() => {
    if (!previousNavigableVerse) {
      return null;
    }
    return () => {
      if (!previousNavigableVerse || !onNavigate) {
        return;
      }
      resetSelectedPosition();
      onNavigate(previousNavigableVerse);
    };
  }, [previousNavigableVerse, onNavigate]);

  const backButton = useMemo(
    () => (
      <Tooltip
        title={
          previousNavigableVerse ? (
            <BCVDisplay currentPosition={previousNavigableVerse} />
          ) : (
            ''
          )
        }
      >
        <IconButton
          color={'primary'}
          sx={{ marginTop: ICON_BTN_VERT_MARGIN }}
          disabled={disabled || !navigateBack}
          onClick={navigateBack ?? undefined}
        >
          <ArrowBack />
        </IconButton>
      </Tooltip>
    ),
    [disabled, navigateBack, previousNavigableVerse]
  );

  const nextNavigableVerse: BCVWP | null = useMemo(
    () =>
      findNextNavigableVerse(
        availableBooks,
        availableChapters,
        availableVerses,
        currentPosition
      ),
    [currentPosition, availableBooks, availableChapters, availableVerses]
  );

  const navigateForward: (() => void) | null = useMemo(() => {
    if (!nextNavigableVerse) {
      return null;
    }
    return () => {
      if (!nextNavigableVerse || !onNavigate) {
        return;
      }
      resetSelectedPosition();
      onNavigate(nextNavigableVerse);
    };
  }, [nextNavigableVerse, onNavigate]);

  const forwardButton = useMemo(
    () => (
      <Tooltip
        title={
          nextNavigableVerse ? (
            <BCVDisplay currentPosition={nextNavigableVerse} />
          ) : (
            ''
          )
        }
      >
        <IconButton
          color={'primary'}
          sx={{ marginTop: ICON_BTN_VERT_MARGIN }}
          disabled={disabled || !navigateForward}
          onClick={navigateForward ?? undefined}
        >
          <ArrowForward />
        </IconButton>
      </Tooltip>
    ),
    [disabled, navigateForward, nextNavigableVerse]
  );

  const verseSelection = useMemo(
    () => (
      <Autocomplete
        disabled={disabled || !availableVerses}
        disablePortal
        id="verse-selection"
        size="small"
        sx={{
          display: 'inline-flex',
          width: horizontal ? '6em' : '100%'
        }}
        getOptionLabel={(option) =>
          option?.reference ? String(option.reference) : ''
        }
        options={availableVerses ?? []}
        typeof={'select'}
        value={selectedVerse}
        onChange={(_, value) => setSelectedVerse(value)}
        renderInput={(params) => (
          <TextField label={'Verse'} {...params} variant={'standard'} />
        )}
      />
    ),
    [disabled, availableVerses, selectedVerse, setSelectedVerse, horizontal]
  );

  const handleNavigation = useCallback(
    () =>
      onNavigate &&
      selectedBook &&
      selectedChapter &&
      selectedVerse &&
      onNavigate(
        new BCVWP(
          selectedBook.BookNumber,
          selectedChapter.reference,
          selectedVerse.reference
        )
      ),
    [selectedBook, selectedChapter, selectedVerse, onNavigate]
  );

  return (
    <Box
      sx={
        {
          ...(sx ?? ({} as SxProps<Theme>)),
          display: 'flex',
          flexFlow: horizontal ? 'row' : 'column',
          ...(horizontal
            ? {
              flexWrap: 'wrap',
              gap: '.50em'
            }
            : {
              alignItems: 'center'
            })
        } as unknown as undefined /*cast to avoid material-ui bug*/
      }
      className={BCVNavigation.name}
    >
      {horizontal && backButton}
      <Autocomplete
        disabled={disabled}
        disablePortal
        id="book-selection"
        size="small"
        sx={{
          width: horizontal ? '12em' : '100%',
          display: 'inline-flex'
        }}
        options={availableBooks ?? ([] as NavigableBook[])}
        typeof={'select'}
        groupBy={(book: NavigableBook) => {
          if (book.BookNumber < 40) return 'Old Testament';
          if (book.BookNumber > 39 && book.BookNumber < 68)
            return 'New Testament';
          return 'Apocrypha';
        }}
        getOptionLabel={(option) => option.EnglishBookName}
        value={selectedBook}
        onChange={(_, value) => handleSetBook(value)}
        renderInput={(params) => (
          <TextField {...params} label={'Book'} variant={'standard'} />
        )}
      />
      <Autocomplete
        disabled={disabled}
        disablePortal
        size="small"
        sx={{
          width: horizontal ? '6em' : '100%',
          display: 'inline-flex'
        }}
        options={availableChapters}
        typeof={'select'}
        getOptionLabel={(option) => String(option.reference)}
        value={selectedChapter}
        onChange={(_, value) => handleSetChapter(value)}
        renderInput={(params) => (
          <TextField label={'Chapter'} {...params} variant={'standard'} />
        )}
      />
      {horizontal ? (
        <>
          {verseSelection}
          {forwardButton}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%'
          }}
        >
          {backButton}
          {verseSelection}
          {forwardButton}
        </Box>
      )}
      <Button
        sx={{
          ...(horizontal ? { marginTop: '.85em' } : {})
        }}
        variant={'text'}
        color={'primary'}
        disabled={
          disabled || !selectedBook || !selectedChapter || !selectedVerse
        }
        onClick={() => handleNavigation()}
      >
        Navigate
      </Button>
    </Box>
  );
};

export default BCVNavigation;
