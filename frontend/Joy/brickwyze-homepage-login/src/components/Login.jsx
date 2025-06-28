import React from "react";
import logo from '../assets/images/logo3.png';
import { ReactComponent as UsernameIcon } from '../assets/icons/username.svg';
import { ReactComponent as PasswordIcon } from '../assets/icons/password.svg';

const Login = () => {
  return (
    <div className="login-page">
        <div className="login-card">
            <img src={logo} alt="BrickWyze Logo" className='login-card-logo' />  
            <h2 className="login-title">Login</h2>
            <p className="login-subtitile">Sign in to your account</p>
            <form className="login-form">
                <div className="input-icon-group">
                    <UsernameIcon className="input-icon" />
                    <input type="text" placeholder="Username/Email" />
                </div>
                
                <div className="input-icon-group">
                    <PasswordIcon className="input-icon" />
                    <input type="password" placeholder="Password" />
                </div>
                
                <a href="/forget-password" className="forgot-password">Forgot password?</a>
                
                <button type="submit" className="login-button">Login</button>
                <button type="button" className="register-button">Register New Account</button>
            </form>
        </div>
    </div>
  );
};

export default Login;
