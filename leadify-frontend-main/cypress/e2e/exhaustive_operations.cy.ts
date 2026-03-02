/// <reference types="cypress" />

describe('Exhaustive Operations Suite', () => {
  const ts = Date.now();

  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(Cypress.env('TEST_EMAIL') || 'admin@hp-tech.com');
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('Scenario 1: Project & Task Lifecycle', () => {
    cy.visit('/operations/projects');
    cy.contains('button', /New|Add/).click();
    cy.get('input[placeholder*="Name"]').first().type(`QA_PROJECT_${ts}`);
    cy.contains('button', /Save|Create/).click();
    cy.contains('Success').should('be.visible');

    // Create Task
    cy.visit('/operations/daily-task');
    cy.contains('button', /New|Add/).click();
    cy.get('input[placeholder*="Title"]').first().type(`QA_TASK_${ts}`);
    cy.contains('button', /Save|Create/).click();
    cy.contains('Success').should('be.visible');
  });

  it('Scenario 2: Resource Inventory Management', () => {
    // Vehicles
    cy.visit('/operations/vehicle');
    cy.contains('button', /New|Add/).click();
    cy.get('input[placeholder*="Plate"], input[placeholder*="Name"]').first().type(`QA_VEHICLE_${ts}`);
    cy.contains('button', /Save|Create/).click();

    // Manpower
    cy.visit('/operations/manpower');
    cy.contains('button', /New|Add/).click();
    cy.get('input[placeholder*="Name"]').first().type(`QA_WORKER_${ts}`);
    cy.contains('button', /Save|Create/).click();
  });

  it('Scenario 3: Assets & Materials', () => {
    cy.visit('/operations/assets');
    cy.contains('button', /New|Add/).click();
    cy.get('input[placeholder*="Name"]').first().type(`QA_ASSET_${ts}`);
    cy.contains('button', /Save|Create/).click();
  });
});
