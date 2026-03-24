/**
 * This file contains the TextSegment Component which is used in Alignment Mode
 * to show the source and target text. TextSegment is also used in the
 * Concordance Mode to show the verse text.
 */
import React, { ReactElement, useMemo } from 'react';
import { Typography, useTheme } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectAlignmentMode, toggleTextSegment } from 'state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import { LanguageInfo, RepositoryLink, Word } from 'structs';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AlignmentMode } from '../../state/alignmentState';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';

export interface TextSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  word: Word;
  languageInfo?: LanguageInfo;
  showAfter?: boolean;
  alignment?: 'flex-end' | 'flex-start' | 'center';
  links?: Map<string, RepositoryLink[]>;
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
  isMemberOfMultipleAlignments: boolean
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

  const theme = useTheme();

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
  const wordLinks = useMemo<RepositoryLink[]>(() => {
    if (!links || !word?.id) {
      return [];
    }
    const result = links.get(BCVWP.sanitize(word.id));
    return result ?? [];
  }, [links, word?.id]);
  const hoveredLinks = useMemo<RepositoryLink[]>(() => {
    if (!links || !currentlyHoveredWord?.id) {
      return [];
    }
    const sanitized = BCVWP.sanitize(currentlyHoveredWord.id);
    const result = [...links.values()]
      .flatMap((a) => a)
      .find((link: RepositoryLink) =>
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

  if (!word) {
    return <span>{'ERROR'}</span>;
  }

  const computedDecoration = computeDecoration(
    !!readonly,
    isHoveredWord,
    isRelatedToCurrentlyHovered,
    mode,
    isLinked,
    hasInProgressLink,
    isMemberOfMultipleAlignments
  );
  return (
    <React.Fragment>
      <LocalizedTextDisplay languageInfo={languageInfo}>
        <Typography
          paragraph={false}
          component="span"
          sx={{
            display: alignment ? 'flex' : null,
            justifyContent: alignment ? alignment : null,
            backgroundColor:
              computedDecoration === ' focused related' ||
              computedDecoration === ' related'
                ? theme.palette.highlightedText.alignmentEditor
                : null,
          }}
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
                    isMemberOfMultipleAlignments
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
                : () =>
                    dispatch(
                      toggleTextSegment({
                        foundRelatedLinks: wordLinks ?? [],
                        word,
                      })
                    )
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
