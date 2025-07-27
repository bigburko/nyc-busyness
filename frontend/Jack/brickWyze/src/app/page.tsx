// src/app/page.tsx - New landing page
'use client';

import Hero from '../components/landing/Hero';
import WhoWeAre from '../components/landing/WhoWeAre';
import Welcome from '../components/landing/Welcome';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import HowItWorks from '../components/landing/HowItWorks';
import Footer from '../components/landing/Footer';

export default function Homepage() {
  return (
    <>
      <Hero />
      <WhoWeAre />
      <Welcome />
      <WhyChooseUs />
      <HowItWorks />
      <Footer />
    </>
  );
}