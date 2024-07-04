import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/UserProfile.css';

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const [cyclists, setCyclists] = useState([]);
    const [showCyclists, setShowCyclists] = useState(false);
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

    const fetchCyclists = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:5000/auth/coach/cyclists', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCyclists(response.data);
        } catch (error) {
            console.error('Error fetching cyclists:', error);
        }
    };

    const toggleCyclists = () => {
        if (!showCyclists) {
            fetchCyclists();
        }
        setShowCyclists(!showCyclists);
    };

    const deleteAccount = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete('http://localhost:5000/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Account deleted successfully');
            navigate('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
        }
    };

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
                        <tr>
                            <th>Name</th>
                            <td>{profile.name}</td>
                        </tr>
                        <tr>
                            <th>Surname</th>
                            <td>{profile.surname}</td>
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
                {profile.role === 'coach' && (
                    <>
                        <button onClick={toggleCyclists}>
                            {showCyclists ? 'Hide All Cyclists' : 'Show All Cyclists'}
                        </button>
                        {showCyclists && (
                            <div className="cyclist-list">
                                <h3>Cyclists</h3>
                                <ul>
                                    {cyclists.map(cyclist => (
                                        <li key={cyclist.cyclistID}>{cyclist.name} {cyclist.surname}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
                <button onClick={() => navigate('/edit-profile')}>Edit Profile</button>
                <button onClick={deleteAccount}>Delete Account</button>
            </div>
        </div>
    );
};

export default UserProfile;
