from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models.database import db  # Corrected import

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:nekipass578@localhost/astmonitor'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'

    db.init_app(app)

    CORS(app, resources={r"/auth/*": {"origins": "http://localhost:3000"}})
    jwt = JWTManager(app)

    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
