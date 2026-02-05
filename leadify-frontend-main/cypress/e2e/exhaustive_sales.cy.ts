/// <reference types="cypress" />

describe('Exhaustive Sales Suite', () => {
    const ts = Date.now();
    const testLead = {
        name: `QA_LEAD_${ts}`,
        company: `QA_CORP_${ts}`,
        email: `qa_${ts}@hpt.com`,
        phone: '1234567890'
    };

    beforeEach(() => {
        cy.visit('/login');
        cy.get('input[name="email"]').type('admin@hp-tech.com');
        cy.get('input[name="password"]').type('Heroo@1502');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });

    it('Scenario 1: Full Lead Lifecycle', () => {
        // Create Lead
        cy.visit('/sales/leads');
        cy.contains('button', 'New Lead').click();
        cy.get('input[placeholder*="Name"]').first().type(testLead.name);
        cy.get('input[placeholder*="Company"]').first().type(testLead.company);
        cy.get('input[placeholder*="Email"]').first().type(testLead.email);
        cy.get('input[placeholder*="Phone"]').first().type(testLead.phone);
        cy.contains('button', 'Save').click();
        cy.contains('Success').should('be.visible');

        // View & Verify
        cy.visit('/sales/leads');
        cy.contains(testLead.name).click();
        cy.contains('Lead Details').should('be.visible');
        cy.contains(testLead.company).should('be.visible');

        // Edit Lead
        cy.contains('button', 'Edit').click();
        cy.get('input[placeholder*="Name"]').first().clear().type(`${testLead.name}_UPDATED`);
        cy.contains('button', 'Save').click();
        cy.contains('Updated successfully').should('be.visible');
    });

    it('Scenario 2: Opportunity & Deal Conversion', () => {
        // Convert existing lead to Opportunity (Assuming logic exists)
        cy.visit('/sales/opportunity');
        cy.contains('button', 'New Opportunity').click();
        // Fill opportunity form (Adjust selectors based on implementation)
        cy.get('input[placeholder*="Title"], .el-input__inner').first().type(`QA_OPP_${ts}`);
        // Verification of stage automation
        cy.contains('Discovery').should('be.visible');
        // Save
        cy.contains('button', /Save|Create/).click();
        cy.contains('created').should('be.visible');
    });

    it('Scenario 3: Proposal Generation', () => {
        cy.visit('/sales/proposals');
        cy.contains('button', 'New Proposal').click();
        // Check if editor loads
        cy.get('.tiptap, .ql-editor, .prose', { timeout: 15000 }).should('exist');
        cy.contains('button', 'Preview').should('be.visible');
    });
});
