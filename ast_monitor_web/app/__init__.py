from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager


def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # Change to a random secret key

    # Initialize CORS to allow connections from the React frontend
    CORS(app, resources={r"/auth/*": {"origins": "http://localhost:3000"}})

    jwt = JWTManager(app)

    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
