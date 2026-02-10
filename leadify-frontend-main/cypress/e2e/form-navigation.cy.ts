/// <reference types="cypress" />

/**
 * Form Navigation & Validation - E2E Tests
 * ==========================================
 * Tests form page navigation, structure, and validation:
 * - Navigate to each add/edit form page
 * - Verify .form-section elements are visible
 * - Verify .glass-card wrapper is visible
 * - Test form validation on required fields
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

describe('Form Pages - Navigation & Structure', () => {
  beforeEach(() => {
    login();
  });

  const formPages = [
    { url: '/sales/leads/add-lead', name: 'Lead Form', minSections: 4 },
    { url: '/sales/clients/add-client', name: 'Client Form', minSections: 3 },
    { url: '/sales/opportunity/add-opportunity', name: 'Opportunity Form', minSections: 4 },
    { url: '/sales/deals/add-deal', name: 'Deal Form', minSections: 1 },
    { url: '/staff/add-staff', name: 'Staff Form', minSections: 3 },
    { url: '/roles/add-role', name: 'Role Form', minSections: 1 },
  ];

  formPages.forEach(({ url, name, minSections }) => {
    describe(`${name} (${url})`, () => {
      it('should navigate to form page', () => {
        cy.visit(url);
        cy.url().should('include', url);
      });

      it('should display .glass-card container', () => {
        cy.visit(url);
        cy.get('.glass-card', { timeout: 10000 }).should('be.visible');
      });

      it(`should have at least ${minSections} .form-section blocks`, () => {
        cy.visit(url);
        cy.get('.form-section', { timeout: 10000 }).should('have.length.at.least', minSections);
      });

      it('should have section headers with icons', () => {
        cy.visit(url);
        cy.get('.form-section-header', { timeout: 10000 }).should('exist');
        cy.get('.section-icon').should('exist');
        cy.get('.section-title').should('exist');
      });

      it('should have a submit button', () => {
        cy.visit(url);
        cy.get('button[type="submit"], .app-btn, .el-button--primary', { timeout: 10000 }).should('exist');
      });
    });
  });
});

describe('Form Validation', () => {
  beforeEach(() => {
    login();
  });

  describe('Lead Form Validation', () => {
    it('should show validation errors when submitting empty form', () => {
      cy.visit('/sales/leads/add-lead');
      cy.get('.glass-card', { timeout: 10000 }).should('be.visible');

      // Try to submit empty form
      cy.get('button[type="submit"], .el-button--primary').first().click();

      // Should show validation feedback (either via element-plus or custom)
      cy.get('.el-form-item__error, .is-error, [role="alert"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('Login Form Validation', () => {
    it('should show error for empty credentials', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();

      // Should show validation errors
      cy.get('.el-form-item__error, .is-error, [role="alert"]', { timeout: 5000 }).should('exist');
    });

    it('should show error for invalid email format', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('not-an-email');
      cy.get('input[name="password"]').type('somepassword');
      cy.get('button[type="submit"]').click();

      cy.get('.el-form-item__error, .is-error, .el-notification', { timeout: 5000 }).should('exist');
    });
  });
});

describe('Operations Form Pages', () => {
  beforeEach(() => {
    login();
  });

  const opsFormPages = [
    { url: '/operations/manpower', btnText: 'Add', name: 'Manpower' },
    { url: '/operations/vehicle', btnText: 'Add', name: 'Vehicle' },
    { url: '/operations/assets', btnText: 'Add', name: 'Assets' },
    { url: '/operations/services', btnText: 'Add', name: 'Services' },
  ];

  opsFormPages.forEach(({ url, name }) => {
    it(`${name} list page should have an add button`, () => {
      cy.visit(url);
      cy.get('.premium-btn, .el-button--primary, .glow-purple', { timeout: 10000 }).should('exist');
    });
  });
});
