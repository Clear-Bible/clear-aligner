/**
 * This file contains the UploadAlignment component which contains buttons used
 * in the Projects Mode for uploading and saving alignment data
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CorpusContainer } from '../../structs';
import {
  AlignmentFile,
  AlignmentFileSchema,
  alignmentFileSchemaErrorMessageMapper
} from '../../structs/alignmentFile';
import { useGetAllLinks, useImportAlignmentFile } from '../../state/links/tableManager';
import { Button, ButtonGroup } from '@mui/material';
import { FileDownload, FileUpload, Sync } from '@mui/icons-material';
import uuid from 'uuid-random';
import saveAlignmentFile from '../../helpers/alignmentFile';
import { SafeParseReturnType, ZodError } from 'zod';
import { ZodErrorDialog } from '../../components/zodErrorDialog';
import { RemovableTooltip } from '../../components/removableTooltip';
import { SyncProgress, useSyncAlignments } from '../../state/links/useSyncAlignments';
import { SyncProgressDialog } from './syncProgressDialog';


const UploadAlignmentGroup = ({ projectId, containers, size, allowImport }: {
  projectId?: string,
  containers: CorpusContainer[],
  size?: string,
  allowImport?: boolean;
}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string
  }>();

  const [ alignmentFileErrors, setAlignmentFileErrors ] = useState<{
    errors?: ZodError<AlignmentFile>,
    showDialog?: boolean
  }>();

  const dismissDialog = useCallback(() => setAlignmentFileErrors({}), [setAlignmentFileErrors]);

  useImportAlignmentFile(projectId, alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);
  const [ syncLinksKey, setSyncLinksKey ] = useState<string|undefined>(undefined);
  const [ cancelSyncKey, setCancelSyncKey ] = useState<string|undefined>(undefined);
  const syncState = useSyncAlignments(projectId, syncLinksKey, cancelSyncKey);
  const [ getAllLinksKey, setGetAllLinksKey ] = useState<string>();
  const { result: allLinks } = useGetAllLinks(projectId, getAllLinksKey);
  useEffect(() => {
    saveAlignmentFile(allLinks);
  }, [allLinks]);
  useEffect(() => {
    if (!syncState.file) {
      return;
    }
    // clear errors, if any
    setAlignmentFileErrors({
      errors: undefined,
      showDialog: undefined
    });
    // import/save file
    setAlignmentFileSaveState({
      alignmentFile: syncState.file,
      saveKey: uuid()
    });
  }, [ syncState.file, setAlignmentFileSaveState ]);
  const showSyncProgressDialog = useMemo<boolean>(() => syncState.progress === SyncProgress.IN_PROGRESS, [ syncState.progress ]);

  return (
    <span>
      <RemovableTooltip
        removed={alignmentFileErrors?.showDialog}
        title="Sync Alignments"
        describeChild
        arrow>
        <span>
          <SyncProgressDialog
            showDialog={showSyncProgressDialog}
            onCancel={() => setCancelSyncKey(uuid())}
          />
          <Button
            size={size as 'medium' | 'small' | undefined}
            disabled={containers.length === 0 || !allowImport}
            variant="contained"
            sx={{
              minWidth: '100%',
              marginBottom: '.2em'
            }}
            onClick={() => {
              setSyncLinksKey(uuid());
            }} >
            <Sync />
          </Button>
        </span>
      </RemovableTooltip>
      <br/>
      <ButtonGroup>
        <RemovableTooltip
          removed={alignmentFileErrors?.showDialog}
          title="Load Alignment Data"
          describeChild
          arrow >
            <span>
              <ZodErrorDialog
                showDialog={alignmentFileErrors?.showDialog}
                fieldNameMapper={alignmentFileSchemaErrorMessageMapper}
                errors={alignmentFileErrors?.errors}
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
                onChange={async (event) => {
                  // grab file content
                  const file = event!.target!.files![0];
                  const content = await file.text();

                  const fileData = AlignmentFileSchema.safeParse(JSON.parse(content)) as SafeParseReturnType<AlignmentFile, AlignmentFile>;

                  setAlignmentFileErrors(fileData.success ? {} : {
                    errors: fileData.error,
                    showDialog: true
                  });

                  setAlignmentFileSaveState({
                    alignmentFile: fileData.success ? fileData.data : undefined,
                    saveKey: uuid()
                  });
                }}
              />
              <Button
                size={size as 'medium' | 'small' | undefined}
                disabled={containers.length === 0 || !allowImport}
                variant="contained"
                onClick={() => {
                  // delegate file loading to regular file input
                  fileInputRef?.current?.click();
                }}
              >
                <FileUpload />
              </Button>
            </span>
          </RemovableTooltip>

        <RemovableTooltip
          removed={alignmentFileErrors?.showDialog}
          title="Save Alignment Data"
          describeChild
          arrow>
            <span>
              <Button
                size={size as 'medium' | 'small' | undefined}
                disabled={containers.length === 0}
                variant="contained"
                onClick={() => new Promise<undefined>((resolve) => {
                  setTimeout(async () => {
                    setGetAllLinksKey(String(Date.now()));
                    resolve(undefined);
                  }, 20);
                })}
              >
                <FileDownload />
              </Button>
            </span>
        </RemovableTooltip>
      </ButtonGroup>
    </span>
  );
};

export default UploadAlignmentGroup;
