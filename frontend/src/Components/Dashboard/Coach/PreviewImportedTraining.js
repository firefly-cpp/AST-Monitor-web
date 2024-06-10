import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'chart.js/auto';
import 'leaflet/dist/leaflet.css';
import '../../../Styles/AthleteProfile.css';

const startIcon = new L.Icon({
    iconUrl: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const PreviewImportedTraining = () => {
    const [importedSession, setImportedSession] = useState(null);
    const [error, setError] = useState('');

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.error('No file selected');
            return;
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const sessionData = JSON.parse(e.target.result);
                    setImportedSession(sessionData);
                    console.log('Imported Session:', sessionData);
                } catch (err) {
                    console.error('Error reading file:', err);
                    setError('Error reading JSON file');
                }
            };
            reader.readAsText(file);
        } else {
            console.error('Unsupported file type');
            setError('Unsupported file type');
        }
    };

    const formatChartData = (data, label) => ({
        labels: data.map((_, index) => index),
        datasets: [{
            label: label,
            data: data,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
        }],
    });

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="import-preview-container">
            <h2>Import and Preview Training Session</h2>
            <input type="file" onChange={handleFileUpload} />
            {importedSession && (
                <div className="session-details">
                    <h3>Session Details on {new Date(importedSession.start_time).toLocaleDateString()}</h3>
                    <p>Altitude Avg: {importedSession.altitude_avg}</p>
                    <p>Altitude Max: {importedSession.altitude_max}</p>
                    <p>Altitude Min: {importedSession.altitude_min}</p>
                    <p>Ascent: {importedSession.ascent}</p>
                    <p>Calories: {importedSession.calories}</p>
                    <p>Descent: {importedSession.descent}</p>
                    <p>Distance: {importedSession.distance}</p>
                    <p>Duration: {importedSession.duration} seconds</p>
                    <p>HR Avg: {importedSession.hr_avg}</p>
                    <p>HR Max: {importedSession.hr_max}</p>
                    <p>HR Min: {importedSession.hr_min}</p>
                    <p>Total Distance: {importedSession.total_distance}</p>
                    <div className="chart-container">
                        <h4>Altitude Over Time</h4>
                        <Line data={formatChartData(importedSession.altitudes, 'Altitude')} />
                        <h4>Heart Rate Over Time</h4>
                        <Line data={formatChartData(importedSession.heartrates, 'Heart Rate')} />
                        <h4>Speed Over Time</h4>
                        <Line data={formatChartData(importedSession.speeds, 'Speed')} />
                    </div>
                    {importedSession.positions && importedSession.positions.length > 0 && (
                        <div className="map-container">
                            <MapContainer center={importedSession.positions[0]} zoom={13} style={{ height: 400, width: "100%" }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Polyline
                                    positions={importedSession.positions}
                                    color="blue"
                                />
                                <Marker position={importedSession.positions[0]} icon={startIcon}>
                                    <Popup>Start Point</Popup>
                                </Marker>
                                <Marker position={importedSession.positions[importedSession.positions.length - 1]} icon={endIcon}>
                                    <Popup>End Point</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PreviewImportedTraining;
