from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

from .models.database import db  # Corrected import



# Initialize mail outside of create_app to make it importable
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:nekipass578@localhost/astmonitor'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
    # Email configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = 'cyclearninfo@gmail.com'
    app.config['MAIL_PASSWORD'] = 'udnc oadv dxsh pwtv'
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_DEBUG'] = True

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
    jwt = JWTManager(app)


    mail.init_app(app)


    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
