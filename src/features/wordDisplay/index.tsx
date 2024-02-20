import { Corpus, Link, Word } from '../../structs';
import { Typography } from '@mui/material';
import TextSegment from '../textSegment';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React, { useMemo } from 'react';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import GlossSegment from '../textSegment/glossSegment';
import uuid from 'uuid-random';

export interface WordDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
  allowGloss?: boolean;
  links?: Map<string, Link>;
}

/**
 * Display a word made up of one or more parts with spacing after it
 * @param readonly whether the word should be displayed in read-only mode
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 * @param allowGloss boolean denoting whether to display gloss information if available.
 */
export const WordDisplay = ({
                              readonly,
                              suppressAfter,
                              onlyLinkIds,
                              parts,
                              corpus,
                              links,
                              allowGloss = false
                            }: WordDisplayProps) => {
  const { language: languageInfo, hasGloss } = useMemo(() => corpus ?? { language: undefined, hasGloss: false }, [corpus]);
  const { preferences } = React.useContext(AppContext);
  const ref = parts?.find((part) => part.id)?.id;

  return (
    <>
      <Typography
        component={'span'}
        key={`${
          ref
            ? BCVWP.parseFromString(ref).toTruncatedReferenceString(
              BCVWPField.Word
            )
            : uuid()
        }-${languageInfo?.code}`}
        style={{
          padding: '1px'
        }}
      >
        {
          (hasGloss && preferences?.showGloss && allowGloss) ? (
            <GlossSegment
              readonly={readonly}
              suppressAfter={suppressAfter}
              links={links}
              parts={parts}
              corpus={corpus}
              allowGloss={allowGloss}
              languageInfo={languageInfo}
            />
          ) : (
            <>
              {parts?.map((part) => (
                <React.Fragment key={part?.id}>
                  <TextSegment
                    key={part.id}
                    readonly={readonly}
                    onlyLinkIds={onlyLinkIds}
                    word={part}
                    links={links}
                    languageInfo={languageInfo}
                    showAfter={!suppressAfter}
                  />
                </React.Fragment>
              ))}
              <span> </span>
            </>
          )
        }
      </Typography>
    </>
  );
};
