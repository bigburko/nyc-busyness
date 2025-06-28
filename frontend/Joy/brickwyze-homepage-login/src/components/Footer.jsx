import React from "react";
import logo from '../assets/images/logo2.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main-section">
          <div className="footer-brand">
            <img src={logo} alt="Brick Wyze Logo" className="footer-logo" />
            <p className="footer-tagline">
              Smart picks for tough streets - we show you where your business stands a chance.
            </p>
          </div>

          <div className="footer-help-section">
            <div className="footer-help">Help</div>
            <div className="footer-help-links">
              <a href="/faqs">FAQs</a>
              <a href="/contact">Contact Us</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-nav">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact Us</a>
          </div>
          <div className="copyright">© 2025. All Rights Reserved</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;