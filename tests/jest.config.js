module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup/simple-setup.ts'],
  moduleNameMapper: {
    '^@partpal/shared-ui$': '<rootDir>/__mocks__/@partpal/shared-ui.ts',
    '^@partpal/shared-utils$': '<rootDir>/__mocks__/@partpal/shared-utils.ts',
    '^@partpal/shared-types$': '<rootDir>/__mocks__/@partpal/shared-types.ts',
    '^@partpal/database$': '<rootDir>/__mocks__/@partpal/database.ts',
    '^@partpal/api-client$': '<rootDir>/__mocks__/@partpal/api-client.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  testMatch: [
    '<rootDir>/**/*.test.{ts,tsx}',
    '<rootDir>/**/*.spec.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'unit/**/*.{ts,tsx}',
    'integration/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
};