/**
 * This file creates the alignmentSlice for use with Redux state management.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LinkOriginManual, Link, LinkStatus, Word, EditedLink } from 'structs';
import { AlignmentMode } from './alignmentState';
import { AppState } from './app.slice';
import { TextSegmentState } from './textSegmentHover.slice';
import { StateWithHistory } from 'redux-undo';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { LinkSuggestion } from '../common/data/project/linkSuggestion';
import { AlignmentSide } from '../common/data/project/corpus';

export interface AlignmentState {
  inProgressLink: EditedLink | null;
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

enum ToggleOperation {
  Undefined,
  OpenForCreate,
  OpenForEdit,
  EditingInProgress
}

/**
 * apply the given suggestions (in order) to the given link
 * @param link link being edited
 * @param suggestions suggestions to be applied
 */
const applySuggestions = (link: EditedLink, suggestions?: LinkSuggestion[]): void => {
  if (!suggestions) return;
  suggestions.forEach((suggestion) => {
    switch (suggestion.side) {
      case AlignmentSide.SOURCE:
        link.suggestedSources.push(suggestion.token);
        break;
      case AlignmentSide.TARGET:
        link.suggestedTargets.push(suggestion.token);
        break;
    }
  });
}

const alignmentSlice = createSlice({
  name: 'alignment',
  initialState,
  reducers: {
    loadInProgressLink: (state, action: PayloadAction<Link>) => {
      state.inProgressLink = EditedLink.fromLink(action.payload);
    },

    toggleTextSegment: (
      state,
      action: PayloadAction<{
        foundRelatedLinks: Link[];
        suggestions?: LinkSuggestion[];
        word: Word;
      }>
    ) => {
      const relatedLink = action.payload.foundRelatedLinks.find((_) => true);
      let toggleOperation: ToggleOperation = ToggleOperation.Undefined;
      if (!state.inProgressLink) {
        if (relatedLink) { // edit
          toggleOperation = ToggleOperation.OpenForEdit;
          state.inProgressLink = EditedLink.fromLink({
            id: relatedLink.id,
            metadata: relatedLink.metadata,
            sources: relatedLink.sources.map(BCVWP.sanitize),
            targets: relatedLink.targets.map(BCVWP.sanitize),
          });
          return;
        } else { // create
          toggleOperation = ToggleOperation.OpenForCreate;
          state.inProgressLink = EditedLink.fromLink({
            metadata: {
              origin: LinkOriginManual,
              status: LinkStatus.CREATED
            },
            sources: [],
            targets: [],
          });
        }
      }

      // There is a partial in-progress link.
      switch (action.payload.word.side) {
        case 'sources':
          if (state.inProgressLink.sources.includes(action.payload.word.id)) { // remove token from sources
            state.inProgressLink.sources.splice(
              state.inProgressLink.sources.indexOf(action.payload.word.id),
              1
            );
          } else { // add token to sources
            state.inProgressLink.sources.push(action.payload.word.id);
          }
          break;
        case 'targets':
          if (state.inProgressLink.targets.includes(action.payload.word.id)) { // remove token from targets
            state.inProgressLink.targets.splice(
              state.inProgressLink.targets.indexOf(action.payload.word.id),
              1
            );
          } else { // add token to targets
            state.inProgressLink.targets.push(action.payload.word.id);
            if (toggleOperation === ToggleOperation.OpenForCreate
              && action.payload.suggestions
              && action.payload.suggestions.length > 0) {
              applySuggestions(state.inProgressLink, action.payload.suggestions);
            }
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
