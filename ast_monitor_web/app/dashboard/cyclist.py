import json
import logging
import os
import requests
from flask import jsonify, Blueprint, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sport_activities_features import HillIdentification, TopographicFeatures
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db, Cyclist
from niaarm import NiaARM

cyclist_bp = Blueprint('cyclist_bp', __name__)

WEATHER_API_URL = 'https://api.weatherapi.com/v1/history.json'
WEATHER_API_KEY = '1b139147fb034e529e7205548243005'

@cyclist_bp.route('/run_niaarm', methods=['POST', 'OPTIONS'])
@jwt_required()
def run_niaarm():
    if request.method == 'OPTIONS':
        return build_cors_preflight_response()
    elif request.method == 'POST':
        identity = get_jwt_identity()
        current_user_id = identity['user_id']
        current_user_role = identity['role']

        if current_user_role != 'cyclist':
            return jsonify({"message": "Access denied"}), 403

        try:
            # Path to your CSV file
            csv_file_path = 'C:/Users/Korisnik/Downloads/random_sportydatagen.csv'

            # Run NiaARM
            niaarm = NiaARM()
            rules = niaarm.run(csv_file_path, support_threshold=0.5, confidence_threshold=0.7)

            # Convert rules to JSON serializable format
            rules_json = [rule.to_dict() for rule in rules]

            return jsonify(rules_json)
        except Exception as e:
            logging.error(f"Error running NiaARM: {str(e)}")
            return jsonify({"error": "Error running NiaARM"}), 500

def build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

def get_weather_data(lat, lon, start_time):
    response = requests.get(WEATHER_API_URL, params={
        'key': WEATHER_API_KEY,
        'q': f'{lat},{lon}',
        'dt': start_time.split('T')[0]
    })
    weather_data = response.json()
    logging.info(f"Weather data response: {weather_data}")
    return weather_data

@cyclist_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_cyclist_sessions():
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'cyclist':
        return jsonify({"message": "Access denied"}), 403

    try:
        sessions = TrainingSession.query.filter_by(cyclistID=current_user_id).order_by(TrainingSession.start_time).all()
        session_dates = [{
            "sessionID": session.sessionsID,
            "start_time": session.start_time.isoformat()
        } for session in sessions]

        return jsonify(session_dates)
    except Exception as e:
        logging.error(f"Error fetching cyclist sessions: {str(e)}")
        return jsonify({"error": "Error fetching cyclist sessions"}), 500

@cyclist_bp.route('/session/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'cyclist':
        return jsonify({"message": "Access denied"}), 403

    try:
        session = TrainingSession.query.filter_by(sessionsID=session_id, cyclistID=current_user_id).first()
        if not session:
            return jsonify({"message": "Session not found"}), 404

        # Get weather data
        weather_data = {}
        if session.positions:
            start_position = json.loads(session.positions)[0]
            lat, lon = start_position
            weather_response = get_weather_data(lat, lon, session.start_time.isoformat())
            if 'forecast' in weather_response and 'forecastday' in weather_response['forecast'] and weather_response['forecast']['forecastday']:
                day_weather = weather_response['forecast']['forecastday'][0]['day']
                weather_data = {
                    "temp_c": day_weather.get('avgtemp_c'),
                    "condition": day_weather.get('condition', {}).get('text', 'N/A'),
                    "wind_kph": day_weather.get('maxwind_kph'),
                    "humidity": day_weather.get('avghumidity')
                }

        # Hill identification
        altitudes = json.loads(session.altitudes)
        hills = HillIdentification(altitudes, 30)
        hills.identify_hills()
        all_hills = hills.return_hills()
        topographic_features = TopographicFeatures(all_hills)
        hill_data = {
            "num_hills": topographic_features.num_of_hills(),
            "avg_altitude": topographic_features.avg_altitude_of_hills([float(a) for a in altitudes]),
            "avg_ascent": topographic_features.avg_ascent_of_hills([float(a) for a in altitudes]),
            "distance_hills": topographic_features.distance_of_hills(json.loads(session.positions)),
            "hills_share": topographic_features.share_of_hills(
                topographic_features.distance_of_hills(json.loads(session.positions)),
                float(session.total_distance)
            )
        }

        session_data = {
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
            "altitudes": altitudes,
            "heartrates": json.loads(session.heartrates),
            "speeds": json.loads(session.speeds),
            "start_time": session.start_time.isoformat(),
            "positions": json.loads(session.positions) if session.positions else [],
            "weather": weather_data,
            "hill_data": hill_data
        }

        return jsonify(session_data)
    except Exception as e:
        logging.error(f"Error fetching session details: {str(e)}")
        return jsonify({"error": "Error fetching session details"}), 500
