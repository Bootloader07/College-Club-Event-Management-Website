import React from 'react';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-content">
        <p className="footer-brand">
          ABES<span> Wave</span>
        </p>
        <p className="footer-tagline">
          ABES Engineering College &middot; Event Management Portal
        </p>
        <p className="footer-copyright">
          &copy; 2025 All rights reserved.
        </p>
      </div>
    </footer>
  );
}
