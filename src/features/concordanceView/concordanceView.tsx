import { useContext, useEffect, useMemo, useState } from 'react';
import { CorpusContainer, DisplayableLink, Link } from '../../structs';
import { Backdrop, CircularProgress, Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, NormalizedTextToPivotWord, PivotWord } from './structs';
import { getAvailableCorporaContainers } from '../../workbench/query';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import {
  generateAlignedWordsMap,
  generateAllWordsAndFrequencies,
  generateListOfNavigablePivotWords,
  generatePivotWordsMap,
} from './concordanceViewHelpers';
import { AppContext } from '../../App';

export enum WordSource {
  SOURCE='source',
  TARGET='target'
}
export type WordFilter = 'aligned' | 'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const { projectState } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [sourceContainer, setSourceContainer] = useState(
    null as CorpusContainer | null
  );
  const [targetContainer, setTargetContainer] = useState(
    null as CorpusContainer | null
  );
  const [selectedPivotWord, setSelectedPivotWord] = useState(
    null as PivotWord | null
  );
  const [alignedWordSortData, setAlignedWordSortData] = useState({
    field: 'frequency',
    sort: 'desc',
  } as GridSortItem | null);
  const [selectedAlignedWord, setSelectedAlignedWord] = useState(
    null as AlignedWord | null
  );
  const [alignmentSortData, setAlignmentSortData] = useState({
    field: 'id',
    sort: 'desc',
  } as GridSortItem | null);
  const [selectedAlignmentLink, setSelectedAlignmentLink] = useState(
    null as Link | null
  );

  const handleUpdateSelectedAlignedWord = useMemo(
    () => (alignedWord: AlignedWord | null) => {
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
    },
    [setSelectedAlignedWord, setSelectedAlignmentLink]
  );
  const handleUpdateSelectedPivotWord = useMemo(
    () => (pivotWord: PivotWord | null) => {
      setSelectedPivotWord(pivotWord);
      handleUpdateSelectedAlignedWord(null);
    },
    [setSelectedPivotWord, handleUpdateSelectedAlignedWord]
  );

  useEffect(() => {
    if (!loading) {
      layoutCtx.setMenuBarDelegate(
        <Typography sx={{ textAlign: 'center', translate: '-20px' }}>
          Alignments :: Batch-review Mode
        </Typography>
      );
    }
  }, [layoutCtx, loading]);

  /**
   * pivot words
   */
  const [pivotWordsPromise, setPivotWordsPromise] = useState(
    null as Promise<PivotWord[]> | null
  );
  const [wordSource, setWordSource] = useState(WordSource.TARGET);
  const [wordFilter, setWordFilter] = useState('all' as WordFilter);
  const [srcPivotWords, setSrcPivotWords] = useState([] as PivotWord[]);
  const [pivotWords, setPivotWords] = useState([] as PivotWord[]);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc',
  } as GridSortItem | null);

  const pivotWordsLoading = useMemo(() => {
    return !!pivotWordsPromise;
  }, [pivotWordsPromise]);

  useEffect(() => {
    if (!!pivotWordsPromise) {
      pivotWordsPromise.then((pivotWords) => {
        setPivotWords(pivotWords);
        setPivotWordsPromise(null);
      });
    }
  }, [pivotWordsPromise, setPivotWords, setPivotWordsPromise]);

  useEffect(() => {
    const loadCorpora = async () => {
      const containers: CorpusContainer[] =
        await getAvailableCorporaContainers();

      containers.forEach((container) => {
        if (container.id === 'source') {
          setSourceContainer(container);
        } else if (container.id === 'target') {
          setTargetContainer(container);
        }
      });
    };

    void loadCorpora();
  }, [setSourceContainer, setTargetContainer]);

  /**
   * create navigable tree structure of pivot words with alignment links as the leaf nodes
   */
  useEffect(
    () => {
      const loadPivotWordData = async () => {
        if (!sourceContainer || !targetContainer) {
          setLoading(false);
          return;
        }

        const allWordsAndFrequencies = generateAllWordsAndFrequencies(
          wordSource === WordSource.SOURCE ? sourceContainer : targetContainer
        );

        if (!allWordsAndFrequencies) {
          setLoading(false);
          return;
        }

        const pivotWordsMap: NormalizedTextToPivotWord = generatePivotWordsMap(
          allWordsAndFrequencies
        );

        const normalizedTextToAlignmentLinks = generateAlignedWordsMap(
          projectState?.linksTable?.getAll() ?? [],
          sourceContainer,
          targetContainer
        );

        setSrcPivotWords(
          generateListOfNavigablePivotWords(
            pivotWordsMap,
            sourceContainer,
            targetContainer,
            normalizedTextToAlignmentLinks,
            wordSource
          )
        );
        setLoading(false);
      };

      if (sourceContainer && targetContainer && wordSource) {
        setLoading(true);
        void loadPivotWordData();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      projectState?.linksTable,
      projectState?.linksTable?.lastUpdate,
      wordSource,
      sourceContainer,
      targetContainer,
      setLoading,
      setSrcPivotWords,
    ]
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (loading || !srcPivotWords || srcPivotWords.length < 1) {
      return;
    }
    if (searchParams.has('pivotWord')) {
      const pivotWordId = searchParams.get('pivotWord')!;
      const pivotWord = srcPivotWords.find(
        (pivotWord) => pivotWord.normalizedText === pivotWordId
      );

      if (pivotWord) {
        setSelectedPivotWord(pivotWord);
      }
      if (searchParams.has('alignedWord') && (pivotWord || selectedPivotWord)) {
        const alignedWordId = searchParams.get('alignedWord')!;
        const alignedWord = (pivotWord ??
          selectedPivotWord)!.alignedWords?.find(
          (alignedWord) => alignedWord.id === alignedWordId
        );

        if (alignedWord) {
          setSelectedAlignedWord(alignedWord);
        }
        if (
          searchParams.has('alignmentLink') &&
          (alignedWord || selectedAlignedWord)
        ) {
          const alignmentLinkId = searchParams.get('alignmentLink');
          const alignmentLink = (
            alignedWord ?? selectedAlignedWord
          )?.alignments?.find((link) => link.id === alignmentLinkId);

          if (alignmentLink) {
            setSelectedAlignmentLink(alignmentLink);
          }
          searchParams.delete('alignmentLink');
        }
        searchParams.delete('alignedWord');
      }
      searchParams.delete('pivotWord');
    }
    setSearchParams(searchParams);
  }, [
    loading,
    srcPivotWords,
    searchParams,
    setSearchParams,
    setSelectedPivotWord,
    selectedPivotWord,
    setSelectedAlignedWord,
    selectedAlignedWord,
    setSelectedAlignmentLink,
    selectedAlignmentLink,
  ]);

  useEffect(() => {
    const performSort = async (srcPivotWords: PivotWord[]) => {
      if (!pivotWordSortData) {
        return [...srcPivotWords];
      }
      return [...srcPivotWords].sort((a, b) => {
        const aValue = (a as any)[pivotWordSortData.field];
        const bValue = (b as any)[pivotWordSortData.field];
        return pivotWordSortData.sort === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    };

    if (srcPivotWords.length < 1) {
      // don't sort on nothing
      return;
    }
    setPivotWordsPromise(performSort(srcPivotWords));
  }, [srcPivotWords, pivotWordSortData, setPivotWordsPromise]);

  return (
    <div style={{ position: 'relative' }}>
      <Backdrop
        open={loading}
        sx={{
          position: 'absolute',
          marginTop: '-1em',
          marginBottom: '-1em',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <CircularProgress color={'inherit'} />
      </Backdrop>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gridGap: '.5em',
          gridTemplateColumns: 'repeat(18, 1fr)',
          width: '100vw !important',
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
            marginTop: '1em',
          }}
        >
          <SingleSelectButtonGroup
            value={wordSource}
            items={[
              {
                value: 'source',
                label: 'Source',
              },
              {
                value: 'target',
                label: 'Target',
              },
            ]}
            onSelect={(value) => setWordSource(value as WordSource)}
          />
          <SingleSelectButtonGroup
            value={wordFilter}
            items={[
              {
                value: 'aligned',
                label: 'Aligned',
              },
              {
                value: 'all',
                label: 'All',
              },
            ]}
            onSelect={(value) => setWordFilter(value as WordFilter)}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 10.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <PivotWordTable
              loading={pivotWordsLoading}
              sort={pivotWordSortData}
              pivotWords={
                wordFilter === 'all'
                  ? pivotWords
                  : pivotWords.filter((w) => w.alignedWords)
              }
              chosenWord={selectedPivotWord}
              onChooseWord={(word) =>
                handleUpdateSelectedPivotWord(
                  word.alignedWords && word.alignedWords.length > 0
                    ? word
                    : null
                )
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
            marginTop: '1em',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignedWordTable
              sort={alignedWordSortData}
              alignedWords={selectedPivotWord?.alignedWords ?? []}
              chosenAlignedWord={selectedAlignedWord}
              onChooseAlignedWord={(alignedWord) =>
                handleUpdateSelectedAlignedWord(
                  alignedWord.alignments && alignedWord.alignments.length > 0
                    ? alignedWord
                    : null
                )
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
            marginTop: '1em',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignmentTable
              sort={alignmentSortData}
              wordSource={wordSource}
              pivotWord={selectedPivotWord}
              alignedWord={selectedAlignedWord}
              sourceContainer={sourceContainer}
              targetContainer={targetContainer}
              alignments={selectedAlignedWord?.alignments ?? []}
              onChangeSort={setAlignmentSortData}
              chosenAlignmentLink={selectedAlignmentLink}
              onChooseAlignmentLink={(alignmentLink: DisplayableLink) =>
                setSelectedAlignmentLink(alignmentLink)
              }
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
