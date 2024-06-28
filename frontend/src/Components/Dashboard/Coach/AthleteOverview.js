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

  if (loading) {
    return <div>Loading athletes...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="athlete-overview">
      <h2>Athlete Overview</h2>
      {athletes.length > 0 ? (
        <div className="athlete-grid">
          {athletes.map(athlete => (
            <div key={athlete.cyclistID} onClick={() => navigate(`/dashboard/athlete/${athlete.cyclistID}`)} className="athlete-container">
              <strong>{athlete.username}</strong>
              {athlete.last_session ? (
                <div>
                  <p>Last session date: {athlete.last_session.time.split('T')[0]}</p>
                  <p>Time of the session: {athlete.last_session.time.split('T')[1]}</p>
                  <p>Calories burned: {athlete.last_session.calories}</p>
                  <p>Duration: {athlete.last_session.duration} seconds</p>
                  <p>Total Distance: {athlete.last_session.total_distance} m</p>
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
