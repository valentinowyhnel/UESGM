const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Path to the Next.js app to load next.config.js and .env files
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/api/**/*.test.[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    '!app/api/**/route.ts',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
