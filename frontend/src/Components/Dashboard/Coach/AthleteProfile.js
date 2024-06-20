import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'chart.js/auto';
import 'react-calendar/dist/Calendar.css';
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
            console.log('Athlete Data:', response.data);
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
        console.log('Selected Session:', selected); // Debug log
    };

    const generatePDFReport = (selectedSession, token) => {
        if (!selectedSession) {
            console.error('No session selected');
            return;
        }

        console.log('Generating PDF for Session ID:', selectedSession.sessionsID); // Debug log

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

    if (loading) {
        return <div>Loading athlete profile...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!athleteData || athleteData.sessions.length === 0) {
        return <div>No session data available for this athlete.</div>;
    }

    return (
        <div className="athlete-profile-container">
            <div className="athlete-profile">
                <h2>{athleteData.username}'s training history calendar</h2>
                <p>Blue dot under a day's number on the calendar represents that there was a training on that day</p>
                <Calendar
                    onChange={onDayClick}
                    value={new Date()}
                    tileContent={({ date, view }) => (
                        athleteData.sessions.some(session =>
                            new Date(session.start_time).toDateString() === date.toDateString()) && <p>🔵</p>
                    )}
                />

                {selectedSession && (
                    <div className="session-details-table">
                        <h3>Session Details on {new Date(selectedSession.start_time).toLocaleDateString()}</h3>
                        <table>
                            <tbody>
                            <tr>
                                <td>Altitude Avg:</td>
                                <td>{selectedSession.altitude_avg}</td>
                            </tr>
                            <tr>
                                <td>Altitude Max:</td>
                                <td>{selectedSession.altitude_max}</td>
                            </tr>
                            <tr>
                                <td>Altitude Min:</td>
                                <td>{selectedSession.altitude_min}</td>
                            </tr>
                            <tr>
                                <td>Ascent:</td>
                                <td>{selectedSession.ascent}</td>
                            </tr>
                            <tr>
                                <td>Calories:</td>
                                <td>{selectedSession.calories}</td>
                            </tr>
                            <tr>
                                <td>Descent:</td>
                                <td>{selectedSession.descent}</td>
                            </tr>
                            <tr>
                                <td>Distance:</td>
                                <td>{selectedSession.distance}</td>
                            </tr>
                            <tr>
                                <td>Duration:</td>
                                <td>{selectedSession.duration} seconds</td>
                            </tr>
                            <tr>
                                <td>HR Avg:</td>
                                <td>{selectedSession.hr_avg}</td>
                            </tr>
                            <tr>
                                <td>HR Max:</td>
                                <td>{selectedSession.hr_max}</td>
                            </tr>
                            <tr>
                                <td>HR Min:</td>
                                <td>{selectedSession.hr_min}</td>
                            </tr>
                            <tr>
                                <td>Total Distance:</td>
                                <td>{selectedSession.total_distance}</td>
                            </tr>
                            </tbody>
                        </table>
                        <div className="chart-container">
                            <h4>Altitude Over Time</h4>
                            <Line data={formatChartData(selectedSession.altitudes, 'Altitude')}/>
                            <h4>Heart Rate Over Time</h4>
                            <Line data={formatChartData(selectedSession.heartrates, 'Heart Rate')}/>
                            <h4>Speed Over Time</h4>
                            <Line data={formatChartData(selectedSession.speeds, 'Speed')}/>
                        </div>
                        {selectedSession.positions && selectedSession.positions.length > 0 && (
                            <div className="map-container">
                                <MapContainer center={selectedSession.positions[0]} zoom={13}
                                              style={{height: "100%", width: "100%"}}>
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
                                    <Marker position={selectedSession.positions[selectedSession.positions.length - 1]}
                                            icon={endIcon}>
                                        <Popup>End Point</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        )}
                        <div className="button-container">
                            <button className="generate-pdf-button"
                                    onClick={() => generatePDFReport(selectedSession, token)}>
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

export default AthleteProfile;
