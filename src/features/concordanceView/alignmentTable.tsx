/**
 * This file contains the AlignmentTable component which is the third table
 * in the ConcordanceView component
 */
import { Link, LinkStatus } from '../../structs';
import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridInputRowSelectionModel,
  GridRenderCellParams,
  GridRowParams,
  GridRowSelectionModel,
  GridSortItem,
  useGridApiContext,
  useGridApiEventHandler
} from '@mui/x-data-grid';
import { CircularProgress, IconButton, Menu, MenuItem, TableContainer, useTheme } from '@mui/material';
import {
  Cancel,
  CancelOutlined,
  CheckCircle,
  CheckCircleOutlined,
  Flag,
  FlagOutlined,
  Link as LinkIcon
} from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CircleIcon from '@mui/icons-material/Circle';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import {
  DataGridOutlineFix,
  DataGridResizeAnimationFixes,
  DataGridScrollbarDisplayFix,
  DataGridSvgFix,
  DataGridTripleIconMarginFix
} from '../../styles/dataGridFixes';
import { VerseCell } from './alignmentTable/verseCell';
import { useLinksFromAlignedWord } from './useLinksFromAlignedWord';
import WorkbenchDialog from './workbenchDialog';
import { Box } from '@mui/system';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { AlignmentSide } from '../../common/data/project/corpus';
import { grey } from '@mui/material/colors';
import { PerRowLinkStateSelector } from './perRowLinkStateSelector';
import { useLinkNotes } from '../linkNotes/useLinkNotes';

/**
 * Interface for the AlignmentTableContext Component
 */
export interface AlignmentTableContextProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
}

/**
 * AlignmentTableContext, Context wrapper used in the AlignmentTable component
 */
export const AlignmentTableContext = createContext({} as AlignmentTableContextProps);

/**
 * Custom cell component to display book, chapter, and verse in the AlignmentTable
 * @param row rendering params for this RefCell entry
 */
export const RefCell = (
  row: GridRenderCellParams<Link, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const refString = findFirstRefFromLink(row.row, tableCtx.wordSource);
  const [rowHovered, setRowHovered] = useState(false);
  const apiRef = useGridApiContext();

  // this logic allows us to subscribe to mouse enter and mouse leave states
  // inisde the datagrid
  useEffect( () => {
    if (apiRef.current.getRowElement(row.id)?.matches(":hover")){
      setRowHovered(true);
    }
  },[apiRef, row.id])
  const handleRowEnter: GridEventListener<"rowMouseEnter"> = ({id})  => {
    id === row.id && setRowHovered(true);
  }
  const handleRowLeave: GridEventListener<'rowMouseLeave'> = ({id})  => {
    id === row.id && setRowHovered(false);
  }
  useGridApiEventHandler(apiRef, "rowMouseEnter", handleRowEnter);
  useGridApiEventHandler(apiRef, "rowMouseLeave", handleRowLeave);

  return (
    rowHovered ? <PerRowLinkStateSelector items={[
      {
        value: 'created',
        label: <LinkIcon />,
        color: 'primary',
      },
      {
        value: 'rejected',
        label: <Cancel />,
        color: 'error'
      },
      {
        value: 'approved',
        label: <CheckCircle />,
        color: 'success'
      },
      {
        value: 'needsReview',
        label: <Flag />,
        color: 'warning'
      }]}
      currentLink={row.row}
      /> :
    <BCVDisplay currentPosition={refString ? BCVWP.parseFromString(refString) : null} useParaText={true} />
  );
};

/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param row rendering params for this Link entry
 * @param onClick Callback on button click
 */
export const LinkCell = ({ row, onClick }: {
  row: GridRenderCellParams<Link, any, any>,
  onClick: (tableCtx: AlignmentTableContextProps, link: Link) => void;
}) => {
  const tableCtx = useContext(AlignmentTableContext);
  const[isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLinkClick = () => {
    onClick(tableCtx, row.row)
    handleClose();
  }

  const handleMoreVertIconClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget)
    setIsMenuOpen(true);
  }

  const handleClose = () => {
    setIsMenuOpen(false);
    setAnchorEl(null);
  }

  const { hasNote, editorDialog, onOpenEditor } = useLinkNotes({ memberOfLink: row.row });

  return (
    <Box
      sx={(theme) => (hasNote ? {
        background: `linear-gradient(45deg, rgba(0,0,0,0) 42px, ${theme.palette.info.dark} 0)`
      } : {})}>
      <IconButton onClick={(event) => handleMoreVertIconClick(event)} >
        <MoreVertIcon/>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => handleLinkClick()}
        >
          Verse Editor
        </MenuItem>
        <MenuItem
          onClick={() => {
            onOpenEditor();
            handleClose();
          }}>
          Edit Notes
        </MenuItem>
      </Menu>
      {editorDialog}
    </Box>
  );
};

/**
 * Props for the StateCellIcon Component
 */
export interface StateCellIconProps {
  state: Link;
}
/**
 * Render the cell with its corresponding state icon
 * @param state the current Link object
 */
export const StateCellIcon = ({
                                state }:
                                StateCellIconProps) => {
  const theme = useTheme();

  if (state.metadata.status === 'created'){
    return (<LinkIcon sx={{
      color: theme.palette.primary.main }}
      />)
  }
  else if (state.metadata.status === 'approved'){
    return <CheckCircle  sx={{
      color: theme.palette.success.main,
    }}
    />
  }
  else if (state.metadata.status === 'needsReview'){
    return <Flag  sx={{
      color: theme.palette.warning.main,
    }}/>
  }
}


/**
 * Props for the StateCell Component
 */
export interface StateCellProps {
  setSaveButtonDisabled: Function;
  state: Link;
  setLinksPendingUpdate: Function;
  linksPendingUpdate: Map<string, Link>;
  isRowSelected: boolean;
  alignmentTableControlPanelLinkState: LinkStatus | null;
}

/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param setSaveButtonDisabled callback to control the state of the Save Button
 * @param state the current Link object
 * @param setLinksPendingUpdate callback to update what links need to be updated
 * @param linksPendingUpdate Map of what links are pending update
 * @param isRowSelected flag to indicate if the row is currently selected
 * @param alignmentTableControlPanelLinkState indicates what state the global link state selector is currently set to
 */
export const StateCell = ({ setSaveButtonDisabled,
                            state,
                            setLinksPendingUpdate,
                            linksPendingUpdate,
                            isRowSelected,
                            alignmentTableControlPanelLinkState }:
                            StateCellProps) => {
  /**
   * calcInitialLink State is needed because MUI DataGrid re-renders the rows
   * often, and we need to be sure we are setting the correct state in the UI,
   * especially after things like the user scrolls changes rows out of view
   * and back into view
   */
  const calcInitialCellState = useCallback((): LinkStatus => {
    // case 1 - user has globally set link status
    if(isRowSelected && alignmentTableControlPanelLinkState){
      return alignmentTableControlPanelLinkState
    }
    // case 2 - user has manually set link status in the row
    else if (state.id && linksPendingUpdate.get(state.id)){
      return linksPendingUpdate.get(state.id)?.metadata.status as LinkStatus
    }
    // case 3 - user has not manually changed link status
    else{
      return state.metadata.status
    }
  },[alignmentTableControlPanelLinkState, isRowSelected, linksPendingUpdate, state.id, state.metadata]);

  const [alignmentTableLinkState, setAlignmentTableLinkState]
    = React.useState<LinkStatus>(calcInitialCellState());

  function handleSelect(value: string) {
    const updatedLink = structuredClone(state);
    const linkStatus = value as LinkStatus;
    updatedLink.metadata.status = linkStatus;
    // add updatedLink to the linksPendingUpdate Map
    setLinksPendingUpdate(new Map(linksPendingUpdate).set(updatedLink.id || '', updatedLink));
    setAlignmentTableLinkState(linkStatus);
    setSaveButtonDisabled(false);
  }

  // if the state is updated via the AlignmentTableControl Panel, then update
  // the state here
  useEffect(() => {
    if (isRowSelected && alignmentTableControlPanelLinkState) {
      setAlignmentTableLinkState(alignmentTableControlPanelLinkState);
    }
  }, [alignmentTableControlPanelLinkState, isRowSelected]);

  return (
    <SingleSelectButtonGroup
      value={alignmentTableLinkState}
      sx={{ size: 'small' }}
      items={[
        {
          value: 'created',
          label: <LinkIcon />,
          tooltip: 'Created',
        },
        {
          value: 'rejected',
          label: <CancelOutlined />,
          tooltip: 'Rejected',
        },
        {
          value: 'approved',
          label: <CheckCircleOutlined />,
          tooltip: 'Approved',
        },
        {
          value: 'needsReview',
          label: <FlagOutlined />,
          tooltip: 'Needs Review',
        }
      ]}
      onSelect={handleSelect}
      customDisabled={isRowSelected}
    />
  );
};

/**
 * Props for the AlignmentTable Component
 */
export interface AlignmentTableProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: Link) => void;
  updateAlignments: (resetState: boolean) => void;
  setSelectedRowsCount: Function,
  setSaveButtonDisabled: Function,
  setLinksPendingUpdate: Function,
  linksPendingUpdate: Map<string, Link>;
  setSelectedRows: Function;
  rowSelectionModel: GridInputRowSelectionModel;
  setRowSelectionModel: Function;
  alignmentTableControlPanelLinkState: LinkStatus | null;
  setUpdatedSelectedRows: Function;
}

/**
 * The AlignmentTable displays a list of alignment Links and allows the user to navigate to that alignment link in the
 * alignment editor
 * @param wordSource current word source
 * @param pivotWord the pivot word that's currently selected, corresponds to the alignment rows being displayed and the
 * currently selected aligned word
 * @param alignedWord the currently selected aligned word, corresponds to the alignment rows being displayed
 * @param chosenAlignmentLink currently selected alignment link
 * @param onChooseAlignmentLink callback for when a user clicks on an alignment link
 * @param updateAlignments callback used when closing the WorkBenchDialog Dialog
 * @param setSelectedRowsCount callback to update the count of currently selected rows in the table
 * @param setSaveButtonDisabled callback to control the status of the Save button
 * @param setLinksPendingUpdate callback to add an updated Link to the array of Links pending an update
 * @param linksPendingUpdate Array of Links pending an update
 * @param setSelectedRows callback to update the state with what rows are currently selected
 * @param rowSelectionModel prop that reflects what rows in the table are currently selected
 * @param setRowSelectionModel callback to update what rows are currently selected
 * @param alignmentTableControlPanelLinkState prop passed down to update selected links in bulk
 * @param setUpdatedSelectedRows callback to update the updatedSelectedRows
 */
export const AlignmentTable = ({
                                 wordSource,
                                 pivotWord,
                                 alignedWord,
                                 chosenAlignmentLink,
                                 onChooseAlignmentLink,
                                 updateAlignments,
                                 setSelectedRowsCount,
                                 setSelectedRows,
                                 setSaveButtonDisabled,
                                 setLinksPendingUpdate,
                                 linksPendingUpdate,
                                 rowSelectionModel,
                                 setRowSelectionModel,
                                 alignmentTableControlPanelLinkState,
                                 setUpdatedSelectedRows
                               }: AlignmentTableProps) => {
  const [selectedAlignment, setSelectedAlignment] = useState<BCVWP | null>(null);
  const [sort, onChangeSort] = useState<GridSortItem | null>({
    field: 'id',
    sort: 'desc'
  } as GridSortItem);

  const alignments = useLinksFromAlignedWord(alignedWord, sort);

  const loading: boolean = useMemo(
    () => !!alignedWord && !alignments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alignedWord, alignments, alignments?.length]);

  const initialPage = useMemo(() => {
    if (chosenAlignmentLink && alignments) {
      return (
        alignments.findIndex(
          (link) => link.id === chosenAlignmentLink.id
        ) / 20
      );
    }
    return 0;
  }, [chosenAlignmentLink, alignments]);

  const onRowSelectionModelChange = useCallback ((rowSelectionModel: GridRowSelectionModel) => {
    setRowSelectionModel(rowSelectionModel);
    setSelectedRowsCount(rowSelectionModel.length);
    const selectedIDs = new Set(rowSelectionModel);
    const selectedRows = alignments?.filter((row) => selectedIDs.has(row?.id || ''));
    setSelectedRows(selectedRows);

    // update the state of all the currently selected rows in bulk
    if(alignmentTableControlPanelLinkState) {
      setUpdatedSelectedRows(selectedRows?.map((row) => (
        {
          ...row,
          metadata: {
            ...row.metadata,
            status: alignmentTableControlPanelLinkState,
          }
        })))
    }
  },[alignmentTableControlPanelLinkState, alignments, setRowSelectionModel, setSelectedRows,
  setSelectedRowsCount, setUpdatedSelectedRows])

  const onRowClick = useCallback((clickEvent: GridRowParams<Link>) => {
    if (onChooseAlignmentLink) {
      onChooseAlignmentLink(clickEvent.row);
    }
  },[onChooseAlignmentLink]);

  const onSortModelChange = useCallback((newSort: string | any[]) => {
    if (!newSort || newSort.length < 1) {
      onChangeSort(sort);
    }
    onChangeSort(newSort[0] /*only single sort is supported*/);
  }, [sort])

  const rowCount = useMemo( () => alignments?.length ?? 0, [alignments?.length])

  const rows = useMemo( () => alignments ?? [], [alignments])

  const getRowId = useMemo( () => (row: any) => row.id, [] )

  const sortModel = useMemo( () => sort ? [sort] : [], [sort])

  const columns: GridColDef[] = [
    {
      field: "__check__",
      type: 'checkboxSelection',
      disableColumnMenu: true,
      resizable: false,
      disableReorder: true,
      disableExport: true,
      filterable: false,
      sortable: false,
      width: 10,
      align: 'center'
    },
    {
      field: 'state',
      headerName: 'State',
      renderHeader: () => <CircleIcon sx={{
        color: grey[400],
        fontSize: '16px',
      }}/>,
      sortable: false,
      width: 10,
      disableColumnMenu: true,
      renderCell: row => {
        return (
          <StateCellIcon
            state={row.row}
          />)
      }
    },
    {
      field: 'ref',
      headerName: 'Bible Ref',
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
          <RefCell {...row} />
      )
    },
    {
      field: 'verse',
      headerName: 'Verse Text',
      flex: 1,
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <VerseCell {...row}  />
      )
    },
    {
      field: 'id',
      headerName: '',
      disableColumnMenu: true,
      width: 1,
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <LinkCell row={row} onClick={() => {
          setSelectedAlignment(BCVWP.parseFromString(findFirstRefFromLink(row.row, AlignmentSide.TARGET) ?? ''));
        }} />
      )
    }
  ];

  const initialState = {
    pagination: {
      paginationModel: { page: initialPage, pageSize: 20 }
    }
  }

  const pageSizeOptions = [20];

  const sx = {
    width: '100%',
    ...DataGridScrollbarDisplayFix,
    ...DataGridResizeAnimationFixes,
    ...DataGridTripleIconMarginFix,
    ...DataGridOutlineFix,
    ...DataGridSvgFix
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', margin: 'auto' }}>
        <CircularProgress sx={{
          display: 'flex',
          '.MuiLinearProgress-bar': {
            transition: 'none'
          }
        }} />
      </Box>
    );
  }

  return (
    <AlignmentTableContext.Provider
      value={{
        pivotWord,
        alignedWord,
        wordSource
      }}
    >
      <TableContainer
        sx={{
          width: '100%',
          height: '100%',
          '.MuiTableContainer-root::-webkit-scrollbar': {
            width: 0
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', margin: 'auto' }}>
            <CircularProgress sx={{ margin: 'auto' }} />
          </Box>
        ) : (
          <>
            <DataGrid
              sx={sx}
              rowSelection={true}
              rowCount={rowCount}
              rows={rows}
              columns={columns}
              getRowId={getRowId}
              sortModel={sortModel}
              onSortModelChange={onSortModelChange}
              initialState={initialState}
              pageSizeOptions={pageSizeOptions}
              onRowClick={onRowClick}
              checkboxSelection={true}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={onRowSelectionModelChange}
              hideFooterSelectedRowCount
              disableRowSelectionOnClick
              rowHeight={35}
            />
          </>
        )}
      </TableContainer>
      <WorkbenchDialog
        alignment={selectedAlignment}
        setAlignment={setSelectedAlignment}
        updateAlignments={updateAlignments}
      />
    </AlignmentTableContext.Provider>
  );
};
