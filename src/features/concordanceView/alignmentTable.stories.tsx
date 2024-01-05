import { Meta } from '@storybook/react';
import { AlignmentTable, AlignmentTableProps } from './alignmentTable';

const meta: Meta<typeof AlignmentTable> = {
  title: 'Concordance View/AlignmentTable',
  component: AlignmentTable,
};

export default meta;

export const Default = (props: AlignmentTableProps) => {
  return (
    <AlignmentTable
      {...props}
    />
  );
};

Default.args = {
} as AlignmentTableProps;
