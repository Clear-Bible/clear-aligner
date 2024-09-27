import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import React from 'react';

/**
 * produce a mock of preferences with select overrides
 * @param prefs partial (optional) for overriding default property valiues
 */
export const mockPreferences = (prefs?: Partial<UserPreference>): UserPreference => {
  return {
    id: 'prefs-id',
    bcv: null,
    alignmentDirection: '',
    page: '',
    showGloss: false,
    currentProject: '',
    initialized: InitializationStates.INITIALIZED,
    ...prefs
  };
}

/**
 * produce a mock for setPreferences
 * @param initialPrefs initial values to use for preferences
 * @param onChange callback to be invoked when the setPreferences function is changed
 */
export const mockSetPreferences = (initialPrefs?: Partial<UserPreference>, onChange?: (p: UserPreference) => void): React.Dispatch<React.SetStateAction<UserPreference|undefined>> => {
  const initialValue = mockPreferences(initialPrefs);
  return ((s: UserPreference | ((p: UserPreference|undefined) => UserPreference)) => {
    if (typeof s === 'function') {
      onChange?.(s(initialValue));
    } else {
      onChange?.(s);
    }
  }) as React.Dispatch<React.SetStateAction<UserPreference|undefined>>;
}
