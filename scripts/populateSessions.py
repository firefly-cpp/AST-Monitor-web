import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ast_monitor_web.app.models.training_sessions_model import TrainingSession  # Assuming your models file and class names
from datetime import datetime, timezone, timedelta

# Connect to your database
engine = create_engine('postgresql://postgres:nekipass578@localhost/astmonitor')
Session = sessionmaker(bind=engine)
session = Session()

# Function to convert string timestamps to datetime objects
def parse_datetime(timestamp):
    """ Convert milliseconds UNIX timestamp to a timezone-aware datetime object. """
    if timestamp is None:
        # Return a default datetime or None based on your requirements
        return None  # Or datetime.datetime.now(timezone.utc) for current timestamp
    return datetime.fromtimestamp(timestamp / 1000.0, timezone.utc)


# Load your JSON data
def load_json_data(filepath):
    with open(filepath, 'r') as file:
        data = json.load(file)
    return data


def insert_data(data_list, cyclist_id):
    for data in data_list:
        duration_seconds = data.get('duration') or 0
        duration_interval = timedelta(seconds=duration_seconds)

        start_time_value = parse_datetime(data.get('start_time'))
        if start_time_value is None:
            start_time_value = datetime.now(timezone.utc)  # or another appropriate default

        training_session = TrainingSession(
            cyclistID=cyclist_id,
            altitude_avg=data.get('altitude_avg'),
            altitude_max=data.get('altitude_max'),
            altitude_min=data.get('altitude_min'),
            altitudes=json.dumps(data.get('altitudes')),  # Ensure altitudes is included
            ascent=data.get('ascent'),
            descent=data.get('descent'),
            calories=data.get('calories'),
            distance=data.get('distance'),
            distances=json.dumps(data.get('distances')),  # Ensure distances is included
            duration=duration_interval,
            heartrates=json.dumps(data.get('heartrates')),
            hr_avg=data.get('hr_avg'),
            hr_max=data.get('hr_max'),
            hr_min=data.get('hr_min'),
            positions=json.dumps(data.get('positions')),
            speeds=json.dumps(data.get('speeds')),
            start_time=start_time_value,
            steps=data.get('steps'),
            timestamps=json.dumps(data.get('timestamps')),
            total_distance=data.get('total_distance')
        )
        session.add(training_session)

    session.commit()
    session.close()

# Usage Example
data_file = 'C:/Users/Vanja/Desktop/Projekt/Sport5Rider3.json'
data_list = load_json_data(data_file)
insert_data(data_list, cyclist_id=1)

# Commit the session to save your data to the database
session.commit()

# Close the session
session.close()
