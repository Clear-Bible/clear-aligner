import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Link, Word } from 'structs';
import { AlignmentMode } from './alignmentState';
import { AppState } from './app.slice';
import { TextSegmentState } from './textSegmentHover.slice';
import { StateWithHistory } from 'redux-undo';
import BCVWP from '../features/bcvwp/BCVWPSupport';

export interface AlignmentState {
  inProgressLink: Link | null;
  suggestedTokens: Word[];
}

export const initialState: AlignmentState = {
  inProgressLink: null,
  suggestedTokens: [],
};

export const selectAlignmentMode = (state: {
  app: AppState;
  alignment: StateWithHistory<AlignmentState>;
  textSegmentHover: TextSegmentState;
}): AlignmentMode => {
  const { inProgressLink } = state.alignment.present;
  if (!inProgressLink) {
    return AlignmentMode.CleanSlate;
  }
  if (inProgressLink.id) {
    // edit
    if (
      inProgressLink.sources.length > 0 &&
      inProgressLink.targets.length > 0
    ) {
      return AlignmentMode.Edit;
    }
    return AlignmentMode.PartialEdit;
  } else {
    // create
    if (
      inProgressLink.sources.length > 0 &&
      inProgressLink.targets.length > 0
    ) {
      return AlignmentMode.Create;
    }
    return AlignmentMode.PartialCreate;
  }
};

const alignmentSlice = createSlice({
  name: 'alignment',
  initialState,
  reducers: {
    loadInProgressLink: (state, action: PayloadAction<Link>) => {
      state.inProgressLink = action.payload;
    },

    toggleTextSegment: (
      state,
      action: PayloadAction<{ foundRelatedLinks: Link[]; word: Word }>
    ) => {
      const relatedLink = action.payload.foundRelatedLinks.find((_) => true);
      if (!state.inProgressLink) {
        if (relatedLink) {
          state.inProgressLink = {
            id: relatedLink.id,
            sources: relatedLink.sources.map(BCVWP.sanitize),
            targets: relatedLink.targets.map(BCVWP.sanitize),
          };
          return;
        } else {
          state.inProgressLink = {
            sources: [],
            targets: [],
          };
        }
      }

      // There is a partial in-progress link.
      switch (action.payload.word.side) {
        case 'sources':
          if (state.inProgressLink.sources.includes(action.payload.word.id)) {
            state.inProgressLink.sources.splice(
              state.inProgressLink.sources.indexOf(action.payload.word.id),
              1
            );
          } else {
            state.inProgressLink.sources.push(action.payload.word.id);
          }
          break;
        case 'targets':
          if (state.inProgressLink.targets.includes(action.payload.word.id)) {
            state.inProgressLink.targets.splice(
              state.inProgressLink.targets.indexOf(action.payload.word.id),
              1
            );
          } else {
            state.inProgressLink.targets.push(action.payload.word.id);
          }
          break;
      }
    },

    resetTextSegments: (state) => {
      state.inProgressLink = null;
    },
    suggestTokens: (state, action: PayloadAction<Word[] | undefined>) => {
      console.log('suggestTokens', action.payload);
      if (action.payload) {
        state.suggestedTokens = action.payload;
      }
    },
    clearSuggestions: (state) => {
      state.suggestedTokens = [];
    },
  },
});

export const {
  loadInProgressLink,
  toggleTextSegment,
  resetTextSegments,
  suggestTokens,
  clearSuggestions,
} = alignmentSlice.actions;

export default alignmentSlice.reducer;
