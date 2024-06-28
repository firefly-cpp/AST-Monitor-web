"""
Utility functions for the AST Monitor web application.
"""

import json
import requests
from sport_activities_features import HillIdentification, TopographicFeatures

import openmeteo_requests
import requests_cache
from retry_requests import retry
import logging

WEATHER_API_URL = "https://archive-api.open-meteo.com/v1/archive?latitude=46.5547&longitude=15.6467&start_date=2010-01-01&end_date=2019-12-31&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,cloud_cover,wind_speed_100m"

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

def get_weather_data(lat, lon, start_time):
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_time.split('T')[0],
            "end_date": start_time.split('T')[0],  # Same day for historical data
            "hourly": ["temperature_2m", "apparent_temperature", "precipitation", "cloud_cover", "wind_speed_10m"]
        }
        responses = openmeteo.weather_api(WEATHER_API_URL, params=params)
        
        if not responses:
            logging.warning("No response from weather API")
            return {}

        response = responses[0]
        hourly = response.Hourly()
        
        weather_data = {
            "temp_c": hourly.Variables(0).ValuesAsNumpy().mean() if hourly.Variables(0).ValuesAsNumpy().size > 0 else 'N/A',
            "condition": 'N/A',  # Condition data not directly available
            "wind_kph": hourly.Variables(4).ValuesAsNumpy().mean() * 3.6 if hourly.Variables(4).ValuesAsNumpy().size > 0 else 'N/A',  # Convert m/s to kph
            "humidity": 'N/A'  # Humidity data not available in the sample
        }
        logging.info("Parsed weather data: %s", weather_data)
        return weather_data
    except Exception as e:
        logging.error("Error fetching weather data: %s", e)
        return {}
    
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
