import React, { useState } from 'react';
import axios from 'axios';
import PasswordRecovery from './PasswordRecovery'; // Import the Password Recovery Component

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

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
    <div>
      {!showRecovery ? (
        <form onSubmit={handleSubmit}>
          <label>
            Username:
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit">Login</button>
          <p onClick={() => setShowRecovery(true)}>Forgot Password?</p>
        </form>
      ) : (
        <PasswordRecovery />
      )}
    </div>
  );
};

export default Login;
