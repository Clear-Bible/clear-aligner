import React from 'react';

/**
 * mocks a set state action
 */
export const mockSetStateAction = <T>(): React.Dispatch<React.SetStateAction<T>> => {
  return (newState: T|((old: T) => T)) => {};
}
