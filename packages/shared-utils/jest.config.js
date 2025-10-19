const { createJestConfig } = require('../../tests/jest.config.base');

module.exports = createJestConfig({
  displayName: '@partpal/shared-utils',
  testEnvironment: 'jsdom', // For DOM APIs
  setupFilesAfterEnv: ['../../tests/setup/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@partpal/shared-types$': '<rootDir>/../shared-types/src'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/src/**/*.(test|spec).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
});