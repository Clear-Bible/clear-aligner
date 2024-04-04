import { RootState } from 'test/harness';

const preloadedState: RootState = {
  app: { debug: false, theme: 'day', corpusViewports: [], scrollLock: false },
  alignment: {
    past: [],
    present: {
      inProgressLink: null,
      suggestedTokens: [],
    },
    future: [],
    group: null,
    _latestUnfiltered: {
      inProgressLink: null,
      suggestedTokens: [],
    },
    index: 0,
    limit: 1,
  },
  textSegmentHover: { hovered: null },
};

export default preloadedState;
