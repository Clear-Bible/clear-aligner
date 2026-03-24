import { ProjectState } from '../../state/databaseManagement';
import { LinksTable } from '../../state/links/tableManager';
import { ProjectTable } from '../../state/projects/tableManager';
import { UserPreferenceTable } from '../../state/preferences/tableManager';
import mocked = jest.mocked;

export const mockProjectState = (ps?: Partial<ProjectState>): ProjectState => {
  const MockLinksTable = mocked(new LinksTable());
  const MockProjectTable = mocked(new ProjectTable());
  const MockUserPreferenceTable = mocked(new UserPreferenceTable());
  return {
    linksTable: MockLinksTable,
    projectTable: MockProjectTable,
    userPreferenceTable: MockUserPreferenceTable,
    ...ps,
  };
};
