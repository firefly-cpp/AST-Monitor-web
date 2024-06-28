// src/Components/Authentication/PasswordRecovery.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Auth.css'; // Ensure this path is correct

const PasswordRecovery = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/recover', { email });
      alert('If that email address is in our database, we will send you an email to reset your password.');
      navigate('/login');  // Redirect to login after request
    } catch (error) {
      alert('Error: ' + (error.response.data.msg || 'Failed to send recovery email.'));
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleRequestReset} className="auth-form">
        <h2>Password Recovery</h2>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Request Password Reset</button>
      </form>
    </div>
  );
};

export default PasswordRecovery;
