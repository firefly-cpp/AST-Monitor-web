// src/Components/AuthManager.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthManager = ({ token }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return null;
};
