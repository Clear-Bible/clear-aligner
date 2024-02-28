import { Alignment, Word } from 'structs';
import findRelatedAlignments from 'helpers/findRelatedAlignments';

const testAlignments: Alignment[] = [
  {
    links: [
      { sources: ['regular_8'], targets: ['goofy_7'] },
      { sources: ['regular_1'], targets: ['goofy_2'] },
    ],
    polarity: {
      type: 'primary',
      syntaxSide: 'sources',
      nonSyntaxSide: 'targets',
    },
  },
  {
    links: [{ sources: ['specific_1', 'specific_2'], targets: ['generic_4'] }],
    polarity: {
      type: 'primary',
      syntaxSide: 'sources',
      nonSyntaxSide: 'targets',
    },
  },
];

const testWord: Word = {
  id: 'regular_8',
  corpusId: 'regular',
  side: 'sources',
  text: 'asdf',
  position: 8,
};
//const testWord1: Word = {
//id: 'goofy_7',
//corpusId: 'regular',
//text: 'fdsa',
//position: 7,
//};

describe('findRelatedAlignments', () => {
  it('filters Alignment by Word', () => {
    expect(testAlignments.length).toBe(2);
  });

  it('filters Link by Word', () => {});
});
