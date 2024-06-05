from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Interval, DateTime
from sqlalchemy.orm import relationship
from .database import db

class TrainingPlan(db.Model):
    __tablename__ = 'training_plans'

    plansID = Column(Integer, primary_key=True)
    coachID = Column(Integer, ForeignKey('coaches.coachID'), nullable=False)
    start_time = Column(DateTime, nullable=False)
    duration = Column(Interval, nullable=False)
    total_distance = Column(Numeric, nullable=False)
    hr_avg = Column(Numeric)
    altitude_avg = Column(Numeric)
    altitude_max = Column(Numeric)
    calories = Column(Numeric)
    ascent = Column(Numeric)
    descent = Column(Numeric)

    coach = relationship('Coach', backref=db.backref('training_plans', lazy=True))

    def to_dict(self):
        return {
            'plansID': self.plansID,
            'coachID': self.coachID,
            'start_time': self.start_time.isoformat(),
            'duration': str(self.duration),
            'total_distance': float(self.total_distance),
            'hr_avg': float(self.hr_avg) if self.hr_avg is not None else None,
            'altitude_avg': float(self.altitude_avg) if self.altitude_avg is not None else None,
            'altitude_max': float(self.altitude_max) if self.altitude_max is not None else None,
            'calories': float(self.calories) if self.calories is not None else None,
            'ascent': float(self.ascent) if self.ascent is not None else None,
            'descent': float(self.descent) if self.descent is not None else None
        }

class CyclistTrainingPlan(db.Model):
    __tablename__ = 'cyclist_training_plans'

    cyclistID = Column(Integer, ForeignKey('cyclists.cyclistID'), primary_key=True)
    plansID = Column(Integer, ForeignKey('training_plans.plansID'), primary_key=True)

    cyclist = relationship('Cyclist', backref=db.backref('cyclist_training_plans', lazy=True))
    training_plan = relationship('TrainingPlan', backref=db.backref('cyclist_training_plans', lazy=True))

    def to_dict(self):
        return {
            'cyclistID': self.cyclistID,
            'plansID': self.plansID,
            'cyclist': self.cyclist.to_dict(),
            'training_plan': self.training_plan.to_dict()
        }
