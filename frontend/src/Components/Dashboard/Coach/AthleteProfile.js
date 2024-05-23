import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import '../../../Styles/AthleteProfile.css'; // Import the CSS file

const AthleteProfile = ({ token }) => {
  const { id } = useParams();
  const [athleteData, setAthleteData] = useState(null);
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
    datasets: [
      {
        label: label,
        data: data,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  });

  const latestSession = athleteData.sessions[0];

  return (
    <div className="athlete-profile-container">
      <div className="athlete-profile">
        <h2>{athleteData.username}'s Profile</h2>
        <p>Altitude Avg: {latestSession.altitude_avg}</p>
        <p>Altitude Max: {latestSession.altitude_max}</p>
        <p>Altitude Min: {latestSession.altitude_min}</p>
        <p>Ascent: {latestSession.ascent}</p>
        <p>Calories: {latestSession.calories}</p>
        <p>Descent: {latestSession.descent}</p>
        <p>Distance: {latestSession.distance}</p>
        <p>Duration: {latestSession.duration} seconds</p>
        <p>HR Avg: {latestSession.hr_avg}</p>
        <p>HR Max: {latestSession.hr_max}</p>
        <p>HR Min: {latestSession.hr_min}</p>
        <p>Total Distance: {latestSession.total_distance}</p>

        <div className="chart-container">
          <h3>Altitude Over Time</h3>
          <Line data={formatChartData(latestSession.altitudes, 'Altitude')} />
        </div>

        <div className="chart-container">
          <h3>Heart Rates Over Time</h3>
          <Line data={formatChartData(latestSession.heartrates, 'Heart Rate')} />
        </div>

        <div className="chart-container">
          <h3>Speeds Over Time</h3>
          <Line data={formatChartData(latestSession.speeds, 'Speed')} />
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
