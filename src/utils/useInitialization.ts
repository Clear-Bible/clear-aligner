import React, { useCallback, useEffect, useState } from 'react';
import { Project, ProjectTable } from '../state/projects/tableManager';
import { UserPreference, UserPreferenceTable } from '../state/preferences/tableManager';
import { ProjectState } from '../state/databaseManagement';
import { DefaultProjectName, LinksTable } from '../state/links/tableManager';
import { AppContextProps } from '../App';
import { Containers } from '../hooks/useCorpusContainers';
import { getAvailableCorporaContainers, InitializationStates } from '../workbench/query';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

const useInitialization = () => {
  const isLoaded = React.useRef(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreference | undefined>();
  const [state, setState] = useState({} as ProjectState);
  const [containers, setContainers] = useState<Containers>({});

  const setUpdatedPreferences = useCallback((updatedPreferences?: UserPreference) => {
    updatedPreferences && state.userPreferenceTable?.saveOrUpdate(updatedPreferences);
  }, [state.userPreferenceTable]);

  useEffect(() => {
    setUpdatedPreferences(preferences);
  }, [preferences, setUpdatedPreferences]);

  /*
   * if there's no bcv saved or the corpus for the current project doesn't contain the currently saved bcv, update it to be within the available words
   */
  const checkIfBCVIsOkay = useCallback(() => {
    if (!containers?.targetContainer) return;
    if (!preferences?.bcv
      || !containers.targetContainer?.corpusAtReferenceString(preferences.bcv.toReferenceString())
      || !containers.targetContainer?.corpusAtReferenceString(preferences.bcv.toReferenceString())?.wordsByVerse[preferences.bcv.toTruncatedReferenceString(BCVWPField.Verse)]) {
      const targetWord = containers.targetContainer?.corpora.find(_ => true)?.words.find(_ => true);
      if (targetWord) {
        const newPosition = BCVWP.parseFromString(targetWord.id);
        setPreferences((oldPreferences): UserPreference => ({
          ...oldPreferences as UserPreference,
          bcv: newPosition
        }));
      }
    }
  }, [preferences?.bcv, containers.targetContainer, setPreferences]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => checkIfBCVIsOkay(), [containers.targetContainer, checkIfBCVIsOkay]);

  useEffect(() => {
    const loadContainers = async () => {
      console.time('loading corpora');
      const newContainers = (await getAvailableCorporaContainers({
        projectState: state,
        setProjectState: setState,
        preferences,
        setPreferences,
        projects,
        setProjects
      } as AppContextProps));
      console.timeEnd('loading corpora');
      setContainers(newContainers);
      setPreferences((oldPreferences) => ({
        ...(oldPreferences ?? {}) as UserPreference,
        initialized: InitializationStates.INITIALIZED
      }));
    };
    if (containers?.projectId !== preferences?.currentProject || !containers.sourceContainer || !containers.targetContainer || preferences?.initialized !== InitializationStates.INITIALIZED) {
      void loadContainers();
    }
  }, [preferences, preferences?.currentProject, projects, containers, setContainers, state]);

  useEffect(() => {
    if (!isLoaded.current) {
      const currLinksTable = state.linksTable ?? new LinksTable();
      const currProjectTable = state.projectTable ?? new ProjectTable();
      const currUserPreferenceTable = state.userPreferenceTable ?? new UserPreferenceTable();

      setState({
        ...state,
        linksTable: currLinksTable,
        projectTable: currProjectTable,
        userPreferenceTable: currUserPreferenceTable
      });
      const initializeProject = () => new Promise((resolve) => {
        let projects: Project[] = [];
        currProjectTable.getProjects(true).then(res => {
          projects = [...res!.values()];
          setProjects(projects);
          resolve(projects);
        });
      }).then(() => {
        currUserPreferenceTable.getPreferences(true).then((res: UserPreference | undefined) => {
          setPreferences({
            ...(res ?? {}) as UserPreference,
            currentProject: res?.currentProject
              ?? projects?.[0]?.id
              ?? DefaultProjectName
          });
          currLinksTable.setSourceName(res?.currentProject
            ?? projects?.[0]?.id
            ?? DefaultProjectName);
        });
      });
      initializeProject().catch(console.error);
      isLoaded.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    projectState: state,
    setProjectState: setState,
    preferences,
    setPreferences,
    projects,
    setProjects,
    containers
  } as AppContextProps;
};

export default useInitialization;
