// src/components/landing/Hero.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

const Hero: React.FC = () => {
  const router = useRouter();

  const handleMapClick = () => {
    router.push('/map');
  };

  return (
    <section className={styles.hero}>
      <Image 
        src="/images/Background.jpg" 
        alt="Manhattan Business Background" 
        className={styles.heroBackground}
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
      
      <div className={styles.heroContent}>
        <h1>Land Your Biz Where It Pops.</h1>
        <h2>Real data. Real blocks. Real results.</h2>  
        
        <button 
          className={styles.mapButton} 
          onClick={handleMapClick}
        >
          Hit the Map
        </button>
      </div>
    </section>
  );
};

export default Hero;