from .database import db
from sqlalchemy import Column, Integer, String, Date

class User(db.Model):
    __tablename__ = 'users'

    usersID = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    role = Column(String(15), nullable=False)
    date_of_birth = Column(Date, nullable=True)  # For cyclists
    height_cm = Column(Integer, nullable=True)  # Height in cm for cyclists
    weight_kg = Column(Integer, nullable=True)  # Weight in kg for cyclists

    def __init__(self, username, password, email, role='user', date_of_birth=None, height_cm=None, weight_kg=None):
        self.username = username
        self.password = password
        self.email = email
        self.role = role
        self.date_of_birth = date_of_birth
        self.height_cm = height_cm
        self.weight_kg = weight_kg

    def to_dict(self):
        """Helper method to convert a User object into a dictionary format."""
        return {
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg
        }
