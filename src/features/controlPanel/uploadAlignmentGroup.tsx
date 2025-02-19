/**
 * This file contains the UploadAlignment component which contains buttons used
 * in the Projects Mode for uploading and saving alignment data
 */
import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CorpusContainer } from '../../structs';
import { AlignmentFile } from '../../structs/alignmentFile';
import { Button } from '@mui/material';
import uuid from 'uuid-random';
import {
  AlignmentFileCheckResults,
  checkAlignmentFile,
  saveAlignmentFile,
} from '../../helpers/alignmentFile';
import { AlignmentValidationErrorDialog } from '../../components/alignmentValidationErrorDialog';
import { RemovableTooltip } from '../../components/removableTooltip';
import {
  SyncProgress,
  useSyncProject,
} from '../../api/projects/useSyncProject';
import { Project } from '../../state/projects/tableManager';
import { BusyDialogContext } from '../../utils/useBusyDialogContext';
import { useGetAllLinks } from '../../state/links/useGetAllLinks';
import { wrapAsync } from '../../utils/wrapAsync';
import { useImportAlignmentFile } from '../../state/links/useImportAlignmentFile';

const UploadAlignmentGroup = ({
  project,
  containers,
  size,
  isCurrentProject,
  isSignedIn,
  disableProjectButtons,
}: {
  project?: Project;
  containers: CorpusContainer[];
  size?: string;
  isCurrentProject?: boolean;
  isSignedIn?: boolean;
  disableProjectButtons: boolean;
}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile;
    saveKey?: string;
    isFromServer: boolean;
  }>({ isFromServer: false });

  const { setForceShowBusyDialog, setCustomStatus } =
    useContext(BusyDialogContext);

  const [alignmentFileCheckResults, setAlignmentFileCheckResults] = useState<{
    checkResults?: AlignmentFileCheckResults;
    showDialog?: boolean;
  }>();

  const dismissDialog = useCallback(
    () => setAlignmentFileCheckResults({}),
    [setAlignmentFileCheckResults]
  );

  useImportAlignmentFile(
    project?.id,
    alignmentFileSaveState?.alignmentFile,
    alignmentFileSaveState?.saveKey,
    false,
    alignmentFileSaveState?.isFromServer,
    alignmentFileSaveState?.isFromServer,
    alignmentFileSaveState?.isFromServer,
    alignmentFileSaveState?.isFromServer
  );
  const { progress, dialog, syncedAlignments } = useSyncProject();
  const [getAllLinksKey, setGetAllLinksKey] = useState<string>();
  const { result: allLinks } = useGetAllLinks(project?.id, getAllLinksKey);

  useEffect(() => {
    saveAlignmentFile(allLinks);
  }, [allLinks]);

  useEffect(() => {
    if (!syncedAlignments) {
      return;
    }

    // clear errors, if any
    setAlignmentFileCheckResults({
      checkResults: undefined,
      showDialog: undefined,
    });

    // import/save file
    setAlignmentFileSaveState({
      alignmentFile: syncedAlignments,
      saveKey: uuid(),
      isFromServer: true,
    });
  }, [syncedAlignments, setAlignmentFileSaveState]);

  const inProgress = useMemo(
    () =>
      [
        SyncProgress.IN_PROGRESS,
        SyncProgress.SYNCING_LOCAL,
        SyncProgress.SWITCH_TO_PROJECT,
        SyncProgress.SYNCING_PROJECT,
        SyncProgress.SYNCING_CORPORA,
        SyncProgress.SYNCING_ALIGNMENTS,
      ].includes(progress),
    [progress]
  );

  return (
    <span
      style={{
        width: '100%',
        marginTop: '8px',
      }}
    >
      <RemovableTooltip
        removed={alignmentFileCheckResults?.showDialog || disableProjectButtons}
        title="Load Alignment Data"
        describeChild
        arrow
      >
        <span>
          <AlignmentValidationErrorDialog
            showDialog={alignmentFileCheckResults?.showDialog}
            checkResults={alignmentFileCheckResults?.checkResults}
            onDismissDialog={dismissDialog}
          />
          <input
            type="file"
            hidden
            ref={fileInputRef}
            multiple={false}
            onClick={(event) => {
              // this is a fix which allows loading a file of the same path and filename. Otherwise the onChange
              // event isn't thrown.

              // @ts-ignore
              event.currentTarget.value = null;
            }}
            onChange={wrapAsync(
              async () => {
                setForceShowBusyDialog(true);
                setCustomStatus('Importing alignment file...');
              },
              async (event: ChangeEvent<HTMLInputElement>) => {
                // grab file content
                const file = event!.target!.files![0];
                const checkResults = checkAlignmentFile(await file.text(), 20);

                setAlignmentFileCheckResults({
                  checkResults: checkResults,
                  showDialog: !checkResults.isFileValid,
                });

                setAlignmentFileSaveState({
                  alignmentFile: checkResults.isFileValid
                    ? checkResults.validatedFile
                    : undefined,
                  saveKey: uuid(),
                  isFromServer: false,
                });
              },
              async () => {
                setForceShowBusyDialog(false);
              }
            )}
          />
          <Button
            size={size as 'medium' | 'small' | undefined}
            disabled={
              containers.length === 0 || !isCurrentProject || inProgress
            }
            variant="contained"
            component="label"
            sx={{
              mr: '2px',
              borderRadius: 10,
              width: 'calc(50% - 2px)',
            }}
            onClick={() => {
              // delegate file loading to regular file input
              fileInputRef?.current?.click();
            }}
          >
            {'Import Data'}
          </Button>
        </span>
      </RemovableTooltip>

      <RemovableTooltip
        removed={alignmentFileCheckResults?.showDialog || disableProjectButtons}
        title="Save Alignment Data"
        describeChild
        arrow
      >
        <span>
          <Button
            size={size as 'medium' | 'small' | undefined}
            disabled={containers.length === 0 || inProgress}
            variant="contained"
            component="label"
            sx={{
              ml: '2px',
              borderRadius: 10,
              width: 'calc(50% - 2px)',
            }}
            onClick={() =>
              new Promise<undefined>((resolve) => {
                setTimeout(async () => {
                  setGetAllLinksKey(String(Date.now()));
                  resolve(undefined);
                }, 20);
              })
            }
          >
            {'Export Data'}
          </Button>
        </span>
      </RemovableTooltip>
      {dialog}
    </span>
  );
};

export default UploadAlignmentGroup;
