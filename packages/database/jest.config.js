const { createJestConfig } = require('../../tests/jest.config.base');

module.exports = createJestConfig({
  displayName: '@partpal/database',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['../../tests/setup/jest.setup.ts', '<rootDir>/src/__tests__/setup.ts'],
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
    '!src/index.ts',
    '!src/__tests__/setup.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
});