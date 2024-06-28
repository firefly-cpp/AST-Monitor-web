import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'chart.js/auto';
import 'react-calendar/dist/Calendar.css';
import 'leaflet/dist/leaflet.css';
import '../../Styles/AthleteProfile.css';

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

const HistoryCalendar = ({ token, role }) => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { sessionId, id: cyclistId } = useParams();

    useEffect(() => {
        setError('');
        setLoading(true);

        const url = role === 'coach'
            ? `http://localhost:5000/cyclist/sessions?cyclist_id=${cyclistId}`
            : 'http://localhost:5000/cyclist/sessions';

        axios.get(url, {
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
    }, [token, role, cyclistId]);

    const onDayClick = (value) => {
        const selectedSession = sessions.find(session =>
            new Date(session.start_time).toDateString() === value.toDateString()
        );
        if (selectedSession) {
            if (role === 'coach') {
                navigate(`/dashboard/athlete/${cyclistId}/session/${selectedSession.sessionID}`);
            } else {
                navigate(`/dashboard/calendar/${selectedSession.sessionID}`);
            }
        }
    };

    useEffect(() => {
        if (sessionId) {
            setError('');
            setLoading(true);

            const url = role === 'coach'
                ? `http://localhost:5000/cyclist/session/${sessionId}?cyclist_id=${cyclistId}`
                : `http://localhost:5000/cyclist/session/${sessionId}`;

            axios.get(url, {
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
    }, [sessionId, token, role, cyclistId]);

    if (loading) {
        return <div>Loading sessions...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const formatChartData = (data, label) => ({
        labels: data ? data.map((_, index) => index) : [],
        datasets: [{
            label: label,
            data: data ? data.map(value => (value !== null && value !== undefined) ? parseFloat(value.toFixed(2)) : value) : [],
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
        }],
    });

    const getHillData = () => {
        if (!selectedSession || !selectedSession.hill_data) {
            return { labels: [], datasets: [] };
        }
        const { num_hills, avg_altitude, avg_ascent, distance_hills, hills_share } = selectedSession.hill_data;
        return {
            labels: ['Number of Hills', 'Avg Altitude (m)', 'Avg Ascent (m)', 'Distance Hills (km)', 'Hills Share (%)'],
            datasets: [
                {
                    label: 'Hill Data',
                    data: [
                        num_hills,
                        avg_altitude,
                        avg_ascent,
                        distance_hills,
                        hills_share * 100,
                    ],
                    backgroundColor: [
                        'rgba(75,192,192,0.6)',
                        'rgba(75,75,192,0.6)',
                        'rgba(192,75,75,0.6)',
                        'rgba(75,192,75,0.6)',
                        'rgba(192,192,75,0.6)',
                    ],
                    borderWidth: 1
                },
            ],
        };
    };

    const generatePDFReport = (selectedSession, token) => {
        if (!selectedSession) {
            console.error('No session selected');
            return;
        }

        axios.get(`http://localhost:5000/import_export/athlete/session/${selectedSession.sessionsID}/export_pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
        })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `session_report_${new Date(selectedSession.start_time).toLocaleDateString()}.pdf`);
            document.body.appendChild(link);
            link.click();
        })
        .catch(error => {
            console.error('Error generating PDF report:', error);
        });
    };

    const exportSessionData = (format) => {
        if (!selectedSession) {
            console.error('No session selected');
            return;
        }

        const url = `http://localhost:5000/import_export/athlete/session/${selectedSession.sessionsID}/export_${format}`;
        axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
        })
        .then(response => {
            const blob = new Blob([response.data], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', `session_${new Date(selectedSession.start_time).toLocaleDateString()}.json`);
            document.body.appendChild(link);
            link.click();
        })
        .catch(error => {
            console.error(`Error exporting ${format} data:`, error);
        });
    };

    return (
       <div className="athlete-profile-container">
    <div className="athlete-profile">
        <h2>Training History</h2>
        <p>Track your training sessions and analyze your performance with detailed data and charts.</p>
        <Calendar
            onClickDay={onDayClick}
            tileContent={({ date, view }) => (
                sessions.some(session =>
                    new Date(session.start_time).toDateString() === date.toDateString()) && <p>🔵</p>
            )}
            className="react-calendar"
        />

                {selectedSession && (
                    <div>
                        <div className="main-container session-details-container">
                            <h3>Session Details</h3>
                            <p>Details of your training session on {new Date(selectedSession.start_time).toLocaleDateString()}</p>
                            <div className="session-cards">
                                <div className="card">
                                    <h4>Altitude Avg</h4>
                                    <p>{parseFloat(selectedSession.altitude_avg).toFixed(2)} m</p>
                                </div>
                                <div className="card">
                                    <h4>Altitude Max</h4>
                                    <p>{parseFloat(selectedSession.altitude_max).toFixed(2)} m</p>
                                </div>
                                <div className="card">
                                    <h4>Altitude Min</h4>
                                    <p>{parseFloat(                                    selectedSession.altitude_min).toFixed(2)} m</p>
                                </div>
                                <div className="card">
                                    <h4>Ascent</h4>
                                    <p>{parseFloat(selectedSession.ascent).toFixed(2)} m</p>
                                </div>
                                <div className="card">
                                    <h4>Calories</h4>
                                    <p>{parseFloat(selectedSession.calories).toFixed(2)} kcal</p>
                                </div>
                                <div className="card">
                                    <h4>Descent</h4>
                                    <p>{parseFloat(selectedSession.descent).toFixed(2)} m</p>
                                </div>
                                <div className="card">
                                    <h4>Distance</h4>
                                    <p>{parseFloat(selectedSession.distance).toFixed(2)} km</p>
                                </div>
                                <div className="card">
                                    <h4>Duration</h4>
                                    <p>{parseFloat(selectedSession.duration).toFixed(2)} seconds</p>
                                </div>
                                <div className="card">
                                    <h4>HR Avg</h4>
                                    <p>{parseFloat(selectedSession.hr_avg).toFixed(2)} bpm</p>
                                </div>
                                <div className="card">
                                    <h4>HR Max</h4>
                                    <p>{parseFloat(selectedSession.hr_max).toFixed(2)} bpm</p>
                                </div>
                                <div className="card">
                                    <h4>HR Min</h4>
                                    <p>{parseFloat(selectedSession.hr_min).toFixed(2)} bpm</p>
                                </div>
                                <div className="card">
                                    <h4>Total Distance</h4>
                                    <p>{parseFloat(selectedSession.total_distance).toFixed(2)} km</p>
                                </div>
                            </div>
                        </div>

                        {selectedSession.weather && (
                            <div className="main-container weather-details-container">
                                <h3>Weather Data</h3>
                                <p>Weather conditions during your session:</p>
                                <div className="weather-card">
                                    <p><strong>Temperature:</strong> {selectedSession.weather.temp_c !== null ? `${parseFloat(selectedSession.weather.temp_c).toFixed(2)}°C` : 'N/A'}</p>
                                    <p><strong>Apparent Temperature:</strong> {selectedSession.weather.apparent_temp_c !== null ? `${parseFloat(selectedSession.weather.apparent_temp_c).toFixed(2)}°C` : 'N/A'}</p>
                                    <p><strong>Wind Speed:</strong> {selectedSession.weather.wind_kph !== null ? `${parseFloat(selectedSession.weather.wind_kph).toFixed(2)} kph` : 'N/A'}</p>
                                    <p><strong>Humidity:</strong> {selectedSession.weather.humidity !== null ? `${parseFloat(selectedSession.weather.humidity).toFixed(2)}%` : 'N/A'}</p>
                                    <p><strong>Precipitation:</strong> {selectedSession.weather.precipitation !== null ? `${parseFloat(selectedSession.weather.precipitation).toFixed(2)} mm` : 'N/A'}</p>
                                    <p><strong>Rain:</strong> {selectedSession.weather.rain !== null ? `${parseFloat(selectedSession.weather.rain).toFixed(2)} mm` : 'N/A'}</p>
                                    <p><strong>Cloud Cover:</strong> {selectedSession.weather.cloud_cover !== null ? `${parseFloat(selectedSession.weather.cloud_cover).toFixed(2)}%` : 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        {selectedSession.positions && selectedSession.positions.length > 0 && (
                            <div className="main-container map-container">
                                <h3>Route Map</h3>
                                <p>View the route you took during your training session:</p>
                                <MapContainer center={selectedSession.positions[0]} zoom={13} style={{ height: "80%", width: "100%" }}>
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
                        
                        <div className="chart-row">
                            <div className="chart-container">
                                <h4>Hill Data</h4>
                                <p>Analysis of hills encountered during the session:</p>
                                <Doughnut data={getHillData()} options={{ plugins: { legend: { display: true }}}} />
                            </div>
                            <div className="chart-container">
                                <h4>Hills Share</h4>
                                <p>Percentage of session spent on hills vs flat terrain:</p>
                                {selectedSession.hill_data && (
                                    <Pie data={{
                                        labels: ['Hills', 'Flat'],
                                        datasets: [{
                                            data: [selectedSession.hill_data.hills_share * 100, 100 - selectedSession.hill_data.hills_share * 100],
                                            backgroundColor: ['rgba(75,192,192,0.6)', 'rgba(192,75,75,0.6)'],
                                        }]
                                    }} options={{ plugins: { legend: { display: true }}}} />
                                )}
                            </div>
                        </div>
                        <div className="chart-container">
                            <h4>Altitude Over Time</h4>
                            <p>Track the change in altitude throughout the session:</p>
                            <Line data={formatChartData(selectedSession.altitudes, 'Altitude')} options={{ plugins: { legend: { display: true }}}} />
                        </div>
                        <div className="chart-container">
                            <h4>Heart Rate Over Time</h4>
                            <p>Monitor your heart rate throughout the session:</p>
                            <Line data={formatChartData(selectedSession.heartrates, 'Heart Rate')} options={{ plugins: { legend: { display: true }}}} />
                        </div>
                        <div className="chart-container">
                            <h4>Speed Over Time</h4>
                            <p>Track your speed throughout the session:</p>
                            <Line data={formatChartData(selectedSession.speeds, 'Speed')} options={{ plugins: { legend: { display: true }}}} />
                        </div>
                        <div className="button-container">
                            <button className="generate-pdf-button" onClick={() => generatePDFReport(selectedSession, token)}>
                                Generate PDF Report
                            </button>
                            <button className="generate-pdf-button" onClick={() => exportSessionData('json')}>
                                Export to JSON
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryCalendar;

