import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/HomePage.css'; // Ensure this path is correct

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartCycling = () => {
    navigate('/login');
  };

  return (
    <div className="homepage-container">
      <div className="start-container">
        <h2>Welcome to CYCLearn</h2>
        <button onClick={handleStartCycling} className="start-button">Start Cycling</button>
      </div>
    </div>
  );
};

export default HomePage;
