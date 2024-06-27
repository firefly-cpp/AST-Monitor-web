"""
Utility functions for the AST Monitor web application.
"""

import json
import logging
import requests
from sport_activities_features import HillIdentification, TopographicFeatures

WEATHER_API_URL = 'https://api.weatherapi.com/v1/history.json'
WEATHER_API_KEY = '1b139147fb034e529e7205548243005'

def get_weather_data(lat, lon, start_time):
    """Fetch weather data for the given location and date."""
    response = requests.get(WEATHER_API_URL, params={
        'key': WEATHER_API_KEY,
        'q': f'{lat},{lon}',
        'dt': start_time.split('T')[0]
    })
    weather_data = response.json()
    logging.info("Weather data response: %s", weather_data)
    return weather_data

def compute_hill_data(session):
    """Compute hill data for a given session."""
    altitudes = json.loads(session.altitudes)
    hills = HillIdentification(altitudes, 30)
    hills.identify_hills()
    all_hills = hills.return_hills()
    topographic_features = TopographicFeatures(all_hills)
    hill_data = {
        "num_hills": topographic_features.num_of_hills(),
        "avg_altitude": topographic_features.avg_altitude_of_hills([float(a) for a in altitudes]),
        "avg_ascent": topographic_features.avg_ascent_of_hills([float(a) for a in altitudes]),
        "distance_hills": topographic_features.distance_of_hills(json.loads(session.positions)),
        "hills_share": topographic_features.share_of_hills(
            topographic_features.distance_of_hills(json.loads(session.positions)),
            float(session.total_distance)
        )
    }
    return hill_data
