// src/Components/Dashboard/Dashboard.js
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TrainingCalendar from './TrainingCalendar';
import PerformanceAnalytics from './PerformanceAnalytics';
import HealthMonitoring from './HealthMonitoring';
import '../../Styles/Dashboard.css';

const Dashboard = ({ role, token }) => {
  if (role !== 'cyclist') {
    return (
      <div className="access-denied">
        <h2>Vanjozi tu si ti</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/calendar" element={<TrainingCalendar token={token} />} />
          <Route path="/performance" element={<PerformanceAnalytics token={token} />} />
          <Route path="/health" element={<HealthMonitoring token={token} />} />
          <Route path="*" element={<Navigate to="/dashboard/calendar" />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
