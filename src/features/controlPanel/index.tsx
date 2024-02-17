import { ReactElement, useContext, useMemo, useRef, useState } from 'react';
import {
  Button,
  ButtonGroup,
  Tooltip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  AddLink,
  LinkOff,
  RestartAlt,
  SyncLock,
  FileDownload,
  FileUpload,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { resetTextSegments } from 'state/alignment.slice';
import { toggleScrollLock } from 'state/app.slice';
import { CorpusContainer, Link } from '../../structs';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { AppContext } from '../../App';
import { VirtualTableLinks } from '../../state/links/tableManager';
import _ from 'lodash';

interface ControlPanelProps {
  containers: CorpusContainer[];
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();

  const { projectState, setProjectState } = useContext(AppContext);

  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);

  const linkHasBothSides = useMemo(
    () => {
      return (
        Number(inProgressLink?.sources.length) > 0 &&
        Number(inProgressLink?.targets.length) > 0
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inProgressLink,
      inProgressLink?.sources.length,
      inProgressLink?.targets.length,
    ]
  );

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }
  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="baseline"
      style={{ marginTop: '16px', marginBottom: '16px' }}
    >
      <ToggleButtonGroup
        size="small"
        value={formats}
        sx={{
          display: 'unset',
        }}
        // For later.
        // onChange={(
        //   event: React.MouseEvent<HTMLElement>,
        //   newFormats: string[]
        // ) => {}}
      >
        <ToggleButton
          value="scroll-lock"
          sx={{
            height: '36px',
          }}
          onClick={() => {
            if (formats.includes('scroll-lock')) {
              setFormats(formats.filter((item) => item !== 'scroll-lock'));
            } else {
              setFormats(formats.concat(['scroll-lock']));
            }

            dispatch(toggleScrollLock());
          }}
        >
          <SyncLock />
        </ToggleButton>
      </ToggleButtonGroup>

      <ButtonGroup>
        <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!linkHasBothSides}
              onClick={() => {
                if (!projectState.linksTable || !inProgressLink) {
                  return;
                }
                projectState.linksTable.save(inProgressLink);
                dispatch(resetTextSegments());
              }}
            >
              <AddLink />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Delete Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!inProgressLink?.id}
              onClick={() => {
                if (!projectState.linksTable || !inProgressLink) {
                  return;
                }
                if (inProgressLink?.id) {
                  const linksTable = projectState.linksTable;
                  linksTable.remove(inProgressLink.id);
                  dispatch(resetTextSegments());
                }
              }}
            >
              <LinkOff />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Reset" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!anySegmentsSelected}
              onClick={() => {
                dispatch(resetTextSegments());
              }}
            >
              <RestartAlt />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

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
                const linksTable: VirtualTableLinks = new VirtualTableLinks();

                setProjectState({
                  ...projectState,
                  linksTable,
                });

                // convert into an appropriate object
                console.time('Loaded from file');
                const alignmentFile = JSON.parse(content) as AlignmentFile;
                console.timeEnd('Loaded from file');

                // override the alignments from alignment file
                let idx = 0;
                const chunks = _.chunk(alignmentFile.records, 10_000);
                console.time('Processed chunk');
                for (let chunk of chunks) {
                  const links = chunk.map((record) => {
                    const link: Link = {
                      id: record.id ?? `record-${idx}`,
                      sources: record.source,
                      targets: record.target,
                    };
                    ++idx;
                    return link;
                  });
                  try {
                    linksTable.saveAll(links, true);
                  } catch (e) {
                    console.error('e', e);
                  }
                  console.timeLog('Processed chunk', idx);
                }
                console.timeEnd('Processed chunk');
                linksTable.onUpdate(); // modify variable to indicate that an update has occurred
              }}
            />
            <Button
              disabled={props.containers.length === 0}
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
              disabled={props.containers.length === 0}
              variant="contained"
              onClick={() => {
                // create starting instance
                const alignmentExport: AlignmentFile = {
                  type: 'translation',
                  meta: {
                    creator: 'ClearAligner',
                  },
                  records: [],
                };

                if (!projectState.linksTable) {
                  return;
                }

                projectState.linksTable
                  .getAll()
                  .map(
                    (link) =>
                      ({
                        id: link.id,
                        source: link.sources,
                        target: link.targets,
                      } as AlignmentRecord)
                  )
                  .forEach((record) => alignmentExport.records.push(record));

                // Create alignment file content
                const fileContent = JSON.stringify(
                  alignmentExport,
                  undefined,
                  2
                );

                // Create a Blob from the data
                const blob = new Blob([fileContent], {
                  type: 'application/json',
                });

                // Create a URL for the Blob
                const url = URL.createObjectURL(blob);

                // Create a link element
                const link = document.createElement('a');
                const currentDate = new Date();

                // Set the download attribute and file name
                link.download = `alignment_data_${currentDate.getFullYear()}-${String(
                  currentDate.getMonth() + 1
                ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(
                  2,
                  '0'
                )}T${String(currentDate.getHours()).padStart(2, '0')}_${String(
                  currentDate.getMinutes()
                ).padStart(2, '0')}.json`;

                // Set the href attribute to the generated URL
                link.href = url;

                // Append the link to the document
                document.body.appendChild(link);

                // Trigger a click event on the link
                link.click();

                // Remove the link from the document
                document.body.removeChild(link);

                // Revoke the URL to free up resources
                URL.revokeObjectURL(url);
              }}
            >
              <FileDownload />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
    </Stack>
  );
};

export default ControlPanel;
