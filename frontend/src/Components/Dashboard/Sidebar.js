import React from 'react';
import {NavLink} from 'react-router-dom';
import '../../Styles/Dashboard.css';

const Sidebar = ({role}) => {
    return (
        <div className="sidebar">
            <h2>Dashboard</h2>
            <ul>
                {role === 'coach' ? (
                    <li>
                        <NavLink to="/dashboard/coach/overview">Athlete Overview</NavLink>
                    </li>
                ) : (
                    <>
                        <li>
                            <NavLink to="/dashboard/performance">Performance Analytics</NavLink>
                        </li>
                        <li>
                            <NavLink to="/dashboard/history">Training History</NavLink>
                        </li>
                        <li>
                            <NavLink to="/dashboard/health">Health Monitoring</NavLink>
                        </li>
                        
                    </>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
