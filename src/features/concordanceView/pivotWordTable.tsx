import { CircularProgress, TableContainer } from '@mui/material';
import React, { useMemo } from 'react';
import { PivotWord } from './structs';
import { Box } from '@mui/system';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridSortItem,
} from '@mui/x-data-grid';
import {
  DataGridResizeAnimationFixes,
  DataGridScrollbarDisplayFix,
} from '../../styles/dataGridFixes';
import { LocalizedTextDisplay } from '../localizedTextDisplay';

const columns: GridColDef[] = [
  {
    field: 'frequency',
    headerName: 'Frequency',
    flex: 1,
  },
  {
    field: 'normalizedText',
    headerName: 'Pivot Word',
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams<PivotWord, any, any>) => (
      <LocalizedTextDisplay languageInfo={row.languageInfo}>
        {row.normalizedText}
      </LocalizedTextDisplay>
    ),
  },
];

export interface PivotWordTableProps {
  loading?: boolean;
  sort: GridSortItem | null;
  pivotWords: PivotWord[];
  chosenWord?: PivotWord | null;
  onChooseWord: (word: PivotWord) => void;
  onChangeSort: (sortData: GridSortItem | null) => void;
}

/**
 * The PivotWordTable displays a list of pivot words
 * @param loading optional parameter to indicate whether a loading indicator should be displayed
 * @param sort current sort model for Material UI DataGrid
 * @param onChangeSort callback for when the user changes the sort model
 * @param pivotWords list of pivot words to be displayed
 * @param chosenWord currently chosen pivot word
 * @param onChooseWord callback for when the user clicks a pivot word
 */
export const PivotWordTable = ({
  loading,
  sort,
  onChangeSort,
  pivotWords,
  chosenWord,
  onChooseWord,
}: PivotWordTableProps) => {
  const initialPage = useMemo(() => {
    if (chosenWord && pivotWords) {
      return Math.floor(pivotWords.indexOf(chosenWord) / 20);
    }
    return 0;
  }, [chosenWord, pivotWords]);
  if (loading) {
    return (
      <Box sx={{ display: 'flex', margin: 'auto' }}>
        <CircularProgress sx={{ margin: 'auto' }} />
      </Box>
    );
  }
  return (
    <TableContainer
      sx={{
        width: '100%',
        height: '100%',
        '.MuiTableContainer-root::-webkit-scrollbar': {
          width: 0,
        },
      }}
    >
      <DataGrid
        sx={{
          width: '100%',
          ...DataGridScrollbarDisplayFix,
          ...DataGridResizeAnimationFixes,
        }}
        rowSelection={true}
        rowSelectionModel={
          chosenWord?.normalizedText ? [chosenWord.normalizedText] : undefined
        }
        rows={pivotWords}
        columns={columns}
        getRowId={(row) => row.normalizedText}
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
        pagination={true}
        pageSizeOptions={[20, 50]}
        onRowClick={(clickEvent: GridRowParams<PivotWord>) => {
          if (onChooseWord) {
            onChooseWord(clickEvent.row);
          }
        }}
        isRowSelectable={({
          row: { alignedWords },
        }: GridRowParams<PivotWord>) =>
          !!alignedWords && (alignedWords?.length || 0) > 0
        }
      />
    </TableContainer>
  );
};
