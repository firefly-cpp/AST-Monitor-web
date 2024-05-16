from flask import request, jsonify, Blueprint, current_app, url_for, render_template, redirect
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from ..models.user import db, User
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Message
from ..__init__ import mail
from sqlalchemy.exc import IntegrityError



auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = data['password']
    role = data.get('role')

    # Create a new user object depending on the role
    if role == 'cyclist':
        date_of_birth = data.get('date_of_birth')
        height_cm = data.get('height_cm')
        weight_kg = data.get('weight_kg')
        new_user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            role=role,
            date_of_birth=date_of_birth,
            height_cm=height_cm,
            weight_kg=weight_kg
        )
    elif role == 'coach':
        new_user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            role=role
        )
    else:
        return jsonify({"message": "Invalid user role"}), 400

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except IntegrityError as e:
        db.session.rollback()
        if 'username' in str(e.orig):
            return jsonify({'message': 'Username already exists'}), 409
        elif 'email' in str(e.orig):
            return jsonify({'message': 'Email already exists'}), 409
        return jsonify({'message': 'Failed to register user'}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Invalid username or password"}), 401

# Password recovery

@auth_bp.route('/recover', methods=['POST'])
def recover():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "No user found with that email address"}), 404

    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    token = serializer.dumps(email, salt='email-recover')

    # Send recovery email
    msg = Message('Password Reset', sender='your-email@gmail.com', recipients=[email])
    link = url_for('auth_bp.reset_with_token', token=token, _external=True)
    msg.body = f'Your link to reset password is {link}'
    mail.send(msg)

    return jsonify({"message": "If your email is in our database, you will receive a password recovery link."}), 200

@auth_bp.route('/reset/<token>', methods=['GET', 'POST'])
def reset_with_token(token):
    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    if request.method == 'GET':
        try:
            email = serializer.loads(token, salt='email-recover', max_age=3600)
            return redirect(f"http://localhost:3000/reset-password/{token}")
        except SignatureExpired:
            return jsonify({"message": "The reset link has expired."}), 400
        except BadSignature:
            return jsonify({"message": "Invalid reset link."}), 400
    elif request.method == 'POST':
        data = request.get_json()
        new_password = data.get('password')
        try:
            email = serializer.loads(token, salt='email-recover', max_age=3600)
            user = User.query.filter_by(email=email).first()
            if user:
                user.password = generate_password_hash(new_password)
                db.session.commit()
                return jsonify({"message": "Your password has been successfully reset."}), 200
            return jsonify({"message": "User not found."}), 404
        except (SignatureExpired, BadSignature):
            return jsonify({"message": "The reset link is invalid or has expired."}), 400



# Profile Management

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    username_changed = False

    if 'username' in data and data['username'] != user.username:
        user.username = data['username']
        username_changed = True  # Set flag if username is updated

    if 'date_of_birth' in data:
        user.date_of_birth = data['date_of_birth']
    if 'height_cm' in data:
        user.height_cm = data['height_cm']
    if 'weight_kg' in data:
        user.weight_kg = data['weight_kg']

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "username_changed": username_changed}), 200
