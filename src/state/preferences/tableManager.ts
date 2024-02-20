import { VirtualTable } from '../databaseManagement';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import uuid from 'uuid-random';
import { DefaultProjectName } from '../links/tableManager';
import { InitializationStates } from '../../workbench/query';

export enum ControlPanelFormat {
  VERTICAL,
  HORIZONTAL
}

export interface UserPreference {
  id: string;
  bcv: BCVWP | null;
  alignmentDirection: string;
  page: string;
  showGloss: boolean;
  currentProject: string;
  initialized?: InitializationStates;
}

interface UserPreferenceDto {
  id: string;
  bcv: string;
  alignment_view: string;
  current_project: string;
  page: string;
  show_gloss: boolean;
}

const initialPreferences = {
  id: uuid(),
  bcv: null,
  alignmentDirection: ControlPanelFormat[ControlPanelFormat.HORIZONTAL],
  page: '',
  showGloss: false,
  currentProject: DefaultProjectName
};

export class UserPreferenceTable extends VirtualTable {
  private preferences: UserPreference;

  constructor() {
    super();
    this.preferences = initialPreferences;
  }

  saveOrUpdate = async (nextPreference: UserPreference, suppressOnUpdate = true): Promise<UserPreference | undefined> => {
    try {
      const prevPreferences = await this.getPreferences(true);
      // @ts-ignore
      await window.databaseApi.createOrUpdatePreferences(
        UserPreferenceTable.convertToDto({ ...prevPreferences, ...nextPreference }));
      await this.getPreferences(true);
    } catch (e) {
      return undefined;
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  getPreferences = async (requery = false): Promise<UserPreference> => {
    if (requery) {
      // @ts-ignore
      const preferences = await window.databaseApi.getPreferences();
      if (preferences) {
        this.preferences = {
          id: preferences?.id,
          page: preferences?.page,
          showGloss: preferences?.show_gloss,
          alignmentDirection: preferences?.alignment_view,
          currentProject: preferences?.current_project ?? DefaultProjectName,
          bcv: preferences?.bcv ? BCVWP.parseFromString(preferences.bcv.trim()) : null
        };
      }
    }

    return this.preferences;
  };

  getFirstBcvFromSource = async (sourceName: string, suppressOnUpdate?: boolean): Promise<{ id?: string }> => {
    try {
      // @ts-ignore
      return await window.databaseApi.getFirstBcvFromSource(sourceName);
    } catch (e) {
      return {};
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  getPreferencesSync = () => this.preferences;

  private static convertToDto = (userPreference: UserPreference): UserPreferenceDto => {
    return {
      id: userPreference.id ?? uuid(),
      bcv: (userPreference.bcv?.toReferenceString() ?? '').trim(),
      alignment_view: userPreference.alignmentDirection ?? ControlPanelFormat[ControlPanelFormat.HORIZONTAL],
      current_project: userPreference.currentProject ?? DefaultProjectName,
      page: userPreference.page,
      show_gloss: !!userPreference.showGloss
    };
  };
}
