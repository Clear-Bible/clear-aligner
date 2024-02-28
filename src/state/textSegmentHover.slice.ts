import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Word } from 'structs';

export interface TextSegmentState {
  hovered: Word | null;
}

const initialState: TextSegmentState = {
  hovered: null,
};

const textSegmentHoverSlice = createSlice({
  name: 'textSegmentHover',
  initialState,
  reducers: {
    hover: (state, action: PayloadAction<Word | null>) => {
      state.hovered = action.payload ? action.payload : null;
    },
  },
});

export const { hover } = textSegmentHoverSlice.actions;
export default textSegmentHoverSlice.reducer;
