"""
Initialization and configuration of the Flask application for the AST Monitor web application.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from .auth.views import auth_bp
from .dashboard.coach import coach_bp
from .dashboard.cyclist import cyclist_bp
from .dashboard.import_export import import_export_bp
from .models.database import db
from .extensions import mail  # Import mail from extensions

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    # Allow CORS for all routes and origins
    CORS(app, resources={r"/*": {"origins": "*"}})

    JWTManager(app)
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(coach_bp, url_prefix='/coach')
    app.register_blueprint(cyclist_bp, url_prefix='/cyclist')
    app.register_blueprint(import_export_bp, url_prefix='/import_export')

    return app
