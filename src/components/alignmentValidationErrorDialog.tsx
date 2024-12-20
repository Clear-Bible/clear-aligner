import { Box, Button, Dialog } from '@mui/material';
import { AlignmentValidationErrorDisplay } from './alignmentValidationErrorDisplay';
import React from 'react';
import { AlignmentFileCheckResults } from '../helpers/alignmentFile';

export interface AlignmentErrorDialogProps {
  showDialog?: boolean;
  checkResults?: AlignmentFileCheckResults;
  onDismissDialog?: () => void;
}

/**
 * Dialog component for displaying alignment link validation errors.
 * @param showDialog whether dialog should be displayed
 * @param fieldNameMapper custom field error message mapper to use (optional)
 * @param onDismissDialog callback for the keys/buttons to dismiss the dialog
 * @param checkResults alignment check results, including errors
 */
export const AlignmentValidationErrorDialog = ({
  showDialog,
  onDismissDialog,
  checkResults,
}: AlignmentErrorDialogProps) => {
  return (
    <Dialog
      fullWidth
      scroll={'paper'}
      open={!!showDialog}
      onClose={onDismissDialog}
      title={'Validation Error'}
    >
      <Box padding={'2em'}>
        Errors validating alignment file:
        <AlignmentValidationErrorDisplay checkResults={checkResults} />
        <Box textAlign={'right'}>
          <Button onClick={onDismissDialog}>Close</Button>
        </Box>
      </Box>
    </Dialog>
  );
};
