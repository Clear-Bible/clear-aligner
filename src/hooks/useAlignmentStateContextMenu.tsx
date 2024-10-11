/**
 * This file contains the useAlignmentStateContextMenu hook used in the Alignment
 * Editor to allow users to change the link state by right-clicking on an alignment
 */
import { Box, Divider, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { Cancel, CheckCircle, CommentOutlined, Flag } from '@mui/icons-material';
import React from 'react';
import { Link } from '../structs';
import { useSaveLink } from '../state/links/tableManager';
import ListItemText from '@mui/material/ListItemText';

/**
 * useAlignmentStateContextMenu hook
 * allow users to change the link state by right-clicking on an alignment
 */
const useAlignmentStateContextMenu = (localAnchorEl: React.MutableRefObject<undefined>, link?: Link, openNoteEditor?: () => void ): any => {
  const [isLinkStateMenuOpen, setIsLinkStateMenuOpen] = React.useState(false);
  const [linkState ,setLinkState ] = React.useState("")
  const [localLink, setLocalLink] = React.useState<Link>();
  const [wordPartID, setWordPartID] = React.useState("");
  const theme = useTheme();
  const {saveLink} = useSaveLink();

  const handleRightClick = (wordPartID: string) => {
    setWordPartID(wordPartID);

    // if this is a valid link, open the menu
    if(link){
      setLinkState(link?.metadata.status);
      setLocalLink(link);
      setIsLinkStateMenuOpen(true);
    }
  }

  const handleClose = () => {
    setIsLinkStateMenuOpen(false);
  };

  // change the state of the alignment
  const handleMenuClick = React.useCallback((event: any, wordPartID: string) => {
    const { linkState } = event.currentTarget.dataset;

    // prepare an updated link to save
    const updatedLink = {
      ...localLink,
      metadata: {
        ...localLink?.metadata,
        status: linkState
      }
    }
    // save link
    saveLink(updatedLink as Link);

    handleClose()
  },[saveLink, localLink])

  const CheckIconStyle = {width: '18px', height: '20px', color: theme.palette.alignmentStateMenu.check};

  const ContextMenu = () => {
    return(
        <Menu
          id="link-state-menu"
          anchorEl={localAnchorEl.current}
          open={isLinkStateMenuOpen}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            onClick={(e) => {
              e.preventDefault();
              openNoteEditor?.();
              handleClose();
            }}>
            <ListItemIcon>
              <CommentOutlined/>
            </ListItemIcon>
            <ListItemText>
              <Typography
                sx={{fontSize: '13px'}}>Edit Note</Typography>
            </ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            data-link-state={'created'}
            onClick={(e) => handleMenuClick( e, wordPartID)}
          >
            <ListItemIcon >
              <LinkIcon sx={{
                color : theme.palette.primary.main
              }} />
            </ListItemIcon>
            <Box
              sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
            >
              <Typography
                sx={{fontSize: '13px'}}
              >
                Aligned
              </Typography>
              {linkState === 'created' && <CheckIcon sx={CheckIconStyle}/>}
            </Box>
          </MenuItem>
          <MenuItem
            data-link-state={'rejected'}
            onClick={(e) => handleMenuClick( e, wordPartID)}
          >
            <ListItemIcon >
              <Cancel sx={{
                color : theme.palette.error.main
              }} />
            </ListItemIcon>
            <Box
              sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
            >
              <Typography
                sx={{fontSize: '13px'}}
              >
                Rejected
              </Typography>
              {linkState === 'rejected' && <CheckIcon sx={CheckIconStyle}/>}
            </Box>
          </MenuItem>
          <MenuItem
            data-link-state={'approved'}
            onClick={(e) => handleMenuClick( e, wordPartID)}
          >
            <ListItemIcon>
              <CheckCircle sx={{
                color : theme.palette.success.main
              }}/>
            </ListItemIcon>
            <Box
              sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
            >
              <Typography
                sx={{fontSize: '13px'}}
              >
                Approved
              </Typography>
              {linkState === 'approved' && <CheckIcon sx={CheckIconStyle}/>}
            </Box>
          </MenuItem>
          <MenuItem
            data-link-state={'needsReview'}
            onClick={(e) => handleMenuClick( e, wordPartID)}
          >
            <ListItemIcon>
              <Flag sx={{
                color : theme.palette.warning.main
              }} />
            </ListItemIcon>
            <Box
              sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
            >
              <Typography
                sx={{fontSize: '13px'}}
              >
                Flagged
              </Typography>
              {linkState === 'needsReview' && <CheckIcon sx={CheckIconStyle}/>}
            </Box>
          </MenuItem>
        </Menu>
      )
  }
  return [ContextMenu, handleRightClick]
};

export default useAlignmentStateContextMenu;
