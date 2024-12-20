/**
 * This file contains the WorkBenchDialog which is a Modal/Dialog that wraps the
 * AlignmentEditor component for usage inside ConcordanceView
 */
import React from 'react';
import { AppContext } from '../../App';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { AlignmentEditor } from '../alignmentEditor/alignmentEditor';
import { Close } from '@mui/icons-material';
import BCVWP from '../bcvwp/BCVWPSupport';
import { UserPreference } from 'state/preferences/tableManager';
import { LinksTable } from '../../state/links/tableManager';

interface WorkbenchDialogProps {
  alignment: BCVWP | null;
  setAlignment: React.Dispatch<React.SetStateAction<BCVWP | null>>;
  updateAlignments: (resetState: boolean) => void;
}

const WorkbenchDialog: React.FC<WorkbenchDialogProps> = ({
  alignment,
  setAlignment,
  updateAlignments,
}) => {
  const { projectState, setPreferences } = React.useContext(AppContext);
  const initialUpdateTime = React.useMemo(
    () =>
      LinksTable.getLatestLastUpdateTime(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    [alignment]
  );

  const handleClose = React.useCallback(() => {
    updateAlignments(
      initialUpdateTime !== LinksTable.getLatestLastUpdateTime()
    );
    setAlignment(null);
  }, [initialUpdateTime, updateAlignments, setAlignment]);

  React.useEffect(() => {
    if (alignment) {
      setPreferences((p: UserPreference | undefined) => ({
        ...((p ?? {}) as UserPreference),
        bcv: alignment,
      }));
    }
  }, [projectState.userPreferenceTable, alignment, setPreferences]);

  return (
    <Dialog
      maxWidth="lg"
      open={!!alignment}
      fullWidth
      disableEscapeKeyDown={true}
    >
      <DialogContent
        sx={{
          height: '80vh',
          width: '100%',
          pb: 0,
          pt: 1,
        }}
      >
        <AlignmentEditor
          showNavigation={false}
          showProfileAvatar={false}
          usePaddingForEditorContainer={false}
          useZeroYPaddingForToolbar={true}
          actions={{
            onClose: (
              <IconButton onClick={handleClose} sx={{ zIndex: 20 }}>
                <Close />
              </IconButton>
            ),
          }}
          styles={{
            contextPanel: {
              height: '15rem',
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WorkbenchDialog;
