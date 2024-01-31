import { LanguageInfo, Word } from '../../structs';
import { Typography } from '@mui/material';
import TextSegment from '../textSegment';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React from 'react';

export interface WordDisplayProps {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  languageInfo?: LanguageInfo;
}

/**
 * Display a word made up of one or more parts with spacing after it
 * @param readonly whether the word should be displayed in read-only mode
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 */
export const WordDisplay = ({
  readonly,
  suppressAfter,
  parts,
  languageInfo,
}: WordDisplayProps) => {
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
          padding: '1px',
        }}
      >
        {parts?.map((part) => (
          <React.Fragment key={part?.id}>
            <TextSegment
              readonly={readonly}
              key={part.id}
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
      </Typography>
    </>
  );
};
