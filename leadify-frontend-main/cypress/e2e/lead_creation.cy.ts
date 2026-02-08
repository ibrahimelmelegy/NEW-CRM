/// <reference types="cypress" />

describe('Lead Management Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@hp-tech.com');
    cy.get('input[name="password"]').type('Heroo@1502');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('Should create a new lead successfully', () => {
    // 1. Navigate to Leads
    cy.visit('/sales/leads');
    cy.contains('Leads', { timeout: 10000 }).should('be.visible');

    // 2. Click New Lead
    cy.contains('button', 'New Lead').click();
    cy.url().should('include', '/sales/leads/add-lead');

    // 3. Fill Form
    const leadName = `Test Lead ${Date.now()}`;
    cy.get('input[placeholder*="Name"]').first().type(leadName);
    cy.get('input[placeholder*="Company"]').first().type('Test Company Inc');
    cy.get('input[placeholder*="Email"]').first().type(`test_${Date.now()}@example.com`);

    // 4. Submit
    cy.contains('button', 'Save').click();

    // 5. Verify Success (Notification or Redirect)
    cy.contains('Success', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/sales/leads');
    cy.contains(leadName).should('be.visible');
  });
});
