/**
 * This file contains the useBusyDialog component that can be shown to users
 * while wait for an action in the background to complete.
 */
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid, IconButton,
  Typography
} from '@mui/material';
import { useInterval } from 'usehooks-ts';
import { DatabaseStatus } from '../state/databaseManagement';
import _ from 'lodash';
import { AppContext } from '../App';
import { LinksTable } from '../state/links/tableManager';
import { isLoadingAnyCorpora } from '../workbench/query';
import { Close } from '@mui/icons-material';

const BusyRefreshTimeInMs = 500;
const DefaultBusyMessage = 'Please wait...';

const useBusyDialog = (customStatus?: string, onCancel?: CallableFunction) => {
  const { projectState } = useContext(AppContext);
  const [cancel, setCancel] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<{
    projects: DatabaseStatus,
    links: DatabaseStatus
  }>();
  const [numProjects, setNumProjects] = useState<number>();
  const [isLoadingCorpora, setIsLoadingCorpora] = useState<boolean>();
  useInterval(() => {
    const newLinkStatus = LinksTable.getLatestDatabaseStatus();
    const newProjectStatus = projectState?.projectTable.getDatabaseStatus();
    if (!_.isEqual({ projects: newProjectStatus, links: newLinkStatus }, databaseStatus)) {
      setDatabaseStatus({
        projects: newProjectStatus,
        links: newLinkStatus
      });
    }
    projectState?.projectTable?.getProjects(false)
      .then(newProjects => {
        if (newProjects?.size !== numProjects) {
          setNumProjects(newProjects?.size);
        }
      });
    const newIsLoadingCorpora = isLoadingAnyCorpora();
    if (newIsLoadingCorpora !== isLoadingCorpora) {
      setIsLoadingCorpora(newIsLoadingCorpora);
    }
  }, BusyRefreshTimeInMs);
  const spinnerParams = useMemo<{
    isBusy?: boolean,
    text?: string,
    variant?: 'determinate' | 'indeterminate',
    value?: number,
    isCancelled?: boolean
  }>(() => {
    const busyInfo =
      [databaseStatus?.links, databaseStatus?.projects]
        .filter(Boolean)
        .map(itemStatus => itemStatus?.busyInfo)
        .filter(Boolean)
        .find(busyInfo => busyInfo?.isBusy);
    if (busyInfo?.isBusy) {
      const progressCtr = busyInfo?.progressCtr ?? 0;
      const progressMax = busyInfo?.progressMax ?? 0;
      if (progressMax > 0
        && progressMax >= progressCtr) {
        const percentProgress = Math.round((progressCtr / progressMax) * 100.0);
        return {
          isBusy: true,
          text: busyInfo?.userText ?? DefaultBusyMessage,
          variant: percentProgress < 100 ? 'determinate' : 'indeterminate',
          value: percentProgress < 100 ? percentProgress : undefined
        };
      } else {
        return {
          isBusy: true,
          text: busyInfo?.userText ?? DefaultBusyMessage,
          variant: 'indeterminate',
          value: undefined
        };
      }
    }
    if (isLoadingCorpora
      || !numProjects) {
      return {
        isBusy: true,
        text: isLoadingCorpora
          ? 'Loading project & corpora...'
          : 'Starting up...',
        variant: 'indeterminate',
        value: undefined
      };
    }
    if (customStatus) {
      return {
        isBusy: true,
        text: customStatus,
        variant: 'indeterminate',
        value: undefined
      };
    }
    return {
      isBusy: false,
      text: undefined,
      variant: 'indeterminate',
      value: undefined
    };
  }, [databaseStatus, isLoadingCorpora, numProjects, customStatus]);

  useEffect(() => {
    setCancel(false);
  }, [customStatus]);

  return (
    <Dialog
      open={!!spinnerParams.isBusy && !cancel}
      fullWidth={true}
      sx={{
        '.MuiPaper-root': {
          minHeight: '120px'
        }
      }}
    >
      <DialogTitle>
        <Grid container justifyContent="flex-end" alignItems="center">
          {
            !!onCancel && (
              <IconButton onClick={() => {
                setCancel(true);
                onCancel();
              }} sx={{m: 0}}>
                <Close sx={{height: 18, width: 'auto'}} />
              </IconButton>
            )
          }
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          display: 'flex',
          margin: 'auto',
          position: 'relative'
        }}>
          <CircularProgress sx={{ margin: 'auto' }}
                            variant={spinnerParams.variant ?? 'indeterminate'}
                            value={spinnerParams.value} />
          {!!spinnerParams.value && <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
            <Typography variant="caption">{`${spinnerParams.value}%`}</Typography>
          </Box>}
        </Box>
        <DialogContentText>
          {spinnerParams.text}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default useBusyDialog;
