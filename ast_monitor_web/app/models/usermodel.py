from .database import db
from sqlalchemy import Column, Integer, String, Date

class Coach(db.Model):
    __tablename__ = 'coaches'

    coachID = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    profile_picture = Column(String(255), nullable=True)

    def __init__(self, username, password, email, profile_picture=None):
        self.username = username
        self.password = password
        self.email = email
        self.profile_picture = profile_picture

    def to_dict(self):
        return {
            'coachID': self.coachID,
            'username': self.username,
            'email': self.email,
            'profile_picture': self.profile_picture if self.profile_picture else 'photos/profilePictures/blankProfilePic.png'
        }

class Cyclist(db.Model):
    __tablename__ = 'cyclists'

    cyclistID = Column(Integer, primary_key=True)
    coachID = Column(Integer, db.ForeignKey('coaches.coachID'), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    date_of_birth = Column(Date)
    height_cm = Column(Integer)
    weight_kg = Column(Integer)
    profile_picture = Column(String(255), nullable=True)

    coach = db.relationship('Coach', backref=db.backref('cyclists', lazy=True))

    def __init__(self, coachID, username, password, email, date_of_birth=None, height_cm=None, weight_kg=None, profile_picture=None):
        self.coachID = coachID
        self.username = username
        self.password = password
        self.email = email
        self.date_of_birth = date_of_birth
        self.height_cm = height_cm
        self.weight_kg = weight_kg
        self.profile_picture = profile_picture

    def to_dict(self):
        return {
            'cyclistID': self.cyclistID,
            'coachID': self.coachID,
            'username': self.username,
            'email': self.email,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg,
            'profile_picture': self.profile_picture if self.profile_picture else 'photos/profilePictures/blankProfilePic.png'
        }
