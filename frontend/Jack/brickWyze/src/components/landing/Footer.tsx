// src/components/landing/Footer.tsx
'use client';

import React from "react";
import Image from 'next/image';
import Link from 'next/link';
import styles from './landing.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerMainSection}>
          <div className={styles.footerBrand}>
            <Image 
              src="/images/logo2.png" 
              alt="Brick Wyze Logo" 
              className={styles.footerLogo}
              width={120}
              height={40}
            />
            <p className={styles.footerTagline}>
              Smart picks for tough streets - we show you where your business stands a chance.
            </p>
          </div>

          <div className={styles.footerHelpSection}>
            <div className={styles.footerHelp}>Help</div>
            <div className={styles.footerHelpLinks}>
              <Link href="/faqs">FAQs</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerNav}>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
          <div className={styles.copyright}>© 2025. All Rights Reserved</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;