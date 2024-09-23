import { EnvironmentVariables } from '../structs/environmentVariables';
import { DatabaseApi } from '../hooks/useDatabase';

export const mockEnvironmentVars = (vars?: EnvironmentVariables) => {
  (window as any).environmentVariables = vars ?? {};
}

export const mockDatabaseApi = (api?: Partial<DatabaseApi>) => {
  (window as any).databaseApi = {
    getPreferences: async (requery) => ({}),
    ...api
  } as DatabaseApi;
}
