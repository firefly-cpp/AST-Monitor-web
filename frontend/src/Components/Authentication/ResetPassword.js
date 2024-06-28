// src/Components/Authentication/ResetPassword.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../Styles/Auth.css'; // Ensure this path is correct

const PasswordReset = () => {
  const { token } = useParams(); // Get the token from the URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match.");
      return;
    }
    try {
      await axios.post(`http://localhost:5000/auth/reset/${token}`, {
        password
      });
      alert('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      alert('Failed to reset password: ' + (error.response.data.msg || 'Unknown error'));
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Reset Password</h2>
        <label>New Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <label>Confirm New Password:</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default PasswordReset;
