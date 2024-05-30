import json
import logging
from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db, Cyclist

cyclist_bp = Blueprint('cyclist_bp', __name__)

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

        session_data = {
            "altitude_avg": session.altitude_avg,
            "altitude_max": session.altitude_max,
            "altitude_min": session.altitude_min,
            "ascent": session.ascent,
            "calories": session.calories,
            "descent": session.descent,
            "distance": session.distance,
            "duration": session.duration.total_seconds() if session.duration else 0,
            "hr_avg": session.hr_avg,
            "hr_max": session.hr_max,
            "hr_min": session.hr_min,
            "total_distance": session.total_distance,
            "altitudes": json.loads(session.altitudes),
            "heartrates": json.loads(session.heartrates),
            "speeds": json.loads(session.speeds),
            "start_time": session.start_time.isoformat(),
            "positions": json.loads(session.positions) if session.positions else []
        }

        return jsonify(session_data)
    except Exception as e:
        logging.error(f"Error fetching session details: {str(e)}")
        return jsonify({"error": "Error fetching session details"}), 500