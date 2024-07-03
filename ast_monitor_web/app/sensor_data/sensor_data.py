import sys
import os
import logging
import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models.database import db
from ..models.training_sessions_model import TrainingSession as DBTrainingSession
from ..models.usermodel import Cyclist

# Add the AST-Monitor directory to the sys.path
ast_monitor_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../../../AST-Monitor-main/AST-Monitor-main'))
sys.path.append(ast_monitor_path)

from ast_monitor.model import BasicData, GoalsProcessor, RouteReader, TrainingSession as ASTTrainingSession

sensor_bp = Blueprint('sensor_bp', __name__)
logging.basicConfig(level=logging.DEBUG)

# Absolute paths for data
hr_data_path = os.path.abspath(os.path.join(ast_monitor_path, 'sensor_data', 'hr.txt'))
gps_data_path = os.path.abspath(os.path.join(ast_monitor_path, 'sensor_data', 'gps.txt'))
route_data_path = os.path.abspath(os.path.join(ast_monitor_path, 'development', 'routes', 'route.json'))
training_data_path = os.path.abspath(os.path.join(ast_monitor_path, 'sensor_data', 'training_data.json'))

# Ensure directories exist
os.makedirs(os.path.dirname(hr_data_path), exist_ok=True)
os.makedirs(os.path.dirname(gps_data_path), exist_ok=True)
os.makedirs(os.path.dirname(route_data_path), exist_ok=True)
os.makedirs(os.path.dirname(training_data_path), exist_ok=True)

# Initialize data handlers
basic_data = BasicData(hr_data_path, gps_data_path)
if os.path.exists(route_data_path):
    route_reader = RouteReader(route_data_path)
    route = route_reader.read()
else:
    route = None
goals_processor = GoalsProcessor(route) if route else None
session = ASTTrainingSession()

temp_training_data = {"speeds": []}

@sensor_bp.route('/api/latest-data')
def latest_data():
    logging.debug("Received request for latest data")

    # Read current HR
    basic_data.read_current_hr()
    current_hr = basic_data.current_heart_rate
    logging.debug(f"Current heart rate: {current_hr}")

    # Read current GPS and calculate speed
    basic_data.read_current_gps()
    basic_data.calculate_speed()
    current_speed = basic_data.current_speed
    logging.debug(f"Current speed: {current_speed}")

    # Calculate session time and distance
    session.calculate_time()
    time_s = convert_time_to_hours_minutes_seconds(int(session.time))
    session.add_distance(basic_data.distance)
    current_distance = round(session.distance / 1000, 2)

    # Calculate ascent and altitude
    ascent = 0
    altitude = None
    if basic_data.current_gps:
        session.add_ascent(basic_data.current_gps[2])
        ascent = int(session.ascent)
        lat_lng = basic_data.current_gps[0:2]
        altitude = basic_data.current_gps[2]  # Assuming altitude is the third value
    else:
        lat_lng = None

    # Goals processor updates
    progress = None
    remaining_ascent = None
    remaining_distance = None
    if goals_processor and basic_data.current_gps:
        goals_processor.add_position(basic_data.current_gps)
        progress = round(goals_processor.progress * 100, 0)
        remaining_ascent = round(goals_processor.ascent_to_go, 1)
        remaining_distance = round(float(goals_processor.distance_to_go / 1000), 1)

    response = {
        'heartrate': current_hr,
        'speed': round(current_speed, 1) if current_speed is not None else None,
        'distance': current_distance,
        'duration': time_s,
        'lat_lng': lat_lng,
        'ascent': ascent,
        'altitude': altitude,
        'progress': progress,
        'remainingAscent': remaining_ascent,
        'remainingDistance': remaining_distance,
        'route': route  # Include the route in the response
    }

    # Append the current speed to the temp_training_data
    if current_speed is not None:
        temp_training_data["speeds"].append(current_speed)
        logging.debug(f"Appended speed: {current_speed} to temp_training_data")

    logging.debug("Response: %s", response)
    return jsonify(response)

@sensor_bp.route('/api/route')
def get_route():
    if route:
        route_data = {
            'route_render': [{'lat': point['lat'], 'lon': point['lon']} for point in route.get('route_render', [])]
        }
        logging.debug("Route data: %s", route_data)
        return jsonify(route_data)
    return jsonify([])

def read_hr_data(hr_data_path):
    try:
        with open(hr_data_path, 'r') as file:
            return [int(line.strip()) for line in file.readlines()]
    except Exception as e:
        logging.error(f"Error reading HR data: {e}")
        return []

def read_gps_data(gps_data_path):
    try:
        with open(gps_data_path, 'r') as file:
            lines = file.readlines()
            gps_data = [line.strip().split(';') for line in lines]
            return {
                'longitude': [float(line[0]) for line in gps_data],
                'latitude': [float(line[1]) for line in gps_data],
                'altitude': [float(line[2]) for line in gps_data],
                'timestamps': [float(line[3]) for line in gps_data]
            }
    except Exception as e:
        logging.error(f"Error reading GPS data: {e}")
        return {}

def estimate_calories(distance_km, duration_sec, weight_kg):
    duration_hours = duration_sec / 3600
    if duration_hours == 0:
        return 0
    avg_speed_kmh = distance_km / duration_hours

    if avg_speed_kmh < 10:
        met_value = 4
    elif avg_speed_kmh < 12:
        met_value = 6
    elif avg_speed_kmh < 14:
        met_value = 8
    else:
        met_value = 10

    calories_burned = met_value * weight_kg * duration_hours
    return calories_burned

@sensor_bp.route('/api/temp-training-data', methods=['POST'])
def temp_training_data_route():
    global temp_training_data
    new_data = request.json
    temp_training_data.update(new_data)
    return jsonify({"message": "Temporary training data received"}), 200






def parse_duration(duration_str):
    """Parse a duration string into a timedelta object."""
    try:
        parts = duration_str.split(", ")
        if len(parts) == 2:
            days, time = parts
            days = int(days.split()[0])  # extract the integer before 'days'
            h, m, s = map(int, time.split(":"))
            return timedelta(days=days, hours=h, minutes=m, seconds=s)
        h, m, s = map(int, duration_str.split(':'))
        return timedelta(hours=h, minutes=m, seconds=s)
    except ValueError as exc:
        try:
            return timedelta(minutes=int(duration_str))
        except ValueError as e:
            raise ValueError(
                f"Duration '{duration_str}' is not in the correct format 'HH:MM:SS', "
                "'X days, HH:MM:SS' or 'minutes'"
            ) from e


def calculate_descent(altitudes):
    descent = 0
    for i in range(1, len(altitudes)):
        if altitudes[i] < altitudes[i - 1]:
            descent += altitudes[i - 1] - altitudes[i]
    return descent
@sensor_bp.route('/api/save-training-data', methods=['POST'])
@jwt_required()
def save_training_data():
    logging.debug("Entering save_training_data route")

    try:
        identity = get_jwt_identity()
        logging.debug(f"JWT identity: {identity}")

        current_user_id = identity['user_id']
        current_user_role = identity['role']
        logging.debug(f"Current user ID: {current_user_id}, Role: {current_user_role}")

        cyclist_id = current_user_id
        if current_user_role == 'coach':
            cyclist_id = request.args.get('cyclist_id')
            if not cyclist_id:
                logging.error("Cyclist ID is required for coach")
                return jsonify({"message": "Cyclist ID is required"}), 400

        cyclist = db.session.query(Cyclist).get(cyclist_id)
        if not cyclist:
            logging.error(f"Cyclist with ID {cyclist_id} not found")
            return jsonify({"message": "Cyclist not found"}), 404

        logging.debug(f"Temporary training data: {temp_training_data}")

        gps_data = read_gps_data(gps_data_path)
        hr_data = read_hr_data(hr_data_path)

        if not gps_data:
            logging.error("Error reading GPS data")
            return jsonify({"message": "Error reading GPS data"}), 500
        if not hr_data:
            logging.error("Error reading HR data")
            return jsonify({"message": "Error reading HR data"}), 500

        altitudes = gps_data['altitude']
        altitude_avg = sum(gps_data['altitude']) / len(gps_data['altitude'])
        altitude_min = min(gps_data['altitude'])
        altitude_max = max(gps_data['altitude'])
        hr_avg = sum(hr_data) / len(hr_data)
        hr_min = min(hr_data)
        hr_max = max(hr_data)
        positions = [[lat, lon] for lat, lon in zip(gps_data['latitude'], gps_data['longitude'])]

        descent = calculate_descent(altitudes)

        duration_str = temp_training_data.get('duration', '0')
        logging.debug(f"Duration string: {duration_str}")

        try:
            duration = parse_duration(duration_str)
        except ValueError as e:
            logging.error(f"Invalid input for duration: {duration_str}")
            return jsonify({"message": str(e)}), 400

        logging.debug(f"Duration (timedelta): {duration}")

        start_time = datetime.now() - duration

        weight_kg = cyclist.weight_kg
        if weight_kg is None:
            logging.error("Cyclist weight not found")
            return jsonify({"message": "Cyclist weight not found"}), 400
        calories = estimate_calories(temp_training_data.get('distance', 0) / 1000, duration.total_seconds(), weight_kg)

        new_session = DBTrainingSession(
            cyclistID=cyclist_id,
            speeds=json.dumps(temp_training_data.get('speeds', [])),
            duration=duration,
            distance=temp_training_data.get('distance', 0),
            ascent=temp_training_data.get('ascent', 0),
            altitudes=json.dumps(gps_data['altitude']),
            timestamps=json.dumps(gps_data['timestamps']),
            descent=descent,
            altitude_avg=altitude_avg,
            altitude_min=altitude_min,
            altitude_max=altitude_max,
            hr_avg=hr_avg,
            hr_min=hr_min,
            hr_max=hr_max,
            total_distance=temp_training_data.get('distance', 0),
            positions=json.dumps(positions),
            start_time=start_time,
            calories=calories,
            heartrates=json.dumps(hr_data) if hr_data else json.dumps([])  # Ensure heartrates is always a JSON string
        )

        db.session.add(new_session)
        db.session.commit()

        logging.debug("Training data saved successfully")
        return jsonify({"message": "Training data saved successfully"}), 200

    except Exception as e:
        logging.error(f"Error in save_training_data route: {e}")
        return jsonify({"message": "Internal server error"}), 500

def convert_time_to_hours_minutes_seconds(time_in_seconds: int) -> str:
    seconds = int(time_in_seconds % 60)
    minutes = int(time_in_seconds / 60) % 60
    hours = int(time_in_seconds / 60 / 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}"
