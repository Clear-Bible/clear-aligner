import { AlignmentSide, Link } from '../../structs';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, GridSortItem } from '@mui/x-data-grid';
import { CircularProgress, IconButton, TableContainer } from '@mui/material';
import { Launch } from '@mui/icons-material';
import React, { createContext, useContext, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import { DataGridResizeAnimationFixes, DataGridScrollbarDisplayFix } from '../../styles/dataGridFixes';
import { VerseCell } from './alignmentTable/verseCell';
import { useLinksFromAlignedWord } from './useLinksFromAlignedWord';
import WorkbenchDialog from './workbenchDialog';
import { Box } from '@mui/system';

export interface AlignmentTableContextProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
}

export const AlignmentTableContext = createContext({} as AlignmentTableContextProps);

export const RefCell = (
  row: GridRenderCellParams<Link, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const refString = findFirstRefFromLink(row.row, tableCtx.wordSource);
  return (
    <BCVDisplay currentPosition={refString ? BCVWP.parseFromString(refString) : null} />
  );
}

/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param row rendering params for this Link entry
 * @param onClick Callback on button click
 */
export const LinkCell = ({row, onClick}: {
  row: GridRenderCellParams<Link, any, any>,
  onClick: (tableCtx: AlignmentTableContextProps, link: Link) => void;
}) => {
  const tableCtx = useContext(AlignmentTableContext);
  return (
    <IconButton onClick={() => onClick(tableCtx, row.row)}>
      <Launch />
    </IconButton>
  );
};


export interface AlignmentTableProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: Link) => void;
  updateAlignments: (resetState: boolean) => void;
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
 */
export const AlignmentTable = ({
  wordSource,
  pivotWord,
  alignedWord,
  chosenAlignmentLink,
  onChooseAlignmentLink,
  updateAlignments
}: AlignmentTableProps) => {
  const [selectedAligment, setSelectedAlignment] = useState<BCVWP | null>(null);
  const [ sort, onChangeSort ] = useState<GridSortItem|null>({
    field: 'id',
    sort: 'desc',
  } as GridSortItem);

  const alignments = useLinksFromAlignedWord(alignedWord, sort);

  const chosenLink: Link|undefined = useMemo(() => {
    if (!chosenAlignmentLink) return undefined;
    if (!alignments?.includes(chosenAlignmentLink)) return undefined;
    return chosenAlignmentLink;
  }, [alignments, chosenAlignmentLink]);

  const loading: boolean = useMemo(
    () => !!alignedWord &&  !alignments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ alignedWord, alignments, alignments?.length ]);

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

  const columns: GridColDef[] = [
    {
      field: 'state',
      headerName: 'State',
    },
    {
      field: 'ref',
      headerName: 'Ref',
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <RefCell {...row} />
      ),
    },
    {
      field: 'verse',
      headerName: 'Verse Text',
      flex: 1,
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <VerseCell {...row} />
      ),
    },
    {
      field: 'id',
      headerName: 'Link',
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <LinkCell row={row} onClick={() => {
          setSelectedAlignment(BCVWP.parseFromString(findFirstRefFromLink(row.row, AlignmentSide.TARGET) ?? ""))
        }} />
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', margin: 'auto' }}>
        <CircularProgress sx={{
          display: 'flex',
          '.MuiLinearProgress-bar': {
            transition: 'none'
          },
        }} />
      </Box>
    );
  }

  return (
    <AlignmentTableContext.Provider
      value={{
        pivotWord,
        alignedWord,
        wordSource,
      }}
    >
      <TableContainer
        sx={{
          width: '100%',
          height: '100%',
          '.MuiTableContainer-root::-webkit-scrollbar': {
            width: 0,
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', margin: 'auto' }}>
            <CircularProgress sx={{ margin: 'auto' }} />
          </Box>
        ) : (
        <DataGrid
          sx={{
            width: '100%',
            ...DataGridScrollbarDisplayFix,
            ...DataGridResizeAnimationFixes,
          }}
          rowSelection={true}
          rowCount={alignments?.length ?? 0}
          rowSelectionModel={
            chosenLink?.id ? [chosenLink.id] : undefined
          }
          rows={alignments ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          getRowHeight={(_) => 'auto'}
          sortModel={sort ? [sort] : []}
          onSortModelChange={(newSort) => {
            if (!newSort || newSort.length < 1) {
              onChangeSort(sort);
            }
            onChangeSort(newSort[0] /*only single sort is supported*/);
          }}
          initialState={{
            pagination: {
              paginationModel: { page: initialPage, pageSize: 20 },
            },
          }}
          pageSizeOptions={[20, 50]}
          onRowClick={(clickEvent: GridRowParams<Link>) => {
            if (onChooseAlignmentLink) {
              onChooseAlignmentLink(clickEvent.row);
            }
          }}
        />
      )}
      </TableContainer>
      <WorkbenchDialog
        alignment={selectedAligment}
        setAlignment={setSelectedAlignment}
        updateAlignments={updateAlignments}
      />
    </AlignmentTableContext.Provider>
  );
};
