/// <reference types="cypress" />

describe('Exhaustive Procurement Suite', () => {
    const ts = Date.now();

    beforeEach(() => {
        cy.visit('/login');
        cy.get('input[name="email"]').type('admin@hp-tech.com');
        cy.get('input[name="password"]').type('Heroo@1502');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });

    it('Scenario 1: Global Vendor Management', () => {
        const vendorNames = ['Vendor', 'Distributor', 'Local Supplier', 'Showroom'];
        const paths = ['/procurement/vendors', '/procurement/distributors', '/procurement/local-suppliers', '/procurement/showrooms'];

        paths.forEach((path, index) => {
            cy.visit(path);
            cy.contains('button', /New|Add/).click();
            cy.get('input[placeholder*="Name"]').first().type(`QA_${(vendorNames[index] || '').toUpperCase()}_${ts}`);
            cy.contains('button', /Save|Create/).click();
            cy.contains('Success').should('be.visible');
        });
    });

    it('Scenario 2: Purchase Order Lifecycle', () => {
        cy.visit('/procurement/purchase-orders');
        cy.contains('button', /New|Add/).click();
        // Assuming PO form selection logic
        cy.get('input[placeholder*="Subject"], .el-input__inner').first().type(`QA_PO_${ts}`);
        cy.contains('button', /Save|Create/).click();
        cy.contains('Success').should('be.visible');
    });

    it('Scenario 3: RFQ Workflow', () => {
        cy.visit('/procurement/rfq');
        cy.contains('button', /New|Add/).click();
        cy.get('input[placeholder*="Title"], .el-input__inner').first().type(`QA_RFQ_${ts}`);
        cy.contains('button', /Save|Create/).click();
        cy.contains('Success').should('be.visible');
    });
});
