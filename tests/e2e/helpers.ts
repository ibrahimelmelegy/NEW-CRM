/**
 * ============================================
 * E2E Test Helpers - High Point Technology CRM
 * ============================================
 * Robust helper functions for comprehensive E2E testing
 */

import { Page, expect } from '@playwright/test';

// Test credentials - use environment variables with fallbacks
export const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Wait for Nuxt page to fully hydrate and stabilize.
 * Uses 'load' instead of 'networkidle' to avoid timeout from WebSocket/SSE connections.
 */
export async function waitForPageLoad(page: Page, timeout = 4000): Promise<void> {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(timeout);
    // Dismiss any vite-error-overlay that may block interactions
    await dismissViteOverlay(page);
}

/**
 * Remove vite-error-overlay elements that block pointer events during dev mode
 */
export async function dismissViteOverlay(page: Page): Promise<void> {
    try {
        await page.evaluate(() => {
            document.querySelectorAll('vite-error-overlay').forEach(el => el.remove());
        });
    } catch {
        // Page might not be ready yet - ignore
    }
}

/**
 * Perform login and verify successful authentication
 */
export async function login(page: Page, email?: string, password?: string): Promise<void> {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Wait for the login form to be interactive
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email || TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(password || TEST_PASSWORD);

    await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();

    // Wait for redirect away from login page
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
    await page.waitForTimeout(2000);
}

/**
 * Ensure the user is logged in before running tests (for beforeEach hooks)
 */
export async function ensureLoggedIn(page: Page): Promise<void> {
    const url = page.url();
    if (url.includes('/login') || !url.includes('localhost')) {
        await login(page);
    }
}

/**
 * Navigate to a page and wait for it to load.
 * If unexpectedly redirected to login (not intentional), attempts re-auth.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Short wait to allow client-side redirects (auth middleware)
    await page.waitForTimeout(1500);

    // Only re-auth if we didn't intend to go to a login/auth page
    const isAuthPage = path.includes('login') || path.includes('forget-password');
    if (page.url().includes('/login') && !isAuthPage) {
        try {
            await login(page);
            await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(1500);
        } catch {
            // Re-auth failed - continue with current state, test assertion will handle
        }
    }
    await dismissViteOverlay(page);
}

/**
 * Get unique test data string with timestamp
 */
export function uniqueName(prefix: string): string {
    return `${prefix}_${Date.now()}`;
}

/**
 * Get unique email for testing
 */
export function uniqueEmail(prefix = 'test'): string {
    return `${prefix}_${Date.now()}@test.com`;
}

/**
 * Wait for an Element Plus notification to appear
 */
export async function waitForNotification(page: Page, type: 'success' | 'error' | 'warning' | 'info' = 'success'): Promise<void> {
    await page.locator(`.el-notification--${type}, .el-notification`).first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Check if an Element Plus notification appeared with specific text
 */
export async function expectNotification(page: Page, text?: string, type: 'success' | 'error' = 'success'): Promise<void> {
    const notification = page.locator(`.el-notification--${type}, .el-notification`).first();
    await expect(notification).toBeVisible({ timeout: 10000 });
    if (text) {
        await expect(notification).toContainText(text, { timeout: 5000 });
    }
}

/**
 * Wait for a table to load data.
 * Waits for skeleton/loading to disappear and actual el-table to appear.
 */
export async function waitForTableData(page: Page, timeout = 30000): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    // Dismiss any vite-error-overlay if present
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.count() > 0) {
        await page.evaluate(() => {
            document.querySelectorAll('vite-error-overlay').forEach(el => el.remove());
        });
    }
    // Wait for actual table to render (skeleton disappears, el-table appears)
    try {
        await page.locator('.el-table, table').first().waitFor({ state: 'visible', timeout });
    } catch {
        // Table may not exist on this page - continue anyway
    }
    await page.waitForTimeout(500);
}

/**
 * Click on the first row in a table
 */
export async function clickFirstTableRow(page: Page): Promise<void> {
    await waitForTableData(page);
    const row = page.locator('table tbody tr, .el-table__row, [class*="table"] tr').first();
    await row.click();
    await waitForPageLoad(page, 2000);
}

/**
 * Count table rows
 */
export async function getTableRowCount(page: Page): Promise<number> {
    await waitForTableData(page);
    return page.locator('table tbody tr, .el-table__row').count();
}

/**
 * Fill a form field by label or placeholder
 */
export async function fillField(page: Page, selector: string, value: string): Promise<void> {
    const input = page.locator(selector).first();
    await input.clear();
    await input.fill(value);
}

/**
 * Select an option from an Element Plus dropdown
 */
export async function selectDropdownOption(page: Page, triggerSelector: string, optionIndex = 0): Promise<void> {
    await page.locator(triggerSelector).first().click();
    await page.waitForTimeout(500);
    const options = page.locator('.el-select-dropdown__item, .el-dropdown-menu__item');
    const count = await options.count();
    if (count > optionIndex) {
        await options.nth(optionIndex).click();
    }
    await page.waitForTimeout(300);
}

/**
 * Click a button by text content
 */
export async function clickButton(page: Page, text: string): Promise<void> {
    await page.locator(`button:has-text("${text}")`).first().click();
}

/**
 * Make an API call directly for setup/teardown
 */
export async function apiCall(page: Page, method: string, endpoint: string, body?: object): Promise<any> {
    return page.evaluate(async ({ apiUrl, method, endpoint, body }) => {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
            || localStorage.getItem('access_token') || '';
        const response = await fetch(`${apiUrl}/${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        return response.json();
    }, { apiUrl: API_URL, method, endpoint, body });
}
