import { Meta } from '@storybook/react';
import { AlignedWordTable, AlignedWordTableProps } from './alignedWordTable';
import { GridSortItem } from '@mui/x-data-grid';
import { useState } from 'react';
import { AlignedWord } from './structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';

const meta: Meta<typeof AlignedWordTable> = {
  title: 'Concordance View/AlignedWordTable',
  component: AlignedWordTable,
};

export default meta;

export const Default = (props: AlignedWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <AlignedWordTable
      {...props}
      sort={sortData}
      onChangeSort={onChangeSortDelegate}
    />
  );
};

Default.args = {
  alignedWords: [
    {
      id: 'the',
      frequency: 73_611,
      sourceTextId: 'srcId',
      targetTextId: 'tgtId',
      sourceWordTexts: [
        {
          text: 'the',
          position: BCVWP.parseFromString(
            '010010010011'
          ).toTruncatedReferenceString(BCVWPField.Word),
        },
      ],
      targetWordTexts: [
        {
          text: 'der',
          position: BCVWP.parseFromString(
            '010010010011'
          ).toTruncatedReferenceString(BCVWPField.Word),
        },
      ],
      alignments: [],
    } as AlignedWord,
  ],
} as AlignedWordTableProps;
