# CYCLearn

🚴 Welcome to CYCLearn! 🚴‍♂️  
Transforming Cyclist Training with Advanced Automation and Data Analysis

## About

CYCLearn is an innovative web platform designed to revolutionize cyclist training through data analysis and advanced features. Leveraging real-time data such as heart rate, speed, and location collected through integration with the open-source cycling computer AST-Monitor, CYCLearn enables coaches to efficiently manage training sessions, track performance, and gain valuable insights into athlete progress. Our platform combines data and technology to help coaches and athletes achieve new heights in their sports achievements.

## Key Features

- **Training Management:** Efficiently manage training sessions and schedules for cyclists.
- **Real-Time Performance Analysis:** Track and compare performance data dynamically with interactive graphs and trend analysis.
- **Map Visualization:** Draw and update cyclists' routes on interactive maps using GPS data.
- **Advanced Analytical Dashboards:** Customized dashboards provide insights into key performance indicators (KPIs) and trend analysis.
- **Data Import and Export:** Import and export training data in various formats for external analysis or sharing with other platforms.

## Backend Setup

### Prerequisites

- Python
- PostgreSQL
- Poetry

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/AST-Monitor-web.git
   cd AST-Monitor-web
2. **Create a Poetry Environment and Install Dependencies:**

   ```bash
   poetry install
3. **Create a PostgreSQL Database:**

- Create a new PostgreSQL database.

- Navigate to the database/creatingDBscript.sql file and run it in the query to set up the database schema.

4. Create an Environment File:

- In the root of the project, create a .env file with the following content:
   ```dotenv
   Copy code
   MAIL_USERNAME=cyclearninfo@gmail.com
   MAIL_PASSWORD=udnc oadv dxsh pwtv
   SQLALCHEMY_DATABASE_URI=postgres://YourUserName:YourPassword@YourHostname:YourPort/YourDatabaseName
   TEST_DATABASE_URL=postgres://YourUserName:YourPassword@YourHostname:YourPort/YourDatabaseName
  
- Insert valid uris for SQLALCHEMY_DATABASE_URI and TEST_DATABASE_URL

- TEST_DATABASE_URL should contain the same database as the SQLALCHEMY_DATABASE_URI, it's just meant for testing purposes

5. Starting the Backend Server
- Navigate to the `ast_monitor_web/run.py` and run it 

## Frontend Setup

### Prerequisites
- Node.js
- npm

### Steps
1. **Navigate to the Frontend Directory:**

    ```bash
    cd frontend

2. **Install Dependencies:**

    ```bash
    npm install

3. **Start the Application:**

    ```bash
    npm start

## Populating the Training Sessions Table

### To populate the training_sessions table (recommended), follow these steps:

1. **Create a Coach and a User:**

Use the application to create a coach and a user.
2. **Run the Population Script:**

- Navigate to the `scripts/populateSessions.py` file.
- At the bottom of the script, modify the `insert_data(data_list, cyclist_id=1)` line to change the cyclist's ID as needed.
   ```bash
   python scripts/populateSessions.py

## Technologies Used
### Frontend
- React
- Axios

### Backend
- Python Flask
- PostgreSQL
- SQLAlchemy
- Flask-Mail
### Other
- AST-Monitor Integration
- GPS Data Visualization

Embark on an extraordinary cycling journey with CYCLearn! 🚴‍♂️🌟