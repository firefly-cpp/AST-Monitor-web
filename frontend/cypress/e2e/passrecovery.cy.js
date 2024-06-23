describe('Password Recovery Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/recover'); // Adjust the path if needed
  });

  it('should request password recovery and show success alert', () => {
    const email = 'testuser@123'; // Use an appropriate test email

    // Intercept the network request
    cy.intercept('POST', 'http://localhost:5000/auth/recover').as('recoverPassword');

    // Stub the alert
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert');
    });

    // Fill out the form and submit
    cy.get('input[type="email"]').type(email);
    cy.get('button[type="submit"]').click();

    // Wait for the network request and check its status
    cy.wait('@recoverPassword').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });

    // Check if the correct alert message is shown
    cy.get('@alert').should(
      'have.been.calledWithExactly',
      'If that email address is in our database, we will send you an email to reset your password.'
    );

    // Check if the URL redirects to /login
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
