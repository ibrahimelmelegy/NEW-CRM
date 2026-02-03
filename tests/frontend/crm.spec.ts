import { test, expect } from '@playwright/test';

test.describe('Main CRM Frontend', () => {
    test('should allow user to login and see dashboard', async ({ page }) => {
        // Navigate to Login Page
        await page.goto('http://localhost:3000/login');

        // Verify we are on the login page
        await expect(page).toHaveTitle(/Login/i);

        // Fill credentials
        // Fill credentials
        // Using getByLabel if appropriate, or sticking to placeholder if labels aren't associated correctly.
        // Looking at login.vue, InputText has 'label' prop. Assuming checking the rendered HTML would show a label.
        // Safest might be specific selectors if labels are custom rendered divs.
        // But let's try getByPlaceholder with exact string or use fill on the locator found by name.

        // Trying getByRole textbox doesn't work well for password.
        // Let's rely on the InputText implementation likely using IDs or just standard placeholders.
        // If placeholder failed, maybe waiting is needed.
        await page.locator('input[type="email"]').fill('admin@example.com');
        await page.locator('input[type="password"]').fill('password');

        // Click Sign In
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Wait for navigation and verify Dashboard
        await expect(page).toHaveURL('http://localhost:3000/');

        // Check for Dashboard Tabs
        await expect(page.getByRole('tab', { name: 'Leads & Sales' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Projects & Operations' })).toBeVisible();

        // Verify Leads & Sales is active by default
        const activeTab = page.locator('.el-tabs__item.is-active');
        await expect(activeTab).toHaveText('Leads & Sales');
    });
});
