const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js',
  ],
}

module.exports = createJestConfig(customJestConfig)
