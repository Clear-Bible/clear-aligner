import React from 'react';
import { ThemeMode } from '../themed';
import { Box, Divider, Grid, Paper } from '@mui/material';
import { Corpus, LanguageInfo, Word } from '../../structs';
import TextSegment from './index';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';

interface GlossSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
  allowGloss?: boolean;
  languageInfo?: LanguageInfo;
}

/**
 * Wrapper component for TextSegment that displays gloss information.
 * @param readonly whether the word should be displayed in read-only mode
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 * @param allowGloss boolean denoting whether to display gloss information if available.
 * @constructor Basic ctor.
 */
const GlossSegment: React.FC<GlossSegmentProps> = ({
                        readonly,
                        suppressAfter,
                        onlyLinkIds,
                        parts,
                        languageInfo
                      }: GlossSegmentProps) => {
  return (
    <Paper variant="outlined" sx={theme => ({
      display: 'inline-block',
      p: 1,
      m: .25,
      borderColor: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
      ...(theme.palette.mode === ThemeMode.DARK ? {
        background: 'transparent'
      } : {})
    })}>
      <Grid container>
        {
          (parts || []).map((wordPart: Word, idx: number) => {
            return (
              <React.Fragment key={wordPart.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <TextSegment
                    key={wordPart.id}
                    readonly={readonly}
                    onlyLinkIds={onlyLinkIds}
                    word={wordPart}
                    languageInfo={languageInfo}
                    showAfter={!suppressAfter}
                    alignment={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'}
                  />
                  <Grid container justifyContent={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'} sx={{ height: '20px' }}>
                    <LocalizedTextDisplay
                      languageInfo={languageInfo}
                      variant="caption"
                      sx={theme => ({
                        color: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)',
                      })}
                    >
                      {wordPart.gloss || "-"}
                    </LocalizedTextDisplay>
                  </Grid>
                </Box>
                {
                  idx !== ((parts || []).length - 1) && (
                    <Divider flexItem orientation="vertical" sx={theme => ({
                      borderStyle: 'dashed',
                      borderWidth: '1px',
                      mx: .5,
                      borderColor: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)'
                    })} />
                  )
                }
              </React.Fragment>
            )
          })
        }
      </Grid>
    </Paper>
  );
}
export default GlossSegment;
