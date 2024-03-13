import React, { useRef, useState } from 'react';
import { CorpusContainer } from '../../structs';
import { AlignmentFile } from '../../structs/alignmentFile';
import { useSaveAlignmentFile } from '../../state/links/tableManager';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import { FileDownload, FileUpload } from '@mui/icons-material';
import uuid from 'uuid-random';


const UploadAlignmentGroup = ({ projectId, containers, size, allowImport, setGetAllLinksKey }: {
  projectId: string,
  containers: CorpusContainer[],
  size?: string,
  allowImport?: boolean;
  setGetAllLinksKey: CallableFunction
}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string
  }>();
  useSaveAlignmentFile(projectId, alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);

  return (
    <ButtonGroup>
      <Tooltip title="Load Alignment Data" arrow describeChild>
          <span>
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

                setAlignmentFileSaveState({
                  alignmentFile: JSON.parse(content) as AlignmentFile,
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
      </Tooltip>

      <Tooltip title="Save Alignment Data" arrow describeChild>
          <span>
            <Button
              size={size as 'medium' | 'small' | undefined}
              disabled={containers.length === 0}
              variant="contained"
              onClick={() => setGetAllLinksKey()}
            >
              <FileDownload />
            </Button>
          </span>
      </Tooltip>
    </ButtonGroup>
  );
};

export default UploadAlignmentGroup;
