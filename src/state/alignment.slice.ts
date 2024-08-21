/**
 * This file creates the alignmentSlice for use with Redux state management.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LinkOriginManual, Link, LinkStatus, Word } from 'structs';
import { AlignmentMode } from './alignmentState';
import { AppState } from './app.slice';
import { TextSegmentState } from './textSegmentHover.slice';
import { StateWithHistory } from 'redux-undo';
import BCVWP from '../features/bcvwp/BCVWPSupport';

export interface AlignmentState {
  inProgressLink: Link | null;
}

export const initialState: AlignmentState = {
  inProgressLink: null,
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
        if (relatedLink) { // edit
          state.inProgressLink = {
            id: relatedLink.id,
            metadata: relatedLink.metadata,
            sources: relatedLink.sources.map(BCVWP.sanitize),
            targets: relatedLink.targets.map(BCVWP.sanitize),
          };
          return;
        } else { // create
          state.inProgressLink = {
            metadata: {
              origin: LinkOriginManual,
              status: LinkStatus.CREATED
            },
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
  },
});

export const { loadInProgressLink, toggleTextSegment, resetTextSegments } =
  alignmentSlice.actions;

export default alignmentSlice.reducer;
