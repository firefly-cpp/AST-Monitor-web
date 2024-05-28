// src/Components/Dashboard/HillData.js
import React, { useState } from 'react';
import axios from 'axios';

const HillData = ({ token }) => {
  const [file, setFile] = useState(null);
  const [hillData, setHillData] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/data_fetching/hill-data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setHillData(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="hill-data-container">
      <h2>Hill Data</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload and Analyze</button>
      </form>
      {hillData && (
        <div className="hill-data-results">
          <h3>Hill Data Results</h3>
          <p>Number of Hills: {hillData.num_hills}</p>
          <p>Average Altitude of Hills: {hillData.avg_altitude.toFixed(2)} meters</p>
          <p>Average Ascent of Hills: {hillData.avg_ascent.toFixed(2)} meters</p>
          <p>Total Distance of Hills: {hillData.distance_hills.toFixed(2)} km</p>
          <p>Share of Hills: {hillData.hills_share.toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default HillData;
