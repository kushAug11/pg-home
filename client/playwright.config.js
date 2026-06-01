import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false, // Run tests sequentially for data consistency
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: 1, // Single worker for sequential execution
    reporter: isCI
        ? [['html'], ['json', { outputFile: 'test-results.json' }], ['list']]
        : [['list']],

    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15000,
        navigationTimeout: 30000,
    },

    projects: isCI
        ? [
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
            {
                name: 'Mobile Chrome',
                use: { ...devices['Pixel 5'] },
            },
            {
                name: 'Mobile Safari',
                use: { ...devices['iPhone 12'] },
            },
        ]
        : [
            {
                name: 'chromium',
                use: { ...devices['Desktop Chrome'] },
            },
        ],

    webServer: {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120000,
    },
});
