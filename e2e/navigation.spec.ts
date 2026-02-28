import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  // Opt out of shared storageState auth - tests unauthenticated redirect behavior
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should load login page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    expect(errors.length).toBe(0);
  });

  test('should load forgot password page', async ({ page }) => {
    await page.goto('/forget-password');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
