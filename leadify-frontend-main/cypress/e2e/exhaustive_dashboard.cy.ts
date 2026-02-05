/// <reference types="cypress" />

describe('Dashboard Data Integrity', () => {

    beforeEach(() => {
        cy.visit('/login');
        cy.get('input[name="email"]').type('admin@hp-tech.com');
        cy.get('input[name="password"]').type('Heroo@1502');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });

    it('Scenario 1: Global Dashboard Charts', () => {
        cy.visit('/');
        // Check for presence of ECharts or Canvas elements
        cy.get('canvas, .echarts', { timeout: 20000 }).should('exist');
        cy.contains('Revenue').should('be.visible');
        cy.contains('Lead Conversion').should('be.visible');
    });

    it('Scenario 2: Procurement Statistics', () => {
        cy.visit('/procurement/statistics');
        cy.get('canvas, .echarts', { timeout: 15000 }).should('exist');
        // Ensure no empty state if data exists
        cy.get('body').should('not.contain', 'No data');
    });

    it('Scenario 3: Report Generation Integrity', () => {
        cy.visit('/reports');
        cy.contains('h2', 'Report').should('be.visible');
        // Verify we can at least interact with the table
        cy.get('table').should('exist');
    });
});
