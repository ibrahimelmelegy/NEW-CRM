
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,
    reporter: 'html',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3060',
        reuseExistingServer: false,
        timeout: 120000,
    },
    use: {
        baseURL: 'http://localhost:3060',
        trace: 'on-first-retry',
        navigationTimeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
