"""
Cyclist-related routes and logic for the AST Monitor web application.
"""

import json
import os
import pandas as pd
import logging
from flask import jsonify, Blueprint, make_response, request, current_app
from niaarm import Dataset, get_rules
from niapy.algorithms.basic import DifferentialEvolution
from flask_jwt_extended import jwt_required, get_jwt_identity
import numpy as np

from ..models.training_plans_model import TrainingPlan, CyclistTrainingPlan
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db
from ..utils import get_weather_data, compute_hill_data

cyclist_bp = Blueprint('cyclist_bp', __name__)

HR_MAX_THRESHOLD = 200  # Example threshold for high heart rate
HR_MIN_THRESHOLD = 50  # Example threshold for low heart rate

# Update paths to be relative to the project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../'))
RULES_FILE_PATH = os.path.join(PROJECT_ROOT, 'ast_monitor_web/csv/generated_rules.json')
CSV_FILE_PATH = os.path.join(PROJECT_ROOT, 'ast_monitor_web/csv/treci.csv')

def build_cors_preflight_response():
    """Build a CORS preflight response.

    Returns:
        Response: A Flask response with CORS headers.
    """
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

@cyclist_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_cyclist_sessions():
    """Get all sessions for the current cyclist.

    Returns:
        Response: JSON response with a list of sessions and their start times.
    """
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    cyclist_id = current_user_id
    if current_user_role == 'coach':
        cyclist_id = request.args.get('cyclist_id')
        if not cyclist_id:
            return jsonify({"message": "Cyclist ID is required"}), 400

    try:
        sessions = TrainingSession.query.filter_by(cyclistID=cyclist_id).order_by(TrainingSession.start_time).all()
        session_dates = [{
            "sessionID": session.sessionsID,
            "start_time": session.start_time.isoformat()
        } for session in sessions]

        return jsonify(session_dates)
    except Exception as e:
        logging.error("Error fetching sessions: %s", str(e))
        return jsonify({"error": "Error fetching sessions"}), 500

CSV_MARIBOR = os.path.join(PROJECT_ROOT, 'ast_monitor_web/csv/open-meteo-maribor.csv')

def get_weather_data_from_csv(date):
    """Fetch weather data from a CSV file for a specific date.

    Args:
        date (datetime.date): The date for which to fetch weather data.

    Returns:
        dict: A dictionary containing weather data, or an empty dictionary if data is not found.
    """
    try:
        df = pd.read_csv(CSV_MARIBOR, skiprows=2, parse_dates=['time'])
        weather_data = df[df['time'].dt.date == date]
        if weather_data.empty:
            return {}
        
        weather_data = weather_data.iloc[0]
        weather_info = {
            "temp_c": weather_data['temperature_2m (°C)'] if not pd.isna(weather_data['temperature_2m (°C)']) else None,
            "apparent_temp_c": weather_data['apparent_temperature (°C)'] if not pd.isna(weather_data['apparent_temperature (°C)']) else None,
            "wind_kph": weather_data['wind_speed_100m (km/h)'] if not pd.isna(weather_data['wind_speed_100m (km/h)']) else None,
            "humidity": weather_data['relative_humidity_2m (%)'] if not pd.isna(weather_data['relative_humidity_2m (%)']) else None,
            "precipitation": weather_data['precipitation (mm)'] if not pd.isna(weather_data['precipitation (mm)']) else None,
            "rain": weather_data['rain (mm)'] if not pd.isna(weather_data['rain (mm)']) else None,
            "cloud_cover": weather_data['cloud_cover (%)'] if not pd.isna(weather_data['cloud_cover (%)']) else None
        }
        return weather_info
    except Exception as e:
        logging.error("Error fetching weather data from CSV: %s", e)
        return {}

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle NumPy data types."""
    def default(self, obj):
        if isinstance(obj, np.int64):
            return int(obj)
        if isinstance(obj, np.float64):
            return float(obj)
        return super().default(obj)

@cyclist_bp.route('/session/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    """Get details for a specific session.

    Args:
        session_id (int): The ID of the session to retrieve.

    Returns:
        Response: JSON response with session details or error message and status code.
    """
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    cyclist_id = current_user_id
    if current_user_role == 'coach':
        cyclist_id = request.args.get('cyclist_id')
        if not cyclist_id:
            return jsonify({"message": "Cyclist ID is required"}), 400

    try:
        session = TrainingSession.query.filter_by(sessionsID=session_id, cyclistID=cyclist_id).first()
        if not session:
            logging.error("Session not found")
            return jsonify({"message": "Session not found"}), 404

        weather_data = {}
        if session.positions:
            start_date = session.start_time.date()
            logging.info("Fetching weather data for date: %s", start_date)
            weather_data = get_weather_data_from_csv(start_date)
            logging.info("Weather data: %s", weather_data)

        hill_data = compute_hill_data(session)
        logging.info("Hill data: %s", hill_data)

        session_data = {
            "sessionsID": int(session.sessionsID),
            "altitude_avg": float(session.altitude_avg) if session.altitude_avg else None,
            "altitude_max": float(session.altitude_max) if session.altitude_max else None,
            "altitude_min": float(session.altitude_min) if session.altitude_min else None,
            "ascent": float(session.ascent) if session.ascent else None,
            "calories": float(session.calories) if session.calories else None,
            "descent": float(session.descent) if session.descent else None,
            "distance": float(session.distance) if session.distance else None,
            "duration": session.duration.total_seconds() if session.duration else 0,
            "hr_avg": session.hr_avg,
            "hr_max": session.hr_max,
            "hr_min": session.hr_min,
            "total_distance": float(session.total_distance) if session.total_distance else None,
            "altitudes": json.loads(session.altitudes),
            "heartrates": json.loads(session.heartrates),
            "speeds": json.loads(session.speeds),
            "start_time": session.start_time.isoformat(),
            "positions": json.loads(session.positions) if session.positions else [],
            "weather": weather_data,
            "hill_data": hill_data
        }

        logging.info("Session data prepared: %s", session_data)
        response = json.dumps(session_data, cls=CustomJSONEncoder)
        return response
    except Exception as e:
        logging.error("Error fetching session details: %s", str(e), exc_info=True)
        return jsonify({"error": "Error fetching session details"}), 500

@cyclist_bp.route('/run_niaarm', methods=['POST', 'OPTIONS'])
@jwt_required()
def run_niaarm():
    """Run the NiaARM algorithm on the CSV dataset.

    Returns:
        Response: JSON response with the generated rules and run time, or error message and status code.
    """
    if request.method == 'OPTIONS':
        return build_cors_preflight_response()
    elif request.method == 'POST':
        identity = get_jwt_identity()
        current_user_id = identity['user_id']
        current_user_role = identity['role']

        if current_user_role != 'cyclist':
            return jsonify({"message": "Access denied"}), 403

        try:
            current_app.logger.info("Current working directory: %s", os.getcwd())
            current_app.logger.info("Using CSV file at path: %s", CSV_FILE_PATH)
            absolute_csv_file_path = os.path.abspath(CSV_FILE_PATH)
            current_app.logger.info("Absolute CSV file path: %s", absolute_csv_file_path)

            if not os.path.exists(absolute_csv_file_path):
                current_app.logger.error("CSV file not found at path: %s", absolute_csv_file_path)
                return jsonify({"error": "CSV file not found"}), 404

            dataset = Dataset(absolute_csv_file_path)
            algo = DifferentialEvolution(population_size=50, differential_weight=0.5, crossover_probability=0.9)
            metrics = ('support', 'confidence')

            rules, run_time = get_rules(dataset, algo, metrics, max_iters=30, logging=True)

            rules_json = []
            for rule in rules:
                rule_dict = {
                    "lhs": [str(feature) for feature in rule.antecedent] if hasattr(rule, 'antecedent') else None,
                    "rhs": [str(feature) for feature in rule.consequent] if hasattr(rule, 'consequent') else None,
                    "support": getattr(rule, 'support', None),
                    "confidence": getattr(rule, 'confidence', None)
                }
                rules_json.append(rule_dict)

            if os.path.exists(RULES_FILE_PATH):
                with open(RULES_FILE_PATH, 'r') as f:
                    existing_rules = json.load(f)
            else:
                existing_rules = []

            existing_rules.extend(rules_json)

            with open(RULES_FILE_PATH, 'w') as f:
                json.dump(existing_rules, f)

            return jsonify({"rules": rules_json, "run_time": run_time})
        except Exception as e:
            current_app.logger.error("Error running NiaARM: %s", str(e))
            return jsonify({"error": f"Error running NiaARM: {str(e)}"}), 500

@cyclist_bp.route('/get_saved_rules', methods=['GET'])
@jwt_required()
def get_saved_rules():
    """Get saved rules from the rules file.

    Returns:
        Response: JSON response with saved rules or error message and status code.
    """
    try:
        if not os.path.exists(RULES_FILE_PATH):
            return jsonify({"error": "Rules file not found"}), 404

        with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
            rules_json = json.load(f)

        return jsonify({"rules": rules_json})
    except Exception as e:
        current_app.logger.error("Error fetching saved rules: %s", str(e))
        return jsonify({"error": f"Error fetching saved rules: {str(e)}"}), 500

def extract_heart_rate_rules(rules):
    """Extract heart rate related rules from the list of rules.

    Args:
        rules (list): The list of rules to filter.

    Returns:
        list: The list of heart rate related rules.
    """
    hr_metrics = ['hr_max', 'hr_avg', 'hr_min']
    hr_rules = [rule for rule in rules if any(metric in str(rule['rhs']) for metric in hr_metrics)]
    return hr_rules

def check_session_against_rules(session_data, rules):
    """Check a session against a set of rules.

    Args:
        session_data (dict): The session data to check.
        rules (list): The list of rules to check against.

    Returns:
        list: A list of warnings generated based on the rules.
    """
    warnings = []

    for rule in rules:
        lhs_conditions = rule['lhs']
        match = True

        for condition in lhs_conditions:
            if 'hr_max' in condition:
                value_range = extract_range(condition)
                if not (value_range[0] <= session_data['hr_max'] <= value_range[1]):
                    match = False
            elif 'hr_avg' in condition:
                value_range = extract_range(condition)
                if not (value_range[0] <= session_data['hr_avg'] <= value_range[1]):
                    match = False
            elif 'hr_min' in condition:
                value_range = extract_range(condition)
                if not (value_range[0] <= session_data['hr_min'] <= value_range[1]):
                    match = False

        if match:
            warning_message = interpret_warning(rule)
            warnings.append(warning_message)

    return warnings

def interpret_warning(rule):
    """Interpret a rule and return a warning message.

    Args:
        rule (dict): The rule to interpret.

    Returns:
        str: The warning message generated based on the rule.
    """
    lhs_descriptions = " AND ".join(rule['lhs'])
    rhs_descriptions = " AND ".join(rule['rhs'])
    additional_text = ""

    for condition in rule['rhs']:
        if 'hr_max' in condition:
            value_range = extract_range(condition)
            if value_range[1] > HR_MAX_THRESHOLD:
                additional_text += " Your maximum heart rate is too high."
        elif 'hr_min' in condition:
            value_range = extract_range(condition)
            if value_range[0] < HR_MIN_THRESHOLD:
                additional_text += " Your minimum heart rate is too low."

    return f"Warning: If {lhs_descriptions}, then {rhs_descriptions}. This could indicate potential health risks based on your recent session data. Please monitor your health metrics closely.{additional_text}"

def extract_range(condition):
    """Extract a range from a condition string.

    Args:
        condition (str): The condition string to extract the range from.

    Returns:
        tuple: A tuple containing the lower and upper bounds of the range.
    """
    import re
    match = re.search(r'\[(.*),(.*)\]', condition)
    return float(match.group(1)), float(match.group(2))

@cyclist_bp.route('/check_session', methods=['POST', 'OPTIONS'])
@jwt_required()
def check_session():
    """Check a session against the saved rules.

    Returns:
        Response: JSON response with warnings or error message and status code.
    """
    if request.method == 'OPTIONS':
        return build_cors_preflight_response()
    elif request.method == 'POST':
        identity = get_jwt_identity()
        current_user_id = identity['user_id']
        current_user_role = identity['role']

        if current_user_role != 'cyclist':
            return jsonify({"message": "Access denied"}), 403

        try:
            session_data = request.json
            current_app.logger.info("Received Session Data: %s", session_data)

            if not isinstance(session_data, dict):
                return jsonify({"error": "Invalid session data format"}), 422

            required_keys = [
                "hr_max", "hr_avg", "hr_min", "altitude_avg", "altitude_max", "altitude_min", "ascent",
                "calories", "descent", "distance", "duration", "total_distance"
            ]
            for key in required_keys:
                if key not in session_data:
                    return jsonify({"error": f"Missing required field: {key}"}), 422

            if not os.path.exists(RULES_FILE_PATH):
                return jsonify({"error": "Rules file not found"}), 404

            with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
                rules = json.load(f)
            current_app.logger.info("Checking against Rules: %s", rules)

            hr_rules = extract_heart_rate_rules(rules)
            current_app.logger.info("Extracted Heart Rate Rules: %s", hr_rules)

            warnings = check_session_against_rules(session_data, hr_rules)
            current_app.logger.info("Warnings: %s", warnings)

            return jsonify({"warnings": warnings})
        except Exception as e:
            current_app.logger.error("Error checking session: %s", str(e))
            return jsonify({"error": f"Error checking session: {str(e)}"}), 500

@cyclist_bp.route('/training_plans', methods=['GET'])
@jwt_required()
def get_cyclist_training_plans():
    """Get training plans for the current cyclist.

    Returns:
        Response: JSON response with a list of training plans or error message and status code.
    """
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'cyclist':
        return jsonify({"message": "Access denied"}), 403

    try:
        training_plans = db.session.query(TrainingPlan).join(CyclistTrainingPlan).filter(
            CyclistTrainingPlan.cyclistID == current_user_id,
            TrainingPlan.executed == 'No'
        ).all()

        plans_data = [plan.to_dict() for plan in training_plans]

        return jsonify(plans_data), 200
    except Exception as e:
        logging.error("Error fetching training plans: %s", str(e))
        return jsonify({"error": "Error fetching training plans"}), 500

@cyclist_bp.route('/training_plans/<int:plan_id>/execute', methods=['POST'])
@jwt_required()
def execute_training_plan(plan_id):
    """Execute a training plan for the current cyclist.

    Args:
        plan_id (int): The ID of the training plan to execute.

    Returns:
        Response: JSON response with success message or error message and status code.
    """
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'cyclist':
        return jsonify({"message": "Access denied"}), 403

    try:
        training_plan = db.session.query(TrainingPlan).join(CyclistTrainingPlan).filter(
            CyclistTrainingPlan.cyclistID == current_user_id,
            TrainingPlan.plansID == plan_id
        ).first()

        if not training_plan:
            return jsonify({"error": "Training plan not found"}), 404

        training_plan.executed = 'Yes'
        db.session.commit()

        return jsonify({"message": "Training plan executed successfully"}), 200
    except Exception as e:
        logging.error("Error executing training plan: %s", str(e))
        db.session.rollback()
        return jsonify({"error": f"Error executing training plan: {str(e)}"}), 500

@cyclist_bp.route('/training_plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_training_plan(plan_id):
    """Delete a training plan for the current cyclist.

    Args:
        plan_id (int): The ID of the training plan to delete.

    Returns:
        Response: JSON response with success message or error message and status code.
    """
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'cyclist':
        return jsonify({"message": "Access denied"}), 403

    try:
        cyclist_training_plans = CyclistTrainingPlan.query.filter_by(plansID=plan_id).all()
        for ctp in cyclist_training_plans:
            db.session.delete(ctp)

        training_plan = TrainingPlan.query.filter_by(plansID=plan_id).first()
        if not training_plan:
            return jsonify({"error": "Training plan not found"}), 404

        db.session.delete(training_plan)
        db.session.commit()

        return jsonify({"message": "Training plan deleted successfully"}), 200
    except Exception as e:
        logging.error("Error deleting training plan: %s", str(e))
        db.session.rollback()
        return jsonify({"error": f"Error deleting training plan: {str(e)}"}), 500
