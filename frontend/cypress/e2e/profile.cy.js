describe('Profile Tests', () => {
  const login = (username, password) => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[type="text"]').type(username);
    cy.get('input[type="password"]').type(password);

    // Intercept the network request for login
    cy.intercept('POST', 'http://localhost:5000/auth/login').as('login');
    cy.get('button[type="submit"]').click();

    // Wait for the network request and check its status
    cy.wait('@login').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      const { access_token, role } = interception.response.body;

      // Check localStorage for token and role
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.eq(access_token);
        expect(window.localStorage.getItem('role')).to.eq(role);
      });
    });

    // Check if the URL redirects to /dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
  };

  const interceptProfileRequests = () => {
    cy.intercept('GET', 'http://localhost:5000/auth/profile').as('fetchProfile');
    cy.intercept('PUT', 'http://localhost:5000/auth/profile').as('updateProfile');
    cy.intercept('POST', 'http://localhost:5000/auth/upload_profile_picture').as('uploadProfilePicture');
  };

  const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  it('should log in as a coach, view and update the profile without changing username', () => {
    login('testcoach', '123');

    // Intercept profile requests
    interceptProfileRequests();

    // Navigate to the profile page
    cy.visit('http://localhost:3000/profile');

    // Wait for the profile to be fetched
    cy.wait('@fetchProfile').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });

    // Check if the profile data is displayed
    cy.contains('User Profile').should('be.visible');
    cy.contains('Username').should('be.visible');
    cy.contains('Email').should('be.visible');

    // Navigate to edit profile page
    cy.contains('Edit Profile').click();

    // Update profile without changing username
    cy.get('button[type="submit"]').click();

    // Wait for the profile to be updated
    cy.wait('@updateProfile').its('response.statusCode').should('eq', 200);

    // Check if the profile is still accessible
    cy.visit('http://localhost:3000/profile');
    cy.contains('testcoach').should('be.visible');
  });

  it('should log in as a cyclist, view and update the profile with random height and weight without changing username', () => {
    login('testuser', '123');

    // Intercept profile requests
    interceptProfileRequests();

    // Navigate to the profile page
    cy.visit('http://localhost:3000/profile');

    // Wait for the profile to be fetched
    cy.wait('@fetchProfile').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });

    // Check if the profile data is displayed
    cy.contains('User Profile').should('be.visible');
    cy.contains('Username').should('be.visible');
    cy.contains('Email').should('be.visible');

    // Navigate to edit profile page
    cy.contains('Edit Profile').click();

    // Generate random height and weight
    const newHeight = getRandomNumber(150, 200); // Random height between 150cm and 200cm
    const newWeight = getRandomNumber(50, 100);  // Random weight between 50kg and 100kg

    // Update profile without changing username
    cy.get('input[type="number"]').eq(0).clear().type(newHeight); // Update height
    cy.get('input[type="number"]').eq(1).clear().type(newWeight); // Update weight
    cy.get('button[type="submit"]').click();

    // Wait for the profile to be updated
    cy.wait('@updateProfile').its('response.statusCode').should('eq', 200);

    // Check if the updated profile is displayed
    cy.visit('http://localhost:3000/profile');
    cy.contains('testuser').should('be.visible');
    cy.contains(`${newHeight} cm`).should('be.visible');
    cy.contains(`${newWeight} kg`).should('be.visible');
  });
});
