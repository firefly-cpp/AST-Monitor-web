from .database import db
from sqlalchemy import Column, Integer, Numeric, ForeignKey, Text, Interval, DateTime

class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'

    sessionsID = Column(Integer, primary_key=True)
    cyclistID = Column(Integer, ForeignKey('cyclists.cyclistID'), nullable=False)
    altitude_avg = Column(Numeric)
    altitude_max = Column(Numeric)
    altitude_min = Column(Numeric)
    ascent = Column(Numeric)
    descent = Column(Numeric)
    calories = Column(Numeric)
    distance = Column(Numeric)
    duration = Column(Interval)
    heartrates = Column(Text)  # JSON string of heart rate data points
    hr_avg = Column(Integer)
    hr_max = Column(Integer)
    hr_min = Column(Integer)
    positions = Column(Text)  # JSON string of position data points
    speeds = Column(Text)  # JSON string of speed data points
    start_time = Column(DateTime)
    steps = Column(Integer)
    timestamps = Column(Text)  # JSON string of timestamp data points
    total_distance = Column(Numeric)

    def __init__(self, cyclistID, altitude_avg, altitude_max, altitude_min, ascent, descent, calories, distance, duration, heartrates, hr_avg, hr_max, hr_min, positions, speeds, start_time, steps, timestamps, total_distance):
        self.cyclistID = cyclistID
        self.altitude_avg = altitude_avg
        self.altitude_max = altitude_max
        self.altitude_min = altitude_min
        self.ascent = ascent
        self.descent = descent
        self.calories = calories
        self.distance = distance
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
        return {
            'sessionsID': self.sessionsID,
            'cyclistID': self.cyclistID,
            'altitude_avg': float(self.altitude_avg),
            'altitude_max': float(self.altitude_max),
            'altitude_min': float(self.altitude_min),
            'ascent': float(self.ascent),
            'descent': float(self.descent),
            'calories': float(self.calories),
            'distance': float(self.distance),
            'duration': self.duration.seconds,  # Assuming durations is stored as a timedelta
            'heartrates': self.heartrates,
            'hr_avg': self.hr_avg,
            'hr_max': self.hr_max,
            'hr_min': self.hr_min,
            'positions': self.positions,
            'speeds': self.speeds,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'steps': self.steps,
            'timestamps': self.timestamps,
            'total_distance': float(self.total_distance)
        }
