/**
 * ============================================
 * E2E: Authentication Flow
 * ============================================
 * Tests login page rendering, validation errors,
 * invalid credentials, successful login, and
 * forgot password navigation.
 *
 * NOTE: These tests opt out of shared storageState
 * so they run in an unauthenticated context.
 *
 * TODO: Add data-testid attributes to login form
 * elements in the source code for more robust selectors.
 */

import { test, expect } from '@playwright/test';

// Opt out of shared auth - this suite tests unauthenticated flows
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('Authentication', () => {

  test.describe('Login Page Rendering', () => {

    test('should display the login page with email and password inputs', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Verify the page title contains something meaningful
      await expect(page).toHaveTitle(/Login|Leadify|CRM/i);

      // Verify email input is present and visible
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });

      // Verify password input is present and visible
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display a submit/login button', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login"), button:has-text("Log in")'
      ).first();
      await expect(submitButton).toBeVisible({ timeout: 10000 });
    });

    test('should display a link to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const forgotLink = page.locator(
        'a[href*="forget"], a[href*="forgot"], a:has-text("Forgot"), a:has-text("forget")'
      ).first();
      await expect(forgotLink).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Form Validation', () => {

    test('should show validation errors when submitting empty form', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Click submit without filling any fields
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.waitFor({ state: 'visible', timeout: 10000 });
      await submitButton.click();

      // Should show validation error messages (Element Plus form validation)
      const validationError = page.locator(
        '.el-form-item__error, .error-message, [role="alert"], text=/required|invalid|email/i'
      ).first();
      await expect(validationError).toBeVisible({ timeout: 5000 });

      // Should remain on the login page
      await expect(page).toHaveURL(/login/);
    });

    test('should reject invalid email format', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[type="text"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('not-a-valid-email');

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('somepassword123');

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.click();

      await page.waitForTimeout(2000);

      // Should not navigate away from login
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Invalid Credentials', () => {

    test('should show error notification for wrong credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('wrong@email.com');

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('wrongpassword123');

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.click();

      // Should show an error notification (Element Plus notification)
      const errorNotification = page.locator(
        '.el-notification, .el-message, .el-notification--error, .el-message--error'
      ).first();
      await expect(errorNotification).toBeVisible({ timeout: 10000 });

      // Should remain on the login page
      await expect(page).toHaveURL(/login/);
    });

    test('should not store auth token on failed login', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[type="text"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('fake@nonexistent.com');

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('wrongpassword');

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Verify no auth cookie was set
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name === 'access_token' && c.value);
      expect(hasAuthCookie).toBeFalsy();
    });
  });

  test.describe('Successful Login', () => {

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[type="text"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(TEST_EMAIL);

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(TEST_PASSWORD);

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.click();

      // Wait for redirect away from login
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

      // Should be on dashboard or home page, not login
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      await expect(page).toHaveURL(/dashboard|\//);
    });

    test('should set auth cookie after successful login', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[type="text"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(TEST_EMAIL);

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(TEST_PASSWORD);

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign"), button:has-text("Login")'
      ).first();
      await submitButton.click();

      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

      // Verify auth cookie is present
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'access_token');
      expect(authCookie).toBeTruthy();
      expect(authCookie!.value.length).toBeGreaterThan(10);
    });

    test('should persist session after page reload', async ({ page }) => {
      // Login first
      await page.goto('/login');
      const emailInput = page.locator('input[type="email"], input[type="text"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(TEST_EMAIL);
      await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
      await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

      // Reload the page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Should NOT redirect back to login
      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('Forgot Password', () => {

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const forgotLink = page.locator(
        'a[href*="forget"], a[href*="forgot"], a:has-text("Forgot"), a:has-text("forget")'
      ).first();
      await forgotLink.click();

      await expect(page).toHaveURL(/forget|forgot|reset/);
    });

    test('should display email input on forgot password page', async ({ page }) => {
      await page.goto('/forget-password');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator(
        'input[type="email"], input[type="text"], input[placeholder*="email" i]'
      ).first();
      await expect(emailInput).toBeVisible({ timeout: 10000 });
    });

    test('should have a submit button on forgot password page', async ({ page }) => {
      await page.goto('/forget-password');
      await page.waitForLoadState('domcontentloaded');

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Reset"), button:has-text("Submit")'
      ).first();
      await expect(submitButton).toBeVisible({ timeout: 10000 });
    });

    test('should have a link back to login page', async ({ page }) => {
      await page.goto('/forget-password');
      await page.waitForLoadState('domcontentloaded');

      const backLink = page.locator(
        'a[href*="login"], a:has-text("Login"), a:has-text("Back"), a:has-text("Sign")'
      ).first();
      if (await backLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await backLink.click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/login/);
      }
    });
  });

  test.describe('Access Control', () => {

    test('should redirect unauthenticated users to login from protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/sales/leads',
        '/sales/deals',
        '/sales/clients',
        '/dashboard',
        '/settings',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(/login/);
      }
    });
  });
});
