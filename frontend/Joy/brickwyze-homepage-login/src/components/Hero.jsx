import React from 'react';
import backgroundImg from '../assets/images/Background.jpg';

const Hero = () => {
  return (
    <section className="hero">
      <img src={backgroundImg} alt="ManhattanBusinessBackgroundImage" className="hero-background" />
      
      <div className='hero-content'>
        <h1>Land Your Biz Where It Pops.</h1>
        <h2>Real data. Real blocks. Real results.</h2>  
        
        <button 
            className="map-button" 
            onClick={() => { /* Add redirection logic later */ }}
        >

            Hit the Map
        </button>

      </div>
    </section>
  );
};

export default Hero;