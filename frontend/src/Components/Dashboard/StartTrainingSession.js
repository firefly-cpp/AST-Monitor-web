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

    const saveTrainingData = async () => {
        try {
            const response = await axios.post('http://localhost:5000/sensor/api/save-training-data', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Training data saved:', response.data);
        } catch (error) {
            console.error('Error saving training data:', error);
        }
    };

    const handleEndWorkoutAndSaveData = async () => {
        await saveTrainingData();
        handleEndWorkout();
    };

    return (
        <div className="start-training-session">
            <h2>Training Session</h2>
            <div className="sensor-container">
                <iframe
                    src="http://localhost:5173/"
                    width="100%"
                    height="600px"
                    title="Wearable Sensor Simulation"
                    frameBorder="0"
                    allowFullScreen
                ></iframe>
            </div>
            <button className="end-workout-button" onClick={handleEndWorkoutAndSaveData}>
                End Workout
            </button>
        </div>
    );
};

export default StartTrainingSession;
