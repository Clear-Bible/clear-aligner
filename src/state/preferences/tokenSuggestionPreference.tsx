import React, { useMemo } from 'react';
import { ToggleButton } from '../../components/toggleButton';
import defaultPreferenceItemStyle from './defaultPreferenceItemStyle';
import { Box } from '@mui/system';
import { SxProps, Theme } from '@mui/material';

/**
 * token suggestion preference component props
 */
export interface TokenSuggestionPreferenceProps {
  /**
   * CSS overrides, replaces default CSS
   */
  sx?: SxProps<Theme>;
  tokenSuggestionEnabled?: boolean;
  setTokenSuggestionsEnabled?: (tokenSuggestionEnabled: boolean) => void;
}

/**
 * token suggestion preference component
 * @param tokenSuggestionEnabled whether token suggestions are turned on
 * @param setTokenSuggestionsEnabled callback to set the token suggestion preference
 */
export const TokenSuggestionPreference = ({
  sx,
  tokenSuggestionEnabled,
  setTokenSuggestionsEnabled
                                          }: TokenSuggestionPreferenceProps) => {

  const boxSx = useMemo(() => ({
    ...defaultPreferenceItemStyle,
    ...sx
  }), [ sx ]);

  return (
    <Box
      sx={boxSx}>
      <ToggleButton
        isOn={tokenSuggestionEnabled}
        onStateChanged={setTokenSuggestionsEnabled}
        sx={{
          maxWidth: undefined,
          height: '100%'
        }}>
        Token Suggestions
      </ToggleButton>
    </Box>
  );
}
