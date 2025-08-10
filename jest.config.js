const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)