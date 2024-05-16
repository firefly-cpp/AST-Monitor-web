// App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/Authentication/Login';
import Register from './Components/Authentication/Register';
import Dashboard from './Components/Dashboard/Dashboard';
import ResetPassword from './Components/Authentication/ResetPassword';
import HomePage from './Components/HomePage';

const App = () => {
  // Store both token and role in a single state object
  const [auth, setAuth] = useState({ token: '', role: '' });

  // Update handleLogin to take both token and role
  const handleLogin = (token, role) => {
    setAuth({ token, role });
  };

  return (
    <BrowserRouter>
      <div>
        {!auth.token ? (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={(token, role) => handleLogin(token, role)} />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          // Pass the role to the Dashboard component
          <Dashboard role={auth.role} />
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
