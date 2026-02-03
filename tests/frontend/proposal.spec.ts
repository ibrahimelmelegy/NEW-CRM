import { test, expect } from '@playwright/test';

test.describe('Proposal App Frontend', () => {
    test('should load the proposal app', async ({ page }) => {
        // Navigating to the Proposal App port
        // Navigating to the Proposal App port (configured as 3001 in vite.config.ts)
        await page.goto('http://127.0.0.1:3001');

        // Check for app root element
        await expect(page.locator('#root')).toBeVisible();

        // Since we don't have exact content, we check for generic structural elements usually present in React apps
        // or just ensure the page loaded without error network-wise
        const title = await page.title();
        console.log('Proposal App Title:', title);

        // Basic assertion that body is present
        await expect(page.locator('body')).toBeVisible();
    });
});
