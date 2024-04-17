import React from 'react';
import { AppContext } from '../../App';
import { Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from '@mui/material';
import { AlignmentEditor } from '../alignmentEditor/alignmentEditor';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { Close } from '@mui/icons-material';
import BCVWP from '../bcvwp/BCVWPSupport';
import { UserPreference } from 'state/preferences/tableManager';
import { LinksTable } from '../../state/links/tableManager';

interface WorkbenchDialogProps {
  alignment: BCVWP | null;
  setAlignment: React.Dispatch<React.SetStateAction<BCVWP | null>>;
  updateAlignments: (resetState: boolean) => void;
}

const WorkbenchDialog: React.FC<WorkbenchDialogProps> = ({ alignment, setAlignment, updateAlignments }) => {
  const { projectState, setPreferences } = React.useContext(AppContext);
  const initialUpdateTime = React.useMemo(() => (
    LinksTable.getLatestLastUpdateTime()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [alignment]);

  const handleClose = React.useCallback(() => {
    updateAlignments(initialUpdateTime !== LinksTable.getLatestLastUpdateTime());
    setAlignment(null);
  }, [initialUpdateTime, updateAlignments, setAlignment]);

  React.useEffect(() => {
    if (alignment) {
      setPreferences((p: UserPreference | undefined) => ({ ...(p ?? {}) as UserPreference, bcv: alignment }));
    }
  }, [projectState.userPreferenceTable, alignment, setPreferences]);

  return (
    <Dialog maxWidth="lg"
            open={!!alignment}
            fullWidth
            disableEscapeKeyDown={true}
    >
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
      <DialogContent sx={{ height: '100%', width: '100%' }}>
        <AlignmentEditor showNavigation={false} />
      </DialogContent>
    </Dialog>
  );
};

export default WorkbenchDialog;
