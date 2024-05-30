import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'chart.js/auto';
import 'react-calendar/dist/Calendar.css';
import 'leaflet/dist/leaflet.css';
import '../../Styles/AthleteProfile.css';

// Custom icons
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

const HistoryCalendar = ({ token }) => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { sessionId } = useParams();

    useEffect(() => {
        setError('');
        setLoading(true);

        axios.get('http://localhost:5000/cyclist/sessions', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setSessions(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching sessions:', error);
            setError('Failed to fetch sessions. Please try again later.');
            setLoading(false);
        });
    }, [token]);

    const onDayClick = (value) => {
        const selectedSession = sessions.find(session =>
            new Date(session.start_time).toDateString() === value.toDateString()
        );
        if (selectedSession) {
            navigate(`/dashboard/calendar/${selectedSession.sessionID}`);
        }
    };

    useEffect(() => {
        if (sessionId) {
            setError('');
            setLoading(true);

            axios.get(`http://localhost:5000/cyclist/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                setSelectedSession(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching session details:', error);
                setError('Failed to fetch session details. Please try again later.');
                setLoading(false);
            });
        }
    }, [sessionId, token]);

    if (loading) {
        return <div>Loading sessions...</div>;
    }

    if (error) {
        return <div>{error}</div>;
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
                <h2>Training History</h2>
                <Calendar
                    onClickDay={onDayClick}
                    tileContent={({ date, view }) => (
                        sessions.some(session =>
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

export default HistoryCalendar;
