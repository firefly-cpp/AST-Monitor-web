// StartTrainingSession.js
import React from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../../Styles/StartTrainingSession.css'; // Import the CSS file

const StartTrainingSession = ({ token }) => {
    const { planId } = useParams();
    const navigate = useNavigate();

    const handleEndWorkout = () => {
        axios.post(`http://localhost:5000/cyclist/training_plans/${planId}/execute`, {}, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                alert('Workout completed successfully!');
                navigate('/dashboard/calendar');
            })
            .catch(error => {
                console.error("There was an error completing the workout!", error);
            });
    };

    return (
        <div className="start-training-session">
            <h2>Training Session</h2>
            <div className="sensor-container">
                {/* The code for the wearable sensor simulation will be integrated here */}
            </div>
            <button className="end-workout-button" onClick={handleEndWorkout}>
                End Workout
            </button>
        </div>
    );
};

export default StartTrainingSession;