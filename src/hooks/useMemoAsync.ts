import { useEffect, useState } from 'react';

/**
 * helper to allow use of useMemo with asynchronous functions
 * @param f factory function
 * @param deps dependency array
 */
export const useMemoAsync = <T>(f: () => Promise<T>, deps: React.DependencyList) => {
  const [ state, setState ] = useState<T>();

  useEffect(() => {
    const load = async () => {
      const result = await f();
      setState(result);
    };
    void load();
  },
    // disable eslint deps inspection due to use of spread operator
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [ ...deps ]);

  return state;
}
