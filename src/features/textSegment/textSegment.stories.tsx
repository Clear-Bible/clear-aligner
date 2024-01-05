import { Meta } from '@storybook/react';
import TextSegment, { TextSegmentProps } from './index';
import { Corpus, Word } from '../../structs';

const meta: Meta<typeof TextSegment> = {
  title: 'TextSegment',
  component: TextSegment,
};

export default meta;

export const Default = (props: TextSegmentProps) => {
  return <TextSegment {...props} />;
};

Default.args = {
  corpus: {} as Corpus,
  word: {} as Word,
} as TextSegmentProps;
