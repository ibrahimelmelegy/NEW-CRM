module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Look for tests in the tests directory
    roots: ['<rootDir>/tests'],
    // Match test files
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.[jt]sx?$': ['ts-jest', {
            diagnostics: false     // Disable diagnostics to prevent compilation errors from stopping tests
        }],
    },
    // Transform ESM modules that Jest can't parse natively
    transformIgnorePatterns: [
        'node_modules/(?!(@scure|otplib|@otplib)/)'
    ],
    // Module aliases (if you use them in tsconfig, add them here too)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Setup
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
