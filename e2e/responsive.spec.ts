import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  // Opt out of shared storageState auth - tests login page rendering
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should render login on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('should render login on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('should render login on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });
});
