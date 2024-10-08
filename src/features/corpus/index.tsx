/**
 * This file contains the CorpusComponent which is used in the Alignment editor
 * to display the current verse and related functionality/context
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, InfoOutlined, Remove } from '@mui/icons-material';
import useDebug from 'hooks/useDebug';
import { CorpusContainer, NamedContainers, Verse } from 'structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { VerseDisplay } from './verseDisplay';
import {
  computeAvailableChaptersAndVersesFromNavigableBooksAndPosition,
  findNextNavigableVerse,
  findPreviousNavigableVerse,
  getReferenceListFromWords
} from '../bcvNavigation/structs';
import { AlignmentSide } from '../../common/data/project/corpus';
import { WordDisplayVariant } from '../wordDisplay';

export interface CorpusProps {
  viewCorpora: CorpusContainer,
  viewportIndex: number,
  position: BCVWP | null,
  containers: NamedContainers,
  setChangedVisibleVerses?: ((verses: Verse[], corpus: CorpusContainer) => void)
}

const determineCorpusView = (
  viewCorpora: CorpusContainer,
  verses: Verse[],
  bcvId: BCVWP | null
) => {

  return verses.map((verse) => {
    const languageInfo = viewCorpora.languageAtReferenceString(verse.bcvId.toReferenceString());
    return (
      <Grid
        container
        key={`${viewCorpora.id}/${verse.bcvId.toReferenceString()}`}
        sx={{ marginRight: '.7em' }}
      >
        <Grid item xs={1} sx={{ p: '1px' }}>
          <Typography
            sx={
              bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                ? { fontStyle: 'italic' }
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
                : {})
            }}
          >
            <Typography
              component={'span'}
              lang={languageInfo?.code}
              style={{
                paddingBottom: '0.5rem',
                paddingLeft: '0.7rem',
                paddingRight: '0.7rem'
              }}
            >
              <VerseDisplay corpus={viewCorpora.corpusAtReferenceString(verse.bcvId.toReferenceString())}
                            verse={verse}
                            variant={WordDisplayVariant.BUTTON} />
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

export const CorpusComponent = ({
                                  containers,
                                  position,
                                  viewCorpora,
                                  setChangedVisibleVerses
                                }: CorpusProps): ReactElement => {
  useDebug('Corpus');

  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [verseElement, setVerseElement] = useState<JSX.Element[]>();
  const computedPosition = useMemo(() => {
    if (viewCorpora.id === AlignmentSide.TARGET) {
      return position ?? null;
    }
    // displaying source
    if (!position || !containers.targets) return null;
    const verseString = containers.targets.verseByReference(position)?.sourceVerse;
    if ((verseString ?? '').trim().length) return BCVWP.parseFromString(verseString!);
    return position;
  }, [viewCorpora.id, position, containers]);
  const computedVerse: Verse | undefined = useMemo(
    () =>
      computedPosition
        ? viewCorpora.verseByReference(computedPosition)
        : undefined,
    [computedPosition, viewCorpora]
  );
  const initialVerses = useMemo(() => {
    return [computedVerse].filter(Boolean) as Verse[];
  }, [computedVerse]);
  const [visibleVerses, setVisibleVerses] = useState<Verse[]>(initialVerses);
  const verseKeys = useMemo(
    () =>
      viewCorpora.corpora
        .flatMap((viewCorpus) => Object.keys(viewCorpus.wordsByVerse))
        .sort(),
    [viewCorpora.corpora]
  );
  useEffect(() => {
    setVisibleVerses(initialVerses);
  }, [initialVerses]);
  useEffect(() => {
    setChangedVisibleVerses?.(visibleVerses, viewCorpora);
  }, [setChangedVisibleVerses, viewCorpora, visibleVerses]);

  const addBcvId = useCallback(() => {
    const firstExistingRef = visibleVerses?.at(0)?.bcvId ?? computedPosition;
    const lastExistingRef = visibleVerses?.at(-1)?.bcvId ?? computedPosition;
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
      newLastVerse ? viewCorpora.verseByReference(newLastVerse) : undefined
    ].filter((v) => v) as Verse[];
    setVisibleVerses(updatedVerses);
  }, [visibleVerses, viewCorpora, computedPosition]);

  const removeBcvId = useCallback(() =>
    setVisibleVerses((verses) => {
      if (verses.length < 1 || !computedPosition) {
        return verses;
      }
      return verses.slice(
        computedPosition?.matchesTruncated(verses[0]?.bcvId, BCVWPField.Verse) ? 0 : 1,
        verses.length === 1 ||
        computedPosition?.matchesTruncated(
          verses[verses.length - 1]?.bcvId,
          BCVWPField.Verse
        ) ? verses.length : -1
      );
    }), [computedPosition]);

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
  useEffect(() => {
    setVerseElement(
      determineCorpusView(
        viewCorpora,
        visibleVerses,
        computedPosition));
  }, [computedPosition, viewCorpora, visibleVerses, computedVerse]);

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
          <CorpusAction
            add={addBcvId}
            remove={removeBcvId}
            disabled={corpusActionEnableState}
          />
        </Grid>
        <Grid
          container
          justifyContent="flex-end"
          alignItems="center"
          sx={{ flex: 1 }}
        >
          <Typography variant="h6" sx={{ mr: 1 }}>
            {computedPosition
              ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.name
              : ''}
          </Typography>

          <Tooltip
            title={
              <>
                <Typography variant="h6">
                  {computedPosition
                    ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.fullName
                    : ''}
                </Typography>
                <Typography>
                  {computedPosition
                    ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.name
                    : ''}
                </Typography>
                <Typography>
                  Language:{' '}
                  {computedPosition
                    ? viewCorpora.languageAtReferenceString(computedPosition.toReferenceString())?.code
                    : ''}
                </Typography>
              </>
            }
          >
            <InfoOutlined />
          </Tooltip>
        </Grid>
      </Grid>

      <Grid
        ref={textContainerRef}
        container
        sx={{ pl: 4, flex: 8, overflow: 'auto' }}
      >
        {(verseElement?.length ?? 0) > 0
          ? verseElement
          : <Typography>No verse data for this reference.</Typography>}
      </Grid>
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
                                                     disabled
                                                   }) =>
  (
    <Grid container>
      <Tooltip title="Show the next verses" placement="left">
        <span>
          <IconButton onClick={add} disabled={disabled === 'add'}>
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Remove the outer verses" placement="right">
        <span>
          <IconButton onClick={remove} disabled={disabled === 'remove'}>
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Grid>
  );

export default CorpusComponent;
