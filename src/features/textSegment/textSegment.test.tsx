import { renderWithProvider, RootState } from 'test/harness';
import preloadedState from 'test/preloadedState';
import { AlignmentMode } from 'state/alignment.slice';
import TextSegment from 'features/textSegment';

const testState: RootState = {
  ...preloadedState,
  alignment: {
    ...preloadedState.alignment,
    present: {
      alignments: [
        {
          links: [],
          polarity: {
            type: 'primary',
            syntaxSide: 'sources',
            nonSyntaxSide: 'targets',
          },
        },
      ],
      corpora: [],
      inProgressLink: {
        sources: ['sbl_0'],
        targets: [],
      },
      mode: AlignmentMode.CleanSlate,
    },
  },
};
describe('TextSegment', () => {
  it('renders without crashing', () => {
    renderWithProvider(
      <TextSegment
        word={{
          id: 'test_1',
          corpusId: 'test',
          side: 'targets',
          text: 'mikey',
          position: 0,
        }}
      />,
      null
    );
  });

  it('is selected', () => {
    const { getByText } = renderWithProvider(
      <TextSegment
        word={{
          id: 'sbl_0',
          corpusId: 'sbl',
          side: 'sources',
          text: 'mikey',
          position: 0,
        }}
      />,
      testState
    );
    // BLURG, custom css properties don't work with js-dom.
    // See https://github.com/jsdom/cssstyle/pull/127
    // and https://github.com/testing-library/jest-dom/issues/322
    // code:
    //expect(textSegment.style.backgroundColor).toEqual('black');
  });
});
