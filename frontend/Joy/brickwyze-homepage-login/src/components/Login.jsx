import React, { useState } from "react";
import logo from '../assets/images/logo3.png';
import { ReactComponent as UsernameIcon } from '../assets/icons/username.svg';
import { ReactComponent as PasswordIcon } from '../assets/icons/password.svg';
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Login = () => {
    const navigate = useNavigate(); // If login in successfully, will be redirected
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent page refresh

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg("Login Failed: " + error.message);
        } else {
            setErrorMsg("");
            console.log("Login Successed! ", data);
            navigate("/dashboard"); // Login successfully jumps to the page and sets the route
        }
    };

  return (
    <div className="login-page">
        <div className="login-card">
            <img src={logo} alt="BrickWyze Logo" className='login-card-logo' />  
            <h2 className="login-title">Login</h2>
            <p className="login-subtitile">Sign in to your account</p>
            <form className="login-form" onSubmit={handleLogin}>
                <div className="input-icon-group">
                    <UsernameIcon className="input-icon" />
                    <input 
                        type="Email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                
                <div className="input-icon-group">
                    <PasswordIcon className="input-icon" />
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {errorMsg && <p className="error-message">{errorMsg}</p>}
                
                <a href="/forget-password" className="forgot-password">Forgot password?</a>
                
                <button type="submit" className="login-button">Login</button>
                <button type="button" className="register-button" onClick={() => navigate("/register")}>
                    Register New Account
                </button>
            </form>
        </div>
    </div>
  );
};

export default Login;
