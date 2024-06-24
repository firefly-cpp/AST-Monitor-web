import json
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
from ast_monitor_web.app.models.training_plans_model import TrainingPlan, CyclistTrainingPlan, TrainingPlanTemplate
from config import TestConfig

def get_random_string(length=6):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

class TestCoachRoutes(TestCase):

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

        # Add a training session
        session = TrainingSession(
            cyclistID=self.cyclistID,
            altitude_avg=100,
            calories=500,
            duration=timedelta(hours=1),
            hr_avg=120,
            total_distance=30,
            start_time=datetime.now(),
            altitudes=json.dumps([100, 200, 300]),  # Example altitude data
            heartrates=json.dumps([110, 115, 120]),  # Example heart rate data
            speeds=json.dumps([20, 25, 30]),  # Example speed data
            positions=json.dumps([[45.0, 45.0], [46.0, 46.0]])  # Example position data
        )
        db.session.add(session)
        db.session.commit()

        print("Setup complete for TestCoachRoutes")

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        print("Teardown complete for TestCoachRoutes")

    def get_access_token(self, user_id, role):
        return create_access_token(identity={'user_id': user_id, 'role': role})

    def test_get_athletes(self):
        print("Starting test_get_athletes")
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.get('/coach/athletes', headers={'Authorization': f'Bearer {access_token}'})
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.json) > 0)
        print("Completed test_get_athletes")

    def test_get_athlete_profile(self):
        print("Starting test_get_athlete_profile")
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.get(f'/coach/athlete/{self.cyclistID}',
                                   headers={'Authorization': f'Bearer {access_token}'})
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['cyclistID'], self.cyclistID)
        print("Completed test_get_athlete_profile")

    def test_get_sessions_for_calendar(self):
        print("Starting test_get_sessions_for_calendar")
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.get(f'/coach/athlete/sessions/{self.cyclistID}',
                                   headers={'Authorization': f'Bearer {access_token}'})
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.json) > 0)
        print("Completed test_get_sessions_for_calendar")

    def test_create_training_plan(self):
        print("Starting test_create_training_plan")
        access_token = self.get_access_token(self.coachID, 'coach')

        # Create a training plan template without a planID
        template_response = self.client.post('/coach/create_training_plan_template',
                                             headers={'Authorization': f'Bearer {access_token}'}, json={
                'type': 'interval',
                'duration': '01:00:00',  # Ensure this matches the expected format
                'distance': 20,
                'intensity': 'high',
                'notes': 'Test template'
            })
        print(f"Template response status code: {template_response.status_code}")
        print(f"Template response JSON: {template_response.json}")
        template_id = template_response.json['sessionID']

        # Now create the training plan and link it to the template
        response = self.client.post('/coach/create_training_plan', headers={'Authorization': f'Bearer {access_token}'},
                                    json={
                                        'cyclist_ids': [self.cyclistID],
                                        'start_date': (datetime.now() + timedelta(days=1)).isoformat(
                                            timespec='seconds'),
                                        'sessions': [
                                            {'template_id': template_id, 'duration': '01:00:00', 'distance': 20,
                                             'type': 'interval', 'intensity': 'high'}],  # Explicitly include duration
                                        'description': 'Test plan'
                                    })
        print(f"Plan creation response status code: {response.status_code}")
        print(f"Plan creation response JSON: {response.json}")
        self.assertEqual(response.status_code, 201)

        # Update the planID in the training plan template after the plan is created
        training_plan_id = response.json['plansID']
        db.session.query(TrainingPlanTemplate).filter_by(sessionID=template_id).update({'planID': training_plan_id})
        db.session.commit()

        self.assertIn('Training plan created successfully', response.json['message'])
        print("Completed test_create_training_plan")

    def test_get_training_plan_templates(self):
        print("Starting test_get_training_plan_templates")
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.get('/coach/training_plan_templates',
                                   headers={'Authorization': f'Bearer {access_token}'})
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 200)
        print("Completed test_get_training_plan_templates")

    def test_create_training_plan_template(self):
        print("Starting test_create_training_plan_template")
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.post('/coach/create_training_plan_template',
                                    headers={'Authorization': f'Bearer {access_token}'}, json={
                'type': 'interval',
                'duration': '01:00:00',
                'distance': 20,
                'intensity': 'high',
                'notes': 'Test template'
            })
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 201)
        self.assertIn('interval', response.json['type'])
        print("Completed test_create_training_plan_template")

    def test_delete_training_plan_template(self):
        print("Starting test_delete_training_plan_template")
        # First, create a TrainingPlan and associate a template with it
        training_plan = TrainingPlan(
            coachID=self.coachID,
            start_date=datetime.now(),
            description='Test plan',
            executed='No'
        )
        db.session.add(training_plan)
        db.session.commit()

        plan_id = training_plan.plansID

        template = TrainingPlanTemplate(
            type='interval',
            duration=timedelta(hours=1),
            distance=20,
            intensity='high',
            notes='Test template',
            planID=plan_id
        )
        db.session.add(template)
        db.session.commit()
        template_id = template.sessionID

        # Now, test deletion
        access_token = self.get_access_token(self.coachID, 'coach')
        response = self.client.delete(f'/coach/delete_training_plan_template/{template_id}',
                                      headers={'Authorization': f'Bearer {access_token}'})
        print(f"Response status code: {response.status_code}")
        print(f"Response JSON: {response.json}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('Training plan template deleted successfully', response.json['message'])
        print("Completed test_delete_training_plan_template")


if __name__ == '__main__':
    unittest.main()
