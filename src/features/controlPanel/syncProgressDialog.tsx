import { Box, Button, CircularProgress, Dialog, Stack } from '@mui/material';
import React from 'react';

export interface SyncProgressDialogProps {
  showDialog?: boolean;
  onCancel?: () => void;
}

/**
 * Display sync progress
 * @param showDialog whether the dialog is shown
 * @param onCancel callback for canceling a sync operation
 */
export const SyncProgressDialog = ({ showDialog, onCancel }: SyncProgressDialogProps) => {
  return ( <Dialog
      fullWidth
      scroll={'paper'}
      open={!!showDialog}
    >
      <Box padding={'2em'}>
        <Stack direction={'row'} height={'fit-content'} alignItems={'center'} spacing={'.8em'}>
          <CircularProgress sx={{
              marginTop: 'auto',
              marginBottom: 'auto',
              flexDirection: 'row'
            }} />
          <span>
            Alignment Sync in progress
          </span>
        </Stack>
        <Box
          textAlign={'right'}
        >
          <Button onClick={onCancel}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>);
}
