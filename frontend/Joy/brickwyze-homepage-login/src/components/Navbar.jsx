import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo1.png';

const Navbar = () => {
    return (
        <nav style={{ fontFamily: "'Simonetta', serif" }} className="navbar">
            {/* Left-side navigation links */}
            <div className="nav-left">
                <Link to="/">Home</Link>
                <Link to="/">About</Link>
                <Link to="/">Help</Link>
            </div>

            {/* center logo */}
            <div className="nav-center">
                <img src={logo} alt="BrickWyze Logo" className='logo' />
            </div>

            {/* Right-side function buttons */}
            <div className='nav-right'>
                <Link to="/shortlist">Shortlist</Link>
                <Link to="/login" className="login-btn">Login / Register</Link>
            </div>
        </nav>
    );
};

export default Navbar;