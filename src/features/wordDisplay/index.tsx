import { Corpus, Word } from '../../structs';
import { Typography } from '@mui/material';
import TextSegment from '../textSegment';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React from 'react';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import GlossSegment from '../textSegment/glossSegment';

export interface WordDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
  allowGloss?: boolean;
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
                              allowGloss = false
                            }: WordDisplayProps) => {
  const { language: languageInfo, hasGloss } = corpus ?? { languageInfo: null, hasGloss: false };
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
            : ''
        }-${languageInfo?.code}`}
        style={{
          padding: '1px'
        }}
      >
        {
          (hasGloss && preferences.showGloss && allowGloss) ? (
            <GlossSegment
              readonly={readonly}
              suppressAfter={suppressAfter}
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
                    languageInfo={languageInfo}
                  />
                  {!suppressAfter && (
                    <>
                      {part.after && (
                        <LocalizedTextDisplay
                          key={`${part.id}-after`}
                          languageInfo={languageInfo}
                        >
                          {part.after}
                        </LocalizedTextDisplay>
                      )}
                    </>
                  )}
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
