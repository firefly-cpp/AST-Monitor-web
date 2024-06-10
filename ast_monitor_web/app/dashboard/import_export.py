import csv
import io
import json
import logging
import os

import pandas as pd
from flask_mail import Mail, Message
from datetime import datetime, timedelta
from flask import jsonify, Blueprint, request, send_file, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
from ..models.training_sessions_model import TrainingSession
from ..models.usermodel import db, Coach, Cyclist
from ..models.training_plans_model import TrainingPlan, CyclistTrainingPlan
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import send_file
import matplotlib.pyplot as plt
import folium
import tempfile
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import chromedriver_autoinstaller



import_export_bp = Blueprint('import_export_bp', __name__)




#Export PDF route

@import_export_bp.route('/athlete/session/<int:session_id>/export_pdf', methods=['GET'])
@jwt_required()
def export_session_report(session_id):
    try:
        session = TrainingSession.query.get(session_id)
        if not session:
            return jsonify({"message": "Session not found"}), 404

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Add title
        pdf.setFont("Helvetica", 16)
        pdf.drawString(30, height - 40, f"Session Report on {session.start_time.strftime('%Y-%m-%d')}")

        # Add session details
        y = height - 60
        pdf.setFont("Helvetica", 12)
        pdf.drawString(30, y, f"Altitude Avg: {session.altitude_avg}")
        y -= 15
        pdf.drawString(30, y, f"Altitude Max: {session.altitude_max}")
        y -= 15
        pdf.drawString(30, y, f"Altitude Min: {session.altitude_min}")
        y -= 15
        pdf.drawString(30, y, f"Ascent: {session.ascent}")
        y -= 15
        pdf.drawString(30, y, f"Calories: {session.calories}")
        y -= 15
        pdf.drawString(30, y, f"Descent: {session.descent}")
        y -= 15
        pdf.drawString(30, y, f"Distance: {session.distance}")
        y -= 15
        pdf.drawString(30, y, f"Duration: {session.duration}")
        y -= 15
        pdf.drawString(30, y, f"HR Avg: {session.hr_avg}")
        y -= 15
        pdf.drawString(30, y, f"HR Max: {session.hr_max}")
        y -= 15
        pdf.drawString(30, y, f"HR Min: {session.hr_min}")
        y -= 15
        pdf.drawString(30, y, f"Total Distance: {session.total_distance}")

        # Add charts
        def save_chart(data, label, file_name):
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

        altitudes_chart = save_chart(json.loads(session.altitudes), 'Altitude', 'altitudes.png')
        heartrates_chart = save_chart(json.loads(session.heartrates), 'Heart Rate', 'heartrates.png')
        speeds_chart = save_chart(json.loads(session.speeds), 'Speed', 'speeds.png')

        charts = [altitudes_chart, heartrates_chart, speeds_chart]
        y -= 20

        for chart in charts:
            pdf.drawImage(chart, 30, y - 150, width=500, height=100)
            y -= 160

        # Add map
        positions = json.loads(session.positions)
        if positions:
            m = folium.Map(location=positions[0], zoom_start=13, tiles='OpenStreetMap')
            folium.PolyLine(positions, color="blue", weight=2.5, opacity=1).add_to(m)
            folium.Marker(positions[0], popup='Start Point').add_to(m)
            folium.Marker(positions[-1], popup='End Point').add_to(m)

            map_html = m._repr_html_()

            # Save map as PNG image using selenium and chromedriver
            chromedriver_autoinstaller.install()  # Install chromedriver if not installed

            options = Options()
            options.add_argument("--headless")  # Run headless
            options.add_argument("--disable-gpu")  # Disable GPU acceleration
            options.add_argument("--no-sandbox")  # Bypass OS security model
            options.add_argument("--window-size=800,600")
            driver = webdriver.Chrome(options=options)

            temp_map_html = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
            temp_map_html.write(map_html.encode('utf-8'))
            temp_map_html.close()

            driver.get(f'file://{temp_map_html.name}')
            temp_map_png = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            driver.save_screenshot(temp_map_png.name)
            driver.quit()

            map_height = 200  # Adjust map height
            if y - map_height < 0:  # If the map won't fit on the current page
                pdf.showPage()
                y = height - 50  # Reset y position for the new page

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
            "positions": json.loads(session.positions) if session.positions else []
        }

        return jsonify(session_data)
    except Exception as e:
        logging.error(f"Error exporting JSON data: {str(e)}")
        return jsonify({"error": "Error exporting JSON data"}), 500





#Importing CSV and JSON

@import_export_bp.route('/import_session', methods=['POST'])
@jwt_required()
def import_session():
    try:
        file = request.files['file']
        if not file:
            return jsonify({"message": "No file provided"}), 400

        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['json', 'csv']:
            return jsonify({"message": "Unsupported file type"}), 400

        if file_extension == 'json':
            session_data = json.load(file)
        elif file_extension == 'csv':
            df = pd.read_csv(file)
            session_data = df.to_dict(orient='records')[0]  # Assuming single session data per CSV file

        # Assuming session_data is in the correct format
        session = TrainingSession(
            cyclistID=session_data['cyclistID'],
            altitude_avg=session_data['altitude_avg'],
            altitude_max=session_data['altitude_max'],
            altitude_min=session_data['altitude_min'],
            ascent=session_data['ascent'],
            calories=session_data['calories'],
            descent=session_data['descent'],
            distance=session_data['distance'],
            duration=pd.Timedelta(seconds=session_data['duration']),
            heartrates=json.dumps(session_data['heartrates']),
            hr_avg=session_data['hr_avg'],
            hr_max=session_data['hr_max'],
            hr_min=session_data['hr_min'],
            total_distance=session_data['total_distance'],
            positions=json.dumps(session_data['positions']),
            altitudes=json.dumps(session_data['altitudes']),  # Ensure it is dumped to JSON string
            speeds=json.dumps(session_data['speeds']),
            start_time=pd.to_datetime(session_data['start_time'])
        )

        db.session.add(session)
        db.session.commit()

        return jsonify({"message": "Session imported successfully", "sessionID": session.sessionsID}), 201
    except Exception as e:
        logging.error(f"Error importing session data: {str(e)}")
        return jsonify({"error": "Error importing session data"}), 500

