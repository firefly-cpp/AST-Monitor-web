// src/Components/Dashboard/Dashboard.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TrainingCalendar from './TrainingCalendar';
import PerformanceAnalytics from './PerformanceAnalytics';
import HealthMonitoring from './HealthMonitoring';
import CoachDashboard from './Coach/CoachDashboard';
import AthleteOverview from './Coach/AthleteOverview';
import AthleteProfile from './Coach/AthleteProfile';
import '../../Styles/Dashboard.css';

const Dashboard = ({ role, token }) => {
  return (
    <div className="dashboard">
      <Sidebar role={role} />
      <div className="content">
        <Routes>
          {role === 'coach' ? (
            <>
              <Route path="/overview" element={<AthleteOverview token={token} />} />
              <Route path="/athlete/:id" element={<AthleteProfile token={token} />} />
              <Route path="*" element={<Navigate to="/overview" />} />
            </>
          ) : (
            <>
              <Route path="/calendar" element={<TrainingCalendar token={token} />} />
              <Route path="/performance" element={<PerformanceAnalytics token={token} />} />
              <Route path="/health" element={<HealthMonitoring token={token} />} />
              <Route path="*" element={<Navigate to="/calendar" />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
