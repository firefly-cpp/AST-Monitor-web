import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Auth.css';

const Register = ({ onRegister }) => {
  const [accountType, setAccountType] = useState(''); // '' to determine the initial state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [coachID, setCoachID] = useState('');
  const [coaches, setCoaches] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
  }, [role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous error
    const userData = {
      username,
      email,
      password,
      role,
      ...(role === 'cyclist' && {
        coachID,
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
      navigate('/login'); // Redirect to the login page after successful registration
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register as {role}</h2>
      {error && <p className="error">{error}</p>}
      <label>Username:</label>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <label>Email:</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Password:</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {role === 'cyclist' && coaches.length > 0 && (
        <label>
          Coach:
          <select value={coachID} onChange={(e) => { setCoachID(e.target.value); }}>
            {coaches.map((coach) => (
              <option key={coach.coachID} value={coach.coachID}>
                {coach.username}
              </option>
            ))}
          </select>
        </label>
      )}
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
      <p onClick={() => setRole(role === 'coach' ? 'cyclist' : 'coach')}>
        Want to create a {role === 'coach' ? 'Cyclist' : 'Coach'} account instead? Click here.
      </p>
      <p onClick={() => navigate('/login')}>Already have an account? <a href="/login">Login</a></p>
    </form>
  );

  return (
    <div className="auth-container">
      {accountType === '' ? (
        <div className="account-type-selection">
          <h2>Select Account Type</h2>
          <button onClick={() => { setAccountType('coach'); setRole('coach'); }}>Create a Coach Account</button>
          <button onClick={() => { setAccountType('cyclist'); setRole('cyclist'); }}>Create a Cyclist Account</button>
        </div>
      ) : (
        renderForm()
      )}
    </div>
  );
};

export default Register;
