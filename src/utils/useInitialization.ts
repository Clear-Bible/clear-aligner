/**
 * This file contains the useInitialization hook which returns the App Context
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Project, ProjectTable } from '../state/projects/tableManager';
import {
  UserPreference,
  UserPreferenceTable,
} from '../state/preferences/tableManager';
import { ProjectState } from '../state/databaseManagement';
import { LinksTable } from '../state/links/tableManager';
import { AppContextProps } from '../App';
import { Containers } from '../hooks/useCorpusContainers';
import {
  getAvailableCorporaContainers,
  InitializationStates,
} from '../workbench/query';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';
import { useInterval } from 'usehooks-ts';
import { useNetworkState } from '@uidotdev/usehooks';
import { userState } from '../features/profileAvatar/profileAvatar';
import { getCurrentUser } from 'aws-amplify/auth';
import { EnvironmentVariables } from '../structs/environmentVariables';
import { FeaturePreferences } from '../common/data/featurePreferences';
import { pickDeFactoCurrentProject } from '../api/projects/pickDeFactoCurrentProject';
import { SnackBarObjectInterface } from '../features/snackbar';

const environmentVariables = (window as any)
  .environmentVariables as EnvironmentVariables;

const useInitialization = (): AppContextProps => {
  const isLoaded = React.useRef(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [preferences, setPreferences] = React.useState<
    UserPreference | undefined
  >();
  const [state, setState] = useState({} as ProjectState);
  const [containers, setContainers] = useState<Containers>({});
  const [userStatus, setUserStatus] = React.useState<{
    color: string;
    label: string;
  }>(userState.LoggedOut);
  const network = useNetworkState();
  const [isSnackBarOpen, setIsSnackBarOpen] = React.useState(false);
  const [snackBarObject, setSnackBarObject] = React.useState(
    {} as SnackBarObjectInterface
  );
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [isBusyDialogOpen, setIsBusyDialogOpen] = useState<boolean>(false);
  const [features, setFeatures] = useState<FeaturePreferences>({
    enableTokenSuggestions: true, // defaults to enabled
  });

  useEffect(() => {
    if (!preferences?.isFirstLaunch) {
      return;
    }
    window.location.reload();
    setPreferences((oldPreferences) => ({
      ...((oldPreferences ?? {}) as UserPreference),
      isFirstLaunch: false,
    }));
  }, [preferences?.isFirstLaunch, setPreferences]);

  const setUpdatedPreferences = useCallback(
    (updatedPreferences?: UserPreference) => {
      updatedPreferences &&
        state.userPreferenceTable?.saveOrUpdate(updatedPreferences);
    },
    [state.userPreferenceTable]
  );

  useInterval(async () => {
    const currentProjects = await state.projectTable?.getProjects(false);
    if (!currentProjects?.size) {
      state.projectTable?.getProjects(true).then((res) => {
        res && setProjects((p) => [...(res.values() ?? p)]);
      });
    }
  }, 1_000);

  useEffect(() => {
    setUpdatedPreferences(preferences);
  }, [preferences, setUpdatedPreferences]);

  /*
   * if there's no bcv saved or the corpus for the current project doesn't contain the currently saved bcv, update it to be within the available words
   */
  const checkIfBCVIsOkay = useCallback(() => {
    if (!containers?.targetContainer) return;
    if (
      !preferences?.bcv ||
      !containers.targetContainer?.corpusAtReferenceString(
        preferences.bcv.toReferenceString()
      ) ||
      !containers.targetContainer?.corpusAtReferenceString(
        preferences.bcv.toReferenceString()
      )?.wordsByVerse[
        preferences.bcv.toTruncatedReferenceString(BCVWPField.Verse)
      ]
    ) {
      const targetWord = containers.targetContainer?.corpora
        .find((_) => true)
        ?.words.find((_) => true);
      if (targetWord) {
        const newPosition = BCVWP.parseFromString(targetWord.id);
        setPreferences(
          (oldPreferences): UserPreference => ({
            ...(oldPreferences as UserPreference),
            bcv: newPosition,
          })
        );
      }
    }
  }, [preferences?.bcv, containers.targetContainer, setPreferences]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => checkIfBCVIsOkay(),
    [containers.targetContainer, checkIfBCVIsOkay]
  );

  useEffect(() => {
    const loadContainers = async () => {
      console.time('loading corpora');
      const newContainers = await getAvailableCorporaContainers({
        projectState: state,
        setProjectState: setState,
        preferences,
        setPreferences,
        projects,
        setProjects,
      } as AppContextProps);
      console.timeEnd('loading corpora');
      setContainers(newContainers);
      setPreferences((oldPreferences) => ({
        ...((oldPreferences ?? {}) as UserPreference),
        initialized: InitializationStates.INITIALIZED,
      }));
    };
    if (
      !!preferences?.currentProject &&
      (containers?.projectId !== preferences?.currentProject ||
        !containers.sourceContainer ||
        !containers.targetContainer ||
        preferences?.initialized !== InitializationStates.INITIALIZED)
    ) {
      void loadContainers();
    }
  }, [
    preferences,
    preferences?.initialized,
    preferences?.currentProject,
    projects,
    containers,
    setContainers,
    state,
  ]);

  useEffect(() => {
    if (!isLoaded.current) {
      const currLinksTable = state.linksTable ?? new LinksTable();
      const currProjectTable = state.projectTable ?? new ProjectTable();
      const currUserPreferenceTable =
        state.userPreferenceTable ?? new UserPreferenceTable();

      setState({
        ...state,
        linksTable: currLinksTable,
        projectTable: currProjectTable,
        userPreferenceTable: currUserPreferenceTable,
      });
      const initializeProject = () =>
        new Promise<Project[]>((resolve) => {
          let projects: Project[] = [];
          currProjectTable.getProjects(true).then((res) => {
            projects = [...res!.values()];
            setProjects(projects);
            resolve(projects);
          });
        }).then((projectsList: Project[]) => {
          currUserPreferenceTable
            .getPreferences(true)
            .then((res: UserPreference | undefined) => {
              const currentProjectId = pickDeFactoCurrentProject(
                projectsList,
                res?.currentProject
              );
              setPreferences({
                ...((res ?? {}) as UserPreference),
                currentProject: currentProjectId,
              });
              currLinksTable.setSourceName(currentProjectId);
            });
        });
      initializeProject().catch(console.error);
      isLoaded.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update UserStatus
  useEffect(() => {
    const getCurrentUserDetails = async () => {
      if (environmentVariables.caApiEndpoint && network.online) {
        setUserStatus(userState.CustomEndpoint);
        return;
      }
      try {
        await getCurrentUser();
        setUserStatus(userState.LoggedIn);
      } catch (error) {
        setUserStatus(userState.LoggedOut);
      }
    };
    if (network.online) {
      getCurrentUserDetails();
    } else {
      setUserStatus(userState.Offline);
    }
  }, [network]);

  // trigger snackbar messages indicating network status
  useEffect(() => {
    if (network && network.online) {
      setSnackBarObject({
        message: 'Internet Connection Detected.',
        autoHide: true,
      });
      setIsSnackBarOpen(true);
    } else {
      setSnackBarObject({ message: 'No internet connection.', autoHide: true });
      setIsSnackBarOpen(true);
    }
  }, [network]);

  return {
    projectState: state,
    setProjectState: setState,
    preferences,
    setPreferences,
    projects,
    setProjects,
    containers,
    setContainers,
    network,
    userStatus,
    setUserStatus,
    isSnackBarOpen,
    setIsSnackBarOpen,
    snackBarObject,
    setSnackBarObject,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    isBusyDialogOpen,
    setIsBusyDialogOpen,
    features,
    setFeatures,
  };
};

export default useInitialization;
