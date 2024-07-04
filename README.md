# CYCLearn

🚴 Welcome to CYCLearn! 🚴‍♂️  
Transforming Cyclist Training with Advanced Automation and Data Analysis

## About

The CYCLearn project aims to develop an easy to use platform designed to analyze and visualize cyclists' training sessions data using data automation and analytics. This project targets enhancing training efficiency through predictive analysis and providing valuable insights into athlete performance. By integrating machine learning techniques with a user-friendly web platform, CYCLearn aims to to improve performance and health monitoring. This platfort leverages different technologies to offer a comprehensive solution for coaches and cyclists to monitor, evaluate, and improve their training regimens.
## Key features


- **Visualize Training Metrics:** Provide detailed visualizations of various training metrics such as heart rate, altitude, distance, and speed to give users a comprehensive view of their performance.
- **Analyze Performance:** Use advanced machine learning algorithms to discover patterns and insights from the data.
- **Predictive Analytics:** Implement predictive analysis to foresee potential health risks and performance issues.
- **Enhance Training Efficiency:** Offer actionable insights and recommendations to improve training effectiveness.
- **User-Friendly Interface:** Provide an intuitive and easy-to-use interface for both coaches and cyclists.


## Screenshots
Screenshots of the CYCLearn application:

![Profile Overview](frontendphotos/ProfileOverview.png)
*Profile Overview*

![Cyclists Overview](frontendphotos/CyclistsOverview.png)
*Cyclists Overview*

![Training Calendar](frontendphotos/TrainingCalender.png)
*Training Calendar*

![Training Metrics](frontendphotos/TrainingMetrics.png)
*Training Metrics*

![Weather Data](frontendphotos/WeatherData.PNG)
*Weather Data*

![Route Map](frontendphotos/RouteMap.png)
*Route Map*

![Hill Data](frontendphotos/HillData.png)
*Hill Data*

![Altitude](frontendphotos/Altitude.png)
*Altitude Over Time chart*

![Heart Rate](frontendphotos/HeartRate.PNG)
*Heart Rate Over Time chart*

![Speed](frontendphotos/Speed.PNG)
*Speed Over Time chart*

![Training Plan](frontendphotos/TrainingPlan.png)
*Training Plan*

![Training Template](frontendphotos/TrainingTemplate.png)
*Training Template*

![Create Plan](frontendphotos/CreatePlan.png)
*Create Plan*

![My Plans](frontendphotos/MyPlans.png)
*My Plans*

![Health Monitoring](frontendphotos/HealthMonitoring.png)
*Health Monitoring*

![AST Monitor](frontendphotos/ASTMonitor.png)
*AST Monitor*

![Import Export](frontendphotos/ImportExport.png)
*Import Export*


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

- Navigate to the `database/creatingDBscript.sql` file and run the query to set up the database schema.

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
