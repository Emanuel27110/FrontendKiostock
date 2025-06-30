// Footer.js

import React from "react";
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p className="footer-text">
          &copy; 2024 LaMendoza - Todos los derechos reservados
        </p>
        <div className="social-links">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <span className="material-icons">facebook</span>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <span className="material-icons">instagram</span>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <span className="material-icons">twitter</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
