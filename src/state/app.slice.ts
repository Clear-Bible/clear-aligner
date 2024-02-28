import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CorpusViewport } from 'structs';

export interface AppState {
  debug: boolean;
  theme: 'night' | 'day';
  corpusViewports: CorpusViewport[];
  scrollLock: boolean;
}

const initialState: AppState = {
  debug: false,
  theme: 'night',
  corpusViewports: [],
  scrollLock: true,
};

const CORPUS_VIEWPORT_MAX = 4;

interface AddCorpusRequest {
  // Corpus IDs that do not have a current viewport
  availableCorpora: string[];
}

interface ChangeCorpusRequest {
  viewportIndex: number;
  newViewport: CorpusViewport;
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    debug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },
    setTheme: (state, action: PayloadAction<'night' | 'day'>) => {
      state.theme = action.payload;
    },
    addCorpusViewport: (state, action: PayloadAction<AddCorpusRequest>) => {
      if (state.corpusViewports.length < CORPUS_VIEWPORT_MAX) {
        if (action.payload.availableCorpora.length > 0) {
          state.corpusViewports = state.corpusViewports.concat({
            containerId: action.payload.availableCorpora[0],
          });
          return;
        }

        state.corpusViewports.push({ containerId: null });
      }
    },
    removeCorpusViewport: (state) => {
      if (state.corpusViewports.length > 0) {
        state.corpusViewports = state.corpusViewports.slice(
          0,
          state.corpusViewports.length - 1
        );
      }
    },
    changeCorpusViewport: (
      state,
      action: PayloadAction<ChangeCorpusRequest>
    ) => {
      state.corpusViewports[action.payload.viewportIndex] =
        action.payload.newViewport;
    },
    toggleScrollLock: (state) => {
      state.scrollLock = !state.scrollLock;
    },
  },
});

export const {
  debug,
  setTheme,
  addCorpusViewport,
  removeCorpusViewport,
  changeCorpusViewport,
  toggleScrollLock,
} = appSlice.actions;
export default appSlice.reducer;
