/**
 * This file initializes the testing harness with React Testing Library
 */
import { ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import { Provider } from 'react-redux';

import { RootState } from 'app/store';
import combinedReducer from 'app/combinedReducer';

export const renderWithProvider = (
  componentToRender: ReactElement,
  preloadedState: any
) => {
  const storeConfig = { ...combinedReducer };
  let store = null;

  if (preloadedState) {
    store = configureStore({ ...storeConfig, preloadedState: preloadedState });
  } else {
    store = configureStore(storeConfig);
  }

  return render(<Provider store={store}>{componentToRender}</Provider>);
};

export { render, screen, type RootState };
