import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/UserProfile.css';

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:5000/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
            } catch (error) {
                navigate('/login');
            }
        };

        fetchProfile();
    }, [navigate]);

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    const profilePictureUrl = `http://localhost:5000/static/${profile.profile_picture}`;

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h3>User Profile</h3>
                <div className="profile-picture">
                    <img src={profilePictureUrl} alt="Profile" className="rounded-avatar" />
                </div>
                <table>
                    <tbody>
                        <tr>
                            <th>Username</th>
                            <td>{profile.username}</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>{profile.email}</td>
                        </tr>
                        {profile.date_of_birth && (
                            <tr>
                                <th>Date of Birth</th>
                                <td>{profile.date_of_birth}</td>
                            </tr>
                        )}
                        {profile.height_cm && (
                            <tr>
                                <th>Height</th>
                                <td>{profile.height_cm} cm</td>
                            </tr>
                        )}
                        {profile.weight_kg && (
                            <tr>
                                <th>Weight</th>
                                <td>{profile.weight_kg} kg</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <button onClick={() => navigate('/edit-profile')}>Edit Profile</button>
            </div>
        </div>
    );
};

export default UserProfile;
