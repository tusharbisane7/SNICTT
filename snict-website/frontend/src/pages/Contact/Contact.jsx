import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  Send,
  Clock3,
  MessageCircle,
  Building2,
} from "lucide-react";

import { useState } from "react";

import "./Contact.css";

function Contact() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    /*
      Backend/API can be connected here later.
    */

    console.log(
      "Contact form submitted:",
      formData
    );

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };


  return (
    <main className="contact-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="contact-hero">

        <div className="contact-hero-grid" />

        <div className="contact-glow contact-glow-one" />
        <div className="contact-glow contact-glow-two" />

        <div className="contact-hero-container">

          <div className="contact-hero-content">

            <span className="contact-label">
              GET IN TOUCH
            </span>

            <h1>
              Let's connect
              <span> with SNICT.</span>
            </h1>

            <p>
              Have a question, suggestion or want to know
              more about SNICT? Get in touch with our team.
              We would be happy to hear from you.
            </p>

            <div className="contact-hero-meta">

              <div>
                <HeartPulse size={17} />
                <span>
                  Cardiovascular Community
                </span>
              </div>

              <div>
                <MessageCircle size={17} />
                <span>
                  Professional Support
                </span>
              </div>

            </div>

          </div>


          <div className="contact-hero-visual">

            <div className="contact-orbit contact-orbit-one" />
            <div className="contact-orbit contact-orbit-two" />

            <div className="contact-core">

              <HeartPulse
                size={72}
                strokeWidth={1.2}
              />

              <span>
                SNICT
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT INFORMATION
      ===================================================== */}

      <section className="contact-info-section">

        <div className="contact-container">

          <div className="contact-info-heading">

            <span className="contact-section-label">
              CONTACT INFORMATION
            </span>

            <h2>
              We're here to
              <span> help.</span>
            </h2>

            <p>
              Reach out to us through any of the available
              contact channels.
            </p>

          </div>


          <div className="contact-info-grid">


            {/* EMAIL */}

            <a
              href="mailto:info@snict.org"
              className="contact-info-card"
            >

              <div className="contact-info-icon">
                <Mail size={23} />
              </div>

              <div>

                <span>
                  EMAIL
                </span>

                <h3>
                  info@snict.org
                </h3>

                <p>
                  Send us your questions or enquiries.
                </p>

              </div>

              <ArrowRight
                size={18}
                className="contact-info-arrow"
              />

            </a>


            {/* PHONE */}

            <a
              href="tel:+919999999999"
              className="contact-info-card"
            >

              <div className="contact-info-icon">
                <Phone size={23} />
              </div>

              <div>

                <span>
                  PHONE
                </span>

                <h3>
                  +91 XXXXX XXXXX
                </h3>

                <p>
                  Contact us for professional enquiries.
                </p>

              </div>

              <ArrowRight
                size={18}
                className="contact-info-arrow"
              />

            </a>


            {/* LOCATION */}

            <div className="contact-info-card">

              <div className="contact-info-icon">
                <MapPin size={23} />
              </div>

              <div>

                <span>
                  LOCATION
                </span>

                <h3>
                  India
                </h3>

                <p>
                  SNICT professional community.
                </p>

              </div>

              <MapPin
                size={18}
                className="contact-info-arrow"
              />

            </div>


            {/* OFFICE HOURS */}

            <div className="contact-info-card">

              <div className="contact-info-icon">
                <Clock3 size={23} />
              </div>

              <div>

                <span>
                  AVAILABILITY
                </span>

                <h3>
                  Professional Support
                </h3>

                <p>
                  We'll respond as soon as possible.
                </p>

              </div>

              <Clock3
                size={18}
                className="contact-info-arrow"
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT FORM
      ===================================================== */}

      <section className="contact-form-section">

        <div className="contact-container">

          <div className="contact-form-layout">


            {/* LEFT */}

            <div className="contact-form-intro">

              <span className="contact-section-label">
                SEND AN ENQUIRY
              </span>

              <h2>
                Tell us
                <span> how we can help.</span>
              </h2>

              <p>
                Whether you're interested in membership,
                collaboration, events or simply want to
                connect with SNICT, send us a message.
              </p>


              <div className="contact-form-feature">

                <div>
                  <Building2 size={21} />
                </div>

                <span>
                  Professional
                  <strong>
                    SNICT Administration
                  </strong>
                </span>

              </div>


              <div className="contact-form-feature">

                <div>
                  <MessageCircle size={21} />
                </div>

                <span>
                  Communication
                  <strong>
                    We're happy to hear from you
                  </strong>
                </span>

              </div>

            </div>


            {/* FORM */}

            <div className="contact-form-card">

              {submitted && (

                <div className="contact-success">

                  <div>
                    <Send size={18} />
                  </div>

                  <span>
                    Thank you! Your enquiry has
                    been received.
                  </span>

                </div>

              )}


              <form
                onSubmit={handleSubmit}
                className="contact-form"
              >


                {/* NAME */}

                <div className="contact-field">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* EMAIL */}

                <div className="contact-form-row">

                  <div className="contact-field">

                    <label htmlFor="email">
                      Email Address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                  </div>


                  <div className="contact-field">

                    <label htmlFor="phone">
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                    />

                  </div>

                </div>


                {/* SUBJECT */}

                <div className="contact-field">

                  <label htmlFor="subject">
                    Subject
                  </label>

                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select an enquiry type
                    </option>

                    <option value="membership">
                      Membership
                    </option>

                    <option value="events">
                      Events & CME
                    </option>

                    <option value="collaboration">
                      Collaboration
                    </option>

                    <option value="general">
                      General Enquiry
                    </option>

                  </select>

                </div>


                {/* MESSAGE */}

                <div className="contact-field">

                  <label htmlFor="message">
                    Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    placeholder="Write your message..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  className="contact-submit"
                >

                  <span>
                    Send Message
                  </span>

                  <Send size={17} />

                </button>

              </form>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAP / LOCATION
      ===================================================== */}

      <section className="contact-location">

        <div className="contact-container">

          <div className="contact-location-card">

            <div className="contact-location-content">

              <span className="contact-section-label">
                FIND US
              </span>

              <h2>
                SNICT
                <span> Community</span>
              </h2>

              <p>
                Connect with the SNICT professional community
                and stay involved with cardiovascular
                education and collaboration.
              </p>

              <div className="contact-location-item">

                <MapPin size={19} />

                <span>
                  India
                </span>

              </div>

            </div>


            <div className="contact-map-placeholder">

              <div className="contact-map-grid" />

              <div className="contact-map-pin">

                <MapPin size={30} />

                <span>
                  SNICT
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="contact-cta">

        <div className="contact-container">

          <div className="contact-cta-content">

            <div>

              <span className="contact-section-label">
                JOIN SNICT
              </span>

              <h2>
                Become part of the
                <span> community.</span>
              </h2>

              <p>
                Connect, learn and grow with cardiovascular
                technologists and professionals.
              </p>

            </div>

            <a
              href="/signup"
              className="contact-cta-button"
            >
              Join SNICT
              <ArrowRight size={18} />
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Contact;