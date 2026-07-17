const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/api/**/*.test.[jt]s?(x)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
}

module.exports = createJestConfig(customJestConfig)
