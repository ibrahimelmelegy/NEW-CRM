/**
 * ============================================
 * Playwright Test Helpers
 * ============================================
 * Reusable helper functions for frontend tests
 */

import { Page } from '@playwright/test';

/**
 * Helper to wait for page to fully load (Nuxt apps need hydration time)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    // Additional wait for Nuxt hydration
    await page.waitForTimeout(2000);
}

/**
 * Helper function to perform login
 */
export async function performLogin(page: Page, email?: string, password?: string): Promise<void> {
    await page.goto('/login');
    await waitForPageLoad(page);

    await page.locator('input[type="email"], input[type="text"]').first().fill(email || process.env.TEST_USER_EMAIL || 'admin@example.com');
    await page.locator('input[type="password"]').first().fill(password || process.env.TEST_USER_PASSWORD || 'password');
    await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();

    await page.waitForTimeout(5000);
}

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
}

/**
 * Helper to logout
 */
export async function performLogout(page: Page): Promise<void> {
    // Try clicking on user menu or avatar
    const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, .profile-dropdown').first();
    if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.waitForTimeout(500);
    }

    // Click logout button
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("خروج")').first();
    if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
    }
}
