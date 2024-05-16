// src/Components/Authentication/EditProfile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/EditProfile.css'; // Import the CSS file

const EditProfile = () => {
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user data to fill out the form
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setUsername(data.username);
        setDateOfBirth(data.date_of_birth);
        setHeight(data.height_cm);
        setWeight(data.weight_kg);
      } catch (error) {
        console.error('Error fetching profile:', error.response?.data);
        navigate('/login'); // Navigate to login if there's a problem fetching the profile
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put('http://localhost:5000/auth/profile', {
        username,
        date_of_birth: dateOfBirth,
        height_cm: height,
        weight_kg: weight
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Profile updated successfully');

      // Check if username was part of the updated fields and if it was changed
      if (response.data.username_changed) {
        localStorage.removeItem('token');  // Remove token from local storage
        navigate('/login', { replace: true }); // Navigate to login page if username was changed
        window.location.reload(); // Force a reload of the page
      } else {
        navigate('/profile', { replace: true }); // Stay on profile page or refresh it if only other details were changed
      }
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
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;
