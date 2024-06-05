from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from dotenv import load_dotenv
from .auth import auth_bp
from .dashboard.coach import coach_bp
from .dashboard.cyclist import cyclist_bp
from .dashboard.data_fetching import data_bp
from .models.database import db
import os
import secrets

# Initialize mail
mail = Mail()

# Load environment variables from .env file
load_dotenv()

MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')

# Generate a random JWT secret key
JWT_SECRET_KEY = secrets.token_urlsafe(32)

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = MAIL_USERNAME
    app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_DEBUG'] = True

    db.init_app(app)

    # Allow CORS for all routes and origins
    CORS(app, resources={r"/*": {"origins": "*"}})

    jwt = JWTManager(app)
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(data_bp, url_prefix='/data_fetching')
    app.register_blueprint(coach_bp, url_prefix='/coach')
    app.register_blueprint(cyclist_bp, url_prefix='/cyclist')

    return app
