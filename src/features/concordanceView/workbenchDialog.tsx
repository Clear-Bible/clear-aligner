import React from 'react';
import { AppContext } from '../../App';
import { Dialog, DialogTitle, DialogContent, Grid, IconButton, Typography } from '@mui/material';
import { AlignmentEditor } from '../alignmentEditor/alignmentEditor';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { Close } from '@mui/icons-material';
import { Link } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';

interface WorkbenchDialogProps {
  alignment: BCVWP | null;
  setAlignment: React.Dispatch<React.SetStateAction<BCVWP | null>>;
  chosenAlignmentLink: Link | null;
}

const WorkbenchDialog: React.FC<WorkbenchDialogProps> = ({alignment, setAlignment, chosenAlignmentLink}) => {
  const appCtx = React.useContext(AppContext);

  const handleClose = React.useCallback(() => {
    setAlignment(null);
  }, [setAlignment]);

  React.useEffect(() => {
    if(alignment) {
      appCtx.setCurrentReference(alignment);
    }
  }, [appCtx, alignment]);

  return (
    <Dialog maxWidth="lg" open={!!alignment} onClose={handleClose}>
      <DialogTitle>
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            <BCVDisplay currentPosition={alignment} />
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{height: '100%', width: '100%'}}>
        <AlignmentEditor showNavigation={false} />
      </DialogContent>
    </Dialog>
  )
}

export default WorkbenchDialog;