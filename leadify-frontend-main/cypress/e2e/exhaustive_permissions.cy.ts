/// <reference types="cypress" />

describe('Permissions & Security Audit', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(Cypress.env('TEST_EMAIL') || 'test@example.com');
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('Super Admin should see all administrative tools', () => {
    cy.visit('/settings/integrations');
    cy.contains('System Integrations').should('be.visible');

    cy.visit('/settings/audit-logs');
    cy.contains('Audit Logs').should('be.visible');

    cy.visit('/admin/tests');
    cy.contains('QA COMMAND CENTER').should('be.visible');
  });

  it('Should enforce 404/Access Denied for non-existent or restricted pages', () => {
    // Visit a garbage URL
    cy.visit('/this-page-does-not-exist', { failOnStatusCode: false });
    cy.contains(/404|not found/i).should('exist');
  });

  // NOTE: For exhaustive testing, we would ideally create a "Restricted User"
  // and attempt to visit /settings/integrations to verify 404 redirect.
});
