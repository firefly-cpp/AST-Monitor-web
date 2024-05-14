import React, { useState } from 'react';
import axios from 'axios';

const PasswordRecovery = () => {
  const [email, setEmail] = useState('');

  const handleRequestReset = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/auth/recover', { email });
      alert('If that email address is in our database, we will send you an email to reset your password.');
    } catch (error) {
      alert('Error: ' + error.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleRequestReset}>
      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <button type="submit">Request Password Reset</button>
    </form>
  );
};

export default PasswordRecovery;
