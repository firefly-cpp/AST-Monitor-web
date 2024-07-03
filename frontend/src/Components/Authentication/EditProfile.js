import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/EditProfile.css';

const EditProfile = () => {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [role, setRole] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [coachID, setCoachID] = useState('');
    const [coaches, setCoaches] = useState([]);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePictureName, setProfilePictureName] = useState('');
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
                setName(data.name);
                setSurname(data.surname);
                setRole(data.role);  // Ensure the role is set correctly
                console.log('Fetched profile:', data);  // Debugging log
                if (data.role === 'cyclist') {
                    setHeight(data.height_cm || '');
                    setWeight(data.weight_kg || '');
                    setCoachID(data.coachID || ''); // Prepopulate coachID
                    fetchCoaches();
                }
            } catch (error) {
                console.error('Error fetching profile:', error.response?.data);
                navigate('/login');
            }
        };

        const fetchCoaches = async () => {
            try {
                const response = await axios.get('http://localhost:5000/auth/coaches');
                setCoaches(response.data);
            } catch (error) {
                console.error('Error fetching coaches:', error);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        const updateData = {
            username,
            name,
            surname,
            ...(role === 'cyclist' && {
                height_cm: height !== '' ? height : null,
                weight_kg: weight !== '' ? weight : null,
                coachID: coachID !== '' ? coachID : null
            })
        };

        try {
            await axios.put('http://localhost:5000/auth/profile', updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profilePicture) {
                const formData = new FormData();
                formData.append('profile_picture', profilePicture);

                await axios.post('http://localhost:5000/auth/upload_profile_picture', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            alert('Profile updated successfully');
            navigate('/profile', { replace: true });
        } catch (error) {
            console.error('Failed to update profile:', error.response?.data);
            alert('Failed to update profile');
        }
    };

    const handleProfilePictureChange = (event) => {
        setProfilePicture(event.target.files[0]);
        setProfilePictureName(event.target.files[0].name);
    };

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-container">
                <h3>Edit Profile</h3>
                <form onSubmit={handleSubmit}>
                    <label>
                        Username:
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                    </label>
                    <label>
                        Name:
                        <input type="text" value={name} onChange={e => setName(e.target.value)} />
                    </label>
                    <label>
                        Surname:
                        <input type="text" value={surname} onChange={e => setSurname(e.target.value)} />
                    </label>
                    {role === 'cyclist' && (
                        <>
                            <label>
                                Height (cm):
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </label>
                            <label>
                                Weight (kg):
                                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                            </label>
                            <label>
                                Coach:
                                <select value={coachID} onChange={e => setCoachID(e.target.value)}>
                                    <option value="">Select a Coach</option>
                                    {coaches.map(coach => (
                                        <option key={coach.coachID} value={coach.coachID}>
                                            {coach.name} {coach.surname}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}
                    <label className="file-input-label">
                        Profile Picture:
                        <input type="file" onChange={handleProfilePictureChange} />
                        <span>{profilePictureName}</span>
                    </label>
                    <button type="submit" className="update-profile-button">Update Profile</button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
