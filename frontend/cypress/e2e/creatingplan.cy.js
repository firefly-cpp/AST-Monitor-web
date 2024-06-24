describe('Create Training Plan Tests', () => {
    const loginAsCoach = () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="text"]').type('testcoach'); // Replace with actual username
        cy.get('input[type="password"]').type('123'); // Replace with actual password

        cy.intercept('POST', 'http://localhost:5000/auth/login').as('loginRequest');
        cy.get('button[type="submit"]').click();
        cy.wait('@loginRequest').then((interception) => {
            expect(interception.response.statusCode).to.eq(200);
            const { access_token, role } = interception.response.body;
            expect(role).to.eq('coach');

            cy.window().then((window) => {
                window.localStorage.setItem('token', access_token);
                window.localStorage.setItem('role', role);
            });
        });

        cy.url().should('include', '/dashboard/overview');
    };

    const goToCreateTrainingPlan = () => {
        cy.visit('http://localhost:3000/dashboard/create-plan');
        cy.url().should('include', '/dashboard/create-plan');
    };

    const createNewTrainingTemplate = () => {
        const templateName = 'Test Template ' + Date.now(); // Unique identifier
        cy.get('button.submit-button').contains('Create New Training Template').click();
        cy.get('select[name="type"]').select('endurance');
        cy.get('input[name="duration"]').type('123');
        cy.get('input[name="distance"]').type('123');
        cy.get('input[name="intensity"]').type('120-140');
        cy.get('textarea[name="notes"]').type(templateName);
        cy.get('button.submit-button').contains('Create Template').click();

        return templateName;
    };

    const createTrainingPlan = (templateName) => {
        const now = new Date();
        now.setHours(now.getHours() + 2); // Add 2 hours to the current time
        const startDate = now.toISOString().slice(0, 16); // Format for datetime-local input
        cy.get('input[name="start_date"]').type(startDate);
        cy.get('textarea[name="description"]').type('Test Description');
        cy.get('.cyclist-list span').contains('testuser').click();
        cy.get('.template-card').contains(templateName).click();
        cy.get('button.submit-button').contains('Create Plan').click();
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Training plan created successfully!');
        });
    };

   const deleteTemplate = () => {
    // Ensure the template card is visible before trying to delete
    cy.get('.template-card.selected').should('be.visible').within(() => {
        cy.get('img.delete-icon').should('be.visible').trigger('mouseover');
        cy.wait(1000); // Wait for 1 second after hover
        cy.get('img.delete-icon').click({ force: true });
    });

    // Handle the confirmation prompt
    cy.on('window:confirm', () => true);
};

    it('should create a new training template, create a training plan, and delete the template', () => {
        loginAsCoach();
        goToCreateTrainingPlan();
        const templateName = createNewTrainingTemplate();
        createTrainingPlan(templateName);
        deleteTemplate(templateName);
    });
});
