import React, { ReactElement, useMemo } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  selectAlignmentMode,
  toggleTextSegment,
  suggestTokens,
  clearSuggestions,
} from 'state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import { AlignmentSide, LanguageInfo, Link, Word } from 'structs';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AlignmentMode } from '../../state/alignmentState';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';

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
  alignment,
  links,
  showAfter = false,
}: TextSegmentProps): ReactElement => {
  useDebug('TextSegmentComponent');

  const dispatch = useAppDispatch();
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

  const isInvolved = useAppSelector(
    (state) => !!state.alignment.present.inProgressLink
  );

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
            variant={computeVariant(isSelectedInEditedLink, isLinked)}
            sx={alignment ? { display: 'flex', justifyContent: alignment } : {}}
            className={`text-segment${
              readonly ? '.readonly' : ''
            } ${computeDecoration(
              !!readonly,
              isHoveredWord,
              isRelatedToCurrentlyHovered,
              mode,
              isLinked,
              isInvolved,
              isMemberOfMultipleAlignments,
              isSuggested
            )}`}
            style={{
              ...(languageInfo?.fontFamily
                ? { fontFamily: languageInfo.fontFamily }
                : {}),
            }}
            onMouseEnter={
              readonly
                ? undefined
                : () => {
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
              readonly
                ? undefined
                : () => {
                    console.log(word);
                    dispatch(
                      toggleTextSegment({
                        foundRelatedLinks: wordLinks ?? [],
                        word,
                      })
                    );
                    console.log('dispatching suggestTokens...');
                    if (!areSuggestions) {
                      dispatch(
                        suggestTokens([
                          {
                            id: '01001001003',
                            corpusId: 'ylt-new',
                            side: AlignmentSide.TARGET,
                            text: 'beginning',
                            position: 3,
                            normalizedText: 'beginning',
                          },
                        ])
                      );
                    }
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
