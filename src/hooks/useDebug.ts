/**
 * This file contains the useDebug hook used to log component level debugging
 * info using the arguments passed to this hook.
 */
import { useAppSelector } from 'app/hooks';

const useDebug = (componentName: string, ...args: string[]): void => {
  const isDebug = useAppSelector((state) => state.app.debug === true);

  if (isDebug) {
    console.log.apply(console, [componentName, ...args]);
  }
};

export default useDebug;
