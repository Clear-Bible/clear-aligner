import { AppContext, AppContextProps } from '../App';
import { ProjectState } from '../state/databaseManagement';
import React from 'react';
import { UserPreference } from '../state/preferences/tableManager';
import { Project } from '../state/projects/tableManager';
import { mockProjectState } from './mockModules/mockProjectState';
import { mockSetStateAction } from './mockModules/react';
import { mockContainers } from './mockModules/corpora';
import { userState } from '../features/profileAvatar/profileAvatar';

/**
 * mock the application context
 * @param ctx override parameters as desired here
 */
export const mockContext = (
  ctx?: Partial<AppContextProps>
): AppContextProps => {
  return {
    projectState: mockProjectState(ctx?.projectState),
    setProjectState: mockSetStateAction<ProjectState>(),
    setPreferences: mockSetStateAction<UserPreference>(),
    projects: [],
    setProjects: mockSetStateAction<Project[]>(),
    containers: mockContainers(),
    network: {
      online: true,
      downlink: null,
      downlinkMax: null,
      effectiveType: null,
      rtt: null,
      saveData: null,
      type: null,
    },
    userStatus: userState.LoggedIn,
    setUserStatus: mockSetStateAction(),
    isSnackBarOpen: false,
    setIsSnackBarOpen: mockSetStateAction(),
    snackBarObject: false,
    setSnackBarObject: mockSetStateAction(),
    setContainers: mockSetStateAction(),
    isProjectDialogOpen: false,
    setIsProjectDialogOpen: mockSetStateAction(),
    isBusyDialogOpen: false,
    setIsBusyDialogOpen: mockSetStateAction(),
    ...ctx,
  } as AppContextProps;
};

/**
 * returns a component with a context provider produced by {@link mockContext}
 * @param ctx parameters the tester wishes to override
 */
export const mockContextWithWrapper = (ctx?: Partial<AppContextProps>) => {
  // @ts-ignore
  return ({ children }) => (
    <AppContext.Provider value={mockContext(ctx)}>
      {children}
    </AppContext.Provider>
  );
};
