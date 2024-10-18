import { FormControl, InputLabel, MenuItem, Select, SxProps, Theme } from '@mui/material';
import { THEME_PREFERENCE } from '../../App';
import React, { useMemo } from 'react';
import { Box } from '@mui/system';
import defaultPreferenceItemStyle from './defaultPreferenceItemStyle';

/**
 * props for theme selector
 */
export interface ThemeSelectorProps {
  /**
   * CSS overrides, replaces default CSS
   */
  sx?: SxProps<Theme>;
  preferredTheme: THEME_PREFERENCE;
  setPreferredTheme: React.Dispatch<React.SetStateAction<THEME_PREFERENCE>>;
}

/**
 * theme preference selector component
 */
export const ThemeSelector = ({
  sx,
  preferredTheme,
  setPreferredTheme
                              }: ThemeSelectorProps) => {

  const boxSx = useMemo(() => ({
    ...defaultPreferenceItemStyle,
    ...sx
  }), [ sx ]);

  return (
    <Box
      sx={boxSx}>
      <FormControl sx={{ width: '100%' }}>
        <InputLabel id={'theme-label'}>Theme</InputLabel>
        <Select
          labelId={'theme-label'}
          id={'theme-select'}
          value={preferredTheme}
          label={'Theme'}
          onChange={({ target: { value } }) =>
            setPreferredTheme(value as THEME_PREFERENCE)
          }
        >
          <MenuItem value={'auto' as THEME_PREFERENCE}>
            Follow System
          </MenuItem>
          <MenuItem value={'night' as THEME_PREFERENCE}>Dark</MenuItem>
          <MenuItem value={'day' as THEME_PREFERENCE}>Light</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
