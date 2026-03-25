import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="ocdra-footer mt-auto">
      <div className="container">
        {/* Logos */}
        <div className="footer-logos">
          <img src="/ched-logo.png" alt="CHED" />
          <img src="/bp-logo-white.png" alt="Bagong Pilipinas" />
        </div>

        {/* Title */}
        <h5 className="footer-title">e-Agenda System</h5>
        <p className="footer-desc">
          Commission on Higher Education — Official e-Agenda for managing <br></br>
          State Universities and Colleges information.
        </p>

        {/* Tags */}
        <div className="footer-tags">
          <span className="footer-tag">Official</span>
          <span className="footer-tag">Transparent</span>
          <span className="footer-tag">Service-Oriented</span>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          Copyright &copy; {new Date().getFullYear()} Commission on Higher Education. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
