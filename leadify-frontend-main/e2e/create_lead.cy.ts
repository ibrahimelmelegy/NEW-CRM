describe('Create Lead Flow', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/login');
        cy.get('input[type="email"]').type('super@admin.com');
        cy.get('input[type="password"]').type('123456');
        cy.get('button').contains('Sign In').click();
        cy.url().should('include', '/');
    });

    it('should create a new lead successfully', () => {
        // Navigate to Leads page
        cy.visit('/sales/leads');

        // Open Create Lead Modal
        // Assuming there is a button with 'Add Lead' or similar. 
        // Using a generous selector strategy to find the primary action button
        cy.contains('button', 'Add').click();

        // Fill Lead Form
        const testLeadName = `Test Lead ${Date.now()}`;
        cy.get('input[name="clients_name"]').type(testLeadName); // Adjust name attr
        cy.get('input[name="phone"]').type('01000000000');

        // Select status/source if required (This might need specific selectors based on Element Plus)
        // Example for Element Plus Select:
        // cy.get('.el-select').first().click();
        // cy.get('.el-select-dropdown__item').first().click();

        // Submit
        cy.contains('button', 'Save').click();

        // Verify Lead appears in table
        cy.contains(testLeadName).should('exist');
    });
});
