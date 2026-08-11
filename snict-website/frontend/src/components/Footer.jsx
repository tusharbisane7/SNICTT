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

import snictLogo from "../assets/snict-logo.png";

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
              rel="noreferrer"
              aria-label="Instagram"
              className="snict-social-link"
            >
              <FaInstagram />
            </a>


            {/* FACEBOOK */}

            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="snict-social-link"
            >
              <FaFacebookF />
            </a>


            {/* LINKEDIN */}

            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="snict-social-link"
            >
              <FaLinkedinIn />
            </a>


            {/* EMAIL */}

            <a
              href="mailto:info@snict.org"
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

            {/* EMAIL */}

            <div className="snict-footer-contact-item">

              <div className="snict-footer-contact-icon">
                <Mail size={18} />
              </div>

              <a href="mailto:info@snict.org">
                support@snict.org
              </a>

            </div>


            {/* PHONE */}

            <div className="snict-footer-contact-item">

              <div className="snict-footer-contact-icon">
                <Phone size={18} />
              </div>

              <a href="tel:+919731464382">
                +91 9731464382
              </a>

            </div>


            {/* LOCATION */}

            <div className="snict-footer-contact-item">

              <div className="snict-footer-contact-icon">
                <MapPin size={18} />
              </div>

              <span>
                45/25 Socitey of Neo Interventional Cardiovascular Technologites,
                1-1/Pelleru, Chrjerla, SPSR, Nellore, Andhra Pradesh - 524309
              </span>

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