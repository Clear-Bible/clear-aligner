/**
 * This file creates the alignmentSlice for use with Redux state management.
 */
import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { LinkOriginManual, Link, LinkStatus, Word, EditedLink } from 'structs';
import { AlignmentMode } from './alignmentState';
import { AppState } from './app.slice';
import { TextSegmentState } from './textSegmentHover.slice';
import { StateWithHistory } from 'redux-undo';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { ResolvedLinkSuggestion } from '../common/data/project/linkSuggestion';
import { AlignmentSide } from '../common/data/project/corpus';

enum ToggleOperation {
  Undefined,
  OpenForCreate,
  OpenForEdit,
  EditingInProgress
}

export interface AlignmentState {
  inProgressLink: EditedLink | null;
  currentOperation?: ToggleOperation | null;
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

/**
 * apply the given suggestions (in order) to the given link
 * @param link link being edited
 * @param suggestions suggestions to be applied
 */
const applySuggestions = (link: Draft<EditedLink>|EditedLink|null, suggestions?: ResolvedLinkSuggestion[]): void => {
  if (!suggestions || !link) return;
  suggestions.forEach((suggestion) => {
    const tokenRef = BCVWP.parseFromString(suggestion.tokenRef);
    switch (suggestion.side) {
      case AlignmentSide.SOURCE:
        if (link.suggestedSources.map(BCVWP.parseFromString).some((ref) => BCVWP.compare(ref, tokenRef) === 0)) return;
        link.suggestedSources = [ ...link.suggestedSources, suggestion.tokenRef ].sort(BCVWP.compareString);
        break;
      case AlignmentSide.TARGET:
        if (link.suggestedTargets.map(BCVWP.parseFromString).some((ref) => BCVWP.compare(ref, tokenRef) === 0)) return;
        link.suggestedTargets = [ ...link.suggestedTargets, suggestion.tokenRef ].sort(BCVWP.compareString);
        break;
    }
  });
}

const alignmentSlice = createSlice({
  name: 'alignment',
  initialState,
  reducers: {
    loadInProgressLink: (state, action: PayloadAction<Link>) => {
      const { ...tmp } = EditedLink.fromLink(action.payload);
      state.inProgressLink = tmp;
    },

    /**
     * Submits suggested resolutions to the current {@link EditedLink}
     *
     * Note: only accepts resolution while in the {@link ToggleOperation.OpenForCreate} operation
     * @param state current state
     * @param action holds action payload
     */
    submitSuggestionResolution: (
      state,
      action: PayloadAction<{
        suggestions?: ResolvedLinkSuggestion[];
      }>
    ) => {
      if (state.currentOperation !== ToggleOperation.OpenForCreate) // do nothing
        return;
      applySuggestions(state.inProgressLink, action.payload.suggestions);
    },

    toggleTextSegment: (
      state,
      action: PayloadAction<{
        foundRelatedLinks: Link[];
        word: Word;
      }>
    ) => {
      const relatedLink = action.payload.foundRelatedLinks.find((_) => true);
      if (!state.inProgressLink) {
        if (relatedLink) { // edit
          state.currentOperation = ToggleOperation.OpenForEdit;
          const { ...tmpObject } = EditedLink.fromLink({
            id: relatedLink.id,
            metadata: relatedLink.metadata,
            sources: relatedLink.sources.map(BCVWP.sanitize),
            targets: relatedLink.targets.map(BCVWP.sanitize),
          });
          state.inProgressLink = tmpObject;
          return;
        } else { // create
          state.currentOperation = ToggleOperation.OpenForCreate;
          const { ...createdObject } = EditedLink.fromLink({
            metadata: {
              origin: LinkOriginManual,
              status: LinkStatus.CREATED
            },
            sources: [],
            targets: [],
          });
          state.inProgressLink = createdObject;
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
          }
          break;
      }
    },

    resetTextSegments: (state) => {
      state.inProgressLink = null;
      state.currentOperation = null;
    },
  },
});

export const { loadInProgressLink, submitSuggestionResolution, toggleTextSegment, resetTextSegments } =
  alignmentSlice.actions;

export default alignmentSlice.reducer;
