// src/components/landing/Hero.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Hero: React.FC = () => {
  const router = useRouter();

  const handleMapClick = () => {
    router.push('/map');
  };

  return (
    <section className="hero">
      <Image 
        src="/assets/images/Background.jpg" 
        alt="Manhattan Business Background" 
        className="hero-background"
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
      
      <div className='hero-content'>
        <h1>Land Your Biz Where It Pops.</h1>
        <h2>Real data. Real blocks. Real results.</h2>  
        
        <button 
          className="map-button" 
          onClick={handleMapClick}
        >
          Hit the Map
        </button>
      </div>
    </section>
  );
};

export default Hero;