from flask import jsonify, Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sport_activities_features import TCXFile
from ..models.activites import db, TrainingSession


data_bp = Blueprint('data_bp', __name__)

@data_bp.route('/tcx-data', methods=['GET'])
def get_tcx_data():
    # The path to the TCX file should be securely retrieved or configured
    path_to_tcx_file = "C:/Users/Korisnik/Downloads/Sport5/Sport5/1/1.tcx"
    tcx_file = TCXFile()
    data = tcx_file.read_one_file(path_to_tcx_file)

    # Extract additional details manually
    total_ascent = sum([data['altitudes'][i] - data['altitudes'][i-1] for i in range(1, len(data['altitudes'])) if data['altitudes'][i] > data['altitudes'][i-1]])
    total_descent = sum([data['altitudes'][i-1] - data['altitudes'][i] for i in range(1, len(data['altitudes'])) if data['altitudes'][i] < data['altitudes'][i-1]])
    average_speed = sum(data['speeds']) / len(data['speeds']) if data['speeds'] else 0
    average_heart_rate = sum(data['heartrates']) / len(data['heartrates']) if data['heartrates'] else 0

    detailed_data = {
        "total_distance": data['total_distance'],
        "total_ascent": total_ascent,
        "total_descent": total_descent,
        "average_speed": average_speed,
        "average_heart_rate": average_heart_rate
    }

    return jsonify(detailed_data)




@data_bp.route('/upload_training_data', methods=['POST'])
@jwt_required()
def upload_training_data():
    current_user_id = get_jwt_identity()  # Assuming the identity is the ID
    data = request.get_json()

    new_session = TrainingSession(
        cyclistID=data['cyclistID'],
        altitude_avg=data['altitude_avg'],
        altitude_max=data['altitude_max'],
        altitude_min=data['altitude_min'],
        ascent=data['ascent'],
        descent=data['descent'],
        calories=data['calories'],
        distance=data['distance'],
        durations=data['duration'],
        hr_avg=data['hr_avg'],
        hr_max=data['hr_max'],
        hr_min=data['hr_min'],
        positions=data['positions'],
        speeds=data['speeds'],
        start_time=data['start_time'],
        steps=data['steps'],
        timestamps=data['timestamps'],
        total_distance=data['total_distance'],
    )
    db.session.add(new_session)
    db.session.commit()
    return jsonify({'message': 'Training data uploaded successfully'}), 201
