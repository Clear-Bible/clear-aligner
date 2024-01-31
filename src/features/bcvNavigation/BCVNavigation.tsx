import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  IconButton,
  SxProps,
  TextField,
  Theme,
  Tooltip,
} from '@mui/material';
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
  getReferenceListFromWords,
  NavigableBook,
  Verse,
} from './structs';

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
  horizontal,
}: BCVNavigationProps) => {
  const [availableBooks, setAvailableBooks] = useState([] as NavigableBook[]);
  const [selectedBook, setSelectedBook] = useState(
    null as NavigableBook | null
  );
  const [selectedChapter, setSelectedChapter] = useState(
    null as Chapter | null
  );
  const [selectedVerse, setSelectedVerse] = useState(null as Verse | null);

  const getBooksWithNavigationInfo = async (words: Word[]) => {
    const referenceList = getReferenceListFromWords(words);
    setAvailableBooks(referenceList ?? []);
  };

  /**
   * asynchronously initialize the book->chapter->verse listings from the given word list
   */
  useEffect(() => {
    void getBooksWithNavigationInfo(words ?? []);
  }, [words]);

  /**
   * when the book->chapter->verse listings are ready and there is a value for "currentPosition.book", set the selected book based on it
   */
  useEffect(() => {
    setSelectedBook(
      findBookInNavigableBooksByBookNumber(
        availableBooks,
        currentPosition?.book
      )
    );
  }, [availableBooks, currentPosition, setSelectedBook]);

  const availableChapters = useMemo(
    () => (selectedBook ? selectedBook?.chapters : []),
    [selectedBook]
  );

  /**
   * this is to ensure that the chapter selection is properly set after the available words have been loaded into navigable books
   */
  useEffect(() => {
    setSelectedChapter(
      availableChapters?.find(
        (chapter) => chapter.reference === currentPosition?.chapter
      ) ?? null
    );
  }, [availableChapters, currentPosition, setSelectedChapter]);

  const availableVerses = useMemo(
    () =>
      availableChapters && selectedChapter
        ? availableChapters.find(
            (chapter) => chapter.reference === selectedChapter.reference
          )?.verses
        : [],
    [availableChapters, selectedChapter]
  );

  /**
   * this is to ensure that the verse selection is properly set after the available words have been loaded into navigable books
   */
  useEffect(() => {
    setSelectedVerse(
      availableVerses?.find(
        (verse) => verse.reference === currentPosition?.verse
      ) ?? null
    );
  }, [availableVerses, currentPosition?.verse, setSelectedVerse]);

  const handleSetBook = (book: NavigableBook | null) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
  };

  const handleSetChapter = (chapter: Chapter | null) => {
    setSelectedChapter(chapter);
    setSelectedVerse(null);
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
          width: horizontal ? '6em' : '100%',
        }}
        getOptionLabel={(option) =>
          option?.reference ? String(option.reference) : ''
        }
        options={availableVerses ?? []}
        typeof={'select'}
        value={
          selectedVerse && availableVerses?.includes(selectedVerse)
            ? selectedVerse
            : null
        }
        onChange={(_, value) => setSelectedVerse(value)}
        renderInput={(params) => (
          <TextField label={'Verse'} {...params} variant={'standard'} />
        )}
      />
    ),
    [disabled, availableVerses, selectedVerse, setSelectedVerse, horizontal]
  );

  const handleNavigation = useMemo(
    () => () =>
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
                gap: '.50em',
              }
            : {
                alignItems: 'center',
              }),
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
          display: 'inline-flex',
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
        value={
          selectedBook && availableBooks?.includes(selectedBook)
            ? selectedBook
            : null
        }
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
          display: 'inline-flex',
        }}
        options={availableChapters}
        typeof={'select'}
        getOptionLabel={(option) => String(option.reference)}
        value={
          selectedChapter && availableChapters?.includes(selectedChapter)
            ? selectedChapter
            : null
        }
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
            width: '100%',
          }}
        >
          {backButton}
          {verseSelection}
          {forwardButton}
        </Box>
      )}
      <Button
        sx={{
          ...(horizontal ? { marginTop: '.85em' } : {}),
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
