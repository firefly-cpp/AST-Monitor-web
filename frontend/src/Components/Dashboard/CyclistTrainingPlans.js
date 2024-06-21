// CyclistTrainingPlans.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/CyclistTrainingPlans.css'; // Import the CSS file

const CyclistTrainingPlans = ({ token }) => {
    const [trainingPlans, setTrainingPlans] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/cyclist/training_plans', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                setTrainingPlans(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the training plans!", error);
            });
    }, [token]);

    const isToday = (date) => {
        const today = new Date();
        const planDate = new Date(date);
        return planDate.toDateString() === today.toDateString();
    };

    const handleStartTraining = (planId) => {
        navigate(`/dashboard/start-training/${planId}`);
    };

    return (
        <div className="training-plans">
            <h2>My Training Plans</h2>
            <div className="training-plans-grid">
                {trainingPlans.map(plan => (
                    <div key={plan.plansID} className="training-plan-card">
                        <h4>{new Date(plan.start_date).toLocaleString()}</h4>
                        <p>{plan.description}</p>
                        <div className="session-details">
                            {plan.sessions.map(session => (
                                <div key={session.sessionID} className="session-info">
                                    <p><strong>Type:</strong> {session.type}</p>
                                    <p><strong>Duration:</strong> {session.duration}</p>
                                    <p><strong>Distance:</strong> {session.distance} km</p>
                                    <p><strong>Intensity:</strong> {session.intensity}</p>
                                    <p><strong>Notes:</strong> {session.notes}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            className="start-training-button"
                            onClick={() => handleStartTraining(plan.plansID)}
                            disabled={!isToday(plan.start_date)}
                            style={{
                                backgroundColor: isToday(plan.start_date) ? '#4CAF50' : '#ccc',
                                cursor: isToday(plan.start_date) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Start Training
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CyclistTrainingPlans;
