import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlignmentSide, Link } from '../../structs';
import { Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import { usePivotWords } from './usePivotWords';
import { resetTextSegments } from '../../state/alignment.slice';
import { useAppDispatch } from '../../app/index';

export type PivotWordFilter = 'aligned' | 'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const dispatch = useAppDispatch();

  /**
   * pivot words
   */
  const [wordSource, setWordSource] = useState('targets' as AlignmentSide);
  const [wordFilter, setWordFilter] = useState('all' as PivotWordFilter);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const { pivotWords } = usePivotWords(wordSource, wordFilter, pivotWordSortData);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loading = useMemo(() => !!pivotWords, [pivotWords, pivotWords?.length]);

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
    null as Link | null
  );

  const handleUpdateSelectedAlignedWord = useCallback((alignedWord: AlignedWord | null) => {
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
    },
    [setSelectedAlignedWord, setSelectedAlignmentLink]
  );
  const handleUpdateSelectedPivotWord = useMemo(
    () => (pivotWord: PivotWord | null) => {
      setSelectedPivotWord(pivotWord ?? undefined);
      handleUpdateSelectedAlignedWord(null);
    },
    [setSelectedPivotWord, handleUpdateSelectedAlignedWord]
  );

  // when a pivotword is selected, indicate that it's loading or load pivotWords
  useEffect(() => {
    handleUpdateSelectedAlignedWord(null);
  }, [handleUpdateSelectedAlignedWord]);

  useEffect(() => {
    if (!loading) {
      layoutCtx.setMenuBarDelegate(
        <Typography sx={{ textAlign: 'center' }}>
          Alignments :: Batch-review Mode
        </Typography>
      );
    }
  }, [layoutCtx, loading]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!pivotWords || pivotWords.length < 1) {
      return;
    }
    if (searchParams.has('pivotWord')) {
      const pivotWordId = searchParams.get('pivotWord')!;
      const pivotWord = pivotWords.find(
        (pivotWord) => pivotWord.normalizedText === pivotWordId
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

  return (
    <div style={{ position: 'relative' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gridGap: '.5em',
          gridTemplateColumns: 'repeat(18, 1fr)',
          width: '100vw !important'
        }}
      >
        {/**
         * Pivot Words
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexGrow: '0',
            flexShrink: '1',
            gridColumn: '1',
            width: '100%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em'
          }}
        >
          <SingleSelectButtonGroup
            value={wordSource}
            items={[
              {
                value: 'sources',
                label: 'Source'
              },
              {
                value: 'targets',
                label: 'Target'
              }
            ]}
            onSelect={(value) => setWordSource(value as AlignmentSide)}
          />
          <SingleSelectButtonGroup
            value={wordFilter}
            items={[
              {
                value: 'aligned',
                label: 'Aligned'
              },
              {
                value: 'all',
                label: 'All'
              }
            ]}
            onSelect={(value) => setWordFilter(value as PivotWordFilter)}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 10.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
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
        </Box>
        {/**
         * Aligned Words
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexShrink: '1',
            gridColumn: '1',
            width: '100%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em'
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
          >
            <AlignedWordTable
              sort={alignedWordSortData}
              pivotWord={selectedPivotWord}
              chosenAlignedWord={selectedAlignedWord}
              onChooseAlignedWord={(alignedWord) =>
                handleUpdateSelectedAlignedWord(alignedWord)
              }
              onChangeSort={setAlignedWordSortData}
            />
          </Paper>
        </Box>
        {/**
         * Alignment Links
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexShrink: '1',
            gridColumn: '1',
            width: '100%',
            gap: '1em',
            margin: '2em',
            marginTop: '1em'
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
          >
            <AlignmentTable
              wordSource={wordSource}
              pivotWord={selectedPivotWord}
              alignedWord={selectedAlignedWord ?? undefined}
              chosenAlignmentLink={selectedAlignmentLink}
              onChooseAlignmentLink={setSelectedAlignmentLink}
              updateAlignments={(resetState: boolean) => {
                dispatch(resetTextSegments());
                if(resetState) {
                  setSelectedAlignedWord(null);
                  setSelectedAlignmentLink(null);
                  setSelectedPivotWord(undefined);
                }
              }}
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
