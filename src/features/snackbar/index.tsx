/**
 * This file contains the CustomSnackbar Component
 */
import React, { useContext } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { IconButton, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AppContext } from '../../App';

type SnackBarObjectVariants = 'error';

export interface SnackBarObjectInterface {
  message: string,
  autoHide?: boolean
  variant?: SnackBarObjectVariants
}

/**
 * CustomSnackbar displays a temporary informational
 * toast, aka snackbar
 */
export const CustomSnackbar= () => {
  const {isSnackBarOpen, setIsSnackBarOpen, snackBarObject } = useContext(AppContext)
  const theme = useTheme();

  const isErrorVariant = snackBarObject.variant === 'error'

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
      ContentProps={{
        sx: {
          color: isErrorVariant ? theme.palette.snackbar.errorText : null,
          fontWeight: isErrorVariant ? 'bold' : null,
          backgroundColor: isErrorVariant ? theme.palette.background.paper : null
        }
      }}
    >

    </Snackbar>
  );
};


