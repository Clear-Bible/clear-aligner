/**
 * This file contains the ConcordanceView component which is one of the top level
 * modes of the CA application
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RepositoryLink, LinkStatus } from '../../structs';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl, Grid,
  Icon,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Toolbar, Tooltip,
  Typography, useTheme
} from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridInputRowSelectionModel, GridSortItem } from '@mui/x-data-grid';
import { Blocker, Location, useBlocker, useSearchParams } from 'react-router-dom';
import { usePivotWords } from './usePivotWords';
import { resetTextSegments } from '../../state/alignment.slice';
import { useAppDispatch } from '../../app';
import {
  CropFree,
  GpsFixed,
  InsertLink
} from '@mui/icons-material';
import { useSaveLink } from '../../state/links/tableManager';
import useConfirm from '../../hooks/useConfirm';
import { AlignmentSide } from '../../common/data/project/corpus';
import { SingleSelectStateButtonGroup } from '../../components/singleSelectStateButtonGroup';
import AppBar from '@mui/material/AppBar';
import { ProfileAvatar } from '../profileAvatar/profileAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useDatabase } from '../../hooks/useDatabase';
import { AppContext } from '../../App';

/**
 * PivotWordFilter type
 */
export type PivotWordFilter = 'aligned' | 'all';

interface SaveChangesConfirmationViaRouterProps{
  blocker: Blocker;
}

// Unsaved Changes Confirmation Modal triggered by Navigation Change
const SaveChangesConfirmationViaRouter = ({blocker}: SaveChangesConfirmationViaRouterProps) => {
  if (!blocker){
    return
  }
  if(blocker.proceed && blocker.reset) {
    return (
      <Dialog open={blocker.state === 'blocked'}>
        <DialogContent>
          Changes will be lost if you navigate away. Continue?
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => blocker.proceed()} variant={"contained"}>Continue </Button>
          <Button onClick={ () => blocker.reset()} variant={"contained"}>Cancel </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

/**
 * Props for the AlignmentTableControlPanel
 */
export interface AlignmentTableControlPanelProps {
  saveButtonDisabled?: boolean;
  setSaveButtonDisabled: Function;
  setSelectedRowsCount: Function;
  selectedRowsCount: number;
  linksPendingUpdate: Map<string, RepositoryLink>;
  setSelectedRows: Function;
  selectedRows: RepositoryLink[];
  setUpdatedSelectedRows: Function;
  updatedSelectedRows: RepositoryLink[];
  setLinksPendingUpdate: Function;
  setRowSelectionModel: Function;
  alignmentTableControlPanelLinkState: LinkStatus | null;
  setAlignmentTableControlPanelLinkState: Function;
}
/**
 * The AlignmentControl Panel contains custom controls used to edit the alignments
 * @param saveButtonDisabled flag to control the state of the Save Button
 * @param setSaveButtonDisabled callback to control the state of the Save Button
 * @param selectedRowsCount number of currently selected rows (via their checkbox)
 * @param linksPendingUpdate Map of alignment links that the user has updated in the UI, but not yet saved
 * @param setSelectedRows callback to update which rows are currently selected
 * @param setSelectedRowsCount callback to update the count of currently selected rows
 * @param selectedRows array of what rows are currently selected
 * @param setUpdatedSelectedRows callback to update the updated list of selected rows
 * @param updatedSelectedRows array the updated list of selected rows
 * @param setLinksPendingUpdate callback to update the Map of links pending update
 * @param setRowSelectionModel callback to update the rowSelectionModel property of the DataGrid
 * @param alignmentTableControlPanelLinkState the global state set in the upper right button group
 * @param setAlignmentTableControlPanelLinkState callback to update the global state set in the upper right button group
 */
export const AlignmentTableControlPanel = ({
                                             saveButtonDisabled,
                                             setSaveButtonDisabled,
                                             selectedRowsCount,
                                             linksPendingUpdate,
                                             setSelectedRows,
                                             setSelectedRowsCount,
                                             selectedRows,
                                             setUpdatedSelectedRows,
                                             updatedSelectedRows,
                                             setLinksPendingUpdate,
                                             setRowSelectionModel,
                                             alignmentTableControlPanelLinkState,
                                             setAlignmentTableControlPanelLinkState
                                           }: AlignmentTableControlPanelProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isButtonGroupDisabled, setIsButtonGroupDisabled ] = React.useState(true);

  const {saveLink} = useSaveLink();

  const handleClose = () => {
    setIsDialogOpen(false)
  }

  // control if the button group is enabled
  useEffect( () => {
    if(selectedRowsCount > 0) {
      setIsButtonGroupDisabled(false)
    }
    else if(selectedRowsCount === 0){
      setIsButtonGroupDisabled(true)
    }
  }, [selectedRowsCount])

  // iterate through all selectedRows and update linksPendingUpdate
  useEffect( () => {
    updatedSelectedRows?.forEach((row) => {
      setLinksPendingUpdate(linksPendingUpdate.set(row.id || "", row))
    })

  },[updatedSelectedRows, linksPendingUpdate, setLinksPendingUpdate])

  const handleSaveLinkStatus = () => {
    setIsDialogOpen(true);
  };

  // fires when user picks a new state from the control panel
  const handleOnSelect = (value: string) => {
    setAlignmentTableControlPanelLinkState(value);
    setSaveButtonDisabled(false)

    // update the state of all the currently selected rows in bulk
    setUpdatedSelectedRows(selectedRows?.map((row) => (
      {
        ...row,
        metadata: {
          ...row.metadata,
          status: value as LinkStatus,
        }
      })))
  }

  // Take the map, transform it to an array, then pass it to the save function
  const handleSave = async () => {
    const linksToSave = [...linksPendingUpdate.values()];
    saveLink(linksToSave);
    // reset things back to empty and 0
    setRowSelectionModel([])
    setSelectedRows([]);
    setUpdatedSelectedRows([]);
    setSelectedRowsCount(0);
    setSaveButtonDisabled(true);
    setLinksPendingUpdate(new Map());
    setAlignmentTableControlPanelLinkState("");
    handleClose();
  }

  const DisplayItemsSelectedCount = () => {
    if (selectedRowsCount === 0) {
      return null;
    } else if (selectedRowsCount === 1) {
      return (
        <Typography component="span" alignSelf={'center'} fontSize={13}>
          <Box sx={{ fontWeight: 'bold' }} display="inline"> {selectedRowsCount} item</Box> selected
        </Typography>
      );
    } else {
      return (
        <Typography component="span" alignSelf={'center'} fontSize={13}>
          <Box sx={{ fontWeight: 'bold' }} display="inline"> {selectedRowsCount} items</Box> selected
        </Typography>
      );
    }
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="start"
        alignItems="center"
      >
        <Stack
          justifyContent="left"
          style={{ marginBottom: '10px' }}
          direction="row"
        >
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="right"
          marginLeft={'63px'}
        >
          <ButtonGroup>
            <SingleSelectStateButtonGroup
              value={alignmentTableControlPanelLinkState || undefined}
              onSelect={(value) => handleOnSelect(value)}
              disabled={isButtonGroupDisabled}
            />
          </ButtonGroup>
          <DisplayItemsSelectedCount />
          <ButtonGroup>
            <Button
              variant="contained"
              sx={{
                textTransform: 'none',
                borderRadius: '22px',
            }}
              disabled={saveButtonDisabled}
              onClick={handleSaveLinkStatus}
            >
              SAVE
            </Button>
          </ButtonGroup>
        </Stack>
        <Dialog maxWidth="lg"
                open={isDialogOpen}
                disableEscapeKeyDown={true}
        >
          <Box padding={5}>
            <DialogContent sx={{ height: '100%', width: '100%' }}>
              Save {linksPendingUpdate.size} {linksPendingUpdate.size === 1 ? `change` : `changes`}?
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSave} variant={"contained"}>Yes</Button>
              <Button onClick={handleClose} variant={"contained"}>No</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Stack>
    </>
  );
};

/**
 * The Concordance View contains three main tables: PivotWordTable, AlignedWordTable,
 * and the AlignmentTable
 */
export const ConcordanceView = () => {
  const theme = useTheme();
  useContext(LayoutContext);
  const {preferences} = useContext(AppContext);
  const dispatch = useAppDispatch();
  const [selectedRowsCount, setSelectedRowsCount] = React.useState(0);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [saveButtonDisabled, setSaveButtonDisabled] = React.useState(true);
  const [rowSelectionModel, setRowSelectionModel ] = React.useState<GridInputRowSelectionModel>([]);
  const [alignmentTableControlPanelLinkState, setAlignmentTableControlPanelLinkState] = React.useState<LinkStatus>();
  /**
   * pivot words
   */
  const [wordSource, setWordSource] = useState(AlignmentSide.SOURCE);
  const [wordFilter, setWordFilter] = useState('all' as PivotWordFilter);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const [lemmaToggled, setLemmaToggled] = useState(true);
  const [linksPendingUpdate, setLinksPendingUpdate] = useState<Map<string, RepositoryLink>>(new Map());
  const [updatedSelectedRows, setUpdatedSelectedRows] = useState<RepositoryLink[]>([])
  const { pivotWords } = usePivotWords(wordSource, wordFilter, pivotWordSortData, lemmaToggled);

  useMemo(() => !!pivotWords, [pivotWords]);
  const [selectedPivotWord, setSelectedPivotWord] = useState<
    PivotWord | undefined
  >();
  const [alignedWordSortData, setAlignedWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const [selectedAlignedWord, setSelectedAlignedWord] = useState(
    null as AlignedWord | null
  );
  const [selectedAlignmentLink, setSelectedAlignmentLink] = useState(
    null as RepositoryLink | null
  );

  const [ getSaveChangesConfirmation, SaveChangesConfirmation ] = useConfirm();

  const pivotWordTableColumns = 2.2;
  const alignedWordTableColumns = 3.5;
  const alignmentLinkTableColumns = 6.3;

  const handleUpdateSelectedAlignedWord = useCallback(async (alignedWord: AlignedWord | null) => {
      if (linksPendingUpdate.size > 0 && alignedWord !== null ) {
        // open modal asking if users want to continue or not
        const status = await getSaveChangesConfirmation('Changes will be lost if you navigate away. Continue?');
        // if user clicks cancel: early return, otherwise proceed
        if (status === false) {
          return;
        }
      }
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
      setSaveButtonDisabled(true);
      setUpdatedSelectedRows([]);
      setLinksPendingUpdate(new Map());
      setAlignmentTableControlPanelLinkState("" as LinkStatus);
    },
    [getSaveChangesConfirmation, linksPendingUpdate]
  );


  const handleUpdateSelectedPivotWord = useCallback( async (pivotWord: PivotWord | null) => {
    if (linksPendingUpdate.size > 0) {
        // show a modal in here asking if users want to continue or not
        const status = await getSaveChangesConfirmation('Changes will be lost if you navigate away. Continue?');
        // if user clicks cancel: early return, otherwise proceed
        if (status === false) {
          return;
        }
      }
      setSelectedPivotWord(pivotWord ?? undefined);
      setSaveButtonDisabled(true);
      setUpdatedSelectedRows([]);
      setLinksPendingUpdate(new Map());
      setAlignmentTableControlPanelLinkState("" as LinkStatus);
      await handleUpdateSelectedAlignedWord(null);
    },
    [handleUpdateSelectedAlignedWord, linksPendingUpdate, getSaveChangesConfirmation ]
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!pivotWords || pivotWords.length < 1) {
      return;
    }
    if (searchParams.has('pivotWord')) {
      const pivotWordId = searchParams.get('pivotWord')!;
      const pivotWord = pivotWords.find(
        (pivotWord) => pivotWord.word === pivotWordId
      );

      if (pivotWord) {
        handleUpdateSelectedPivotWord(pivotWord);
      }
      searchParams.delete('pivotWord');
    } else if (searchParams.has('alignedWord') && (selectedPivotWord)) {
      searchParams.delete('alignedWord');
    } else if (
      searchParams.has('alignmentLink') &&
      (selectedAlignedWord)
    ) {
      searchParams.delete('alignmentLink');
    }
    setSearchParams(searchParams);
  }, [
    pivotWords,
    searchParams,
    setSearchParams,
    handleUpdateSelectedPivotWord,
    selectedPivotWord,
    setSelectedAlignedWord,
    selectedAlignedWord,
    setSelectedAlignmentLink,
    selectedAlignmentLink
  ]);

  const dbApi = useDatabase();

  const [allowLemmaToggle, setAllowLemmaToggle] = React.useState(false);
   React.useEffect(() => {
    if(preferences?.currentProject) {
      dbApi.getDataSourceLemmaCount(preferences.currentProject).then(lc => {
        setAllowLemmaToggle(!!lc);
      }).catch(console.error);
    }
  }, [preferences]);
  console.log("allowLemmaToggle: ", allowLemmaToggle)

  // block route changes when there are unsaved changes
  const blocker = useBlocker(
    ({currentLocation, nextLocation}: {currentLocation: Location,
      nextLocation: Location}) =>
        (linksPendingUpdate.size > 0) &&
        (currentLocation.pathname !== nextLocation.pathname)
  )

  return (
    <>
      {/*App Bar*/}
      <Box>
        <AppBar
          position="static"
        >
          <Toolbar >
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center'}}>
              {/**
               * Grid Container for the three heading areas for the three tables
               */}
              <Grid
                container
              >
                {/**
                 * Pivot Words Table Heading Area
                 */}
                <Grid item xs={pivotWordTableColumns}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexFlow: 'row',
                      flexGrow: '0',
                      flexShrink: '1',
                      gridColumn: '1',
                      gap: '0',
                      marginTop: '0',
                    }}>
                    <Box>
                      <SingleSelectButtonGroup
                        sx={{ flexGrow: 1 }}
                        value={wordSource}
                        items={[
                          {
                            value: 'sources',
                            label: <CropFree />,
                            tooltip: 'Source'
                          },
                          {
                            value: 'targets',
                            label: <GpsFixed />,
                            tooltip: 'Target'
                          }
                        ]}
                        onSelect={(value) => {
                          const alignmentSide = value as AlignmentSide;
                          if(alignmentSide === AlignmentSide.TARGET && lemmaToggled) {
                            setLemmaToggled(false);
                          }
                          setWordSource(alignmentSide)
                        }}
                      />
                    </Box>
                    <Tooltip title="Group by Lemma">
                      <Button
                        onClick={() => setLemmaToggled(lt => !lt)}
                        variant={lemmaToggled ? 'contained' : 'outlined'}
                        disabled={wordSource === AlignmentSide.TARGET}
                        sx={{minWidth: 0, width: 42, height: 37, ml: '6px'}}
                      >
                        <Box component="span" sx={{fontSize: 25, fontWeight: 500, textTransform: 'none' }}>
                          λ
                        </Box>
                      </Button>
                    </Tooltip>
                    {/*Pivot Word Filter*/}
                    <FormControl sx={{ marginLeft: '6px', display: 'inline' }}>
                      <InputLabel id={'pivot-word-filter'}>Pivot Word Filter</InputLabel>
                      <Select
                        labelId={'pivot-word-filter'}
                        id={'pivot-word-filter'}
                        value={wordFilter}
                        label={'Pivot Word Filter'}
                        onChange={({ target: { value } }) =>
                          setWordFilter(value as PivotWordFilter)
                        }
                        sx={{height: 37, width: '154px'}}
                      >
                          <MenuItem value={'aligned' as PivotWordFilter}>
                            <Box display={'flex'}>
                              <ListItemIcon sx={{minWidth: '36px', alignItems: 'center'}}>
                                <InsertLink color={"primary"}/>
                              </ListItemIcon>
                              <ListItemText primary="Aligned"/>
                            </Box>
                          </MenuItem>
                          <MenuItem value={'all' as PivotWordFilter}>
                            <Box display={'flex'}>
                              <ListItemIcon sx={{minWidth: '36px', alignItems: 'center'}}>
                                <Icon/>
                            </ListItemIcon>
                            <ListItemText primary="All"/>
                            </Box>
                          </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                {/**
                 * Aligned Words Table Heading Area
                 */}
                <Grid item xs={alignedWordTableColumns} >
                  <Box
                    sx={{
                      display: 'flex',
                      flexFlow: 'column',
                      flexShrink: '1',
                      gridColumn: '1',
                      gap: '0',
                      marginLeft: '1em',
                      marginTop: '0',
                    }}
                  >
                    {/*Empty Box above Aligned Words for Spacing*/}
                  </Box>
                </Grid>

                {/**
                 * Alignment Links Table Heading Area
                 */}
                <Grid item xs={alignmentLinkTableColumns} >
                  {/*Alignment Table Control Panel*/}
                  <Box
                    sx={{
                      display: 'flex',
                      flexFlow: 'column',
                      flexShrink: '1',
                      gridColumn: '1',
                      gap: '1em',
                      margin: '',
                      marginTop: '0',
                      justifyContent: 'start',
                    }}
                  >
                    <AlignmentTableControlPanel
                      saveButtonDisabled={saveButtonDisabled}
                      setSelectedRowsCount={setSelectedRowsCount}
                      selectedRowsCount={selectedRowsCount}
                      linksPendingUpdate={linksPendingUpdate}
                      setSaveButtonDisabled={setSaveButtonDisabled}
                      setSelectedRows={setSelectedRows}
                      selectedRows={selectedRows}
                      setLinksPendingUpdate={setLinksPendingUpdate}
                      updatedSelectedRows={updatedSelectedRows}
                      setUpdatedSelectedRows={setUpdatedSelectedRows}
                      setRowSelectionModel={setRowSelectionModel}
                      alignmentTableControlPanelLinkState={alignmentTableControlPanelLinkState || null}
                      setAlignmentTableControlPanelLinkState={setAlignmentTableControlPanelLinkState}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <ProfileAvatar/>
          </Toolbar>
        </AppBar>
      </Box>
      <div style={{
        position: 'relative',
        display: 'flex',
      }}>

        {/**
         * Grid Container for the three tables
         */}
        <Grid
          container
          spacing={theme.spacing(.5)}
          marginLeft={'8px'}
          marginRight={'12px'}
        >
          {/**
           * Pivot Words Table
           */}
          <Grid item xs={pivotWordTableColumns}>
              <Paper
                sx={(theme) => ({
                  display: 'flex',
                  width: '100%',
                  height: 'calc(100vh - 4.2em)',
                  backgroundColor: theme.palette.primary.contrastText,
                  backgroundImage: 'none',
                  '.MuiTableContainer-root::-webkit-scrollbar': {
                    width: 0
                  }
                })}
              >
                <PivotWordTable
                  loading={!pivotWords}
                  sort={pivotWordSortData}
                  pivotWords={pivotWords ?? []}
                  chosenWord={selectedPivotWord}
                  onChooseWord={(word) =>
                    handleUpdateSelectedPivotWord(word)
                  }
                  onChangeSort={setPivotWordSortData}
                />
              </Paper>
          </Grid>

          {/**
           * Aligned Words Table
           */}
          <Grid item xs={alignedWordTableColumns} >
              <Paper
                sx={(theme) => ({
                  display: 'flex',
                  width: '100%',
                  backgroundColor: theme.palette.primary.contrastText,
                  backgroundImage: 'none',
                  height: 'calc(100vh - 4.2em)',
                  '.MuiTableContainer-root::-webkit-scrollbar': {
                    width: 0
                  }
                })}
              >
                <AlignedWordTable
                  sort={alignedWordSortData}
                  pivotWord={selectedPivotWord}
                  chosenAlignedWord={selectedAlignedWord}
                  onChooseAlignedWord={(alignedWord) =>
                    handleUpdateSelectedAlignedWord(alignedWord)
                  }
                  onChangeSort={setAlignedWordSortData}
                  lemmaToggled={lemmaToggled}
                />
              </Paper>
          </Grid>

          {/**
           * Alignment Links Table
           */}
          <Grid item xs={alignmentLinkTableColumns} >
              <Paper
                sx={ (theme) => ({
                  display: 'flex',
                  width: '100%',
                  height: 'calc(100vh - 4.2em)',
                  backgroundColor: theme.palette.primary.contrastText,
                  backgroundImage: 'none',
                  '.MuiTableContainer-root::-webkit-scrollbar': {
                    width: 0
                  }
                })}
              >
                <AlignmentTable
                  wordSource={wordSource}
                  pivotWord={selectedPivotWord}
                  alignedWord={selectedAlignedWord ?? undefined}
                  chosenAlignmentLink={selectedAlignmentLink}
                  onChooseAlignmentLink={setSelectedAlignmentLink}
                  updateAlignments={(resetState: boolean) => {
                    dispatch(resetTextSegments());
                    if (resetState) {
                      setSelectedAlignedWord(null);
                      setSelectedAlignmentLink(null);
                      setSelectedPivotWord(undefined);
                    }
                  }}
                  setSelectedRowsCount={setSelectedRowsCount}
                  setSelectedRows={setSelectedRows}
                  setSaveButtonDisabled={setSaveButtonDisabled}
                  setLinksPendingUpdate={setLinksPendingUpdate}
                  linksPendingUpdate={linksPendingUpdate}
                  rowSelectionModel={rowSelectionModel}
                  setRowSelectionModel={setRowSelectionModel}
                  alignmentTableControlPanelLinkState={alignmentTableControlPanelLinkState || null}
                  setUpdatedSelectedRows={setUpdatedSelectedRows}
                />
              </Paper>
          </Grid>
        </Grid>
        <SaveChangesConfirmation />
        <SaveChangesConfirmationViaRouter blocker={blocker}/>
      </div>
    </>
  );
};
