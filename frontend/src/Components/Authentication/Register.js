import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5000/auth/register', {
        username,
        password,
        email
      });
      onRegister(data.access_token); // Assuming the backend sends back the access token on successful registration
      alert('Registration successful');
    } catch (error) {
      alert('Registration failed: ' + error.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
