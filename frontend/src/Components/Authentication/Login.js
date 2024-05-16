import React, { useState } from 'react';
import axios from 'axios';
import PasswordRecovery from './PasswordRecovery';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Auth.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        username,
        password
      });
      // Store the token in localStorage
      localStorage.setItem('token', response.data.access_token);
      // Call the onLogin function to update the app's state
      onLogin(response.data.access_token);
      alert('Login successful');
      navigate('/dashboard'); // Optionally redirect the user to the dashboard
    } catch (error) {
      alert('Login failed: ' + error.response.data.msg);
    }
  };

  return (
    <div className="auth-container">
      {!showRecovery ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Login</h2>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />

          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit">Login</button>
          <p onClick={() => setShowRecovery(true)}>Forgot Password?</p>
          <p onClick={() => navigate('/register')}>Don't have an account? <a href="/register">Register</a></p>
        </form>
      ) : (
        <PasswordRecovery />
      )}
    </div>
  );
};

export default Login;
