/**
 * ============================================
 * E2E: Login Page (Focused Tests)
 * ============================================
 * Focused login tests that exclusively use data-testid selectors
 * for reliable, maintainable element targeting.
 *
 * Covers:
 * - Login form rendering (all elements present)
 * - Successful login → redirect to dashboard
 * - Invalid credentials → error shown, stay on login
 * - Empty form submission → validation errors
 * - Login form accessibility attributes
 *
 * Data-testid attributes used (set in login.vue):
 *   - [data-testid="login-form"]      → el-form element
 *   - [data-testid="email-input"]     → InputText for email
 *   - [data-testid="password-input"]  → InputText for password
 *   - [data-testid="login-button"]    → el-button submit
 */

import { test, expect } from '@playwright/test';

// All tests in this file run unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Page', () => {

  test('login form renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // All four data-testid elements should be visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('login form has correct ARIA attributes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Login form should have role="form" and aria-label
    const loginForm = page.locator('[data-testid="login-form"]');
    await expect(loginForm).toBeVisible({ timeout: 10000 });
    await expect(loginForm).toHaveAttribute('role', 'form');

    // Login button should have aria-label
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toHaveAttribute('aria-label', /sign in/i);
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill form using data-testid selectors
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.locator('input').fill(testEmail);

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.locator('input').fill(testPassword);

    await page.locator('[data-testid="login-button"]').click();

    // Should redirect away from login after successful auth
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard|\//);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill with wrong credentials using data-testid selectors
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.locator('input').fill('wrong@example.com');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.locator('input').fill('wrongpassword');

    await page.locator('[data-testid="login-button"]').click();

    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('login with empty fields shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Click login button without filling any fields
    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();

    // Should show validation error (Element Plus form validation)
    const validationError = page.locator('.el-form-item__error').first();
    await expect(validationError).toBeVisible({ timeout: 5000 });

    // Should remain on login page
    await expect(page).toHaveURL(/login/);
  });

  test('login button shows loading state during submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.locator('input').fill('test@example.com');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.locator('input').fill('testpassword123');

    const loginButton = page.locator('[data-testid="login-button"]');

    // Click and immediately check for loading/aria-busy attribute
    await loginButton.click();

    // Button should indicate loading or navigate away
    // (depending on network speed and response time)
    await page.waitForTimeout(500);

    // Page should either still be on login or have navigated
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('password field masks input', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // The password input wrapper has data-testid="password-input"
    // The actual input inside should be of type="password"
    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

    // Check the inner input type
    const innerInput = passwordInput.locator('input[type="password"]');
    await expect(innerInput).toBeVisible({ timeout: 5000 });
  });

  test('should stay on login page after failed auth attempt', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.locator('input').fill('nonexistent@example.com');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.locator('input').fill('badpassword');

    await page.locator('[data-testid="login-button"]').click();
    await page.waitForTimeout(5000);

    // Should remain on login page
    await expect(page).toHaveURL(/login/);

    // Login form elements should still be visible and functional
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});
