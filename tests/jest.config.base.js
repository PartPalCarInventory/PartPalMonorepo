/**
 * Base Jest configuration for PartPal monorepo packages
 */

module.exports = {
  createJestConfig: (overrides = {}) => ({
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx'
        }
      }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleNameMapping: {
      '^@partpal/shared-types$': '<rootDir>/../../packages/shared-types/src',
      '^@partpal/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
      '^@partpal/shared-ui$': '<rootDir>/../../packages/shared-ui/src',
      '^@partpal/database$': '<rootDir>/../../packages/database/src'
    },
    setupFilesAfterEnv: ['<rootDir>/../../tests/setup/jest.setup.ts'],
    testPathIgnorePatterns: [
      '<rootDir>/node_modules/',
      '<rootDir>/dist/',
      '<rootDir>/.next/'
    ],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000,
    ...overrides
  })
};