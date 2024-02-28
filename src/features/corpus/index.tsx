import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, InfoOutlined, Remove } from '@mui/icons-material';
import useDebug from 'hooks/useDebug';
import CorpusSettings from 'features/corpusSettings';
import { Corpus, CorpusContainer, Verse } from 'structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { VerseDisplay } from './verseDisplay';
import {
  computeAvailableChaptersAndVersesFromNavigableBooksAndPosition,
  findNextNavigableVerse,
  findPreviousNavigableVerse,
  getReferenceListFromWords,
} from '../bcvNavigation/structs';

export interface CorpusProps {
  viewCorpora: CorpusContainer;
  viewportIndex: number;
  corpora: Corpus[];
  position: BCVWP | null;
}

const determineCorpusView = (
  viewCorpora: CorpusContainer,
  verses: Verse[],
  bcvId: BCVWP | null
) => {
  const corpus = bcvId ? viewCorpora.corpusAtReference(bcvId) : undefined;
  if (!corpus) return <></>;
  return verses.map((verse) => {
    const languageInfo = viewCorpora.languageAtReference(verse.bcvId);
    return (
      <Grid
        container
        key={`${corpus.id}/${verse.bcvId.toReferenceString()}`}
        sx={{ marginRight: '.7em' }}
      >
        <Grid item xs={1} sx={{ p: '1px' }}>
          <Typography
            sx={
              bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                ? { textDecoration: 'underline', fontStyle: 'italic' }
                : {}
            }
          >
            {verse.citation}
          </Typography>
        </Grid>
        <Grid item xs={11}>
          <Grid
            container
            sx={{
              p: '1px',
              pl: 4,
              flexGrow: 1,
              overflow: 'auto',
              ...(languageInfo?.textDirection
                ? { direction: languageInfo?.textDirection }
                : {}),
            }}
          >
            <Typography
              component={'span'}
              lang={languageInfo?.code}
              style={{
                paddingBottom: '0.5rem',
                paddingLeft: '0.7rem',
                paddingRight: '0.7rem',
              }}
            >
              <VerseDisplay corpus={viewCorpora.corpusAtReference(verse.bcvId)} verse={verse} allowGloss />
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

export const CorpusComponent = (props: CorpusProps): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const { viewCorpora, viewportIndex, corpora, position } = props;
  useDebug('TextComponent');

  const verseAtPosition: Verse | undefined = useMemo(
    () => (position ? viewCorpora.verseByReference(position) : undefined),
    [position, viewCorpora]
  );

  const initialVerses = useMemo(() => {
    if (!position || !viewCorpora) return [];
    const verse = viewCorpora.verseByReference(position);
    if (!verse) return [];
    return [verse].filter((v) => v);
  }, [viewCorpora, position]);
  const [visibleVerses, setVisibleVerses] = useState<Verse[]>(initialVerses);
  const [showSettings] = useState(false);
  const verseKeys = useMemo(
    () =>
      viewCorpora.corpora
        .flatMap((corpus) => Object.keys(corpus.wordsByVerse))
        .sort(),
    [viewCorpora.corpora]
  );

  useEffect(() => {
    setVisibleVerses(initialVerses);
  }, [initialVerses]);

  const addBcvId = useCallback(() => {
    const firstExistingRef = visibleVerses?.at(0)?.bcvId ?? position;
    const lastExistingRef = visibleVerses?.at(-1)?.bcvId ?? position;
    if (!firstExistingRef || !lastExistingRef) {
      return;
    }

    const corporaWords =
      viewCorpora?.corpora?.flatMap(({ words }) => words) ?? [];
    const navigableWords = getReferenceListFromWords(corporaWords);

    const stateForFirstVerse =
      computeAvailableChaptersAndVersesFromNavigableBooksAndPosition(
        navigableWords,
        firstExistingRef
      );
    const stateForLastVerse =
      computeAvailableChaptersAndVersesFromNavigableBooksAndPosition(
        navigableWords,
        lastExistingRef
      );

    const newFirstVerse = findPreviousNavigableVerse(
      navigableWords,
      stateForFirstVerse.availableChapters,
      stateForFirstVerse.availableVerses,
      firstExistingRef
    );
    const newLastVerse = findNextNavigableVerse(
      navigableWords,
      stateForLastVerse.availableChapters,
      stateForLastVerse.availableVerses,
      lastExistingRef
    );

    const updatedVerses = [
      newFirstVerse ? viewCorpora.verseByReference(newFirstVerse) : undefined,
      ...visibleVerses,
      newLastVerse ? viewCorpora.verseByReference(newLastVerse) : undefined,
    ].filter((v) => v) as Verse[];
    setVisibleVerses(updatedVerses);
  }, [visibleVerses, viewCorpora, position]);

  const removeBcvId = useCallback(() => {
    setVisibleVerses((verses) => {
      if (verses.length < 1 || !position) {
        return verses;
      }
      return verses.slice(
        position?.matchesTruncated(verses[0]?.bcvId, BCVWPField.Verse) ? 0 : 1,
        verses.length === 1 ||
          position?.matchesTruncated(
            verses[verses.length - 1]?.bcvId,
            BCVWPField.Verse
          )
          ? verses.length
          : -1
      );
    });
  }, [position]);

  const corpusActionEnableState = useMemo(() => {
    const firstBcvId = viewCorpora.verseByReferenceString(
      verseKeys[
        verseKeys.indexOf(visibleVerses[0]?.bcvId.toReferenceString()) - 1
      ]
    )?.bcvId;
    const lastBcvId = viewCorpora.verseByReferenceString(
      verseKeys[
        verseKeys.indexOf(
          visibleVerses[visibleVerses.length - 1]?.bcvId.toReferenceString()
        ) + 1
      ]
    )?.bcvId;
    const showAdd = !firstBcvId && !lastBcvId ? 'add' : null;
    return visibleVerses.length <= 1 ? 'remove' : showAdd;
  }, [viewCorpora, visibleVerses, verseKeys]);

  if (!viewCorpora) {
    return <Typography>Empty State</Typography>;
  }

  return (
    <Grid
      container
      flexDirection="column"
      justifyContent="space-between"
      sx={{ height: '100%', flex: 1 }}
    >
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ py: 1, px: 2 }}
      >
        <Grid container sx={{ flex: 1 }}>
          {!showSettings && (
            <CorpusAction
              add={addBcvId}
              remove={removeBcvId}
              disabled={corpusActionEnableState}
            />
          )}
        </Grid>
        <Grid
          container
          justifyContent="flex-end"
          alignItems="center"
          sx={{ flex: 1 }}
        >
          <Typography variant="h6" sx={{ mr: 1 }}>
            {position ? viewCorpora.corpusAtReference(position)?.name : ''}
          </Typography>

          <Tooltip
            title={
              <>
                <Typography variant="h6">
                  {position
                    ? viewCorpora.corpusAtReference(position)?.fullName
                    : ''}
                </Typography>
                <Typography>
                  {position
                    ? viewCorpora.corpusAtReference(position)?.name
                    : ''}
                </Typography>
                <Typography>
                  Language:{' '}
                  {position
                    ? viewCorpora.languageAtReference(position)?.code
                    : ''}
                </Typography>
              </>
            }
          >
            <InfoOutlined />
          </Tooltip>
         </Grid>
      </Grid>

      {showSettings && (
        <CorpusSettings
          currentCorpusId={viewCorpora.id}
          viewportIndex={viewportIndex}
          corpora={corpora}
        />
      )}
      {!showSettings && (
        <Grid
          ref={textContainerRef}
          container
          sx={{ pl: 4, flex: 8, overflow: 'auto' }}
        >
          {verseAtPosition || visibleVerses.length > 0 ? (
            determineCorpusView(viewCorpora, visibleVerses, position)
          ) : (
            <Typography>No verse data for this reference.</Typography>
          )}
        </Grid>
      )}
    </Grid>
  );
};

interface CorpusActionProps {
  add: () => void;
  remove: () => void;
  disabled?: 'add' | 'remove' | null;
}

const CorpusAction: React.FC<CorpusActionProps> = ({
  add,
  remove,
  disabled,
}) => {
  return (
    <Grid container>
      <Tooltip title="Show the next verses">
        <span>
          <IconButton onClick={add} disabled={disabled === 'add'}>
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Remove the outer verses">
        <span>
          <IconButton onClick={remove} disabled={disabled === 'remove'}>
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Grid>
  );
};

export default CorpusComponent;
