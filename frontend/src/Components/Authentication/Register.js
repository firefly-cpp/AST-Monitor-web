import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Auth.css';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('coach'); // Default role is coach
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const userData = {
  username,
  password,
  email,
  role,
  ...(role === 'cyclist' && {
    date_of_birth: dateOfBirth,
    height_cm: Number(height),
    weight_kg: Number(weight)
  })
};
    try {
      const { data } = await axios.post('http://localhost:5000/auth/register', userData);
      onRegister(data.access_token);
      alert('Registration successful');
      navigate('/dashboard'); // Navigate to dashboard after successful registration
    } catch (error) {
      alert('Registration failed: ' + error.response.data.msg);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="coach">Coach</option>
            <option value="cyclist">Cyclist</option>
          </select>
        </label>

        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {role === 'cyclist' && (
          <>
            <label>Date of Birth:</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />

            <label>Height (cm):</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} required />

            <label>Weight (kg):</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required />
          </>
        )}

        <button type="submit">Register</button>
        <p onClick={() => navigate('/login')}>Already have an account? <a href="/login">Login</a></p>
      </form>
    </div>
  );
};

export default Register;
