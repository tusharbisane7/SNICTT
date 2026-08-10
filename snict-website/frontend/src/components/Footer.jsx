import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

import { Link } from "react-router-dom";

import snictLogo from "../assets/snict-logo.jpeg";

import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="snict-footer">

      <div className="snict-footer-container">

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

              {/* ACTUAL SNICT LOGO */}

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


            <p className="snict-footer-description">
              Advancing professional excellence,
              education, collaboration and innovation
              through a trusted medical community.
            </p>


            {/* =================================================
                SOCIAL LINKS
            ================================================= */}

            <div className="snict-footer-social">

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                IG
              </a>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                IN
              </a>

              <a
                href="mailto:info@snict.org"
                aria-label="Email"
              >
                @
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
                <span>Home</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/about">
                <span>About Us</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/team">
                <span>Our Team</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/committees">
                <span>Committees</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/contact">
                <span>Contact</span>
                <ArrowRight size={12} />
              </Link>

            </nav>

          </div>


          {/* =================================================
              RESOURCES
          ================================================= */}

          <div className="snict-footer-column">

            <h3>
              Resources
            </h3>

            <nav className="snict-footer-links">

              <Link to="/events">
                <span>Events</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/membership">
                <span>Membership</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/login">
                <span>Member Login</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/signup">
                <span>Join SNICT</span>
                <ArrowRight size={12} />
              </Link>

              <Link to="/contact">
                <span>Support</span>
                <ArrowRight size={12} />
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
                  <Mail size={15} />
                </div>

                <a href="mailto:info@snict.org">
                  info@snict.org
                </a>

              </div>


              {/* PHONE */}

              <div className="snict-footer-contact-item">

                <div className="snict-footer-contact-icon">
                  <Phone size={15} />
                </div>

                <a href="tel:+919999999999">
                  +91 99999 99999
                </a>

              </div>


              {/* LOCATION */}

              <div className="snict-footer-contact-item">

                <div className="snict-footer-contact-icon">
                  <MapPin size={15} />
                </div>

                <span>
                  Maharashtra, India
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            MEMBERSHIP CTA
        ===================================================== */}

        <div className="snict-footer-cta">

          <div className="snict-footer-cta-content">

            <span className="snict-footer-cta-label">
              PROFESSIONAL COMMUNITY
            </span>

            <h3>
              Become a SNICT Member
            </h3>

            <p>
              Join our professional community and
              stay connected with upcoming events,
              education and opportunities.
            </p>

          </div>


          <Link
            to="/membership"
            className="snict-footer-cta-button"
          >

            <span>
              Explore Membership
            </span>

            <ArrowRight size={15} />

          </Link>

        </div>


        {/* =====================================================
            BOTTOM
        ===================================================== */}

        <div className="snict-footer-bottom">

          <p>
            © {currentYear} SNICT. All rights reserved.
          </p>


          <div className="snict-footer-bottom-links">

            <Link to="/contact">
              Privacy Policy
            </Link>

            <Link to="/contact">
              Terms & Conditions
            </Link>

            <Link to="/admin/login">

              <span>
                Admin
              </span>

              <ExternalLink size={10} />

            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;