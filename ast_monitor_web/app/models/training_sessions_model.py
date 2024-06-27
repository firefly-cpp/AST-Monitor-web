"""
Models for training sessions in the AST Monitor web application.
"""

from sqlalchemy import Column, Integer, Numeric, Text, Interval, String, DateTime
from .database import db

class TrainingSession(db.Model):
    """Model for a training session."""
    __tablename__ = 'training_sessions'

    sessionsID = Column(Integer, primary_key=True)
    cyclistID = Column(Integer, db.ForeignKey('cyclists.cyclistID'), nullable=False)
    altitude_avg = Column(Numeric)
    altitude_max = Column(Numeric)
    altitude_min = Column(Numeric)
    altitudes = Column(Text)
    ascent = Column(Numeric)
    calories = Column(Numeric)
    descent = Column(Numeric)
    distance = Column(Numeric)
    distances = Column(Text)
    duration = Column(Interval)
    heartrates = Column(Text)
    hr_avg = Column(Integer)
    hr_max = Column(Integer)
    hr_min = Column(Integer)
    positions = Column(Text)
    speeds = Column(Text)
    start_time = Column(DateTime)
    steps = Column(Integer)
    timestamps = Column(Text)
    total_distance = Column(Numeric)

    def __init__(self, cyclistID, altitude_avg=None, altitude_max=None, altitude_min=None, altitudes=None, ascent=None,
                 calories=None, descent=None, distance=None, distances=None, duration=None, heartrates=None, hr_avg=None,
                 hr_max=None, hr_min=None, positions=None, speeds=None, start_time=None, steps=None, timestamps=None,
                 total_distance=None):
        """Initialize a TrainingSession instance."""
        self.cyclistID = cyclistID
        self.altitude_avg = altitude_avg
        self.altitude_max = altitude_max
        self.altitude_min = altitude_min
        self.altitudes = altitudes
        self.ascent = ascent
        self.calories = calories
        self.descent = descent
        self.distance = distance
        self.distances = distances
        self.duration = duration
        self.heartrates = heartrates
        self.hr_avg = hr_avg
        self.hr_max = hr_max
        self.hr_min = hr_min
        self.positions = positions
        self.speeds = speeds
        self.start_time = start_time
        self.steps = steps
        self.timestamps = timestamps
        self.total_distance = total_distance

    def to_dict(self):
        """Convert the TrainingSession instance to a dictionary."""
        return {
            'sessionsID': self.sessionsID,
            'cyclistID': self.cyclistID,
            'altitude_avg': self.altitude_avg,
            'altitude_max': self.altitude_max,
            'altitude_min': self.altitude_min,
            'altitudes': self.altitudes,
            'ascent': self.ascent,
            'calories': self.calories,
            'descent': self.descent,
            'distance': self.distance,
            'distances': self.distances,
            'duration': self.duration,
            'heartrates': self.heartrates,
            'hr_avg': self.hr_avg,
            'hr_max': self.hr_max,
            'hr_min': self.hr_min,
            'positions': self.positions,
            'speeds': self.speeds,
            'start_time': self.start_time,
            'steps': self.steps,
            'timestamps': self.timestamps,
            'total_distance': self.total_distance
        }
