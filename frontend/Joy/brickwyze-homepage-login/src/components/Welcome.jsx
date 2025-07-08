import React from "react";
import sildImg from '../assets/images/welcome.png'

const Welcome = () => {
    return (
        <section className="welcome-section">
            <div className="welcome-card">
                <h1>
                    Welcome to <span className="highlight">BrickWyze</span>
                </h1>
                <p className="intro">
                    <strong>BrickWyze</strong> helps NYC entrepreneurs answer one critical question: “If I run a great business, will this place still work against me?”
                </p>
                <p>
                    By translating fragmented city data into an easy-to-use resilience score, we give founders the clarity they need to launch with confidence — and avoid the hidden risks that can quietly sink even the best ideas.
                </p>
            </div>

            <div className="welcome-image-container">
                <img src={sildImg} alt="New Business in NYC" className="welcome-image" />
            </div>
        </section>

    );
};

export default Welcome;