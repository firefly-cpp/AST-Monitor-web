import unittest
import random
import string
from flask_testing import TestCase
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from ast_monitor_web.app import create_app, db
from ast_monitor_web.app.models.usermodel import Coach, Cyclist
from ast_monitor_web.app.models.training_sessions_model import TrainingSession
from config import TestConfig
import os

class TestCyclistRoutes(TestCase):

    def create_app(self):
        return create_app(TestConfig)

    def setUp(self):
        self.app = self.create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

        self.unique_suffix = get_random_string()

        # Add initial test data with unique username and email
        self.coach_username = f"testcoach_{self.unique_suffix}"
        self.coach_email = f"testcoach_{self.unique_suffix}@example.com"
        self.cyclist_username = f"testcyclist_{self.unique_suffix}"
        self.cyclist_email = f"testcyclist_{self.unique_suffix}@example.com"

        hashed_password = generate_password_hash("testpassword")

        coach = Coach(username=self.coach_username, email=self.coach_email, password=hashed_password)
        db.session.add(coach)
        db.session.commit()
        self.coachID = coach.coachID

        cyclist = Cyclist(coachID=self.coachID, username=self.cyclist_username, email=self.cyclist_email,
                          password=hashed_password)
        db.session.add(cyclist)
        db.session.commit()
        self.cyclistID = cyclist.cyclistID

        # Add a training session with positions data
        session = TrainingSession(
            cyclistID=self.cyclistID,
            altitude_avg=100,
            calories=500,
            duration=timedelta(hours=1),
            hr_avg=120,
            total_distance=30,
            start_time=datetime.now(),
            altitudes='[100, 200, 150]',
            heartrates='[60, 120, 180]',
            speeds='[10, 15, 20]',
            positions='[[45.0, -93.0], [45.1, -93.1]]'
        )
        db.session.add(session)
        db.session.commit()
        self.sessionID = session.sessionsID

        print("Setup complete for TestCyclistRoutes")

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        print("Teardown complete for TestCyclistRoutes")

    def get_access_token(self, user_id, role):
        return create_access_token(identity={'user_id': user_id, 'role': role})

    def test_run_niaarm(self):
        print("Starting test_run_niaarm")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.post('/cyclist/run_niaarm', headers=headers)
        print(f"run_niaarm response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('rules', response.json)
        print("Completed test_run_niaarm")

    def test_get_cyclist_sessions(self):
        print("Starting test_get_cyclist_sessions")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.get('/cyclist/sessions', headers=headers)
        print(f"get_cyclist_sessions response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.json) > 0)
        print("Completed test_get_cyclist_sessions")

    def test_get_session_details(self):
        print("Starting test_get_session_details")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.get(f'/cyclist/session/{self.sessionID}', headers=headers)
        print(f"get_session_details response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('altitude_avg', response.json)
        print("Completed test_get_session_details")

    def test_get_saved_rules(self):
        print("Starting test_get_saved_rules")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.get('/cyclist/get_saved_rules', headers=headers)
        print(f"get_saved_rules response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('rules', response.json)
        print("Completed test_get_saved_rules")

    def test_check_session(self):
        print("Starting test_check_session")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        session_data = {
            "hr_max": 180,
            "hr_avg": 120,
            "hr_min": 60,
            "altitude_avg": 100,
            "total_distance": 30,
            "positions": [[45.0, -93.0], [45.1, -93.1]]
        }

        response = self.client.post('/cyclist/check_session', headers=headers, json=session_data)
        print(f"check_session response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('warnings', response.json)
        print("Completed test_check_session")

    def test_get_cyclist_training_plans(self):
        print("Starting test_get_cyclist_training_plans")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.get('/cyclist/training_plans', headers=headers)
        print(f"get_cyclist_training_plans response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        print("Completed test_get_cyclist_training_plans")

    def test_execute_training_plan(self):
        print("Starting test_execute_training_plan")
        access_token = self.get_access_token(self.cyclistID, 'cyclist')
        headers = {'Authorization': f'Bearer {access_token}'}

        # Assuming a training plan exists for the cyclist
        plan_id = 1  # Replace with a valid plan ID
        response = self.client.post(f'/cyclist/training_plans/{plan_id}/execute', headers=headers)
        print(f"execute_training_plan response status code: {response.status_code}, response data: {response.json}")
        if response.status_code == 200:
            self.assertEqual(response.status_code, 200)
            self.assertIn('Training plan executed successfully', response.json['message'])
        else:
            self.assertIn('Training plan not found', response.json['error'])
        print("Completed test_execute_training_plan")


def get_random_string(length=6):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))


if __name__ == '__main__':
    unittest.main()
