import { Tooltip, TooltipProps } from '@mui/material';
import { PropsWithChildren } from 'react';

export interface RemovableTooltipProps extends TooltipProps {
  removed?: boolean;
}

/**
 * This is a component that allows a tooltip to be completely removed from the dom in it's disabled state in order to
 * avoid rendering issues. It is a simple wrapper for {@link @mui/material/Tooltip}
 * @param removed whether the tooltip is removed from the dom
 * @param others {@link TooltipProps} to be used for the MUI Tooltip component
 * @param children children of the MUI Tooltip
 */
export const RemovableTooltip = ({
  removed,
  children,
  ...others
}: PropsWithChildren<RemovableTooltipProps>) => (
  <>{removed ? <>{children}</> : <Tooltip {...others}>{children}</Tooltip>}</>
);
