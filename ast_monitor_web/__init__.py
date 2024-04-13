# ast_monitor_web/__init__.py
from flask import Flask

def create_app():
    app = Flask(__name__)
    # Additional configuration and route setup here
    return app
