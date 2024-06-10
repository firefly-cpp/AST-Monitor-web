import io
import json
import logging
import os

from flask_mail import Message
from datetime import datetime, timedelta
from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db, Coach, Cyclist
from ..models.training_plans_model import TrainingPlan, CyclistTrainingPlan




coach_bp = Blueprint('coach_bp', __name__)



@coach_bp.route('/athletes', methods=['GET'])
@jwt_required()
def get_athletes():
    identity = get_jwt_identity()
    current_user_id = identity['user_id']  # Get user ID from the identity dictionary
    current_user_role = identity['role']  # Get role from the identity dictionary

    logging.info(f"Current user ID: {current_user_id}, Role: {current_user_role}")

    if current_user_role != 'coach':
        return jsonify({"message": "Access denied"}), 403

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

        athlete_data = [{
            "cyclistID": athlete.cyclistID,
            "username": athlete.username,
            "last_session": {
                "time": athlete.last_session_time.isoformat() if athlete.last_session_time else None,
                "altitude_avg": float(athlete.altitude_avg) if athlete.altitude_avg is not None else None,
                "calories": int(athlete.calories) if athlete.calories is not None else None,
                "duration": athlete.duration.total_seconds() if athlete.duration else 0,
                "hr_avg": athlete.hr_avg if athlete.hr_avg is not None else None,
                "total_distance": float(athlete.total_distance) if athlete.total_distance is not None else None
            } if athlete.last_session_time else None
        } for athlete in athletes]

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
                "sessionsID": session.sessionsID,
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


@coach_bp.route('/athlete/sessions/<int:id>', methods=['GET'])
@jwt_required()
def get_sessions_for_calendar(id):
    sessions = TrainingSession.query.filter_by(cyclistID=id).order_by(TrainingSession.start_time).all()
    session_dates = [{
        "sessionID": session.sessionsID,
        "start_time": session.start_time.isoformat()
    } for session in sessions]

    return jsonify(session_dates)




@coach_bp.route('/create_training_plan', methods=['POST'])
@jwt_required()
def create_training_plan():
    data = request.get_json()
    coach_id = get_jwt_identity()['user_id']

    # Try parsing with seconds
    try:
        start_time = datetime.strptime(data['start_time'], "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        # Fallback to parsing without seconds
        start_time = datetime.strptime(data['start_time'], "%Y-%m-%dT%H:%M")

    # Ensure duration is an integer
    try:
        duration_minutes = int(data['duration'])
    except ValueError:
        return jsonify({"error": "Duration must be an integer"}), 400

    duration = timedelta(minutes=duration_minutes)
    total_distance = data['total_distance']
    hr_avg = data.get('hr_avg')
    altitude_avg = data.get('altitude_avg')
    altitude_max = data.get('altitude_max')
    calories = data.get('calories')
    ascent = data.get('ascent')
    descent = data.get('descent')
    cyclist_ids = data['cyclist_ids']

    try:
        # Create the training plan
        training_plan = TrainingPlan(
            coachID=coach_id,
            start_time=start_time,
            duration=duration,
            total_distance=total_distance,
            hr_avg=hr_avg,
            altitude_avg=altitude_avg,
            altitude_max=altitude_max,
            calories=calories,
            ascent=ascent,
            descent=descent
        )
        db.session.add(training_plan)
        db.session.commit()

        # Associate training plan with cyclists
        for cyclist_id in cyclist_ids:
            cyclist_training_plan = CyclistTrainingPlan(
                cyclistID=cyclist_id,
                plansID=training_plan.plansID
            )
            db.session.add(cyclist_training_plan)
            cyclist = Cyclist.query.get(cyclist_id)
            if cyclist:
                send_training_plan_email(cyclist.email, training_plan)

        db.session.commit()

        return jsonify({"message": "Training plan created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating training plan: {str(e)}")
        return jsonify({"error": "Error creating training plan"}), 500

def send_training_plan_email(cyclist_email, training_plan):
    from ..__init__ import mail
    msg = Message(
        subject="New Training Plan",
        sender=os.getenv('MAIL_USERNAME'),
        recipients=[cyclist_email]
    )
    msg.body = (
        f"A new training plan has been created for you.\n"
        f"Start Time: {training_plan.start_time}\n"
        f"Duration: {training_plan.duration}\n"
        f"Please log in to view the full details."
    )
    mail.send(msg)


