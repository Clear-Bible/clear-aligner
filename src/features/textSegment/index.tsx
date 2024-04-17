import React, { ReactElement, useContext, useMemo } from 'react';
import { Typography } from '@mui/material';
import _ from 'lodash';

import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { AppContext } from 'App';
import {
  selectAlignmentMode,
  toggleTextSegment,
  suggestTokens,
  clearSuggestions,
} from 'state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import {
  AlignmentSide,
  LanguageInfo,
  Link,
  Word,
  Corpus,
  TextDirection,
} from 'structs';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AlignmentMode } from '../../state/alignmentState';
import generateSuggestions from '../suggestions/generateSuggestions';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import {
  DefaultProjectName,
  useFindLinksByBCV,
  useDataLastUpdated,
} from '../../state/links/tableManager';
// import { useAlignedWordsFromPivotWord } from '../concordanceView/useAlignedWordsFromPivotWord';
import { useDatabase } from '../../hooks/useDatabase';

export interface TextSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  word: Word;
  languageInfo?: LanguageInfo;
  showAfter?: boolean;
  alignment?: 'flex-end' | 'flex-start' | 'center';
  links?: Map<string, Link>;
}

const computeVariant = (
  isSelected: boolean,
  isLinked: boolean
): 'unlinked' | 'selected' | undefined => {
  if (isSelected) {
    return 'selected';
  }
  if (!isLinked) {
    return 'unlinked';
  }
  return undefined;
};

const computeDecoration = (
  readonly: boolean,
  isHovered: boolean,
  isRelated: boolean,
  mode: AlignmentMode,
  isLinked: boolean,
  isInvolved: boolean,
  isMemberOfMultipleAlignments: boolean,
  isSuggested: boolean
): string => {
  let decoration = '';
  if (
    mode === AlignmentMode.Edit ||
    mode === AlignmentMode.Create ||
    mode === AlignmentMode.PartialCreate ||
    mode === AlignmentMode.PartialEdit
  ) {
    if (isLinked) {
      // Prevents previously linked segments being added to other links.
      decoration += ' locked';
    }

    if (!isInvolved) {
      // Prevents segments from not-involved corpora being added to the inProgressLink
      decoration += ' locked';
    }

    if (isSuggested) {
      console.log('new decoration', decoration);
      decoration += ' suggested';
    }

    return decoration;
  }

  if (isHovered && !readonly) {
    decoration += ' focused';
  }

  if (isRelated) {
    decoration += ' related';
  }

  if (isMemberOfMultipleAlignments) {
    decoration += ' locked';
  }

  return decoration;
};

export const TextSegment = ({
  readonly,
  word,
  languageInfo,
  disableHighlighting,
  alignment,
  links,
  showAfter = false,
}: TextSegmentProps): ReactElement => {
  useDebug('TextSegmentComponent');

  const dispatch = useAppDispatch();
  const { preferences } = useContext(AppContext);
  const mode = useAppSelector(selectAlignmentMode); // get alignment mode
  const isHoveredWord = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === word.side &&
      state.textSegmentHover.hovered?.id === word.id
  );
  const currentlyHoveredWord = useAppSelector(
    (state) => state.textSegmentHover.hovered
  );

  const isSuggested = useAppSelector((state) =>
    Boolean(
      state.alignment.present.suggestedTokens.find((suggestedToken: Word) => {
        return (
          suggestedToken.id === word.id &&
          suggestedToken.corpusId === word.corpusId
        );
      })
    )
  );

  const areSuggestions = useAppSelector((state) => {
    return Boolean(state.alignment.present.suggestedTokens.length > 0);
  });

  const wordLinks = useMemo<Link[]>(() => {
    if (!links || !word?.id) {
      return [];
    }
    const result = links.get(BCVWP.sanitize(word.id));
    return result ? [result] : [];
  }, [links, word?.id]);
  const hoveredLinks = useMemo<Link[]>(() => {
    if (!links || !currentlyHoveredWord?.id) {
      return [];
    }
    const sanitized = BCVWP.sanitize(currentlyHoveredWord.id);
    const result = [...links.values()].find((link: Link) =>
      link[currentlyHoveredWord.side].includes(sanitized)
    );
    return result ? [result] : [];
  }, [links, currentlyHoveredWord?.id, currentlyHoveredWord?.side]);

  const isMemberOfMultipleAlignments = useMemo(
    () => (wordLinks ?? []).length > 1,
    [wordLinks]
  );

  const wasMemberOfCurrentlyEditedLink = useAppSelector(
    (state) =>
      state.alignment.present.inProgressLink?.id &&
      wordLinks
        .map((link) => link.id)
        .includes(state.alignment.present.inProgressLink?.id)
  );

  const isSelectedInEditedLink = useAppSelector((state) => {
    switch (word.side) {
      case AlignmentSide.SOURCE:
        return !!state.alignment.present.inProgressLink?.sources.includes(
          BCVWP.sanitize(word.id)
        );
      case AlignmentSide.TARGET:
        return !!state.alignment.present.inProgressLink?.targets.includes(
          BCVWP.sanitize(word.id)
        );
    }
  });

  const isRelatedToCurrentlyHovered = useMemo(() => {
    return _.intersection(wordLinks, hoveredLinks).length > 0;
  }, [wordLinks, hoveredLinks]);

  const isLinked = useMemo(() => (wordLinks ?? []).length > 0, [wordLinks]);

  const hasInProgressLink = useAppSelector(
    (state) => !!state.alignment.present.inProgressLink
  );

  const db = useDatabase();
  const { sourceContainer, targetContainer } = useCorpusContainers();

  const bcvwp = BCVWP.parseFromString(word.id);

  const dataLastUpdated = useDataLastUpdated();
  // either stale or infinite loop
  const relatedLinks = useFindLinksByBCV(
    word.side,
    bcvwp.book ?? undefined,
    bcvwp.chapter ?? undefined,
    bcvwp.verse ?? undefined,
    false,
    `${bcvwp.toReferenceString()}-${dataLastUpdated}`
  );

  // const alignedWords = useAlignedWordsFromPivotWord({
  //   normalizedText: word.normalizedText,
  //   side: word.side,
  //   frequency: 0,
  //   languageInfo: {
  //     code: 'en',
  //     textDirection: TextDirection.LTR,
  //   },
  // });

  // const { projectState } = React.useContext(AppContext);

  // const memoizedLinks = useMemo(() => {
  //   return relatedLinks;
  // }, [projectState?.linksTable]);

  if (!word) {
    return <span>{'ERROR'}</span>;
  }

  return (
    <React.Fragment>
      <LocalizedTextDisplay languageInfo={languageInfo}>
        <Typography
          paragraph={false}
          component="span"
          sx={alignment ? { display: 'flex', justifyContent: alignment } : {}}
          style={{
            ...(languageInfo?.fontFamily
              ? { fontFamily: languageInfo.fontFamily }
              : {}),
          }}
        >
          <Typography
            paragraph={false}
            component="span"
            variant={
              disableHighlighting
                ? undefined
                : computeVariant(isSelectedInEditedLink, isLinked)
            }
            sx={alignment ? { display: 'flex', justifyContent: alignment } : {}}
            className={`text-segment${readonly ? '.readonly' : ''} ${
              disableHighlighting
                ? ' locked '
                : computeDecoration(
                    !!readonly,
                    isHoveredWord,
                    isRelatedToCurrentlyHovered,
                    mode,
                    isLinked,
                    hasInProgressLink,
                    isMemberOfMultipleAlignments,
                    isSuggested
                  )
            }`}
            style={{
              ...(languageInfo?.fontFamily
                ? { fontFamily: languageInfo.fontFamily }
                : {}),
            }}
            onMouseEnter={
              readonly
                ? undefined
                : () => {
                    // >>>>>>> main
                    dispatch(hover(word));
                  }
            }
            onMouseLeave={
              readonly
                ? undefined
                : () => {
                    dispatch(hover(null));
                  }
            }
            onClick={
              readonly ||
              (isLinked && hasInProgressLink && !wasMemberOfCurrentlyEditedLink)
                ? undefined
                : () => {
                    dispatch(
                      toggleTextSegment({
                        foundRelatedLinks: wordLinks ?? [],
                        word,
                      })
                    );
                    dispatch(
                      suggestTokens(
                        generateSuggestions(
                          word,
                          // HARDCODED to NT
                          sourceContainer?.corpora[1]?.wordsByVerse[
                            bcvwp.toTruncatedReferenceString(8).trim()
                          ]?.words ?? [],
                          targetContainer?.corpora[0]?.wordsByVerse[
                            bcvwp.toTruncatedReferenceString(8).trim()
                          ]?.words ?? [],
                          // The following array should be a running denormalized history of alignments.
                          // Currently this is hard coded for Matt 1:1 test case.
                          [
                            {
                              sourceWords: ['ἐγέννησεν'],
                              targetWords: ['begat'],
                              frequency: 1,
                            },

                            {
                              sourceWords: ['Ἀβραὰμ'],
                              targetWords: ['Abraham'],
                              frequency: 1,
                            },
                          ],
                          relatedLinks.result ?? []
                        )
                      )
                    );
                  }
            }
          >
            {word.text}
          </Typography>
          {showAfter ? (word.after || '').trim() : ''}
        </Typography>
      </LocalizedTextDisplay>
    </React.Fragment>
  );
};

export default TextSegment;
