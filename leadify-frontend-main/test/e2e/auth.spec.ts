
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    // Navigate to login page before each test
    test.beforeEach(async ({ page }) => {
        // Assuming the app runs on localhost:3000 locally
        await page.goto('/login');
    });

    test('User can login with valid credentials', async ({ page }) => {
        // 1. Fill Email
        // Using loose selectors for robustness or data-test-ids if available (Best Practice)
        // Falling back to placeholders/names as generic selectors
        await page.getByPlaceholder('Email').fill('admin@test.com');

        // 2. Fill Password
        await page.getByPlaceholder('Password').fill('password123');

        // 3. Click Login Button
        await page.getByRole('button', { name: /login/i }).click();

        // 4. Verification
        // Expect URL to change to dashboard
        await expect(page).toHaveURL(/\/$/); // Or /dashboard depending on the app

        // Expect a welcome message or dashboard element
        // await expect(page.getByText('Welcome')).toBeVisible(); 
    });

    test('User sees error with invalid credentials', async ({ page }) => {
        // 1. Fill Wrong Data
        await page.getByPlaceholder('Email').fill('wrong@test.com');
        await page.getByPlaceholder('Password').fill('wrongpass');

        // 2. Click Login
        await page.getByRole('button', { name: /login/i }).click();

        // 3. Verify Error Toast/Message
        // Element Plus notifications usually have class el-notification or el-message
        const errorToast = page.locator('.el-notification__content');
        await expect(errorToast).toBeVisible();
        await expect(errorToast).toHaveText(/invalid/i);
    });
});
