/**
 * This file contains the LocalizedTextDisplay component, used throughout the UI
 * to render localized text.
 */
import { LanguageInfo } from '../../structs';
import { Typography } from '@mui/material';
import * as React from 'react';
import { PropsWithChildren } from 'react';

export interface LocalizedTextDisplayProps
  extends React.ComponentProps<typeof Typography> {
  languageInfo?: LanguageInfo;
}

/**
 * Display text in child components in the appropriate font and text direction according to the language info supplied
 * @param children components to be displayed according to the language info
 * @param languageInfo language info for localization
 * @param typographyProps set of parameters from `<Typography>` to be applied to this localized text display
 */
export const LocalizedTextDisplay = ({
                                       children,
                                       languageInfo,
                                       ...typographyProps
                                     }: PropsWithChildren<LocalizedTextDisplayProps>) => {
  return (
    <Typography
      component={'span'}
      noWrap={true}
      {...typographyProps}
      sx={theme => ({
        ...(languageInfo?.fontFamily
          ? { fontFamily: languageInfo?.fontFamily }
          : {}),
        ...((typographyProps as any).sx ?? {})
      })}
    >
      {children}
    </Typography>
  );
};
