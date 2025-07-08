import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        setMessage("Register Failed: " + error.message);
    } else {
        console.log("Register Successed", data);
        setMessage("Registration successful, please check your email for verification link!");
    }
  };

  return (
    <div className="login-page">
        <div className="login-card">
            <h2 className="login-title">Register</h2>
            <p className="login-subtitile">Create a new account</p>
            <form className="login-form" onSubmit={handleRegister}>
                <div className="input-icon-group">
                    <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>

                <div className="input-icon-group">
                    <input
                    type="password"
                    placeholder="Password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>

                {message && <p className="error-message">{message}</p>}

                <button type="submit" className="login-button">Register</button>
                <button type="button" className="register-button" onClick={() => navigate("/login")}>
                    Back to Login
                </button>
            </form>
        </div>
    </div>
  );
};

export default Register;
