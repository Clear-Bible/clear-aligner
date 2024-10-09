import React, { useMemo } from 'react';
import defaultPreferenceItemStyle from './defaultPreferenceItemStyle';
import { Box } from '@mui/system';
import { FormControlLabel, Switch, SxProps, Theme } from '@mui/material';
import { RemovableTooltip } from '../../components/removableTooltip';

interface PreferenceToggleProps {
  tooltipText?: string;
  labelText: string;
  disabled?: boolean;
  value?: boolean;
  onUpdateValue?: (v: boolean) => void;
}

const PreferenceToggle = ({
  disabled,
  labelText,
  tooltipText,
  value,
  onUpdateValue
                          }: PreferenceToggleProps) => {
  return (
    <RemovableTooltip title={tooltipText}
                      removed={disabled || !tooltipText}
    >
      <FormControlLabel
        sx={{
          width: '100%',
          marginLeft: '2px',
          justifyContent: 'space-between',
        }}
        control={
        <Switch
          disabled={disabled}
          checked={value}
          onChange={() => onUpdateValue?.(!value)}
        />}
        label={labelText}
        labelPlacement={'start'}
      />
    </RemovableTooltip>
  );
}

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
      <PreferenceToggle labelText={'Alignment Suggestions'}
                        value={tokenSuggestionEnabled}
                        onUpdateValue={setTokenSuggestionsEnabled} />
    </Box>
  );
}
