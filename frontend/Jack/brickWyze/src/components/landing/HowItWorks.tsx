// src/components/landing/HowItWorks.tsx
'use client';

import React from "react";
import Image from 'next/image';

const HowItWorks: React.FC = () => {
  return (
    <div className="how-it-works-wrapper">
      <h2 className="section-title">How It Works</h2>

      <div className="how-it-works-container">
        <div className="map-section">
          <Image 
            src="/assets/images/map.png" 
            alt="Manhattan Map" 
            className="map-image"
            width={400}
            height={600}
          />
        </div>

        <div className="steps-section">
          <div className="step-box dashed-border">
            <Image 
              src="/assets/icons/process1.png" 
              alt="Input Criteria Icon" 
              className="step-icon"
              width={64}
              height={64}
            />
            <h3>Input Criteria</h3>
            <p>Tell us your industry, budget, and location preferences</p>
          </div>

          <Image 
            src="/assets/icons/downArrow.png" 
            alt="down Arrow" 
            className="arrow-icon"
            width={24}
            height={24}
          />

          <div className="step-box dashed-border">
            <Image 
              src="/assets/icons/process2.png" 
              alt="Data Processing Icon" 
              className="step-icon"
              width={64}
              height={64}
            />
            <h3>Data Processing</h3>
            <p>Our algorithm analyzes millions of data points instantly</p>
          </div>

          <Image 
            src="/assets/icons/downArrow.png" 
            alt="down Arrow" 
            className="arrow-icon"
            width={24}
            height={24}
          />

          <div className="step-box result-box">
            <Image 
              src="/assets/icons/process3.png" 
              alt="Get Results Icon" 
              className="step-icon"
              width={64}
              height={64}
            />
            <h3>Get Results</h3>
            <p>Receive your resilience score and top location recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;