module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/tests/**/*.test.(ts|tsx|js|jsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!@firebase|firebase|firebase-admin)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../lib/firebaseAdmin$': '<rootDir>/src/lib/firebaseAdmin',
    '^../../utils/rateLimiter$': '<rootDir>/src/utils/rateLimiter',
    '^../../../lib/firebaseAdmin$': '<rootDir>/src/lib/firebaseAdmin',
  },
};