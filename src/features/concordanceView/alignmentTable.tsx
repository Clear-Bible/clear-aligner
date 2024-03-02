import { CorpusContainer, DisplayableLink, Link, Verse } from '../../structs';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, GridSortItem } from '@mui/x-data-grid';
import { IconButton, TableContainer } from '@mui/material';
import { Launch } from '@mui/icons-material';
import { VerseDisplay } from '../corpus/verseDisplay';
import { WordSource } from './concordanceView';
import { createContext, useContext, useMemo } from 'react';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import _ from 'lodash';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import findWord from '../../helpers/findWord';
import { DataGridResizeAnimationFixes, DataGridScrollbarDisplayFix } from '../../styles/dataGridFixes';

export interface AlignmentTableContextProps {
  wordSource: WordSource;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
}

const AlignmentTableContext = createContext({} as AlignmentTableContextProps);

/**
 * Render cells with verse text in the appropriate font and text orientation for the verse
 * @param row rendering params for this DisplayableLink entry
 */
export const VerseCell = (
  row: GridRenderCellParams<DisplayableLink, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const container =
    tableCtx.wordSource === WordSource.SOURCE
      ? row.row?.sourceContainer
      : row.row?.targetContainer;
  const verses: Verse[] = _.uniqWith(
    (tableCtx.wordSource === WordSource.SOURCE ? row.row?.sources : row.row?.targets)
      ?.filter(BCVWP.isValidString)
      .map(BCVWP.parseFromString)
      .map((ref) => ref.toTruncatedReferenceString(BCVWPField.Verse)),
    _.isEqual
  )
    .flatMap((ref) =>
      container?.corpora.flatMap(({ wordsByVerse }) => wordsByVerse[ref])
    )
    .filter((v) => !!v)
    .sort((a, b) => BCVWP.compare(a.bcvId, b.bcvId));

  const anyVerse = verses.find((v) => !!v.bcvId);
  const languageInfo = container?.languageAtReference(anyVerse?.bcvId!);

  return (
    <div
      lang={languageInfo?.code}
      style={{
        ...(languageInfo?.textDirection
          ? { direction: languageInfo.textDirection }
          : {}),
      }}
    >
      {verses.map((verse: Verse) => (
        <VerseDisplay
          key={verse?.bcvId?.toReferenceString() ?? ''}
          onlyLinkIds={row.row.id ? [row.row.id] : []}
          readonly
          verse={verse}
          corpus={container?.corpusAtReference(verse.bcvId)}
        />
      ))}
    </div>
  );
};

export const RefCell = (
  row: GridRenderCellParams<DisplayableLink, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  return <BCVDisplay currentPosition={findFirstRefFromLink(row.row, tableCtx.wordSource)} />;
}
/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param row rendering params for this DisplayableLink entry
 */
export const LinkCell = (
  row: GridRenderCellParams<DisplayableLink, any, any>
) => {
  const navigate = useNavigate();
  const tableCtx = useContext(AlignmentTableContext);
  return (
    <IconButton
      onClick={() =>
        navigate({
          pathname: '/',
          search: createSearchParams({
            ref:
              findFirstRefFromLink(row.row, WordSource.TARGET)?.toTruncatedReferenceString(
                BCVWPField.Verse
              ) ?? '',
            pivotWord: tableCtx?.pivotWord?.normalizedText || '',
            alignedWord: tableCtx?.alignedWord?.id || '',
            alignmentLink: row.row.id ?? '',
          }).toString(),
        })
      }
    >
      <Launch />
    </IconButton>
  );
};

const columns: GridColDef[] = [
  {
    field: 'state',
    headerName: 'State',
  },
  {
    field: 'sources',
    headerName: 'Ref',
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <RefCell {...row} />
    ),
  },
  {
    field: 'verse',
    headerName: 'Verse Text',
    flex: 1,
    sortable: false,
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <VerseCell {...row} />
    ),
  },
  {
    field: 'id',
    headerName: 'Link',
    sortable: false,
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <LinkCell {...row} />
    ),
  },
];

export interface AlignmentTableProps {
  sort: GridSortItem | null;
  wordSource: WordSource;
  sourceContainer: CorpusContainer | null;
  targetContainer: CorpusContainer | null;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
  alignments: Link[];
  onChangeSort: (sortData: GridSortItem | null) => void;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: DisplayableLink) => void;
}

/**
 * The AlignmentTable displays a list of alignment Links and allows the user to navigate to that alignment link in the
 * alignment editor
 * @param sort current sort model for Material UI DataGrid
 * @param wordSource current word source
 * @param sourceContainer container with the source corpora
 * @param targetContainer container with the target corpora
 * @param pivotWord the pivot word that's currently selected, corresponds to the alignment rows being displayed and the
 * currently selected aligned word
 * @param alignedWord the currently selected aligned word, corresponds to the alignment rows being displayed
 * @param alignments alignment links to be displayed in the table
 * @param onChangeSort callback for when the user changes the sort model
 * @param chosenAlignmentLink currently selected alignment link
 * @param onChooseAlignmentLink callback for when a user clicks on an alignment link
 */
export const AlignmentTable = ({
  sort,
  wordSource,
  sourceContainer,
  targetContainer,
  pivotWord,
  alignedWord,
  alignments,
  onChangeSort,
  chosenAlignmentLink,
  onChooseAlignmentLink,
}: AlignmentTableProps) => {
  const displayableLinks: DisplayableLink[] = useMemo(() => {
    return alignments && sourceContainer && targetContainer
      ? alignments.map(
          (link) =>
            ({
              ...link,
              sourceContainer,
              targetContainer,
              sourceWords: link.sources
                .map(BCVWP.parseFromString)
                .map((ref) => findWord(sourceContainer!.corpora, ref)?.text),
              targetWords: link.targets
                .map(BCVWP.parseFromString)
                .map((ref) => findWord(targetContainer!.corpora, ref)?.text),
            } as DisplayableLink)
        )
      : [];
  }, [alignments, sourceContainer, targetContainer]);

  const initialPage = useMemo(() => {
    if (chosenAlignmentLink && displayableLinks) {
      return (
        displayableLinks.findIndex(
          (link) => link.id === chosenAlignmentLink.id
        ) / 20
      );
    }
    return 0;
  }, [chosenAlignmentLink, displayableLinks]);

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
        <DataGrid
          sx={{
            width: '100%',
            ...DataGridScrollbarDisplayFix,
            ...DataGridResizeAnimationFixes,
          }}
          rowSelection={true}
          rowSelectionModel={
            chosenAlignmentLink?.id ? [chosenAlignmentLink.id] : undefined
          }
          rows={displayableLinks}
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
          onRowClick={(clickEvent: GridRowParams<DisplayableLink>) => {
            if (onChooseAlignmentLink) {
              onChooseAlignmentLink(clickEvent.row);
            }
          }}
        />
      </TableContainer>
    </AlignmentTableContext.Provider>
  );
};
