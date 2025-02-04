/**
 * This file contains the tests for the TextSegment component.
 */
import { renderWithProvider, RootState } from 'test/harness';
import preloadedState from 'test/preloadedState';
import TextSegment from 'features/textSegment';
import { LinkOriginManual, LinkStatus } from '../../structs';
import { AlignmentSide } from '../../common/data/project/corpus';

const testState: RootState = {
  ...preloadedState,
  alignment: {
    ...preloadedState.alignment,
    present: {
      inProgressLink: {
        metadata: {
          origin: LinkOriginManual,
          status: LinkStatus.CREATED,
        },
        sources: ['sbl_0'],
        targets: [],
        suggestedSources: [],
        suggestedTargets: [],
      },
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
          side: AlignmentSide.TARGET,
          text: 'mikey',
          position: 0,
          normalizedText: 'mikey',
        }}
      />,
      null
    );
  });

  it('is selected', () => {
    renderWithProvider(
      <TextSegment
        word={{
          id: 'sbl_0',
          corpusId: 'sbl',
          side: AlignmentSide.SOURCE,
          text: 'mikey',
          position: 0,
          normalizedText: 'mikey',
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
