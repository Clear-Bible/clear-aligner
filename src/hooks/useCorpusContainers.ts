/**
 * This file contains the useCorpusContainers hook, which returns the source
 * corpus container and the target corpus container.
 */
import { CorpusContainer } from '../structs';
import { useContext } from 'react';
import { AppContext } from '../App';

export interface Containers {
  projectId?: string;
  sourceContainer?: CorpusContainer;
  targetContainer?: CorpusContainer;
}

export const useCorpusContainers = (): Containers => {
  const appContextProps = useContext(AppContext);

  return appContextProps.containers;
};
