import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa";

import { Link } from "react-router-dom";

import snictLogo from "../assets/snict-logo.jpeg";

import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="snict-footer">

      {/* =====================================================
          MAIN FOOTER
      ===================================================== */}

      <div className="snict-footer-grid">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="snict-footer-brand">

          <Link
            to="/"
            className="snict-footer-logo"
          >

            {/* LOGO */}

            <div className="snict-footer-logo-mark">

              <img
                src={snictLogo}
                alt="SNICT Logo"
                className="snict-footer-logo-image"
              />

            </div>


            {/* BRAND CONTENT */}

            <div className="snict-footer-brand-content">

              <span className="snict-footer-brand-name">
                SNICT
              </span>

              <span className="snict-footer-brand-description">
                Society of Neo Interventional
                <br />
                Cardiovascular Technologists
              </span>

            </div>

          </Link>


          {/* DESCRIPTION */}

          <p className="snict-footer-description">
            Advancing professional excellence,
            education, collaboration and innovation
            through a trusted medical community.
          </p>


          {/* =================================================
              SOCIAL LINKS
          ================================================= */}

          <div className="snict-footer-social">

            {/* INSTAGRAM */}

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="snict-social-link"
            >
              <FaInstagram />
            </a>


            {/* FACEBOOK */}

            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="snict-social-link"
            >
              <FaFacebookF />
            </a>


            {/* LINKEDIN */}

            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="snict-social-link"
            >
              <FaLinkedinIn />
            </a>


            {/* EMAIL */}

            <a
              href="mailto:support@snict.net"
              aria-label="Email"
              className="snict-social-link"
            >
              <Mail size={21} />
            </a>

          </div>

        </div>


        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <div className="snict-footer-column">

          <h3>
            Quick Links
          </h3>

          <nav className="snict-footer-links">

            <Link to="/">
              <span>
                Home
              </span>

              <ArrowRight size={14} />
            </Link>


            <Link to="/about">
              <span>
                About Us
              </span>

              <ArrowRight size={14} />
            </Link>


            <Link to="/members">
              <span>
                Members
              </span>

              <ArrowRight size={14} />
            </Link>


            <Link to="/contact">
              <span>
                Contact
              </span>

              <ArrowRight size={14} />
            </Link>

          </nav>

        </div>


        {/* =================================================
            CONTACT
        ================================================= */}

        <div className="snict-footer-column">

          <h3>
            Contact Us
          </h3>

          <div className="snict-footer-contact">

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="snict-footer-contact-item">

              <div className="snict-footer-contact-icon">
                <Mail size={18} />
              </div>

              <a href="mailto:support@snict.net">
                support@snict.net
              </a>

            </div>


            {/* =================================================
                PHONE
            ================================================= */}

            <div className="snict-footer-contact-item">

              <div className="snict-footer-contact-icon">
                <Phone size={18} />
              </div>

              <a href="tel:+919731464382">
                +91 9731464382
              </a>

            </div>


            {/* =================================================
                OFFICE ADDRESS
            ================================================= */}

            <div className="snict-footer-contact-item snict-footer-address-item">

              <div className="snict-footer-contact-icon">
                <MapPin size={18} />
              </div>

              <address className="snict-footer-address">

                <span className="snict-footer-office-title">
                  SNICT Office
                </span>

                <span>
                  45/25, Society of Neo Interventional
                </span>

                <span>
                  Cardiovascular Technologists
                </span>

                <span>
                  1-1/Pelleru, Chrjerla
                </span>

                <span>
                  SPSR Nellore
                </span>

                <span>
                  Andhra Pradesh - 524309
                </span>

              </address>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          BOTTOM FOOTER
      ===================================================== */}

      <div className="snict-footer-bottom">

        {/* COPYRIGHT */}

        <p>
          © {currentYear} SNICT. All rights reserved.
        </p>


        {/* POWERED BY */}

        <p className="snict-footer-powered-by">

          Powered by{" "}

          <a
            href="http://www.utfindia.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="snict-footer-company-link"
          >
            UTF Technologies
          </a>

        </p>


        {/* BOTTOM LINKS */}

        <div className="snict-footer-bottom-links">

          <Link to="/contact">
            Privacy Policy
          </Link>


          <Link to="/contact">
            Terms & Conditions
          </Link>


          {/* ADMIN LOGIN */}

          <Link
            to="/admin/login"
            className="snict-footer-admin-link"
          >

            <ShieldCheck size={15} />

            <span>
              Admin Login
            </span>

            <ExternalLink size={11} />

          </Link>

        </div>

      </div>

    </footer>
  );
}

export default Footer;