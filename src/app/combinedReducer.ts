/**
 * This file combines the various reducers into a single combinedReducer object
 */
import undoable from 'redux-undo';

import AppReducer from 'state/app.slice';
import AlignmentReducer from 'state/alignment.slice';
import TextSegmentHoverReducer from 'state/textSegmentHover.slice';

export const reducer = {
  reducer: {
    app: AppReducer,
    alignment: undoable(AlignmentReducer, { limit: 10 }),
    textSegmentHover: TextSegmentHoverReducer,
  },
};

export default reducer;
