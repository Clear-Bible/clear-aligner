import { Containers } from '../../hooks/useCorpusContainers';

/**
 * mock out containers with selective stubbing
 * @param containers partial to allow overriding of specific properties
 */
export const mockContainers = (containers?: Partial<Containers>): Containers => {
  return {
    ...containers
  };
};
