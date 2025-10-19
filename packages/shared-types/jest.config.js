const { createJestConfig } = require('../../tests/jest.config.base');

module.exports = createJestConfig({
  displayName: '@partpal/shared-types',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['../../tests/setup/jest.setup.ts'],
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
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
});