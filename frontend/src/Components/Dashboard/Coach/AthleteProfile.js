import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'chart.js/auto';
import 'react-calendar/dist/Calendar.css';  // Import the Calendar CSS
import 'leaflet/dist/leaflet.css'; // Leaflet CSS
import '../../../Styles/AthleteProfile.css'; // Import the CSS file for styling

// Custom icons
const startIcon = new L.Icon({
    iconUrl: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png', // Replace with the path to your custom start icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/map-marker-512.png', // Replace with the path to your custom end icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const AthleteProfile = ({ token }) => {
    const { id } = useParams();
    const [athleteData, setAthleteData] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setError('');
        setLoading(true);

        axios.get(`http://localhost:5000/coach/athlete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            console.log('Athlete Data:', response.data); // Debug log
            setAthleteData(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching athlete data:', error);
            setError('Failed to fetch athlete data. Please try again later.');
            setLoading(false);
        });
    }, [id, token]);

    const onDayClick = (value) => {
        const selected = athleteData.sessions.find(session =>
            new Date(session.start_time).toDateString() === value.toDateString()
        );
        setSelectedSession(selected);
    };

    if (loading) {
        return <div>Loading athlete profile...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!athleteData || athleteData.sessions.length === 0) {
        return <div>No session data available for this athlete.</div>;
    }

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

    return (
        <div className="athlete-profile-container">
            <div className="athlete-profile">
                <h2>{athleteData.username}'s Profile</h2>
                <Calendar
                    onChange={onDayClick}
                    value={new Date()}
                    tileContent={({ date, view }) => (
                        athleteData.sessions.some(session =>
                            new Date(session.start_time).toDateString() === date.toDateString()) && <p>🔵</p>
                    )}
                />

                {selectedSession && (
                    <div>
                        <h3>Session Details on {new Date(selectedSession.start_time).toLocaleDateString()}</h3>
                        <p>Altitude Avg: {selectedSession.altitude_avg}</p>
                        <p>Altitude Max: {selectedSession.altitude_max}</p>
                        <p>Altitude Min: {selectedSession.altitude_min}</p>
                        <p>Ascent: {selectedSession.ascent}</p>
                        <p>Calories: {selectedSession.calories}</p>
                        <p>Descent: {selectedSession.descent}</p>
                        <p>Distance: {selectedSession.distance}</p>
                        <p>Duration: {selectedSession.duration} seconds</p>
                        <p>HR Avg: {selectedSession.hr_avg}</p>
                        <p>HR Max: {selectedSession.hr_max}</p>
                        <p>HR Min: {selectedSession.hr_min}</p>
                        <p>Total Distance: {selectedSession.total_distance}</p>
                        <div className="chart-container">
                            <h4>Altitude Over Time</h4>
                            <Line data={formatChartData(selectedSession.altitudes, 'Altitude')} />
                            <h4>Heart Rate Over Time</h4>
                            <Line data={formatChartData(selectedSession.heartrates, 'Heart Rate')} />
                            <h4>Speed Over Time</h4>
                            <Line data={formatChartData(selectedSession.speeds, 'Speed')} />
                        </div>
                        {selectedSession.positions && selectedSession.positions.length > 0 && (
                            <div className="map-container">
                                <MapContainer center={selectedSession.positions[0]} zoom={13} style={{ height: 400, width: "100%" }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Polyline
                                        positions={selectedSession.positions}
                                        color="blue"
                                    />
                                    <Marker position={selectedSession.positions[0]} icon={startIcon}>
                                        <Popup>Start Point</Popup>
                                    </Marker>
                                    <Marker position={selectedSession.positions[selectedSession.positions.length - 1]} icon={endIcon}>
                                        <Popup>End Point</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AthleteProfile;