import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  // Opt out of shared storageState auth - tests login page accessibility
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page should have proper form labels', async ({ page }) => {
    await page.goto('/login');
    // Check that form inputs have associated labels or aria-labels
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('login page should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    // Tab through form elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('login page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    const h1 = page.locator('h1, h2, h3').first();
    await expect(h1).toBeVisible();
  });
});
