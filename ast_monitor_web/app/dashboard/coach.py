# from flask import request, jsonify, Blueprint, session
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from ..models.user import db, User
#
# # Creating a Blueprint for all coach-related routes
# coach_bp = Blueprint('coach_bp', __name__)
#
# @coach_bp.route('/athletes', methods=['GET'])
# @jwt_required()
# def get_athletes():
#     # Retrieve the logged-in coach's username from the JWT
#     coach_username = get_jwt_identity()
#     coach = User.query.filter_by(username=coach_username, role='coach').first()
#
#     if not coach:
#         return jsonify({"message": "Coach not found"}), 404
#
#     # Assuming a relationship is set up in the User model to fetch athletes
#     athletes = User.query.filter_by(coach_id=coach.usersID, role='athlete').all()
#     return jsonify([athlete.to_dict() for athlete in athletes])
#
# # Add other coach-specific routes here
