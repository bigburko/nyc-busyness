// src/components/landing/HowItWorks.tsx
'use client';

import React from "react";
import Image from 'next/image';
import Link from 'next/link';
import styles from './landing.module.css';

const HowItWorks: React.FC = () => {
  return (
    <div className={styles.howItWorksWrapper}>
      <h2 className={styles.sectionTitle}>How It Works</h2>

      <div className={styles.howItWorksContainer}>
        <div className={styles.mapSection}>
          <Link href="/map" className={styles.mapLink}>
            <Image 
              src="/images/map.png" 
              alt="Manhattan Map" 
              className={styles.mapImage}
              width={400}
              height={600}
            />
          </Link>
        </div>

        <div className={styles.stepsSection}>
          <div className={`${styles.stepBox} ${styles.dashedBorder}`}>
            <Image 
              src="/icons/process1.png" 
              alt="Input Criteria Icon" 
              className={styles.stepIcon}
              width={64}
              height={64}
            />
            <h3>Input Criteria</h3>
            <p>Tell us your industry, budget, and location preferences</p>
          </div>

          <Image 
            src="/icons/downArrow.png" 
            alt="down Arrow" 
            className={styles.arrowIcon}
            width={24}
            height={24}
          />

          <div className={`${styles.stepBox} ${styles.dashedBorder}`}>
            <Image 
              src="/icons/process2.png" 
              alt="Data Processing Icon" 
              className={styles.stepIcon}
              width={64}
              height={64}
            />
            <h3>Data Processing</h3>
            <p>Our algorithm analyzes millions of data points instantly</p>
          </div>

          <Image 
            src="/icons/downArrow.png" 
            alt="down Arrow" 
            className={styles.arrowIcon}
            width={24}
            height={24}
          />

          <div className={`${styles.stepBox} ${styles.resultBox}`}>
            <Image 
              src="/icons/process3.png" 
              alt="Get Results Icon" 
              className={styles.stepIcon}
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