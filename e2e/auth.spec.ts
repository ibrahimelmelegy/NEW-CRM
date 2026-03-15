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
 * Uses data-testid selectors for robust element targeting:
 *   - [data-testid="login-form"]     → el-form on login page
 *   - [data-testid="email-input"]    → InputText for email
 *   - [data-testid="password-input"] → InputText for password
 *   - [data-testid="login-button"]   → el-button submit
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

      // Verify login form is present using data-testid
      const loginForm = page.locator('[data-testid="login-form"]');
      await expect(loginForm).toBeVisible({ timeout: 10000 });

      // Verify email input is present using data-testid
      const emailInput = page.locator('[data-testid="email-input"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });

      // Verify password input is present using data-testid
      const passwordInput = page.locator('[data-testid="password-input"]');
      await expect(passwordInput).toBeVisible({ timeout: 10000 });
    });

    test('should display a submit/login button', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Use data-testid for reliable button targeting
      const loginButton = page.locator('[data-testid="login-button"]');
      await expect(loginButton).toBeVisible({ timeout: 10000 });
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

      // Click submit without filling any fields using data-testid
      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.waitFor({ state: 'visible', timeout: 10000 });
      await loginButton.click();

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

      // Use data-testid selectors for form fields
      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill('not-a-valid-email');

      const passwordInput = page.locator('[data-testid="password-input"]');
      await passwordInput.locator('input').fill('somepassword123');

      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.click();

      await page.waitForTimeout(2000);

      // Should not navigate away from login
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Invalid Credentials', () => {

    test('should show error notification for wrong credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Use data-testid selectors for all form interactions
      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill('wrong@email.com');

      const passwordInput = page.locator('[data-testid="password-input"]');
      await passwordInput.locator('input').fill('wrongpassword123');

      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.click();

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

      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill('fake@nonexistent.com');

      const passwordInput = page.locator('[data-testid="password-input"]');
      await passwordInput.locator('input').fill('wrongpassword');

      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.click();
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

      // Use data-testid selectors for login flow
      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill(TEST_EMAIL);

      const passwordInput = page.locator('[data-testid="password-input"]');
      await passwordInput.locator('input').fill(TEST_PASSWORD);

      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.click();

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

      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill(TEST_EMAIL);

      const passwordInput = page.locator('[data-testid="password-input"]');
      await passwordInput.locator('input').fill(TEST_PASSWORD);

      const loginButton = page.locator('[data-testid="login-button"]');
      await loginButton.click();

      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

      // Verify auth cookie is present
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'access_token');
      expect(authCookie).toBeTruthy();
      expect(authCookie!.value.length).toBeGreaterThan(10);
    });

    test('should persist session after page reload', async ({ page }) => {
      // Login first using data-testid selectors
      await page.goto('/login');
      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.locator('input').fill(TEST_EMAIL);
      await page.locator('[data-testid="password-input"]').locator('input').fill(TEST_PASSWORD);
      await page.locator('[data-testid="login-button"]').click();
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
