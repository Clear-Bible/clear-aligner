import { RootState } from 'test/harness';

const preloadedState: RootState = {
  app: { debug: false, theme: 'day', corpusViewports: [], scrollLock: false },
  alignment: {
    past: [],
    present: {
      inProgressLink: null,
    },
    future: [],
    group: null,
    _latestUnfiltered: {
      inProgressLink: null,
    },
    index: 0,
    limit: 1,
  },
  textSegmentHover: { hovered: null },
};

export default preloadedState;
