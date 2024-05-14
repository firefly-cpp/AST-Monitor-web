from flask import request, jsonify, Blueprint, current_app, url_for, render_template, redirect
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from ..models.user import db, User
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Message
from ..__init__ import mail



auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data['username']
    email = data['email']
    password = data['password']
    role = data.get('role', 'user')  # Default role is 'user'

    # Check if user already exists
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'User already exists'}), 409

    new_user = User(
        username=username,
        email=email,
        password=generate_password_hash(password),
        role=role
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

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

