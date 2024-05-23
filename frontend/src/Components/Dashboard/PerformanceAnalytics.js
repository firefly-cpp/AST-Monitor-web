// src/Components/Dashboard/PerformanceAnalytics.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../../Styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PerformanceAnalytics = ({ token }) => {
  const [tcxData, setTcxData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/data_fetching/tcx-data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTcxData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
      }
    };

    fetchData();
  }, [token]);

  const speedData = {
    labels: tcxData.timestamps || [],
    datasets: [
      {
        label: 'Speed (km/h)',
        data: tcxData.speeds || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  const heartRateData = {
    labels: tcxData.timestamps || [],
    datasets: [
      {
        label: 'Heart Rate (bpm)',
        data: tcxData.heartrates || [],
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="performance-analytics">
      <h2>Performance Analytics</h2>
      <div className="chart-container">
        <div className="chart-wrapper">
          <h3>Speed Over Time</h3>
          <Line data={speedData} />
        </div>
        <div className="chart-wrapper">
          <h3>Heart Rate Over Time</h3>
          <Line data={heartRateData} />
        </div>
      </div>
      <div className="analytics-details">
        <p>Total distance: {tcxData.total_distance || 'Loading...'} km</p>
        <p>Total ascent: {tcxData.total_ascent || 'Loading...'} meters</p>
        <p>Total descent: {tcxData.total_descent || 'Loading...'} meters</p>
        <p>Average speed: {tcxData.average_speed || 'Loading...'} km/h</p>
        <p>Average heart rate: {tcxData.average_heart_rate || 'Loading...'} bpm</p>
        <p>Calories burned: {tcxData.calories_burned || 'Loading...'} kcal</p>
        <p>Power output: {tcxData.power_output || 'Loading...'} watts</p>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
