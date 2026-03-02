/**
 * Playwright Auth Setup - Performs login ONCE and saves the session state.
 * All test projects that depend on 'setup' will reuse this auth state.
 */
import { test as setup, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // If a valid auth state file exists with an unexpired token, skip re-login
    const absPath = path.resolve(authFile);
    if (fs.existsSync(absPath)) {
        try {
            const state = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
            const tokenCookie = state.cookies?.find((c: any) => c.name === 'access_token' && c.value);
            if (tokenCookie && tokenCookie.expires > Date.now() / 1000) {
                // Token still valid - verify it works by loading a protected page
                await page.context().addCookies(state.cookies);
                await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(3000);
                if (!page.url().includes('/login')) {
                    // Auth state is still valid, no need to re-login
                    return;
                }
            }
        } catch {
            // Corrupted state file, proceed with fresh login
        }
    }

    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });

    // Fill login form - allow extra time on cold start for Nuxt hydration
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill(TEST_EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(TEST_PASSWORD);

    await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();

    // Wait for redirect away from login
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Verify we're logged in
    expect(page.url()).not.toContain('/login');

    // Verify auth cookie is present before saving state
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(c => c.name === 'access_token' && c.value);
    expect(hasAuthCookie).toBeTruthy();

    // Navigate to a protected page to ensure full auth state is established
    await page.goto('/');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

    // Save storage state (cookies + localStorage)
    await page.context().storageState({ path: authFile });
});
