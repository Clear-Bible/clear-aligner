import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridSortItem,
} from '@mui/x-data-grid';
import { AlignedWord, LocalizedWordEntry, PivotWord } from './structs';
import { CircularProgress, TableContainer } from '@mui/material';
import React, { useMemo } from 'react';
import {
  DataGridResizeAnimationFixes,
  DataGridScrollbarDisplayFix,
  DataGridSetMinRowHeightToDefault,
} from '../../styles/dataGridFixes';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { groupLocalizedPartsByWord } from '../../helpers/groupPartsIntoWords';
import BCVWP from '../bcvwp/BCVWPSupport';
import { useAlignedWordsFromPivotWord } from './useAlignedWordsFromPivotWord';
import { Box } from '@mui/system';

/**
 * Render an individual word or list of words with the appropriate display for their language
 * @param words words to be rendered
 */
const renderWords = (words: LocalizedWordEntry[]) => {
  const languageInfo = words.find((w) => w.languageInfo)?.languageInfo;
  const partsByWord = groupLocalizedPartsByWord(
    words.sort((a, b) =>
      BCVWP.compare(
        BCVWP.parseFromString(a.position),
        BCVWP.parseFromString(b.position)
      )
    )
  );
  return (
    <span
      style={{
        ...(languageInfo?.textDirection === 'rtl'
          ? { direction: languageInfo.textDirection! }
          : {}),
      }}
    >
      {partsByWord?.map((word, idx) => (
        <React.Fragment key={idx}>
          {word.map((wordPart, wordPartIndex) => (
            <LocalizedTextDisplay
              key={wordPartIndex}
              languageInfo={wordPart.languageInfo}
            >
              {wordPart.text}
            </LocalizedTextDisplay>
          ))}
          {words.length - 1 !== idx && ' '}
        </React.Fragment>
      ))}
    </span>
  );
};

const columns: GridColDef[] = [
  {
    field: 'frequency',
    headerName: 'Frequency',
    flex: 1,
  },
  {
    field: 'sourceWordTexts',
    headerName: 'Source',
    sortable: false,
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams<AlignedWord, any, any>) =>
      renderWords(row.sourceWordTexts),
  },
  {
    field: 'targetWordTexts',
    headerName: 'Target',
    sortable: false,
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams<AlignedWord, any, any>) =>
      renderWords(row.targetWordTexts),
  },
];

const columnsWithGloss: GridColDef[] = [
  ...columns,
  {
    field: 'gloss',
    headerName: 'Gloss',
    flex: 1,
  },
];

export interface AlignedWordTableProps {
  sort: GridSortItem | null;
  pivotWord?: PivotWord;
  chosenAlignedWord?: AlignedWord | null;
  onChooseAlignedWord: (alignedWord: AlignedWord) => void;
  onChangeSort: (sortData: GridSortItem | null) => void;
}

/**
 * Display aligned words in the concordance view
 * @param sort current sort model for Material UI DataGrid
 * @param alignedWords list of aligned words for display
 * @param chosenAlignedWord currently selected aligned word
 * @param onChooseAlignedWord callback for when an aligned word entry is clicked in the list
 * @param onChangeSort callback for when the user changes the sort model
 */
export const AlignedWordTable = ({
  sort,
  pivotWord,
  chosenAlignedWord,
  onChooseAlignedWord,
  onChangeSort,
}: AlignedWordTableProps) => {
  const alignedWords = useAlignedWordsFromPivotWord(pivotWord);

  const loading: boolean = useMemo(
    () => !!pivotWord && !alignedWords,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  [pivotWord, alignedWords, alignedWords?.length]);

  const hasGlossData = useMemo(
    () => {
      if (!alignedWords) return false;
      return alignedWords.some(
        (alignedWord: AlignedWord) => !!alignedWord.gloss
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alignedWords, alignedWords?.length]
  );
  const initialPage = useMemo(() => {
    if (chosenAlignedWord && alignedWords && alignedWords.length > 0) {
      return alignedWords.indexOf(chosenAlignedWord) / 20;
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenAlignedWord, alignedWords, alignedWords?.length]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
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
      {loading ? (
        <Box sx={{ display: 'flex', margin: 'auto' }}>
          <CircularProgress sx={{ margin: 'auto' }} />
        </Box>
      ) : (
        <DataGrid
          sx={{
            width: '100%',
            ...DataGridSetMinRowHeightToDefault,
            ...DataGridScrollbarDisplayFix,
            ...DataGridResizeAnimationFixes,
          }}
          rowSelection={true}
          rowSelectionModel={
            chosenAlignedWord?.id ? [chosenAlignedWord.id] : undefined
          }
          rows={alignedWords ?? []}
          columns={hasGlossData ? columnsWithGloss : columns}
          getRowId={(row) => row.id}
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
          onRowClick={(clickEvent: GridRowParams<AlignedWord>) => {
            if (onChooseAlignedWord) {
              onChooseAlignedWord(clickEvent.row);
            }
          }}
          isRowSelectable={({
            row: { alignments },
          }: GridRowParams<AlignedWord>) =>
            !!alignments && (alignments?.length || 0) > 0
          }
          getRowHeight={() => 'auto'}
        />
      )}
    </TableContainer>
  );
};
