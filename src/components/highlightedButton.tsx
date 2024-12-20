/**
 * This file contains HighlightedButton component used in the Concordance View
 */
import { Button, useTheme } from '@mui/material';
import React from 'react';

/**
 * Props for the HighlightedButton Component
 */
export interface HighlightedButtonProps {
  onSelect: Function;
  variant: 'text' | 'contained' | 'outlined' | undefined;
  children: React.ReactNode;
  backgroundColor: string;
  buttonAction: string;
}

/**
 * HighlightedButton Component combines a color from the parent component with
 * colors from the custom MUI color palette.
 */
export const HighlightedButton = ({
  onSelect,
  variant,
  children,
  backgroundColor,
  buttonAction,
}: HighlightedButtonProps) => {
  const theme = useTheme();

  const handleSelect = () => {
    onSelect(buttonAction);
  };

  return (
    <Button
      variant={variant}
      onClick={handleSelect}
      sx={{
        width: '40px',
        '&:disabled': theme.palette.toggleButtons.disabled,
        '&:enabled': theme.palette.toggleButtons.enabled,
        '&:hover': theme.palette.toggleButtons.hover,
        '&.MuiButton-contained': {
          ...theme.palette.toggleButtons.selected,
          backgroundColor: backgroundColor,
        },
      }}
    >
      {children}
    </Button>
  );
};
