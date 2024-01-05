import { Meta } from '@storybook/react';
import { PivotWordTable, PivotWordTableProps } from './pivotWordTable';
import { useState } from 'react';
import { PivotWord } from './structs';
import { Paper } from '@mui/material';
import { GridSortItem } from '@mui/x-data-grid';
import { AlignmentSide, TextDirection } from '../../structs';

const meta: Meta<typeof PivotWordTable> = {
  title: 'Concordance View/PivotWordTable',
  component: PivotWordTable,
};

export default meta;

const pivotWords: PivotWord[] = [
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'the',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'and',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'of',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'to',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'thus',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'so',
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    },
    frequency: 1
  },
  {
    side: AlignmentSide.TARGET,
    normalizedText: 'as',
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
