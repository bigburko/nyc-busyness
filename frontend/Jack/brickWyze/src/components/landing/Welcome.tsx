// src/components/landing/Welcome.tsx
'use client';

import React from "react";
import Image from 'next/image';
import styles from './landing.module.css';

const Welcome: React.FC = () => {
  return (
    <section className={styles.welcomeSection}>
      <div className={styles.welcomeContainer}>
        <div className={styles.welcomeCard}>
          <h1>
            Welcome to <span className={styles.highlight}>BrickWyze</span>
          </h1>
          <p className={styles.intro}>
            <strong>BrickWyze</strong> helps NYC entrepreneurs answer one critical question: "If I run a great business, will this place still work against me?"
          </p>
          <p>
            By translating fragmented city data into an easy-to-use resilience score, we give founders the clarity they need to launch with confidence — and avoid the hidden risks that can quietly sink even the best ideas.
          </p>
        </div>

        <div className={styles.welcomeImageContainer}>
          <Image 
            src="/images/welcome.png" 
            alt="New Business in NYC" 
            className={styles.welcomeImage}
            width={500}
            height={400}
          />
        </div>
      </div>
    </section>
  );
};

export default Welcome;