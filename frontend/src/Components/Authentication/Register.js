import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Auth.css';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('coach');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [coachID, setCoachID] = useState('');
  const [coaches, setCoaches] = useState([]);
  const navigate = useNavigate();

  // Fetch coaches for selection when role is 'cyclist'
  useEffect(() => {
  if (role === 'cyclist') {
    axios.get('http://localhost:5000/auth/coaches') // Adjust as per your actual endpoint
      .then(response => {
        setCoaches(response.data);
        if (response.data.length > 0) {
          setCoachID(response.data[0].coachID.toString()); // Set default coachID
        }
      })
      .catch(error => console.error('Error fetching coaches:', error));
  }
}, [role]); // Dependency on role to refetch when it changes

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Registering with data:', {coachID, username, email, password, dateOfBirth, height, weight}); // Debugging line
    const userData = {
      username,
      email,
      password,
      role,
      ...(role === 'cyclist' && {
        coachID, // Ensure this is correctly captured
        date_of_birth: dateOfBirth,
        height_cm: Number(height),
        weight_kg: Number(weight)
      })
    };

    try {
      const endpoint = role === 'coach' ? 'register_coach' : 'register_cyclist';
      const { data } = await axios.post(`http://localhost:5000/auth/${endpoint}`, userData);
      localStorage.setItem('token', data.access_token);
      onRegister(data.access_token, role);
      alert('Registration successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error.response);
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
        {role === 'cyclist' && coaches.length > 0 && (
          <label>
            Coach:
            <select value={coachID} onChange={(e) => { setCoachID(e.target.value); console.log("Selected coachID:", e.target.value); }}>
  {coaches.map((coach) => (
    <option key={coach.coachID} value={coach.coachID}>
      {coach.username}
    </option>
  ))}
</select>
          </label>
        )}
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
