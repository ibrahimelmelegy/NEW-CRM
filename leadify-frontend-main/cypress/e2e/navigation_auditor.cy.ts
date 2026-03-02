/// <reference types="cypress" />

describe('Universal Navigation Auditor', () => {
  const pages = [
    { name: 'Dashboard', path: '/' },
    { name: 'Leads', path: '/sales/leads' },
    { name: 'Clients', path: '/sales/clients' },
    { name: 'Opportunities', path: '/sales/opportunity' },
    { name: 'Deals', path: '/sales/deals' },
    { name: 'Proposals', path: '/sales/proposals' },
    { name: 'Projects', path: '/operations/projects' },
    { name: 'Daily Tasks', path: '/operations/daily-task' },
    { name: 'Vehicles', path: '/operations/vehicle' },
    { name: 'Manpower', path: '/operations/manpower' },
    { name: 'Additional Materials', path: '/operations/additional-material' },
    { name: 'Services', path: '/operations/services' },
    { name: 'Assets', path: '/operations/assets' },
    { name: 'Vendors', path: '/procurement/vendors' },
    { name: 'Distributors', path: '/procurement/distributors' },
    { name: 'Local Suppliers', path: '/procurement/local-suppliers' },
    { name: 'Showrooms', path: '/procurement/showrooms' },
    { name: 'Purchase Orders', path: '/procurement/purchase-orders' },
    { name: 'RFQs', path: '/procurement/rfq' },
    { name: 'Procurement Stats', path: '/procurement/statistics' },
    { name: 'Reports', path: '/reports' },
    { name: 'Integrations', path: '/settings/integrations' },
    { name: 'Audit Logs', path: '/settings/audit-logs' },
    { name: 'Roles', path: '/roles' },
    { name: 'Add Role', path: '/roles/add-role' },
    { name: 'Staff', path: '/staff' },
    { name: 'Add Staff', path: '/staff/add-staff' },
    { name: 'QA Center', path: '/admin/tests' },
    { name: 'Permissions Hub', path: '/test' }
  ];

  before(() => {
    // Login once for the entire suite
    cy.visit('/login');
    cy.get('input[name="email"]').type(Cypress.env('TEST_EMAIL') || 'admin@hp-tech.com');
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  pages.forEach(page => {
    it(`Should load ${page.name} page without crashing`, () => {
      cy.visit(page.path);
      // Wait for any network requests to settle or a core element to appear
      cy.get('body').should('be.visible');
      // Check for common error indicators (H1 or specific layouts)
      cy.get('.sidebar, .header, h2, h3', { timeout: 15000 }).should('exist');
      // Ensure no "Fatal Error" or blank page
      cy.contains(/error|failed/i).should('not.exist');
    });
  });
});
