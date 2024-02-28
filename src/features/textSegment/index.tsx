import React, { ReactElement, useContext, useMemo } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectAlignmentMode, toggleTextSegment } from 'state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import { LanguageInfo, Word } from 'structs';
import findRelatedAlignments from 'helpers/findRelatedAlignments';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import { AlignmentMode } from '../../state/alignmentState';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';

export interface TextSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  word: Word;
  languageInfo?: LanguageInfo;
  showAfter?: boolean;
  alignment?: 'flex-end' | 'flex-start' | 'center';
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
  onlyLinkIds,
  alignment,
  showAfter = false
}: TextSegmentProps): ReactElement => {
  useDebug('TextSegmentComponent');

  const dispatch = useAppDispatch();
  const { projectState } = useContext(AppContext);

  const mode = useAppSelector(selectAlignmentMode); // get alignment mode

  const isHovered = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === word.side &&
      state.textSegmentHover.hovered?.id === word.id
  );

  const currentlyHovered = useAppSelector(
    (state) => state.textSegmentHover.hovered
  );

  const foundRelatedLinks = useMemo(
    () => {
      const related = findRelatedAlignments(word, projectState.linksTable);
      if (onlyLinkIds) {
        return related.filter(
          (link) => link.id && onlyLinkIds.includes(link.id)
        );
      }
      return related;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      word,
      projectState.linksTable,
      projectState.linksTable?.lastUpdate,
      onlyLinkIds,
      onlyLinkIds?.length,
    ]
  );

  const isMemberOfMultipleAlignments = useMemo(
    () => foundRelatedLinks.length > 1,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foundRelatedLinks.length]
  );

  const isSelectedInEditedLink = useAppSelector((state) => {
    switch (word.side) {
      case 'sources':
        return !!state.alignment.present.inProgressLink?.sources.includes(
          BCVWP.sanitize(word.id)
        );
      case 'targets':
        return !!state.alignment.present.inProgressLink?.targets.includes(
          BCVWP.sanitize(word.id)
        );
    }
    return false;
  });

  const hoverRelatedLinks = useMemo(
    () => {
      // links related to the hovered word
      if (!currentlyHovered) return [];
      return findRelatedAlignments(currentlyHovered, projectState.linksTable);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentlyHovered,
      projectState.linksTable,
      projectState.linksTable?.lastUpdate,
    ]
  );

  const isRelatedToCurrentlyHovered = useMemo(
    () => {
      return _.intersection(foundRelatedLinks, hoverRelatedLinks).length > 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      hoverRelatedLinks,
      hoverRelatedLinks.length,
      foundRelatedLinks,
      foundRelatedLinks.length,
    ]
  );

  const isLinked = useMemo(
    () => foundRelatedLinks.length > 0,
    [foundRelatedLinks.length]
  );

  const isInvolved = useAppSelector(
    (state) => !!state.alignment.present.inProgressLink
  );

  if (!word) {
    return <span>{'ERROR'}</span>;
  }

  return (
    <React.Fragment>
      <Typography
        paragraph={false}
        component="span"
        variant={computeVariant(isSelectedInEditedLink, isLinked)}
        sx={alignment ? {display: 'flex', justifyContent: alignment} : {}}
        className={`text-segment${
          readonly ? '.readonly' : ''
        } ${computeDecoration(
          !!readonly,
          isHovered,
          isRelatedToCurrentlyHovered,
          mode,
          isLinked,
          isInvolved,
          isMemberOfMultipleAlignments
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
            : () => dispatch(toggleTextSegment({ foundRelatedLinks, word }))
        }
      >
        <LocalizedTextDisplay languageInfo={languageInfo}>
          {word.text}{showAfter ? (word.after || "").trim() : ""}
        </LocalizedTextDisplay>
      </Typography>
    </React.Fragment>
  );
};

export default TextSegment;
