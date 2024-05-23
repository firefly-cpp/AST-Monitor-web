// Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../Styles/Dashboard.css'; // Ensure to include the CSS file

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Dashboard</h2>
      <ul>
        <li>
          <NavLink to="/dashboard/calendar">Training Calendar</NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/performance">Performance Analytics</NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health">Health Monitoring</NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
