describe('Registration Tests', () => {
  // Helper function to generate a random string
  function getRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  beforeEach(() => {
    cy.visit('http://localhost:3000/register');
  });

  it('should register a new coach and redirect to login', () => {
    const randomString = getRandomString(5);
    const username = `coachUser_${randomString}`;
    const email = `coach_${randomString}@example.com`;

    cy.contains('Create a Coach Account').click();
    cy.get('input[type="text"]').type(username);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type('password123');

    // Intercept the network request
    cy.intercept('POST', 'http://localhost:5000/auth/register_coach').as('registerCoach');
    cy.get('button[type="submit"]').click(); // Ensure Cypress clicks the correct button

    // Wait for the network request and check its status
    cy.wait('@registerCoach').its('response.statusCode').should('eq', 201);

    // Check if the URL redirects to /login
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('should register a new cyclist and redirect to login', () => {
    const randomString = getRandomString(5);
    const username = `cyclistUser_${randomString}`;
    const email = `cyclist_${randomString}@example.com`;

    cy.contains('Create a Cyclist Account').click();
    cy.get('input[type="text"]').type(username);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type('password123');
    cy.get('select').select('testcoach'); // Replace 'testcoach' with an actual coachID from your database
    cy.get('input[type="date"]').type('1990-01-01');
    cy.get('input[type="number"]').eq(0).type('180'); // Height
    cy.get('input[type="number"]').eq(1).type('75'); // Weight

    // Intercept the network request
    cy.intercept('POST', 'http://localhost:5000/auth/register_cyclist').as('registerCyclist');
    cy.get('button[type="submit"]').click(); // Ensure Cypress clicks the correct button

    // Wait for the network request and check its status
    cy.wait('@registerCyclist').its('response.statusCode').should('eq', 201);

    // Check if the URL redirects to /login
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
