import { EnvironmentVariables } from '../structs/environmentVariables';
import { DatabaseApi } from '../hooks/useDatabase';

/**
 * mock the environment variables from Node on the window api
 * @param vars override values
 */
export const mockEnvironmentVarsOnWindow = (vars?: EnvironmentVariables) => {
  (window as any).environmentVariables = vars ?? {};
}

/**
 * create a mock of the {@link DatabaseApi}
 * @param api override values
 */
export const mockDatabaseApi = (api?: Partial<DatabaseApi>) => {
  return {
    getPreferences: async (requery) => ({}),
    toggleCorporaUpdatedFlagOff: async (projectId: string) => undefined,
    ...api
  } as DatabaseApi;
}

/**
 * creates a mock with the given override values on the window object of the {@link DatabaseApi}
 * @param api override values
 */
export const mockDatabaseApiOnWindow = (api?: Partial<DatabaseApi>) => {
  (window as any).databaseApi = mockDatabaseApi(api);
}
