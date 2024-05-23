import json
import logging
from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db, Coach, Cyclist

coach_bp = Blueprint('coach_bp', __name__)

@coach_bp.route('/athletes', methods=['GET'])
@jwt_required()
def get_athletes():
    current_user_id = get_jwt_identity()
    logging.info(f"Current user ID: {current_user_id}")

    coach = Coach.query.filter_by(coachID=current_user_id).first()
    if not coach:
        logging.warning(f"Coach not found for ID: {current_user_id}")
        return jsonify({"message": "Coach not found"}), 404

    try:
        max_session_id_subq = db.session.query(
            func.max(TrainingSession.sessionsID).label('max_session_id')
        ).filter(
            TrainingSession.cyclistID == Cyclist.cyclistID
        ).correlate(Cyclist).subquery().as_scalar()

        athletes = db.session.query(
            Cyclist.username,
            Cyclist.cyclistID,
            TrainingSession.altitude_avg,
            TrainingSession.calories,
            TrainingSession.duration,
            TrainingSession.hr_avg,
            TrainingSession.total_distance,
            TrainingSession.start_time.label('last_session_time')
        ).outerjoin(
            TrainingSession, and_(
                Cyclist.cyclistID == TrainingSession.cyclistID,
                TrainingSession.sessionsID == max_session_id_subq
            )
        ).filter(
            Cyclist.coachID == current_user_id
        ).all()

        athlete_data = []
        for athlete in athletes:
            last_session = None
            if athlete.last_session_time:
                last_session = {
                    "time": athlete.last_session_time.isoformat(),
                    "altitude_avg": float(athlete.altitude_avg) if athlete.altitude_avg is not None else None,
                    "calories": int(athlete.calories) if athlete.calories is not None else None,
                    "duration": athlete.duration.total_seconds() if athlete.duration else 0,
                    "hr_avg": athlete.hr_avg if athlete.hr_avg is not None else None,
                    "total_distance": float(athlete.total_distance) if athlete.total_distance is not None else None
                }

            athlete_data.append({
                "cyclistID": athlete.cyclistID,
                "username": athlete.username,
                "last_session": last_session
            })

        return jsonify(athlete_data)
    except Exception as e:
        logging.error(f"Error processing athletes data: {str(e)}")
        return jsonify({"error": "Error processing data"}), 500



@coach_bp.route('/athlete/<int:id>', methods=['GET'])
@jwt_required()
def get_athlete_profile(id):
    try:
        athlete = Cyclist.query.get(id)
        if not athlete:
            return jsonify({"message": "Athlete not found"}), 404

        sessions = TrainingSession.query.filter_by(cyclistID=id).all()

        # Assuming sessions contain the data needed for the graphs
        session_data = []
        for session in sessions:
            session_data.append({
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
                "start_time": session.start_time.isoformat()
            })

        # Debug output
        logging.info(f"Athlete ID: {athlete.cyclistID}")
        logging.info(f"Session Data: {session_data}")

        return jsonify({
            "cyclistID": athlete.cyclistID,
            "username": athlete.username,
            "sessions": session_data
        })
    except Exception as e:
        logging.error(f"Error fetching athlete profile: {str(e)}")
        return jsonify({"error": "Error fetching athlete profile"}), 500


