import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PasswordReset = () => {
    const { token } = useParams(); // Get the token from the URL
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords don't match.");
            return;
        }
        try {
            const response = await axios.post(`http://localhost:5000/auth/reset/${token}`, {
                password
            });
            alert('Password reset successfully!');
        } catch (error) {
            alert('Failed to reset password.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                New Password:
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <label>
                Confirm New Password:
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </label>
            <button type="submit">Reset Password</button>
        </form>
    );
};

export default PasswordReset;
