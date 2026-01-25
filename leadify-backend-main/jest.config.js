module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Look for tests in the tests directory
    roots: ['<rootDir>/tests'],
    // Match test files
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            isolatedModules: true, // Disable type-checking for speed and to avoid blocking on minor errors
            diagnostics: false     // Disable diagnostics to prevent compilation errors from stopping tests
        }],
    },
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
