import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import HealthMonitoring from './HealthMonitoring';
import AthleteOverview from './Coach/AthleteOverview';
import HistoryCalendar from "./HistoryCalendar";
import CreateTrainingPlan from "./Coach/CreateTrainingPlan";
import ImportPreview from "./Coach/ImportPreview";
import CyclistTrainingPlans from "./CyclistTrainingPlans";
import StartTrainingSession from "./StartTrainingSession";
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
                            <Route path="/athlete/:id" element={<HistoryCalendar token={token} role={role} />} />
                            <Route path="/athlete/:id/session/:sessionId" element={<HistoryCalendar token={token} role={role} />} />
                            <Route path="/create-plan" element={<CreateTrainingPlan token={token} />} />
                            <Route path="/import-preview" element={<ImportPreview token={token} />} />
                            <Route path="*" element={<Navigate to="/overview" />} />
                        </>
                    ) : (
                        <>
                            <Route path="/calendar" element={<HistoryCalendar token={token} role={role} />} />
                            <Route path="/calendar/:sessionId" element={<HistoryCalendar token={token} role={role} />} />
                            <Route path="/health" element={<HealthMonitoring token={token} />} />
                            <Route path="/training-plans" element={<CyclistTrainingPlans token={token} />} />
                            <Route path="/start-training/:planId" element={<StartTrainingSession token={token} />} />
                            <Route path="/import-preview" element={<ImportPreview token={token} />} />
                            <Route path="*" element={<Navigate to="/calendar" />} />
                        </>
                    )}
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
