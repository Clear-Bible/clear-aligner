import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';

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
