from flask import request, jsonify, Blueprint, url_for, redirect, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Message
from ..models.usermodel import db, Coach, Cyclist
from ..__init__ import mail
from sqlalchemy.exc import IntegrityError

auth_bp = Blueprint('auth_bp', __name__)


# Coach registration endpoint
@auth_bp.route('/register_coach', methods=['POST'])
def register_coach():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = generate_password_hash(data['password'])
    new_coach = Coach(username=username, email=email, password=password)
    try:
        db.session.add(new_coach)
        db.session.commit()
        return jsonify({'message': 'Coach registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Registration failed, username or email already exists'}), 409


@auth_bp.route('/register_cyclist', methods=['POST'])
def register_cyclist():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = generate_password_hash(data['password'])
    coachID = data.get('coachID')  # Use .get to avoid KeyError
    date_of_birth = data['date_of_birth']
    height_cm = data['height_cm']
    weight_kg = data['weight_kg']

    if not coachID:  # Check if coachID is provided
        return jsonify({'message': 'Coach ID must be provided'}), 400

    new_cyclist = Cyclist(coachID=coachID, username=username, email=email, password=password,
                          date_of_birth=date_of_birth, height_cm=height_cm, weight_kg=weight_kg)
    try:
        db.session.add(new_cyclist)
        db.session.commit()
        return jsonify({'message': 'Cyclist registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Registration failed, username or email already exists'}), 409


# Update your login function to handle both coaches and cyclists
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = Coach.query.filter_by(username=username).first() or Cyclist.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        user_id = user.coachID if isinstance(user, Coach) else user.cyclistID
        role = 'coach' if isinstance(user, Coach) else 'cyclist'
        # Include both user ID and role in the JWT identity
        identity = {'user_id': user_id, 'role': role}
        access_token = create_access_token(identity=identity)
        return jsonify(access_token=access_token, role=role), 200
    else:
        return jsonify({"msg": "Invalid username or password"}), 401


@auth_bp.route('/recover', methods=['POST'])
def recover():
    data = request.get_json()
    email = data.get('email')
    user = Coach.query.filter_by(email=email).first() or Cyclist.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "No user found with that email address"}), 404

    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    token = serializer.dumps(email, salt='email-recover')
    link = url_for('auth_bp.reset_with_token', token=token, _external=True)
    msg = Message('Password Reset', sender='your-email@example.com', recipients=[email])
    msg.body = f'Your link to reset password is {link}'
    mail.send(msg)
    return jsonify({"message": "If your email is in our database, you will receive a password recovery link."}), 200


@auth_bp.route('/reset/<token>', methods=['GET', 'POST'])
def reset_with_token(token):
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
    identity = get_jwt_identity()
    user_id = identity['user_id']
    role = identity['role']

    if role == 'coach':
        user = Coach.query.filter_by(coachID=user_id).first()
    else:
        user = Cyclist.query.filter_by(cyclistID=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    identity = get_jwt_identity()  # Extract the identity from the JWT
    user_id = identity['user_id']
    role = identity['role']

    # Find the user by role and user ID
    if role == 'coach':
        user = Coach.query.filter_by(coachID=user_id).first()
    else:
        user = Cyclist.query.filter_by(cyclistID=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    user.username = data.get('username', user.username)

    # If the user is a Cyclist, update additional fields
    if role == 'cyclist':
        if 'height_cm' in data:
            user.height_cm = data['height_cm']
        if 'weight_kg' in data:
            user.weight_kg = data['weight_kg']

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200




# Fetch all coaches:
@auth_bp.route('/coaches', methods=['GET'])
def get_all_coaches():
    try:
        coaches = Coach.query.all()
        return jsonify([coach.to_dict() for coach in coaches]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
