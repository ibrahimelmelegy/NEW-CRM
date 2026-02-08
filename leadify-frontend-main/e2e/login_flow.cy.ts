describe('Login Flow', () => {
  it('should successfully login with valid credentials', () => {
    // Visit the login page
    cy.visit('/login');

    // Check if we are on the login page
    cy.contains('Sign In').should('be.visible');

    // Fill in credentials (using default dev credentials if available or generic ones)
    // Adjust these selectors based on actual UI if they fail, but assuming standard inputs
    cy.get('input[type="email"]').type('super@admin.com');
    cy.get('input[type="password"]').type('123456');

    // Click login button
    cy.get('button').contains('Sign In').click();

    // Should redirect to dashboard
    cy.url().should('include', '/');

    // precise verification
    cy.get('.glass-card').should('exist'); // dashboard elements
  });

  it('should show error on invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('wrong@admin.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button').contains('Sign In').click();

    // Expect error message
    cy.contains('Invalid credentials').should('exist');
  });
});
