import io
import json
import logging

import requests
from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required
from sport_activities_features import HillIdentification, TopographicFeatures

from ..models.training_sessions_model import TrainingSession
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import send_file
import matplotlib.pyplot as plt
import folium
import tempfile
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import chromedriver_autoinstaller

WEATHER_API_URL = 'https://api.weatherapi.com/v1/history.json'
WEATHER_API_KEY = '1b139147fb034e529e7205548243005'

import_export_bp = Blueprint('import_export_bp', __name__)

def get_weather_data(lat, lon, start_time):
    response = requests.get(WEATHER_API_URL, params={
        'key': WEATHER_API_KEY,
        'q': f'{lat},{lon}',
        'dt': start_time.split('T')[0]
    })
    weather_data = response.json()
    logging.info(f"Weather data response: {weather_data}")
    return weather_data


#Export PDF route

@import_export_bp.route('/athlete/session/<int:session_id>/export_pdf', methods=['GET'])
@jwt_required()
def export_session_report(session_id):
    try:
        logging.debug(f"Attempting to fetch session ID: {session_id}")
        session = TrainingSession.query.get(session_id)
        if not session:
            logging.warning(f"Session with ID {session_id} not found.")
            return jsonify({"message": "Session not found"}), 404

        # Compute weather data
        weather_data = {}
        if session.positions:
            start_position = json.loads(session.positions)[0]
            lat, lon = start_position
            weather_response = get_weather_data(lat, lon, session.start_time.isoformat())
            if 'forecast' in weather_response and 'forecastday' in weather_response['forecast'] and weather_response['forecast']['forecastday']:
                day_weather = weather_response['forecast']['forecastday'][0]['day']
                weather_data = {
                    "temp_c": day_weather.get('avgtemp_c'),
                    "condition": day_weather.get('condition', {}).get('text', 'N/A'),
                    "wind_kph": day_weather.get('maxwind_kph'),
                    "humidity": day_weather.get('avghumidity')
                }

        # Compute hill data
        altitudes = json.loads(session.altitudes)
        hills = HillIdentification(altitudes, 30)
        hills.identify_hills()
        all_hills = hills.return_hills()
        topographic_features = TopographicFeatures(all_hills)
        hill_data = {
            "num_hills": max(0, topographic_features.num_of_hills() or 0),
            "avg_altitude": max(0, topographic_features.avg_altitude_of_hills([float(a) for a in altitudes]) or 0),
            "avg_ascent": max(0, topographic_features.avg_ascent_of_hills([float(a) for a in altitudes]) or 0),
            "distance_hills": max(0, topographic_features.distance_of_hills(json.loads(session.positions)) or 0),
            "hills_share": max(0, topographic_features.share_of_hills(
                topographic_features.distance_of_hills(json.loads(session.positions)),
                float(session.total_distance)
            ) or 0)
        }

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Title
        pdf.setFont("Helvetica", 16)
        pdf.drawString(30, height - 40, f"Session Report for {session.start_time.strftime('%Y-%m-%d')}")

        # Session details
        pdf.setFont("Helvetica", 12)
        y = height - 60
        details = [
            f"Altitude Avg: {session.altitude_avg}",
            f"Altitude Max: {session.altitude_max}",
            f"Altitude Min: {session.altitude_min}",
            f"Ascent: {session.ascent}",
            f"Calories: {session.calories}",
            f"Descent: {session.descent}",
            f"Distance: {session.distance}",
            f"Duration: {session.duration}",
            f"HR Avg: {session.hr_avg}",
            f"HR Max: {session.hr_max}",
            f"HR Min: {session.hr_min}",
            f"Total Distance: {session.total_distance}"
        ]
        for detail in details:
            pdf.drawString(30, y, detail)
            y -= 15

        # Weather data
        if weather_data:
            pdf.drawString(30, y, "Weather Data:")
            y -= 15
            for key, value in weather_data.items():
                pdf.drawString(30, y, f"{key}: {value}")
                y -= 15

        # Hill data
        if hill_data:
            pdf.drawString(30, y, "Hill Data:")
            y -= 15
            for key, value in hill_data.items():
                pdf.drawString(30, y, f"{key}: {value}")
                y -= 15

        # Charts
        def save_chart(data, label):
            plt.figure(figsize=(10, 4))
            plt.plot(data)
            plt.title(f'{label} Over Time')
            plt.xlabel('Time')
            plt.ylabel(label)
            plt.grid(True)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            plt.savefig(temp_file.name)
            plt.close()
            return temp_file.name

        charts_data = {
            'Altitude': json.loads(session.altitudes),
            'Heart Rate': json.loads(session.heartrates),
            'Speed': json.loads(session.speeds)
        }
        for label, data in charts_data.items():
            chart_file = save_chart(data, label)
            if y - 150 < 0:
                pdf.showPage()
                y = height - 50
            pdf.drawImage(chart_file, 30, y - 150, width=500, height=100)
            y -= 160

        # Doughnut and Pie charts
        def save_doughnut_chart(data, labels, title):
            data = [max(0, d or 0) for d in data]  # Ensure all data points are non-negative
            plt.figure(figsize=(6, 6))
            plt.pie(data, labels=labels, autopct='%1.1f%%', startangle=140)
            plt.title(title)
            plt.gca().add_artist(plt.Circle((0, 0), 0.70, fc='white'))
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            plt.savefig(temp_file.name)
            plt.close()
            return temp_file.name

        hill_data_chart = save_doughnut_chart(
            data=[
                hill_data['num_hills'],
                hill_data['avg_altitude'],
                hill_data['avg_ascent'],
                hill_data['distance_hills'],
                hill_data['hills_share'] * 100
            ],
            labels=['Number of Hills', 'Avg Altitude (m)', 'Avg Ascent (m)', 'Distance Hills (km)', 'Hills Share (%)'],
            title='Hill Data'
        )

        hills_share_chart = save_doughnut_chart(
            data=[hill_data['hills_share'] * 100, 100 - hill_data['hills_share'] * 100],
            labels=['Hills', 'Flat'],
            title='Hills Share'
        )

        if y - 300 < 0:
            pdf.showPage()
            y = height - 50
        pdf.drawImage(hill_data_chart, 30, y - 300, width=300, height=300)
        pdf.drawImage(hills_share_chart, 330, y - 300, width=300, height=300)
        y -= 320

        # Map
        positions = json.loads(session.positions)
        if positions:
            m = folium.Map(location=positions[0], zoom_start=13, tiles='OpenStreetMap')
            folium.PolyLine(positions, color="blue", weight=2.5, opacity=1).add_to(m)
            folium.Marker(positions[0], popup='Start Point').add_to(m)
            folium.Marker(positions[-1], popup='End Point').add_to(m)

            map_html = m._repr_html_()

            chromedriver_autoinstaller.install()
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--window-size=800,600")
            driver = webdriver.Chrome(options=options)

            temp_map_html = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
            temp_map_html.write(map_html.encode('utf-8'))
            temp_map_html.close()

            driver.get(f'file://{temp_map_html.name}')
            temp_map_png = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            driver.save_screenshot(temp_map_png.name)
            driver.quit()

            map_height = 200
            if y - map_height < 0:
                pdf.showPage()
                y = height - 50
            pdf.drawImage(temp_map_png.name, 30, y - map_height, width=500, height=map_height)
            y -= (map_height + 10)

        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"session_report_{session.start_time.strftime('%Y-%m-%d')}.pdf", mimetype='application/pdf')
    except Exception as e:
        logging.error(f"Error generating PDF report: {str(e)}")
        return jsonify({"error": "Error generating PDF report"}), 500

@import_export_bp.route('/athlete/session/<int:session_id>/export_json', methods=['GET'])
@jwt_required()
def export_session_json(session_id):
    try:
        session = TrainingSession.query.get(session_id)
        if not session:
            return jsonify({"message": "Session not found"}), 404

        # Compute weather data
        weather_data = {}
        if session.positions:
            start_position = json.loads(session.positions)[0]
            lat, lon = start_position
            weather_response = get_weather_data(lat, lon, session.start_time.isoformat())
            if 'forecast' in weather_response and 'forecastday' in weather_response['forecast'] and weather_response['forecast']['forecastday']:
                day_weather = weather_response['forecast']['forecastday'][0]['day']
                weather_data = {
                    "temp_c": day_weather.get('avgtemp_c'),
                    "condition": day_weather.get('condition', {}).get('text', 'N/A'),
                    "wind_kph": day_weather.get('maxwind_kph'),
                    "humidity": day_weather.get('avghumidity')
                }

        # Compute hill data
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

        session_data = {
            "cyclistID": session.cyclistID,
            "sessionsID": session.sessionsID,
            "altitude_avg": session.altitude_avg,
            "altitude_max": session.altitude_max,
            "altitude_min": session.altitude_min,
            "ascent": session.ascent,
            "calories": session.calories,
            "descent": session.descent,
            "distance": session.distance,
            "duration": session.duration.total_seconds() if session.duration else 0,
            "hr_avg": session.hr_avg,
            "hr_max": session.hr_max,
            "hr_min": session.hr_min,
            "total_distance": session.total_distance,
            "altitudes": json.loads(session.altitudes),
            "heartrates": json.loads(session.heartrates),
            "speeds": json.loads(session.speeds),
            "start_time": session.start_time.isoformat(),
            "positions": json.loads(session.positions) if session.positions else [],
            "weather": weather_data,
            "hill_data": hill_data
        }

        return jsonify(session_data)
    except Exception as e:
        logging.error(f"Error exporting JSON data: {str(e)}")
        return jsonify({"error": "Error exporting JSON data"}), 500

