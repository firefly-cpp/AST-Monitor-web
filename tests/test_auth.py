import unittest
import random
import string
from flask_testing import TestCase
from werkzeug.security import generate_password_hash
from ast_monitor_web.app import create_app, db
from ast_monitor_web.app.models.usermodel import Coach, Cyclist
from config import TestConfig


def get_random_string(length=6):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))


class TestAuth(TestCase):

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

        print("Setup complete for TestAuth")

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        print("Teardown complete for TestAuth")

    def test_register_coach(self):
        print("test_auth testing info: Starting test_register_coach")
        new_username = f"newcoach_{self.unique_suffix}"
        new_email = f"newcoach_{self.unique_suffix}@example.com"
        response = self.client.post('/auth/register_coach', json={
            'username': new_username,
            'email': new_email,
            'password': 'newpassword'
        })
        print(f"Register coach response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 201)
        self.assertIn('Coach registered successfully', response.json['message'])
        print("Completed test_register_coach")

    def test_register_cyclist(self):
        print("Starting test_register_cyclist")
        new_username = f"newcyclist_{self.unique_suffix}"
        new_email = f"newcyclist_{self.unique_suffix}@example.com"
        response = self.client.post('/auth/register_cyclist', json={
            'username': new_username,
            'email': new_email,
            'password': 'newpassword',
            'coachID': self.coachID,
            'date_of_birth': '1990-01-01',
            'height_cm': 180,
            'weight_kg': 70
        })
        print(f"Register cyclist response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 201)
        self.assertIn('Cyclist registered successfully', response.json['message'])
        print("Completed test_register_cyclist")

    def test_login_coach(self):
        print("Starting test_login_coach")
        print(f"Logging in with username: {self.coach_username}, password: 'testpassword'")
        response = self.client.post('/auth/login', json={
            'username': self.coach_username,
            'password': 'testpassword'
        })
        print(f"Login response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.json)
        self.assertEqual(response.json['role'], 'coach')
        print("Completed test_login_coach")

    def test_login_cyclist(self):
        print("Starting test_login_cyclist")
        print(f"Logging in with username: {self.cyclist_username}, password: 'testpassword'")
        response = self.client.post('/auth/login', json={
            'username': self.cyclist_username,
            'password': 'testpassword'
        })
        print(f"Login response status code: {response.status_code}, response data: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.json)
        self.assertEqual(response.json['role'], 'cyclist')
        print("Completed test_login_cyclist")

    def test_profile_access(self):
        print("Starting test_profile_access")
        # Log in as coach to get token
        login_response = self.client.post('/auth/login', json={
            'username': self.coach_username,
            'password': 'testpassword'
        })
        print(f"Profile access login response: {login_response.status_code}, {login_response.json}")
        self.assertEqual(login_response.status_code, 200)
        access_token = login_response.json['access_token']

        # Use token to access profile
        profile_response = self.client.get('/auth/profile', headers={
            'Authorization': f'Bearer {access_token}'
        })
        print(f"Profile access response status code: {profile_response.status_code}, response data: {profile_response.json}")
        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(profile_response.json['username'], self.coach_username)
        print("Completed test_profile_access")


if __name__ == '__main__':
    unittest.main()
