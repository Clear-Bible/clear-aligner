import React, { useEffect, useMemo, useState } from 'react';
import { Project } from '../../state/projects/tableManager';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ProjectSharingPermissions from './projectSharingPermissions';
import { useIsAdmin, useIsSignedIn } from '../../hooks/userInfoHooks';

/**
 * props for {@link useProjectSharingDialog}
 */
export interface UseProjectSharingDialogProps {
  project: Project;
  /**
   * whether the dialog is currently shown
   */
  open?: boolean;
  onSave?: (project: Project) => void;
  onCancel?: () => void;
}

/**
 * return values for {@link useProjectSharingDialog}
 */
export interface UseProjectSharingDialogReturn {
  dialog: JSX.Element;
}

/**
 * Constructs and manages a project sharing dialog
 */
const useProjectSharingDialog = ({
                                   project,
                                   open,
                                   onSave,
                                   onCancel
}: UseProjectSharingDialogProps): UseProjectSharingDialogReturn => {
  const isSignedIn = useIsSignedIn();
  const isAdmin = useIsAdmin({});

  const isFormDisabled = useMemo<boolean>(() => !isAdmin || !isSignedIn, [ isAdmin, isSignedIn ]);
  const [ projectMembers, setProjectMembers ] = useState(project.members ?? []);

  useEffect(() => {
    setProjectMembers(project.members ?? []);
  }, [ project.members, setProjectMembers, open ]);

  const dialog = useMemo<JSX.Element>(() => (
    <Dialog
      open={!!open}
      onClose={onCancel}>
      <DialogTitle>Sharing Permissions for {project.name}</DialogTitle>
      <DialogContent>
        <ProjectSharingPermissions
          sx={{
            width: 512,
            height: 360
          }}
          disabled={isFormDisabled}
          members={projectMembers}
          onMembersUpdated={setProjectMembers} />
      </DialogContent>
      <DialogActions>
        {isFormDisabled ?
          <Button
            onClick={() => onCancel?.()}>Close</Button>
        :
        <Button
          onClick={() => {
            onSave?.({
              ...project,
              members: projectMembers
            });
          }}>
          Done
        </Button>}
      </DialogActions>
    </Dialog>
  ), [open, onCancel, onSave, projectMembers, project, isFormDisabled]);

  return {
    dialog
  };
}

export default useProjectSharingDialog;
