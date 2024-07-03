"""
Authentication and user management views for the AST Monitor web application.
"""

import os
import uuid

from flask import request, jsonify, Blueprint, url_for, redirect, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Message
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError

from ..models.usermodel import db, Coach, Cyclist
from ..extensions import mail

# Initialize the Blueprint here
auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register_coach', methods=['POST'])
def register_coach():
    """Register a new coach.

    Returns:
        Response: JSON response with success or error message and status code.
    """
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = generate_password_hash(data['password'])
    name = data.get('name')
    surname = data.get('surname')

    existing_user = Coach.query.filter((Coach.username == username) | (Coach.email == email)).first()
    if existing_user:
        if existing_user.username == username:
            return jsonify({'message': 'Username already exists'}), 409
        if existing_user.email == email:
            return jsonify({'message': 'Email already exists'}), 409

    new_coach = Coach(username=username, email=email, password=password, name=name, surname=surname)
    try:
        db.session.add(new_coach)
        db.session.commit()
        return jsonify({'message': 'Coach registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Registration failed, please try again'}), 500

@auth_bp.route('/register_cyclist', methods=['POST'])
def register_cyclist():
    """Register a new cyclist.

    Returns:
        Response: JSON response with success or error message and status code.
    """
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = generate_password_hash(data['password'])
    coach_id = data.get('coachID')
    name = data.get('name')
    surname = data.get('surname')
    date_of_birth = data['date_of_birth']
    height_cm = data['height_cm']
    weight_kg = data['weight_kg']

    existing_user = Cyclist.query.filter((Cyclist.username == username) | (Cyclist.email == email)).first()
    if existing_user:
        if existing_user.username == username:
            return jsonify({'message': 'Username already exists'}), 409
        if existing_user.email == email:
            return jsonify({'message': 'Email already exists'}), 409

    if not coach_id:
        return jsonify({'message': 'Coach ID must be provided'}), 400

    new_cyclist = Cyclist(coachID=coach_id, username=username, email=email, password=password,
                          name=name, surname=surname, date_of_birth=date_of_birth, height_cm=height_cm, weight_kg=weight_kg)
    try:
        db.session.add(new_cyclist)
        db.session.commit()
        return jsonify({'message': 'Cyclist registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Registration failed, please try again'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user.

    Returns:
        Response: JSON response with access token and role, or error message and status code.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = Coach.query.filter_by(username=username).first() or Cyclist.query.filter_by(username=username).first()

    if user:
        if check_password_hash(user.password, password):
            user_id = user.coachID if isinstance(user, Coach) else user.cyclistID
            role = 'coach' if isinstance(user, Coach) else 'cyclist'
            identity = {'user_id': user_id, 'role': role}
            access_token = create_access_token(identity=identity)
            return jsonify(access_token=access_token, role=role), 200
        return jsonify({"message": "Incorrect password"}), 401
    return jsonify({"message": "Account not found"}), 404

@auth_bp.route('/recover', methods=['POST'])
def recover():
    """Recover a user's password.

    Returns:
        Response: JSON response with a password recovery message.
    """
    data = request.get_json()
    email = data.get('email')
    user = Coach.query.filter_by(email=email).first() or Cyclist.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "No user found with that email address"}), 404

    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    token = serializer.dumps(email, salt='email-recover')
    link = url_for('auth_bp.reset_with_token', token=token, _external=True)
    msg = Message('Password Reset', sender=os.getenv('MAIL_USERNAME'), recipients=[email])
    msg.body = f'Your link to reset password is {link}'
    mail.send(msg)
    return jsonify({"message": "If your email is in our database, you will receive a password recovery link."}), 200

@auth_bp.route('/reset/<token>', methods=['GET', 'POST'])
def reset_with_token(token):
    """Reset a user's password with token.

    Args:
        token (str): The token for password reset.

    Returns:
        Response: JSON response with success or error message and status code.
    """
    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-recover', max_age=3600)
        user = Coach.query.filter_by(email=email).first() or Cyclist.query.filter_by(email=email).first()
        if not user:
            return jsonify({"message": "User not found."}), 404
        if request.method == 'POST':
            data = request.get_json()
            new_password = data.get('password')
            user.password = generate_password_hash(new_password)
            db.session.commit()
            return jsonify({"message": "Your password has been successfully reset."}), 200
        return redirect(f"http://localhost:3000/reset-password/{token}")
    except (SignatureExpired, BadSignature):
        return jsonify({"message": "The reset link is invalid or has expired."}), 400

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get a user's profile.

    Returns:
        Response: JSON response with user profile data.
    """
    identity = get_jwt_identity()
    user_id = identity['user_id']
    role = identity['role']

    user = Coach.query.filter_by(coachID=user_id).first() if role == 'coach' else Cyclist.query.filter_by(cyclistID=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    user_data = user.to_dict()
    user_data['role'] = role
    return jsonify(user_data), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update a user's profile.

    Returns:
        Response: JSON response with success or error message and status code.
    """
    identity = get_jwt_identity()
    user_id = identity['user_id']
    role = identity['role']

    user = Coach.query.filter_by(coachID=user_id).first() if role == 'coach' else Cyclist.query.filter_by(cyclistID=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    user.username = data.get('username', user.username)
    user.name = data.get('name', user.name)
    user.surname = data.get('surname', user.surname)

    if role == 'cyclist':
        if 'height_cm' in data and data['height_cm'] != '':
            user.height_cm = data['height_cm']
        if 'weight_kg' in data and data['weight_kg'] != '':
            user.weight_kg = data['weight_kg']
        if 'coachID' in data and data['coachID'] != '':
            user.coachID = data['coachID']

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200

@auth_bp.route('/coaches', methods=['GET'])
def get_all_coaches():
    """Fetch all coaches.

    Returns:
        Response: JSON response with a list of all coaches.
    """
    try:
        coaches = Coach.query.all()
        return jsonify([coach.to_dict() for coach in coaches]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/upload_profile_picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload a profile picture.

    Returns:
        Response: JSON response with success or error message and status code.
    """
    if 'profile_picture' not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        identity = get_jwt_identity()
        user_id = identity['user_id']
        role = identity['role']
        user = Coach.query.filter_by(coachID=user_id).first() if role == 'coach' else Cyclist.query.filter_by(cyclistID=user_id).first()

        if not user:
            return jsonify({"message": "User not found"}), 404

        filename = secure_filename(file.filename)
        extension = filename.rsplit('.', 1)[1].lower()
        new_filename = f"{role}_{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'photos/profilePictures', new_filename)

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        if user.profile_picture and user.profile_picture != 'photos/profilePictures/blankProfilePic.png':
            old_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], user.profile_picture)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        file.save(file_path)
        user.profile_picture = f'photos/profilePictures/{new_filename}'
        db.session.commit()
        return jsonify({"message": "Profile picture uploaded successfully", "profile_picture": new_filename}), 200

    return jsonify({"message": "Invalid file format"}), 400


@auth_bp.route('/coach/cyclists', methods=['GET'])
@jwt_required()
def get_cyclists_for_coach():
    """Get all cyclists for the logged-in coach"""
    identity = get_jwt_identity()
    current_user_id = identity['user_id']
    current_user_role = identity['role']

    if current_user_role != 'coach':
        return jsonify({"message": "Access denied"}), 403

    cyclists = Cyclist.query.filter_by(coachID=current_user_id).all()
    return jsonify([cyclist.to_dict() for cyclist in cyclists]), 200


@auth_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete the current user's account"""
    identity = get_jwt_identity()
    user_id = identity['user_id']
    role = identity['role']

    user = Coach.query.filter_by(coachID=user_id).first() if role == 'coach' else Cyclist.query.filter_by(cyclistID=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if role == 'coach':
        # Update all cyclists to remove their association with the coach
        Cyclist.query.filter_by(coachID=user_id).update({"coachID": None})

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Account deleted successfully"}), 200

def allowed_file(filename):
    """Check if the file is allowed based on the extension.

    Args:
        filename (str): The filename to check.

    Returns:
        bool: True if the file is allowed, False otherwise.
    """
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
