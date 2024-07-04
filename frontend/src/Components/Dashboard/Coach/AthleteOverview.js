import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../../Styles/AthleteOverview.css'; // Import the CSS file

const AthleteOverview = ({ token }) => {
  const [athletes, setAthletes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setLoading(true);

    axios.get('http://localhost:5000/coach/athletes', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setAthletes(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching athletes:', error);
      setError('Failed to fetch athletes. Please try again later.');
      setLoading(false);
    });
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB').replace(/\//g, '.'); // Convert to DD.MM.YYYY format
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h} hours ${m} minutes ${s} seconds`;
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2) + ' km'; // Convert meters to kilometers
  };

  if (loading) {
    return <div>Loading athletes...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="athlete-overview">
      <h2>Cyclist Overview</h2>
      {athletes.length > 0 ? (
        <div className="athlete-grid">
          {athletes.map(athlete => (
            <div key={athlete.cyclistID} onClick={() => navigate(`/dashboard/athlete/${athlete.cyclistID}`)} className="athlete-container">
              <strong>{athlete.username}</strong>
              {athlete.last_session ? (
                <div>
                  <p>Last session date: {formatDate(athlete.last_session.time.split('T')[0])}</p>
                  <p>Time of the session: {formatTime(athlete.last_session.time.split('T')[1])}</p>
                  <p>Calories burned: {athlete.last_session.calories} kcal</p>
                  <p>Duration: {formatDuration(athlete.last_session.duration)}</p>
                  <p>Total Distance: {formatDistance(athlete.last_session.total_distance)}</p>
                </div>
              ) : (
                <p>No sessions yet</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>No athletes found.</div>
      )}
    </div>
  );
};

export default AthleteOverview;
