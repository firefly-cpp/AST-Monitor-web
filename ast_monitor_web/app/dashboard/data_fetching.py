from flask import jsonify, Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sport_activities_features import TCXFile
from ..models.training_sessions_model import db, TrainingSession
from sport_activities_features.hill_identification import HillIdentification
from sport_activities_features.tcx_manipulation import TCXFile
from sport_activities_features.topographic_features import TopographicFeatures


data_bp = Blueprint('data_bp', __name__)

@data_bp.route('/tcx-data', methods=['GET'])
def get_tcx_data():
    # The path to the TCX file should be securely retrieved or configured
    path_to_tcx_file = "C:/Users/Vanja/Desktop/Projekt/Sport5/Sport5/1/1.tcx"
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
        "average_heart_rate": average_heart_rate,
        "speeds": data.get('speeds', []),
        "heartrates": data.get('heartrates', []),
        "timestamps": data.get('timestamps', [])
    }

    return jsonify(detailed_data)


@data_bp.route('/hill-data', methods=['POST'])
@jwt_required()
def hill_data():
    file = request.files['file']
    file_path = 'temp.tcx'  # Save the uploaded file to a temporary location
    file.save(file_path)

    # Read TCX file
    tcx_file = TCXFile()
    activity = tcx_file.read_one_file(file_path)

    # Detect hills in data
    Hill = HillIdentification(activity['altitudes'], 30)
    Hill.identify_hills()
    all_hills = Hill.return_hills()

    # Extract features from data
    Top = TopographicFeatures(all_hills)
    num_hills = Top.num_of_hills()
    avg_altitude = Top.avg_altitude_of_hills(activity['altitudes'])
    avg_ascent = Top.avg_ascent_of_hills(activity['altitudes'])
    distance_hills = Top.distance_of_hills(activity['positions'])
    hills_share = Top.share_of_hills(distance_hills, activity['total_distance'])

    # Return the data as JSON
    return jsonify({
        'num_hills': num_hills,
        'avg_altitude': avg_altitude,
        'avg_ascent': avg_ascent,
        'distance_hills': distance_hills,
        'hills_share': hills_share
    })
