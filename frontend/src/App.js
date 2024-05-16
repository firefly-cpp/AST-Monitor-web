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

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  return (
    <BrowserRouter>
      <div>
        {token && <Navbar isLoggedIn={!!token} handleLogout={handleLogout} />}
        <Routes>
          {!token ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onRegister={handleLogin} />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
