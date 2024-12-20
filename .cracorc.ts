import { CracoConfig } from '@craco/types';
import webpack from 'webpack';
import * as dotenv from 'dotenv';
import { build } from 'electron-builder';

dotenv.config();

/**
 * Values from .env file which will be injected into variables with the same name at build time
 */
const environmentVariablesForBuildTimeInjection = [
  'CA_AWS_ENDPOINT',
  'CA_AWS_COGNITO_USER_POOL_ID',
  'CA_AWS_COGNITO_USER_POOL_CLIENT_ID',
  'CA_AWS_COGNITO_PERMANENT_PASSWORD_CREATION_URL',
];

const buildTimeEnvironment: { [k: string]: string } = {};

environmentVariablesForBuildTimeInjection.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    throw 'Environment file not configured or is missing at least one value! Exiting!';
  }
  buildTimeEnvironment[key] = JSON.stringify(value);
});

export default {
  jest: {
    configure: (jestConfig) => {
      jestConfig.testMatch = [
        '<rootDir>/src/**/__tests__/**/*.{spec,test}.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.ui.{spec,test}.{js,jsx,ts,tsx}',
      ];
      jestConfig.globals = {
        __DEV__: true,
      };
      jestConfig.moduleNameMapper = {
        '.*amplifySetup.*': require.resolve(
          './src/__tests__/mockModules/mockAmplifySetup'
        ),
        '@uidotdev/usehooks': require.resolve(
          './src/__tests__/mockModules/uidotdev/usehooks'
        ),
      };
      jestConfig.extensionsToTreatAsEsm = ['.ts'];
      return jestConfig;
    },
  },
  webpack: {
    plugins: {
      add: [[new webpack.DefinePlugin(buildTimeEnvironment), 'append']],
    },
  },
} as CracoConfig;
