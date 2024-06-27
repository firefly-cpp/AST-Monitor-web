"""
Models for training plans in the AST Monitor web application.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Interval, DateTime, Text, VARCHAR
from sqlalchemy.orm import relationship
from .database import db

class TrainingPlan(db.Model):
    """Model for a training plan."""
    __tablename__ = 'training_plans'

    plansID = Column(Integer, primary_key=True)
    coachID = Column(Integer, ForeignKey('coaches.coachID'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    executed = Column(VARCHAR(3), nullable=False, default='No')

    coach = relationship('Coach', backref=db.backref('training_plans', lazy=True))
    sessions = relationship('TrainingPlanTemplate', backref='training_plan', cascade="all, delete-orphan")

    def to_dict(self):
        """Convert the TrainingPlan instance to a dictionary."""
        return {
            'plansID': self.plansID,
            'coachID': self.coachID,
            'start_date': self.start_date.isoformat(),
            'description': self.description,
            'executed': self.executed,  # Added executed attribute to dict
            'sessions': [session.to_dict() for session in self.sessions]
        }

class CyclistTrainingPlan(db.Model):
    """Model for associating cyclists with training plans."""
    __tablename__ = 'cyclist_training_plans'

    cyclistID = Column(Integer, ForeignKey('cyclists.cyclistID'), primary_key=True)
    plansID = Column(Integer, ForeignKey('training_plans.plansID'), primary_key=True)

    cyclist = relationship('Cyclist', backref=db.backref('cyclist_training_plans', lazy=True))
    training_plan = relationship('TrainingPlan', backref=db.backref('cyclist_training_plans', lazy=True))

    def to_dict(self):
        """Convert the CyclistTrainingPlan instance to a dictionary."""
        return {
            'cyclistID': self.cyclistID,
            'plansID': self.plansID,
            'cyclist': self.cyclist.to_dict(),
            'training_plan': self.training_plan.to_dict()
        }

class TrainingPlanTemplate(db.Model):
    """Model for a training plan template."""
    __tablename__ = 'training_plan_templates'

    sessionID = Column(Integer, primary_key=True)
    planID = Column(Integer, ForeignKey('training_plans.plansID'), nullable=True)
    type = Column(String(50), nullable=False)
    duration = Column(Interval, nullable=False)
    distance = Column(Numeric, nullable=False)
    intensity = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    def to_dict(self):
        """Convert the TrainingPlanTemplate instance to a dictionary."""
        return {
            'sessionID': self.sessionID,
            'planID': self.planID,
            'type': self.type,
            'duration': str(self.duration),
            'distance': float(self.distance),
            'intensity': self.intensity,
            'notes': self.notes
        }
