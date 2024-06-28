describe('AthleteProfile Tests', () => {
    const login = (username, password) => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="text"]').type(username);
        cy.get('input[type="password"]').type(password);

        cy.intercept('POST', 'http://localhost:5000/auth/login').as('loginRequest');
        cy.get('button[type="submit"]').click();
        cy.wait('@loginRequest').then((interception) => {
            expect(interception.response.statusCode).to.eq(200);
            const { access_token, role } = interception.response.body;

            cy.window().then((window) => {
                window.localStorage.setItem('token', access_token);
                window.localStorage.setItem('role', role);
            });
        });
    };

     const logout = () => {
        cy.get('button.nav-button').contains('Logout').click(); // Adjust the selector to match your logout button
        cy.wait(3000); // Wait for 3 seconds to ensure the logout process is completed

        cy.get('a.nav-link[href="/login"]').click(); // Click on the login link to go back to the login page
        cy.url().should('include', '/login');
    };

    const goToAthleteProfile = () => {
        cy.contains('testuser').click();
        cy.url().should('include', '/dashboard/athlete/');
    };

    const selectDateAndCheckSession = () => {
        cy.wait(5000); // Wait for the calendar to load sufficiently
        cy.get('abbr[aria-label="June 20, 2024"]').click(); // This targets the <abbr> with the specific aria-label

        // Check session details cards
        cy.get('.session-cards .card').should('have.length', 12);

        // Check weather data
        cy.get('.weather-container').should('be.visible');
        cy.get('.weather-card p').should('have.length', 4);

        // Check if the map is loaded
        cy.get('.map-container').should('be.visible');
        cy.get('.leaflet-container').should('exist'); // Checks if the leaflet map is rendered

        // Check hill data and hills share charts
        cy.get('.chart-row').each(($chartRow) => {
            cy.wrap($chartRow).within(() => {
                cy.get('.chart-container').should('have.length', 2);
                cy.get('canvas').should('have.length', 2); // Assumes there are 2 graphs: Hill Data, Hills Share
            });
        });

        // Check line charts: Altitude, Heart Rate, Speed
        cy.get('.chart-container').each(($chartContainer) => {
            cy.wrap($chartContainer).within(() => {
                cy.get('canvas').should('have.length', 1); // Assumes there is 1 graph per chart container
            });
        });

        // Check buttons for exporting data
        cy.get('.button-container').within(() => {
            cy.get('button').should('have.length', 2);
        });
    };

    it('should load and display all data for the selected training session as coach, then as cyclist', () => {
        // Login as Coach and perform the test
        login('testcoach', '123');
        cy.url().should('include', '/dashboard/overview');
        goToAthleteProfile();
        selectDateAndCheckSession();
        logout();

        // Login as Cyclist and perform the test
        login('testuser', '123');
        cy.url().should('include', '/dashboard/calendar');
        selectDateAndCheckSession();
    });
});
