/**
 * This file contains the logic to use the PivotWordTable component
 * in Storybook
 */
import { Meta } from '@storybook/react';
import { PivotWordTable, PivotWordTableProps } from './pivotWordTable';
import { useState } from 'react';
import { PivotWord } from './structs';
import { Paper } from '@mui/material';
import { GridSortItem } from '@mui/x-data-grid';
import { TextDirection } from '../../structs';
import { AlignmentSide } from '../../common/data/project/corpus';

const meta: Meta<typeof PivotWordTable> = {
  title: 'Concordance View/PivotWordTable',
  component: PivotWordTable,
};

export default meta;

const pivotWords: PivotWord[] = [
  {
    side: AlignmentSide.TARGET,
    word: 'the',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'and',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'of',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'to',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'thus',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'so',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    word: 'as',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
];

export const Default = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <PivotWordTable
      sort={sortData}
      pivotWords={props.pivotWords}
      onChooseWord={props.onChooseWord}
      onChangeSort={onChangeSortDelegate}
    />
  );
};
Default.args = {
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;

export const WithScrollbar = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <Paper
      sx={{
        height: '200px',
      }}
    >
      <PivotWordTable
        sort={sortData}
        pivotWords={props.pivotWords}
        onChooseWord={props.onChooseWord}
        onChangeSort={onChangeSortDelegate}
      />
    </Paper>
  );
};
WithScrollbar.args = {
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;

export const Loading = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <PivotWordTable
      loading={props.loading}
      sort={sortData}
      pivotWords={props.pivotWords}
      onChooseWord={props.onChooseWord}
      onChangeSort={onChangeSortDelegate}
    />
  );
};
Loading.args = {
  loading: true,
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;
