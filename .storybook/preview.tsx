import type { Preview } from '@storybook/react';
import { store } from '../src/app';
import { Provider } from 'react-redux';
import 'styles/theme.css';

const preview: Preview = {
  decorators: [
    (Story) => {
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
