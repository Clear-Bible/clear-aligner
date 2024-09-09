/**
 * This file contains the PerRowLinkStateSelector component used in
 * ConcordanceView
 */
import { IconButton, Stack, SxProps, Theme, useTheme } from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { useSaveLink } from '../../state/links/tableManager';
import { Link, LinkStatus } from '../../structs';

/**
 * props for the ToggleIcon
 */
export interface ToggleIconProps{
  sx?: SxProps<Theme>;
  item: {
    value: string;
    label: string | ReactElement;
    tooltip?: string;
    color: string;
  };
  currentValue: string;
  setCurrentValue: Function;
  currentLink: Link;
}
/**
 * Display a single icon inside the perRowLinkStateSelector component
 */
const ToggleIcon = ({item, currentValue, setCurrentValue, currentLink}: ToggleIconProps) => {
  const theme = useTheme();
  const {saveLink} = useSaveLink();

  const [iconColor, setIconColor] = useState('');

  // if another icon is selected, then make sure to take away this icon's color
  useEffect(() => {
    if(currentValue !== item.value){
      setIconColor("")
    }
  },[currentValue, item.value])

  const handleClick = (value: string) => {
    setCurrentValue(value);
    setIconColor(`${item.color}.main`)

    const updatedLink = {
      ...currentLink,
      metadata: {
        ...currentLink.metadata,
        status: value as LinkStatus
      }
    }
    saveLink(updatedLink);

  }
  const handleMouseEnter = () => {
    // if icon is already in a selected state, don't give it the hover color
    if(iconColor.includes('main')){
      return;
    }
    setIconColor(`${item.color}.light`)
  }
  const handleMouseLeave= () => {
    //don't reset color if it's a selected color
    if(iconColor.includes('main')){
      return;
    }
    setIconColor('')
  }

  return(
    <IconButton
      key={item.value}
      onClick={() => handleClick(item.value)}
      onMouseEnter={() => handleMouseEnter()}
      onMouseLeave={() => handleMouseLeave()}
      sx={{
        width: '13.33px',
        height: '13.33px',
        "&.MuiButtonBase-root:hover": {
          bgcolor: theme.palette.transparent
        },
        color: iconColor,
      }}
    >
      {item.label}
    </IconButton>
  )
}

/**
 * props for the PerRowLinkStateSelector
 */
export interface PerRowLinkStateSelectorProps {
  sx?: SxProps<Theme>;
  items: {
    value: string;
    label: string | ReactElement;
    tooltip?: string;
    color: string;
  }[];
  currentLink: Link;
}

/**
 * Display a group of buttons, each with its own corresponding value
 * @param items list of buttons and their corresponding values (string or ReactElement)
 * @param sx style parameters
 */
export const PerRowLinkStateSelector = ({
  items,
  currentLink
}: PerRowLinkStateSelectorProps) => {
  const theme = useTheme();
  const [currentValue, setCurrentValue] = useState("");
  // remove the current state from the list of state icons to display
  const filteredItems = items.filter((item) => item.value !== currentLink.metadata.status)

  return (
    <Stack
      sx={{
        border: `solid 1px ${theme.palette.linkStateSelector.border}`,
        height: '24px',
        width: '88px',
        borderRadius: '32px',
        paddingX: '8px',
        paddingY: '4px',
        gap: '12px',
        marginLeft: '-10px',
        backgroundColor: theme.palette.linkStateSelector.backgroundColor,
        alignItems: 'center'
      }}
      direction={'row'}
    >

      {filteredItems.map((item, index) =>
        <ToggleIcon
          key={index}
          item={item}
          currentValue={currentValue}
          setCurrentValue={setCurrentValue}
          currentLink={currentLink}
        />

      )}
    </Stack>
  );
};
