describe('Login Tests', () => {
  const checkLocalStorage = (token, role) => {
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq(token);
      expect(window.localStorage.getItem('role')).to.eq(role);
    });
  };

  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it('should log in as a coach and redirect to dashboard', () => {
    cy.get('input[type="text"]').type('testcoach');
    cy.get('input[type="password"]').type('123');

    // Intercept the network request
    cy.intercept('POST', 'http://localhost:5000/auth/login').as('loginCoach');
    cy.get('button[type="submit"]').click(); // Ensure Cypress clicks the correct button

    // Wait for the network request and check its status
    cy.wait('@loginCoach').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      const { access_token, role } = interception.response.body;

      // Check if the URL redirects to /dashboard
      cy.url({ timeout: 10000 }).should('include', '/dashboard');

      // Check localStorage for token and role
      checkLocalStorage(access_token, role);
    });
  });

  it('should log in as a cyclist and redirect to dashboard', () => {
    cy.get('input[type="text"]').type('testuser');
    cy.get('input[type="password"]').type('123');

    // Intercept the network request
    cy.intercept('POST', 'http://localhost:5000/auth/login').as('loginCyclist');
    cy.get('button[type="submit"]').click(); // Ensure Cypress clicks the correct button

    // Wait for the network request and check its status
    cy.wait('@loginCyclist').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      const { access_token, role } = interception.response.body;

      // Check if the URL redirects to /dashboard
      cy.url({ timeout: 10000 }).should('include', '/dashboard');

      // Check localStorage for token and role
      checkLocalStorage(access_token, role);
    });
  });
});
