import React, { useState } from 'react';
import axios from 'axios';

const PasswordRecovery = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState('request'); // 'request' or 'reset'

  const handleRequestReset = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/recover', { email });
      setStage('reset');
      alert('If that email address is in our database, we will send you an email to reset your password.');
    } catch (error) {
      alert('Error: ' + error.response.data.msg);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/reset', { token, password });
      alert('Your password has been successfully reset.');
    } catch (error) {
      alert('Error: ' + error.response.data.msg);
    }
  };

  return (
    <div>
      {stage === 'request' ? (
        <form onSubmit={handleRequestReset}>
          <label>
            Email:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit">Request Password Reset</button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <label>
            Token:
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
          </label>
          <label>
            New Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit">Reset Password</button>
        </form>
      )}
    </div>
  );
};

export default PasswordRecovery;