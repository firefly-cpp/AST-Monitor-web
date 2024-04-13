from flask import Flask
from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'super-secret'  # Change to a random secret key

    jwt = JWTManager(app)

    # Import Blueprints
    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
