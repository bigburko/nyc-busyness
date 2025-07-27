// src/components/landing/Footer.tsx
'use client';

import React from "react";
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main-section">
          <div className="footer-brand">
            <Image 
              src="/assets/images/logo2.png" 
              alt="Brick Wyze Logo" 
              className="footer-logo"
              width={120}
              height={40}
            />
            <p className="footer-tagline">
              Smart picks for tough streets - we show you where your business stands a chance.
            </p>
          </div>

          <div className="footer-help-section">
            <div className="footer-help">Help</div>
            <div className="footer-help-links">
              <Link href="/faqs">FAQs</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-nav">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
          <div className="copyright">© 2025. All Rights Reserved</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;