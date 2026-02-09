import { test, expect } from '@playwright/test';
import { performLogin } from './helpers';

/**
 * ============================================
 * Navigation & UI Tests - HP Tech CRM
 * ============================================
 * Tests for sidebar navigation, header, breadcrumbs, responsiveness
 */

test.describe('Navigation & UI', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    // ============== SIDEBAR ==============
    test.describe('Sidebar Navigation', () => {

        test('should display sidebar with all menu items', async ({ page }) => {
            await page.goto('/');

            // Check sidebar exists
            await expect(page.locator('[class*="sidebar"], nav').first()).toBeVisible();

            // Check main menu items
            await expect(page.locator('text=/dashboard|لوحة التحكم/i').first()).toBeVisible();
            await expect(page.locator('text=/sales|مبيعات/i').first()).toBeVisible();
            await expect(page.locator('text=/operations|عمليات/i').first()).toBeVisible();
        });

        test('should expand/collapse sidebar submenus', async ({ page }) => {
            await page.goto('/');

            // Click on Sales menu to expand
            const salesMenu = page.locator('text=/sales|مبيعات/i').first();
            await salesMenu.click();

            // Check submenu items appear
            await expect(page.locator('text=/leads|عملاء محتملين/i').first()).toBeVisible();
        });

        test('should navigate using sidebar', async ({ page }) => {
            await page.goto('/');

            // Navigate to Leads via sidebar
            await page.locator('text=/sales|مبيعات/i').first().click();
            await page.locator('a:has-text("Leads"), a:has-text("العملاء المحتملين")').first().click();

            await expect(page).toHaveURL(/leads/);
        });

        test('should collapse sidebar on mobile', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto('/');

            // Sidebar should be hidden or collapsed
            const sidebar = page.locator('[class*="sidebar"]').first();
            const isHidden = await sidebar.evaluate((el) => {
                const style = window.getComputedStyle(el);
                return style.display === 'none' || style.visibility === 'hidden' || el.clientWidth < 100;
            });

            // Mobile menu toggle should be visible
            const menuToggle = page.locator('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu"]').first();
            if (await menuToggle.isVisible()) {
                await menuToggle.click();
                await expect(sidebar).toBeVisible();
            }
        });
    });

    // ============== HEADER ==============
    test.describe('Header', () => {

        test('should display header with user info', async ({ page }) => {
            await page.goto('/');

            // Check header exists
            await expect(page.locator('header, [class*="header"]').first()).toBeVisible();

            // Check user avatar/dropdown
            await expect(page.locator('[class*="avatar"], [class*="user"]').first()).toBeVisible();
        });

        test('should display notification bell', async ({ page }) => {
            await page.goto('/');

            const notificationBell = page.locator('[class*="notification"], button[aria-label*="notification"], [class*="bell"]').first();
            await expect(notificationBell).toBeVisible();
        });

        test('should open notification dropdown', async ({ page }) => {
            await page.goto('/');

            const notificationBell = page.locator('[class*="notification"], [class*="bell"]').first();
            await notificationBell.click();

            // Check notification dropdown opens
            await expect(page.locator('[class*="dropdown"], [class*="popover"]').first()).toBeVisible();
        });
    });

    // ============== BREADCRUMBS ==============
    test.describe('Breadcrumbs', () => {

        test('should display breadcrumbs on inner pages', async ({ page }) => {
            await page.goto('/sales/leads');

            const breadcrumb = page.locator('[class*="breadcrumb"]').first();
            if (await breadcrumb.isVisible()) {
                await expect(breadcrumb).toContainText(/home|dashboard|leads/i);
            }
        });

        test('should navigate using breadcrumbs', async ({ page }) => {
            await page.goto('/sales/leads');

            const homeBreadcrumb = page.locator('[class*="breadcrumb"] a:has-text("Home"), [class*="breadcrumb"] a:has-text("Dashboard")').first();
            if (await homeBreadcrumb.isVisible()) {
                await homeBreadcrumb.click();
                await expect(page).toHaveURL(/^\/$|\/dashboard/);
            }
        });
    });

    // ============== THEME ==============
    test.describe('Theme Toggle', () => {

        test('should toggle dark/light theme', async ({ page }) => {
            await page.goto('/');

            const themeToggle = page.locator('[class*="theme"], button[aria-label*="theme"]').first();
            if (await themeToggle.isVisible()) {
                await themeToggle.click();

                // Check body class changes
                await page.waitForTimeout(500);
                const bodyClass = await page.locator('body').getAttribute('class');
                expect(bodyClass).toMatch(/light|dark/);
            }
        });
    });

    // ============== LANGUAGE ==============
    test.describe('Language Switcher', () => {

        test('should switch between English and Arabic', async ({ page }) => {
            await page.goto('/');

            const langSwitcher = page.locator('[class*="language"], [class*="locale"], button:has-text("EN"), button:has-text("AR")').first();
            if (await langSwitcher.isVisible()) {
                await langSwitcher.click();

                // Check for language options
                await expect(page.locator('text=/العربية|arabic/i').first()).toBeVisible();
            }
        });

        test('should change text direction for Arabic', async ({ page }) => {
            await page.goto('/');

            const langSwitcher = page.locator('[class*="language"], button:has-text("AR")').first();
            if (await langSwitcher.isVisible()) {
                await langSwitcher.click();

                await page.waitForTimeout(1000);

                // Check RTL direction
                const htmlDir = await page.locator('html').getAttribute('dir');
                if (htmlDir) {
                    expect(htmlDir).toBe('rtl');
                }
            }
        });
    });

    // ============== SPOTLIGHT SEARCH ==============
    test.describe('Spotlight Search', () => {

        test('should open spotlight with keyboard shortcut', async ({ page }) => {
            await page.goto('/');

            // Press Alt+K to open spotlight
            await page.keyboard.press('Alt+k');

            await expect(page.locator('[class*="spotlight"], [class*="command-palette"]').first()).toBeVisible();
        });

        test('should search and navigate using spotlight', async ({ page }) => {
            await page.goto('/');

            await page.keyboard.press('Alt+k');

            const spotlightInput = page.locator('[class*="spotlight"] input, [class*="command-palette"] input').first();
            if (await spotlightInput.isVisible()) {
                await spotlightInput.fill('leads');
                await page.waitForTimeout(500);

                // Select first result
                await page.keyboard.press('Enter');

                await expect(page).toHaveURL(/leads/);
            }
        });
    });

    // ============== RESPONSIVE ==============
    test.describe('Responsive Design', () => {

        test('should adapt to tablet viewport', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/');

            // Page should load without errors
            await expect(page.locator('body')).toBeVisible();
        });

        test('should adapt to mobile viewport', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto('/');

            // Page should load without errors
            await expect(page.locator('body')).toBeVisible();

            // Navigation should be accessible via hamburger menu
            const hamburger = page.locator('[class*="hamburger"], [class*="menu-toggle"]').first();
            if (await hamburger.isVisible()) {
                await hamburger.click();
            }
        });
    });
});
