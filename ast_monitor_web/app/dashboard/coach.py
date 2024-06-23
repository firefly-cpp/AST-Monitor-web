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
from ..models.training_plans_model import TrainingPlan, CyclistTrainingPlan, TrainingPlanTemplate

coach_bp = Blueprint('coach_bp', __name__)

def parse_datetime(datetime_str):
    formats = ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"]
    for fmt in formats:
        try:
            return datetime.strptime(datetime_str, fmt)
        except ValueError:
            pass
    raise ValueError(f"time data '{datetime_str}' does not match any supported format")

def parse_duration(duration_str):
    try:
        # Trying to parse durations that include days
        parts = duration_str.split(", ")
        if len(parts) == 2:
            days, time = parts
            days = int(days.split()[0])  # extract the integer before 'days'
            h, m, s = map(int, time.split(":"))
            return timedelta(days=days, hours=h, minutes=m, seconds=s)
        # Standard HH:MM:SS format
        h, m, s = map(int, duration_str.split(':'))
        return timedelta(hours=h, minutes=m, seconds=s)
    except ValueError:
        # Handling durations in minutes
        try:
            return timedelta(minutes=int(duration_str))
        except ValueError:
            raise ValueError(f"Duration '{duration_str}' is not in the correct format 'HH:MM:SS', 'X days, HH:MM:SS' or 'minutes'")



@coach_bp.route('/athletes', methods=['GET'])
@jwt_required()
def get_athletes():
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

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

    try:
        logging.info(f"Received data: {data}")

        cyclist_ids = data['cyclist_ids']
        start_date = parse_datetime(data['start_date'])
        description = data.get('description', '')

        training_plan = TrainingPlan(
            coachID=coach_id,
            start_date=start_date,
            description=description,
            executed='No'  # Set executed to 'No' when creating a new plan
        )
        db.session.add(training_plan)
        db.session.commit()

        for session_data in data['sessions']:
            session_duration = parse_duration(session_data['duration'])
            new_session = TrainingPlanTemplate(
                planID=training_plan.plansID,
                type=session_data['type'],
                duration=session_duration,
                distance=session_data['distance'],
                intensity=session_data.get('intensity'),
                notes=session_data.get('notes')
            )
            db.session.add(new_session)

        db.session.commit()

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

        return jsonify({"message": "Training plan created successfully", "plansID": training_plan.plansID}), 201

    except Exception as e:
        logging.error(f"Error creating training plan: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Error creating training plan: {str(e)}"}), 500


def send_training_plan_email(cyclist_email, training_plan):
    from ..__init__ import mail
    msg = Message(
        subject="New Training Plan",
        sender=os.getenv('MAIL_USERNAME'),
        recipients=[cyclist_email]
    )
    msg.body = (
        f"A new training plan has been created for you.\n"
        f"Start Date: {training_plan.start_date}\n"
        f"Description: {training_plan.description}\n"
        f"Please log in to view the full details."
    )
    mail.send(msg)


@coach_bp.route('/training_plan_templates', methods=['GET'])
@jwt_required()
def get_training_plan_templates():
    templates = TrainingPlanTemplate.query.all()
    return jsonify([template.to_dict() for template in templates])


@coach_bp.route('/create_training_plan_template', methods=['POST'])
@jwt_required()
def create_training_plan_template():
    data = request.get_json()

    try:
        new_template = TrainingPlanTemplate(
            type=data['type'],
            duration=parse_duration(data['duration']),
            distance=data['distance'],
            intensity=data.get('intensity'),
            notes=data.get('notes'),
            planID=None
        )
        db.session.add(new_template)
        db.session.commit()
        return jsonify(new_template.to_dict()), 201
    except Exception as e:
        logging.error(f"Error creating training plan template: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Error creating training plan template: {str(e)}"}), 500

@coach_bp.route('/delete_training_plan_template/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_training_plan_template(template_id):
    try:
        template = TrainingPlanTemplate.query.get(template_id)
        if not template:
            return jsonify({"error": "Training plan template not found"}), 404

        db.session.delete(template)
        db.session.commit()
        return jsonify({"message": "Training plan template deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Error deleting training plan template: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Error deleting training plan template: {str(e)}"}), 500
