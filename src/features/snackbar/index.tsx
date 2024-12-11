/**
 * This file contains the CustomSnackbar Component
 */
import React, { useContext } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AppContext } from '../../App';

export interface SnackBarObjectInterface {
  message: string,
  autoHide?: boolean
}

/**
 * CustomSnackbar displays a temporary informational
 * toast, aka snackbar
 */
export const CustomSnackbar= () => {

  const {isSnackBarOpen, setIsSnackBarOpen, snackBarObject } = useContext(AppContext)

  const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsSnackBarOpen(false);
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnackbar}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <Snackbar
      open={isSnackBarOpen}
      autoHideDuration={snackBarObject.autoHide ? 3500: null}
      onClose={handleCloseSnackbar}
      message={snackBarObject.message}
      action={action}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
    />
  );
};


