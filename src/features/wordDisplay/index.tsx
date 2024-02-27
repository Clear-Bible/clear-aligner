import { Corpus, TextDirection, Word } from '../../structs';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import TextSegment from '../textSegment';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React from 'react';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';

export interface WordDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
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
                              onlyLinkIds,
                              parts,
                              corpus
                            }: WordDisplayProps) => {
  const { language: languageInfo, hasGloss } = corpus ?? { languageInfo: null, hasGloss: false };
  const { preferences } = React.useContext(AppContext);
  const ref = parts?.find((part) => part.id)?.id;

  const getTextAlignment = React.useCallback((wordStr?: string): 'center' | 'left' | 'right' => {
    const textDirection = languageInfo?.textDirection === TextDirection.LTR ? 'left' : 'right';
    return /-/.test(wordStr || "-") ? 'center' : textDirection;
  }, [languageInfo]);

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
          (hasGloss && preferences.showGloss) ? (
            <Paper variant="outlined" sx={{ display: 'inline-block', p: 1, m: .25 }}>
              <Grid container>
                {
                  (parts || []).map((wordPart: Word, idx: number) => {
                    return (
                      <React.Fragment key={wordPart.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <TextSegment
                            key={wordPart.id}
                            readonly={readonly}
                            onlyLinkIds={onlyLinkIds}
                            word={wordPart}
                            languageInfo={languageInfo}
                            showAfter={!suppressAfter}
                          />
                          <Box sx={{ height: '20px', display: 'flex', justifyContent: getTextAlignment(wordPart.gloss) }}>
                            <LocalizedTextDisplay
                              languageInfo={languageInfo}
                              variant="caption"
                              sx={theme => ({color: (theme as Record<string, any>).typography.unlinked.color })}
                            >
                              {wordPart.gloss || "-"}
                            </LocalizedTextDisplay>
                          </Box>
                        </Box>
                        {
                          idx !== ((parts || []).length - 1) && (
                            <Divider flexItem orientation="vertical" sx={{ borderStyle: 'dashed', width: '2px', mx: .5 }} />
                          )
                        }
                      </React.Fragment>
                    )
                  })
                }
              </Grid>
            </Paper>
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
