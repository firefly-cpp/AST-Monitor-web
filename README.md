# CYCLearn

🚴 Welcome to CYCLearn! 🚴‍♂️  
Transforming Cyclist Training with Advanced Automation and Data Analysis

## About

CYCLearn is an innovative web platform designed to revolutionize cyclist training through data analysis and advanced features. Leveraging real-time data such as heart rate, speed, and location collected through integration with the open-source cycling computer AST-Monitor, CYCLearn enables coaches to efficiently manage training sessions, track performance, and gain valuable insights into athlete progress. Our platform combines data and technology to help coaches and athletes achieve new heights in their sports achievements.

## Key features

- **Training Management:** Efficiently manage training sessions and schedules for cyclists.
- **Real-Time Performance Analysis:** Track and compare performance data dynamically with interactive graphs and trend analysis.
- **Map Visualization:** Draw and update cyclists' routes on interactive maps using GPS data.
- **Advanced Analytical Dashboards:** Customized dashboards provide insights into key performance indicators (KPIs) and trend analysis.
- **Data Import and Export:** Import and export training data in various formats for external analysis or sharing with other platforms.

## Backend setup

### Prerequisites

- Python
- PostgreSQL
- Poetry

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/AST-Monitor-web.git
   cd AST-Monitor-web
2. **Create a poetry environment and install dependencies:**

   ```bash
   poetry install
3. **Create a PostgreSQL database:**

- Create a new PostgreSQL database.

- Navigate to the database/creatingDBscript.sql file and run it in the query to set up the database schema.

4. **Create an environment file:**

- In the root of the project, create a .env file with the following content:
   ```dotenv
   Copy code
   MAIL_USERNAME=cyclearninfo@gmail.com
   MAIL_PASSWORD=udnc oadv dxsh pwtv
   SQLALCHEMY_DATABASE_URI=postgres://YourUserName:YourPassword@YourHostname:YourPort/YourDatabaseName
   TEST_DATABASE_URL=postgres://YourUserName:YourPassword@YourHostname:YourPort/YourDatabaseName
  
- Insert valid uris for SQLALCHEMY_DATABASE_URI and TEST_DATABASE_URL

- TEST_DATABASE_URL should contain the same database as the SQLALCHEMY_DATABASE_URI, it's just meant for testing purposes

5. Starting the backend server
- Navigate to the `ast_monitor_web/run.py` and run it 

## Frontend setup

### Prerequisites
- Node.js
- npm

### Steps
1. **Navigate to the frontend directory:**

    ```bash
    cd frontend

2. **Install dependencies:**

    ```bash
    npm install

3. **Start the application:**

    ```bash
    npm start

## Populating the training sessions table

### To populate the training_sessions table (recommended), follow these steps:

1. **Create a Coach and a Cyclist:**

Use the application to create a coach and a cyclist.

2. **Extract zip files from `scripts` and put it so the path is like this: `scripts/Sport5Rider3.json`**

3. **Run the population script:**

- Navigate to the `scripts/populateSessions.py` file.
- At the bottom of the script, modify the `insert_data(data_list, cyclist_id=1)` line to change the cyclist's ID as needed.
   ```bash
   python scripts/populateSessions.py
  
## Machine learning data

### To run the part for health monitoring:

**Extract zip files from `ast_monitor_web/csv/treci.zip` and put it so the path is like this: `ast_monitor_web/csv/treci.csv`**



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