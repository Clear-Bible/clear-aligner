import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';

const createPromise = () => {
  let resolver;
  return [
    new Promise((resolve) => {
      resolver = resolve;
    }),
    resolver,
  ];
};

/**
 * Custom hook used to present and unsaved changes dialog to users
 */
const useConfirm = (): [
  (text: React.SetStateAction<string>) => Promise<unknown>,
  () => React.JSX.Element
] => {
  const [open, setOpen] = useState(false);
  const [resolver, setResolver] = useState<any>({ resolver: null });
  const [label, setLabel] = useState('');

  const getConfirmation = useMemo(
    () => async (text: React.SetStateAction<string>) => {
      setLabel(text);
      setOpen(true);
      const [promise, resolve] = await createPromise();
      setResolver({ resolve });
      return promise;
    },
    []
  );

  const onClick = async (status: boolean) => {
    setOpen(false);
    resolver.resolve(status);
  };

  const Confirmation = () => (
    <Dialog open={open}>
      <DialogContent>{label}</DialogContent>
      <DialogActions>
        <Button onClick={() => onClick(true)} variant={'contained'}>
          {' '}
          Continue{' '}
        </Button>
        <Button onClick={() => onClick(false)} variant={'contained'}>
          Cancel{' '}
        </Button>
      </DialogActions>
    </Dialog>
  );
  return [getConfirmation, Confirmation];
};
export default useConfirm;
