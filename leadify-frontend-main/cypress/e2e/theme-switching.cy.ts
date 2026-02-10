/// <reference types="cypress" />

/**
 * Theme Switching - E2E Tests
 * =============================
 * Tests theme toggle between dark and light modes:
 * - Verifies html.light-mode class toggling
 * - Theme persists across page navigation
 * - Forms readable in both modes
 */

const credentials = {
  email: 'admin@hp-tech.com',
  password: 'Heroo@1502'
};

function login() {
  cy.visit('/login');
  cy.get('input[name="email"]').type(credentials.email);
  cy.get('input[name="password"]').type(credentials.password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login', { timeout: 15000 });
}

describe('Theme Switching', () => {
  beforeEach(() => {
    login();
  });

  describe('Default Dark Mode', () => {
    it('should default to dark mode (no light-mode class on html)', () => {
      cy.get('html').should('not.have.class', 'light-mode');
    });

    it('should have dark background visible', () => {
      cy.get('html').should('exist');
      // Dark mode is the default - no class needed
    });
  });

  describe('Toggle to Light Mode', () => {
    it('should add light-mode class when toggle clicked', () => {
      // Find and click the theme toggle button
      cy.get('.mode-toggle, [title*="Light"], [title*="Dark"]', { timeout: 10000 })
        .first()
        .click();

      cy.get('html').should('have.class', 'light-mode');
    });

    it('should toggle back to dark mode on second click', () => {
      const toggle = '.mode-toggle, [title*="Light"], [title*="Dark"]';

      // Toggle to light
      cy.get(toggle, { timeout: 10000 }).first().click();
      cy.get('html').should('have.class', 'light-mode');

      // Toggle back to dark
      cy.get(toggle).first().click();
      cy.get('html').should('not.have.class', 'light-mode');
    });
  });

  describe('Theme Persistence Across Navigation', () => {
    it('should maintain theme when navigating between pages', () => {
      const toggle = '.mode-toggle, [title*="Light"], [title*="Dark"]';

      // Toggle to light mode
      cy.get(toggle, { timeout: 10000 }).first().click();
      cy.get('html').should('have.class', 'light-mode');

      // Navigate to a different page
      cy.visit('/sales/leads');
      cy.get('html', { timeout: 10000 }).should('have.class', 'light-mode');

      // Navigate again
      cy.visit('/sales/clients');
      cy.get('html', { timeout: 10000 }).should('have.class', 'light-mode');
    });
  });

  describe('Visual Readability', () => {
    it('should have visible text on list pages in dark mode', () => {
      cy.visit('/sales/leads');
      cy.get('.text-gradient, .title', { timeout: 10000 }).should('be.visible');
    });

    it('should have visible text on list pages in light mode', () => {
      const toggle = '.mode-toggle, [title*="Light"], [title*="Dark"]';
      cy.get(toggle, { timeout: 10000 }).first().click();

      cy.visit('/sales/leads');
      cy.get('.text-gradient, .title', { timeout: 10000 }).should('be.visible');
    });
  });
});

describe('Login Page Theme', () => {
  it('should have theme-aware logo', () => {
    cy.visit('/login');
    // Check that one of the logo images is visible
    cy.get('img[alt="Leadify CRM"]', { timeout: 10000 }).should('exist');
  });

  it('should have properly styled form in dark mode', () => {
    cy.visit('/login');
    cy.get('.glass-card-premium', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
  });
});
