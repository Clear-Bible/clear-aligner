/**
 * This file contains the SingleSelectStateButtonGroup component used in
 * ConcordanceView
 */
import { ButtonGroup, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';
import { HighlightedButton } from './highlightedButton';

/**
 * props for the SingleSelectStateButtonGroup
 */
export interface SingleSelectStateButtonGroupProps {
  value?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/**
 * Display a group of state buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param onSelect callback when a button is clicked by the user
 * @param disabled (optional) flag to disable the buttons
 */
export const SingleSelectStateButtonGroup = ({
  value,
  onSelect,
  disabled = false,
}: SingleSelectStateButtonGroupProps) => {
  const theme = useTheme();

  return (
    <ButtonGroup fullWidth={true} disabled={disabled}>
      <Tooltip title={'Created'}>
        <span>
          <HighlightedButton
            onSelect={onSelect}
            variant={value === 'created' ? 'contained' : undefined}
            backgroundColor={theme.palette.primary.main}
            buttonAction={'created'}
          >
            <LinkIcon />
          </HighlightedButton>
        </span>
      </Tooltip>
      <Tooltip title={'Rejected'}>
        <span>
          <HighlightedButton
            onSelect={onSelect}
            variant={value === 'rejected' ? 'contained' : undefined}
            backgroundColor={theme.palette.error.main}
            buttonAction={'rejected'}
          >
            <Cancel />
          </HighlightedButton>
        </span>
      </Tooltip>
      <Tooltip title={'Approved'}>
        <span>
          <HighlightedButton
            onSelect={onSelect}
            variant={value === 'approved' ? 'contained' : undefined}
            backgroundColor={theme.palette.success.main}
            buttonAction={'approved'}
          >
            <CheckCircle />
          </HighlightedButton>
        </span>
      </Tooltip>
      <Tooltip title={'Needs Review'}>
        <span>
          <HighlightedButton
            onSelect={onSelect}
            variant={value === 'needsReview' ? 'contained' : undefined}
            backgroundColor={theme.palette.warning.main}
            buttonAction={'needsReview'}
          >
            <Flag />
          </HighlightedButton>
        </span>
      </Tooltip>
    </ButtonGroup>
  );
};
