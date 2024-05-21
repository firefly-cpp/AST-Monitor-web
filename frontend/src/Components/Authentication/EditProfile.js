import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/EditProfile.css';

const EditProfile = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setUsername(data.username);
      setRole(localStorage.getItem('role'));  // Get the role from localStorage
      if (data.role === 'cyclist') {
        setDateOfBirth(data.date_of_birth || '');
        setHeight(data.height_cm || '');
        setWeight(data.weight_kg || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data);
      navigate('/login');
    }
  };

  fetchProfile();
}, [navigate]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const updateData = {
      username,
      ...(role === 'cyclist' && {
        date_of_birth: dateOfBirth,
        height_cm: height,
        weight_kg: weight
      })
    };

    try {
      const response = await axios.put('http://localhost:5000/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully');
      navigate('/profile', { replace: true }); // Refresh the profile page
    } catch (error) {
      console.error('Failed to update profile:', error.response?.data);
      alert('Failed to update profile');
    }
  };

  return (
  <div className="edit-profile-container">
    <h3>Edit Profile</h3>
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
      </label>
      {role === 'cyclist' && (
        <>
          <label>
            Date of Birth:
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </label>
          <label>
            Height (cm):
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
          </label>
          <label>
            Weight (kg):
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
          </label>
        </>
      )}
      <button type="submit">Update Profile</button>
    </form>
  </div>
);
};

export default EditProfile;