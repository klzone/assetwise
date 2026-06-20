const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/.*\\.test\\.ts$',
    '<rootDir>/tests/auth-state-management.test.ts',
    '<rootDir>/tests/resource-ownership.test.ts',
    '<rootDir>/tests/csrf-protection.test.ts',
    '<rootDir>/tests/password-validation.test.ts',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 处理 ES 模块
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  // 允许转换 node_modules 中的特定包
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|@tauri-apps)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/lib/testing/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // 为关键模块设置更高的覆盖率要求
    'src/lib/security/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/performance/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/lib/monitoring/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  silent: false,
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'jest-results.xml',
    }],
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
