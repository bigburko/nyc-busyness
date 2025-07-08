import React from "react";
import map from '../assets/images/map.png'
import icon1 from '../assets/icons/process1.png'
import icon2 from '../assets/icons/process2.png'
import icon3 from '../assets/icons/process3.png'
import icon4 from '../assets/icons/downArrow.png'

const HowItWorks = () => {
    return (
        <div className="how-it-works-wrapper">
            {/* { title } */}
            <h2 className="section-title">How It Works</h2>

            <div className="how-it-works-container">
                {/* { map side - with google maps - https://developers.google.com/maps/documentation/embed/embedding-map?hl=zh-cn } */}
                <div className="map-section">
                    <img src={map} alt="Manhattan Map" className="map-image" />
                </div>

                {/* <div className="map-section">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d96652.27317354927!2d-74.33557368359375!3d40.79756494697628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2588f046ee661%3A0xa0b3281fcecc08c!2sManhattan%2C%20New%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1640995200000!5m2!1sen!2sus"
                        className="google-map"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Manhattan Map"
                    ></iframe>
                </div> */}

                {/* { right side processing } */}
                <div className="steps-section">
                    <div className="step-box dashed-border">
                        <img src={icon1} alt="Input Criteria Icon" className="step-icon" />
                        <h3>Input Criteria</h3>
                        <p>Tell us your industry, budget, and location preferences</p>
                    </div>

                    <img src={icon4} alt="down Arrow" className="arrow-icon" />

                    <div className="step-box dashed-border">
                        <img src={icon2} alt="Data Processing Icon" className="step-icon" />
                        <h3>Data Processing</h3>
                        <p>Our algorithm analyzes millions of data points instantly</p>
                    </div>

                    <img src={icon4} alt="down Arrow" className="arrow-icon" />

                    <div className="step-box result-box">
                        <img src={icon3} alt="Get Results Icon" className="step-icon" />
                        <h3>Get Results</h3>
                        <p>Receive your resilience score and top location recommendations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;