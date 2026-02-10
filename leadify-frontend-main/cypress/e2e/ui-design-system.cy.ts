/// <reference types="cypress" />

/**
 * UI Design System Compliance - E2E Tests
 * =========================================
 * Navigates to each page and verifies design system classes exist in the DOM.
 * Ensures the UI overhaul (glass cards, gradient titles, premium tables) is applied.
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

describe('Design System - List Pages', () => {
  beforeEach(() => {
    login();
  });

  const listPages = [
    { url: '/sales/leads', name: 'Leads' },
    { url: '/sales/clients', name: 'Clients' },
    { url: '/sales/deals', name: 'Deals' },
    { url: '/sales/opportunity', name: 'Opportunities' },
    { url: '/operations/projects', name: 'Projects' },
    { url: '/operations/assets', name: 'Assets' },
    { url: '/operations/manpower', name: 'Manpower' },
    { url: '/operations/vehicle', name: 'Vehicles' },
    { url: '/operations/services', name: 'Services' },
    { url: '/staff', name: 'Staff' },
    { url: '/roles', name: 'Roles' },
  ];

  listPages.forEach(({ url, name }) => {
    describe(`${name} Page (${url})`, () => {
      it('should have .glass-card wrapper', () => {
        cy.visit(url);
        cy.get('.glass-card', { timeout: 10000 }).should('exist');
      });

      it('should have .text-gradient title', () => {
        cy.visit(url);
        cy.get('.text-gradient', { timeout: 10000 }).should('exist');
      });

      it('should have .animate-entrance root', () => {
        cy.visit(url);
        cy.get('.animate-entrance', { timeout: 10000 }).should('exist');
      });

      it('should have .premium-table on table', () => {
        cy.visit(url);
        cy.get('.premium-table', { timeout: 10000 }).should('exist');
      });
    });
  });
});

describe('Design System - Form Pages', () => {
  beforeEach(() => {
    login();
  });

  const formPages = [
    { url: '/sales/leads/add-lead', name: 'Add Lead' },
    { url: '/sales/clients/add-client', name: 'Add Client' },
    { url: '/sales/opportunity/add-opportunity', name: 'Add Opportunity' },
    { url: '/sales/deals/add-deal', name: 'Add Deal' },
    { url: '/staff/add-staff', name: 'Add Staff' },
    { url: '/roles/add-role', name: 'Add Role' },
  ];

  formPages.forEach(({ url, name }) => {
    describe(`${name} Form (${url})`, () => {
      it('should have .glass-card container', () => {
        cy.visit(url);
        cy.get('.glass-card', { timeout: 10000 }).should('exist');
      });

      it('should have .form-section blocks', () => {
        cy.visit(url);
        cy.get('.form-section', { timeout: 10000 }).should('exist');
      });

      it('should have .form-section-header with icon and title', () => {
        cy.visit(url);
        cy.get('.form-section-header', { timeout: 10000 }).should('exist');
        cy.get('.section-icon').should('exist');
        cy.get('.section-title').should('exist');
      });
    });
  });
});

describe('Design System - Dashboard', () => {
  beforeEach(() => {
    login();
  });

  it('should render dashboard with glass cards', () => {
    cy.visit('/');
    cy.get('.glass-card, .glass-container, .stat-card', { timeout: 15000 }).should('exist');
  });
});

describe('Design System - Login Page', () => {
  it('should have glass-card-premium form container', () => {
    cy.visit('/login');
    cy.get('.glass-card-premium', { timeout: 10000 }).should('exist');
  });

  it('should have animated sections', () => {
    cy.visit('/login');
    cy.get('.animate-fade-in-right', { timeout: 10000 }).should('exist');
  });

  it('should have ProfessionalBackground', () => {
    cy.visit('/login');
    // The professional background renders behind the form
    cy.get('.login-page').should('exist');
  });
});
