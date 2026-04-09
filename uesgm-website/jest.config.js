module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
}
