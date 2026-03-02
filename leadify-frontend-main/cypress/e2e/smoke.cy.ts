/// <reference types="cypress" />

describe('Smoke Test - Critical Flows', () => {
  it('Should log in successfully with seeding credentials', () => {
    // 1. Visit Login Page
    cy.visit('/login');

    // 2. Assert Page Title or Content
    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Sign In').should('be.visible');

    // 3. Enter Credentials
    // Using name attributes which are stable selectors
    cy.get('input[name="email"]').type(Cypress.env('TEST_EMAIL') || 'admin@hp-tech.com');
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'));

    // 4. Submit
    cy.get('button[type="submit"]').click();

    // 5. Verification
    // Should be redirected to dashboard or home
    cy.url().should('not.include', '/login');
    // Wait for dashboard element (adjust selector based on actual dashboard UI)
    cy.get('.dashboard-container, h1, .sidebar', { timeout: 10000 }).should('exist');
  });
});
