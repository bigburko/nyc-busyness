// src/components/landing/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      {/* Left-side navigation links */}
      <div className={styles.navLeft}>
        <Link href="/">Home</Link>
      </div>

      {/* center logo */}
      <div className={styles.navCenter}>
        <Link href="/">
          <Image 
            src="/images/logo1.png" 
            alt="BrickWyze Logo" 
            className={styles.logo}
            width={120}
            height={40}
          />
        </Link>
      </div>

      {/* Right-side function buttons */}
      <div className={styles.navRight}>
        <Link href="/map" className={styles.loginBtn}>Launch Map</Link>
      </div>
    </nav>
  );
};

export default Navbar;