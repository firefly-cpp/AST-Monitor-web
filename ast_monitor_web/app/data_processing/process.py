import gpxpy
import os
import json
import datetime

def process_gpx_data(directory):
    results = []
    files_to_process = {f'f{i}.gpx' for i in range(1, 11)}
    for filename in os.listdir(directory):
        if filename in files_to_process:
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r') as gpx_file:
                gpx = gpxpy.parse(gpx_file)
                for track in gpx.tracks:
                    for segment in track.segments:
                        for point in segment.points:
                            point_data = {
                                'latitude': point.latitude,
                                'longitude': point.longitude,
                                'elevation': point.elevation,
                                'time': point.time.isoformat() if point.time else None
                            }
                            # Parsing the extensions manually
                            if point.extensions:
                                for child in point.extensions[0]:
                                    if child.tag.endswith('TrackPointExtension'):
                                        for subchild in child:
                                            tag = subchild.tag.split('}')[-1]
                                            point_data[tag] = subchild.text
                            results.append(point_data)
    return results

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def save_data_to_json(data, file_path):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4, default=json_serial)
    print(f"Data saved to {file_path}")

# Example usage
directories = [
    r'C:\Users\Vanja\Desktop\Projekt\Sport\Sport\Rider1',
    r'C:\Users\Vanja\Desktop\Projekt\Sport\Sport\Rider2',
    r'C:\Users\Vanja\Desktop\Projekt\Sport\Sport\Rider3'
]

for directory in directories:
    data_from_directory = process_gpx_data(directory)
    output_file_path = f'output_gpx_data_{os.path.basename(directory)}.json'
    save_data_to_json(data_from_directory, output_file_path)
    print(f"Processed {len(data_from_directory)} files from {directory}")
