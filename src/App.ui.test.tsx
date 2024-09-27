import { render } from '@testing-library/react';
import App from './App';
import { mockDatabaseApiOnWindow, mockEnvironmentVarsOnWindow } from './__tests__/mockElectron';

mockEnvironmentVarsOnWindow();
mockDatabaseApiOnWindow();

test('renders learn react link', () => {
  render(<App />);
  //const linkElement = screen.getByText(/learn react/i);
  //expect(linkElement).toBeInTheDocument();
});
