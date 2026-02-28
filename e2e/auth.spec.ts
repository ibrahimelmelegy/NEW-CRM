import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // Opt out of shared storageState auth - this file tests unauthenticated flows
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login|Leadify/i);
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"], .el-button--primary');
    await expect(page.locator('.el-form-item__error, .error-message, [role="alert"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"], .el-button--primary');
    // Should show error notification or message
    await expect(page.locator('.el-notification, .el-message, .error-message')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href*="forget"], a[href*="forgot"], text=Forgot');
    await expect(page).toHaveURL(/forget|forgot|reset/);
  });
});
