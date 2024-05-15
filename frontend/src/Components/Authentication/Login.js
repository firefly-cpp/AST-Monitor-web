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
      const { data } = await axios.post('http://localhost:5000/auth/login', {
        username,
        password
      });
      onLogin(data.access_token);
      alert('Login successful');
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
          <p onClick={() => navigate('/register')}>Don't have an account? <a>Register</a></p>
        </form>
      ) : (
        <PasswordRecovery />
      )}
    </div>
  );
};

export default Login;
