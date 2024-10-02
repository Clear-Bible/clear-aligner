import { Button, SxProps, Theme } from '@mui/material';
import { RemovableTooltip } from './removableTooltip';
import React from 'react';

/**
 * props for the {@link ToggleButton} component
 */
export interface ToggleButtonProps {
  disabled?: boolean;
  /**
   * optional tooltip
   */
  tooltipText?: string;
  /**
   * whether this button toggled into the on/checked state
   */
  isOn?: boolean;
  onStateChanged?: (on: boolean) => void;
  sx?: SxProps<Theme>;
  children: string | JSX.Element | JSX.Element[];
}

/**
 * toggle button component that acts like a checkbox
 * @param disabled whether this button should be in a disabled state
 * @param tooltipText optional tooltip text
 * @param isOn whether the button is toggled in the on/enabled state currently
 * @param onStateChanged callback for state changes (when a user clicks)
 * @param sx optional style overrides
 * @param children button children
 */
export const ToggleButton = ({
                               disabled,
                               tooltipText,
                               isOn,
                               onStateChanged,
                               sx,
                               children
                             }: ToggleButtonProps) => {
  return (
    <RemovableTooltip
      removed={disabled || !tooltipText}
      title={tooltipText}
      arrow
      describeChild>
      <Button
        variant={isOn ? 'contained' : 'outlined'}
        disabled={disabled}
        onClick={() => onStateChanged?.(!isOn)}
        sx={{
          maxWidth: '40px',
          ...(sx ?? {})
        }}>
        {children}
      </Button>
    </RemovableTooltip>
  );
};
