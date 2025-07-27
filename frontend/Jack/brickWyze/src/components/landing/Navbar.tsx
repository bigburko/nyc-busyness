// src/components/landing/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar: React.FC = () => {
  return (
    <nav style={{ fontFamily: "'Simonetta', serif" }} className="navbar">
      {/* Left-side navigation links */}
      <div className="nav-left">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/help">Help</Link>
      </div>

      {/* center logo */}
      <div className="nav-center">
        <Link href="/">
          <Image 
            src="/assets/images/logo1.png" 
            alt="BrickWyze Logo" 
            className='logo'
            width={120}
            height={40}
          />
        </Link>
      </div>

      {/* Right-side function buttons */}
      <div className='nav-right'>
        <Link href="/shortlist">Shortlist</Link>
        <Link href="/map" className="login-btn">Launch Map</Link>
      </div>
    </nav>
  );
};

export default Navbar;