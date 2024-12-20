export default {
  runner: '@kayahr/jest-electron-runner/main',
  testMatch: ['<rootDir>/src/**/*.main.{spec,test}.{js,jsx,ts,tsx}'],
  testEnvironment: 'node',
  rootDir: './',
  testEnvironmentOptions: {
    electron: {
      options: [
        'no-sandbox',
        'ignore-certificate-errors',
        'force-device-scale-factor=1',
      ],
      disableHardwareAcceleration: false,
    },
  },
  modulePaths: ['<rootDir>', '/home/sam/git/clear-aligner/node_modules'],
  moduleNameMapper: {
    '#(.*)': '<rootDir>/node_modules/$1',
    uuid: require.resolve('uuid'),
    typeorm: require.resolve('typeorm'),
  },
};
