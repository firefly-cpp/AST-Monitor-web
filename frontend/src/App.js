import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Authentication/Login';
import Register from './Components/Authentication/Register';
import Dashboard from './Components/Dashboard/Dashboard';
import ResetPassword from './Components/Authentication/ResetPassword';
import HomePage from './Components/HomePage';
import Navbar from './Components/Navbar/Navbar';
import UserProfile from './Components/Authentication/UserProfile';
import EditProfile from './Components/Authentication/EditProfile';
import PasswordRecovery from './Components/Authentication/PasswordRecovery';
import './App.css';
import BackgroundImage from './Components/BackgroundImage/BackgroundImage'; // Import the BackgroundImage component

const App = () => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || ''
  });

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setAuth({ token, role });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ token: '', role: '' });
  };

  return (
    <BrowserRouter>
      <div>
        <BackgroundImage /> {/* Render the BackgroundImage component */}
        <Navbar isLoggedIn={!!auth.token} handleLogout={handleLogout} />
        <Routes>
          {!auth.token ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onRegister={handleLogin} />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/recover" element={<PasswordRecovery />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/dashboard/*" element={<Dashboard role={auth.role} token={auth.token} />} />
              <Route path="*" element={<Navigate to={auth.role === 'coach' ? "/dashboard/overview" : "/dashboard/calendar"} />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
