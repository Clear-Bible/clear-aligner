import './App.css';
import './styles/theme.css';
import React, { createContext } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import { ProjectState } from './state/databaseManagement';
import { UserPreference } from './state/preferences/tableManager';
import ProjectsView from 'features/projects';
import { Project } from './state/projects/tableManager';
import useInitialization from './utils/useInitialization';
import { Containers } from './hooks/useCorpusContainers';

export interface AppContextProps {
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
  preferences: UserPreference | undefined;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreference | undefined>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  containers: Containers;
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {
  const appContext: AppContextProps = useInitialization();

  return (
    <>
      <AppContext.Provider value={appContext}>
        <Provider store={store}>
          <HashRouter>
            <Routes>
              <Route path={'/'} element={<AppLayout />}>
                <Route index element={<AlignmentEditor />} />
                <Route path={'/concordance'} element={<ConcordanceView />} />
                <Route path={'/projects'} element={<ProjectsView />} />
              </Route>
            </Routes>
          </HashRouter>
        </Provider>
      </AppContext.Provider>
    </>
  );
};

export default App;
