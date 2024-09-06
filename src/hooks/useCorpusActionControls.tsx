/**
 * This file contains the useCorpusActionControls hook that is used in
 * the Alignment Editor for adding or removing context
 */
import { Box, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';
import React, { useCallback, useMemo, useState } from 'react';
import { CorpusContainer, Link, Verse } from '../structs';
import { useSaveLink } from '../state/links/tableManager';
import {
  computeAvailableChaptersAndVersesFromNavigableBooksAndPosition, findNextNavigableVerse, findPreviousNavigableVerse,
  getReferenceListFromWords
} from '../features/bcvNavigation/structs';
import { AlignmentSide } from '../common/data/project/corpus';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';
import { CorpusProps } from '../features/corpus';

/**
 * useCorpusActionControls hook
 * used in the Alignment Editor for adding or removing context
 */
const useCorpusActionControls = (viewCorpora: CorpusContainer,
                                 containers: any,
                                 props: CorpusProps): any => {


  const computedPosition = useMemo(() => {
    if (viewCorpora.id === AlignmentSide.TARGET) {
      return props.position ?? null;
    }
    // displaying source
    if (!props.position || !containers.targets) return null;
    const verseString = containers.targets.verseByReference(props.position)?.sourceVerse;
    if ((verseString ?? '').trim().length) return BCVWP.parseFromString(verseString!);
    return props.position;
  }, [viewCorpora.id, props.position, containers.targets]);

  const verseAtPosition: Verse | undefined = useMemo(
    () =>
      computedPosition
        ? viewCorpora.verseByReference(computedPosition)
        : undefined,
    [computedPosition, viewCorpora]
  );

  const initialVerses = useMemo(() => {
    if (!computedPosition || !viewCorpora) return [];
    const verse = viewCorpora.verseByReference(computedPosition);
    if (!verse) return [];
    return [verse].filter((v) => v);
  }, [viewCorpora, computedPosition]);

  const [visibleVerses, setVisibleVerses] = useState<Verse[]>(initialVerses);
  const verseKeys = useMemo(
    () =>
      viewCorpora.corpora
        .flatMap((corpus) => Object.keys(corpus.wordsByVerse))
        .sort(),
    [viewCorpora.corpora]
  );

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

    // if this is the source side, we also need to expand the text
    // in the InterLinear
    if (viewCorpora.id === AlignmentSide.SOURCE) {
      //interLinearAddBcvId();
    }
  }, [visibleVerses, viewCorpora, computedPosition]);

  const removeBcvId = useCallback(() =>
    setVisibleVerses((verses) => {
      if (verses.length < 1 || !computedPosition) {
        return verses;
      }
      return verses.slice(
        computedPosition?.matchesTruncated(verses[0]?.bcvId, BCVWPField.Verse)
          ? 0
          : 1,
        verses.length === 1 ||
        computedPosition?.matchesTruncated(
          verses[verses.length - 1]?.bcvId,
          BCVWPField.Verse
        )
          ? verses.length
          : -1
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

  return [addBcvId, removeBcvId, corpusActionEnableState, computedPosition, visibleVerses, verseAtPosition ]
};

export default useCorpusActionControls;
