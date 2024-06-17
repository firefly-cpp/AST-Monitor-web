// src/Components/Navbar/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/Navbar.css'; // Import the CSS file

const Navbar = ({ isLoggedIn, handleLogout }) => {
  return (
    <nav className="navbar">
      <ul className="navbar-links">
        {isLoggedIn ? (
          <>
            <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
            <li><Link to="/profile" className="nav-link">Profile</Link></li>
            <li><button className="nav-button" onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/login" className="nav-link">Login</Link></li>
            <li><Link to="/register" className="nav-link">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
