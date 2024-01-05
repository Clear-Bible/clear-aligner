import { Button, ButtonGroup, SxProps, Theme } from '@mui/material';

export interface SingleSelectButtonGroupProps {
  sx?: SxProps<Theme>;
  value?: string;
  items: {
    value: string;
    label: string;
  }[];
  onSelect: (value: string) => void;
}

/**
 * Display a group of buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param items list of buttons and their corresponding values
 * @param onSelect callback when a button is clicked by the user
 * @param sx style parameters
 */
export const SingleSelectButtonGroup = ({
  value,
  items,
  onSelect,
  sx,
}: SingleSelectButtonGroupProps) => {
  return (
    <ButtonGroup fullWidth={true} sx={sx}>
      {items.map((item) => (
        <Button
          key={item.value}
          onClick={() => onSelect(item.value)}
          variant={value && value === item.value ? 'contained' : undefined}
        >
          {item.label}
        </Button>
      ))}
    </ButtonGroup>
  );
};
