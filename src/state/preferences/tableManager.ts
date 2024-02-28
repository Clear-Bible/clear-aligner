import { VirtualTable } from '../databaseManagement';

export enum ControlPanelFormat {
  VERTICAL,
  HORIZONTAL
}

export enum PreferenceKey {
  CONTROL_PANEL_FORMAT = "controlPanelFormat"
}

export interface UserPreference {
  name: PreferenceKey;
  value: unknown;
}


export class UserPreferenceTable extends VirtualTable {
  private readonly preferences: Map<PreferenceKey, UserPreference>;

  constructor() {
    super();
    this.preferences = UserPreferenceTable.initializePreferences();
  }

  private static initializePreferences(): Map<PreferenceKey, UserPreference> {
    const initialPreferences = new Map<PreferenceKey, UserPreference>();
    initialPreferences.set(PreferenceKey.CONTROL_PANEL_FORMAT, {
      name: PreferenceKey.CONTROL_PANEL_FORMAT,
      value: ControlPanelFormat.HORIZONTAL
    });
    return initialPreferences;
  }

  save = (userPreference: UserPreference, suppressOnUpdate?: boolean): UserPreference | undefined => {
    try {
      this.preferences.set(userPreference.name, userPreference);
    } catch (e) {
      return undefined;
    } finally {
      this.onUpdate(suppressOnUpdate);
    }
    return userPreference;
  };

  remove = (preferenceKey: PreferenceKey): boolean => {
    return this.preferences.delete(preferenceKey);
  };

  getPreferences = (): Map<PreferenceKey, UserPreference> => {
    return this.preferences;
  }

  getPreference = (preferenceKey: PreferenceKey): UserPreference | undefined => {
    return this.preferences.get(preferenceKey);
  }
}
