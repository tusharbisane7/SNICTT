import {
  ArrowRight,
  Activity,
  Award,
  BriefcaseBusiness,
  Cpu,
  GraduationCap,
  Users,
  HeartPulse,
  Sparkles,
  Target,
  Eye,
  Stethoscope,
  BrainCircuit,
  Handshake,
} from "lucide-react";

import { useState } from "react";

import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/LoginRequiredModal";

import "./About.css";

function About() {
  const { user } = useAuth();

  const [showLoginModal, setShowLoginModal] =
    useState(false);

  const handleMembershipClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    window.location.href = "/membership";
  };

  return (
    <main className="about-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="about-hero">

        <div className="about-hero-grid" />

        <div className="about-hero-glow about-glow-one" />
        <div className="about-hero-glow about-glow-two" />

        <div className="about-hero-container">

          {/* =================================================
              HERO CONTENT
          ================================================= */}

          <div className="about-hero-content">

            <span className="about-hero-label">
              ABOUT SNICT
            </span>

            <h1>
              Building a stronger
              <span> cardiovascular community.</span>
            </h1>

            <p>
              The Society of Neo Interventional Cardiovascular
              Technologists is a professional community focused on
              education, knowledge sharing, innovation and collaboration
              in the field of cardiovascular interventions.
            </p>

            <div className="about-hero-actions">

              {/* <button
                type="button"
                className="about-primary-btn"
                onClick={handleMembershipClick}
              >
                Become a Member
                <ArrowRight size={17} />
              </button> */}

              <Link
                to="/team"
                className="about-secondary-btn"
              >
                Meet Our Team
              </Link>

            </div>

          </div>


          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="about-hero-visual">

            {/* Animated orbit rings */}

            <div className="about-orbit about-orbit-one" />
            <div className="about-orbit about-orbit-two" />
            <div className="about-orbit about-orbit-three" />


            {/* =================================================
                CENTRAL CORE
            ================================================= */}

            <div className="about-core">

              <div className="about-core-ring" />

              <HeartPulse
                size={92}
                strokeWidth={1.2}
              />

              <span>
                SNICT
              </span>

            </div>


            {/* =================================================
                HOME STYLE FLOATING CARDS

                01 - NEW GENERATION
            ================================================= */}

            <div className="about-floating-card about-card-one about-card-animated">

              <div className="about-floating-icon">
                <Sparkles size={19} />
              </div>

              <div>
                <strong>
                  New Generation
                </strong>

                <span>
                 Building the Future,
                </span>
              </div>

            </div>


            {/* =================================================
                02 - EXCELLENCE
            ================================================= */}

            <div className="about-floating-card about-card-two about-card-animated">

              <div className="about-floating-icon">
                <Award size={19} />
              </div>

              <div>
                <strong>
                  Excellence
                </strong>

                <span>
                 Striving for Excellence in Knowledge, Skills, Practice and Patient Care.
                </span>
              </div>

            </div>


            {/* =================================================
                03 - OPPORTUNITY
            ================================================= */}

            <div className="about-floating-card about-card-three about-card-animated">

              <div className="about-floating-icon">
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <strong>
                  Opportunity
                </strong>

                <span>
                Creating Opportunities for Growth, Leadership, Innovation and a better future.
                </span>
              </div>

            </div>


            {/* =================================================
                04 - TECHNOLOGY
            ================================================= */}

           


          </div>

        </div>

      </section>


      {/* =====================================================
          INTRODUCTION
      ===================================================== */}

      <section className="about-intro">

        <div className="about-container">

          <div className="about-section-heading">

            <span className="about-section-label">
              WHO WE ARE
            </span>

            <h2>
              A professional community
              <span> driven by knowledge.</span>
            </h2>

          </div>


          <div className="about-intro-grid">

            <div className="about-intro-main">

              <p>
                SNICT was formed with the intention of learning and
                improving the knowledge of cardiovascular technologists
                in line with newer advances in cardiology.
              </p>

              <p>
                The organization provides a platform where professionals
                can connect, discuss complicated procedures, techniques
                and experiences, and exchange ideas with one another.
              </p>

              <p>
                Through professional interaction and continuous
                education, SNICT aims to encourage cardiovascular
                technologists to remain connected with developments in
                the rapidly evolving field of cardiovascular
                interventions.
              </p>

            </div>


            <div className="about-intro-highlight">

              <div className="about-highlight-icon">
                <HeartPulse size={28} />
              </div>

              <span>
                OUR PURPOSE
              </span>

              <h3>
                Learn, connect and advance
                cardiovascular technology.
              </h3>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          VISION + MISSION
      ===================================================== */}

      <section className="about-vision-mission">

        <div className="about-container">

          <div className="about-vm-grid">

            {/* =================================================
                VISION
            ================================================= */}

            <article className="about-vm-card">

              <div className="about-vm-icon">
                <Eye size={25} />
              </div>

              <span>
                OUR VISION
              </span>

              <h2>
                Transforming cardiovascular
                care through excellence.
              </h2>

              <p>
                To encourage a professional environment where
                innovation, collaboration and continuous learning
                contribute to advancements in cardiovascular
                interventions and patient care.
              </p>

            </article>


            {/* =================================================
                MISSION
            ================================================= */}

            <article className="about-vm-card about-vm-featured">

              <div className="about-vm-icon">
                <Target size={25} />
              </div>

              <span>
                OUR MISSION
              </span>

              <h2>
                Advancing the field through
                education and collaboration.
              </h2>

              <p>
                To advance the field of cardiovascular interventions
                through innovation, education and collaboration, with
                a focus on improving patient outcomes and quality of
                life.
              </p>

            </article>

          </div>

        </div>

      </section>


      {/* =====================================================
          WHAT WE DO
      ===================================================== */}

      <section className="about-focus">

        <div className="about-container">

          <div className="about-focus-heading">

            <div>

              <span className="about-section-label">
                WHAT WE DO
              </span>

              <h2>
                Creating opportunities
                <span> to grow together.</span>
              </h2>

            </div>

            <p>
              SNICT focuses on professional development, knowledge
              exchange and collaboration within the cardiovascular
              technology community.
            </p>

          </div>


          <div className="about-focus-grid">

            {/* =================================================
                EDUCATION
            ================================================= */}

            <article className="about-focus-card">

              <div className="about-focus-top">

                <div className="about-focus-icon">
                  <GraduationCap size={25} />
                </div>

                <span>
                  01
                </span>

              </div>

              <h3>
                Professional Education
              </h3>

              <p>
                Supporting continuous learning and helping professionals
                stay informed about newer advances, procedures and
                technologies in cardiovascular interventions.
              </p>

            </article>


            {/* =================================================
                KNOWLEDGE
            ================================================= */}

            <article className="about-focus-card about-focus-featured">

              <div className="about-focus-top">

                <div className="about-focus-icon">
                  <BrainCircuit size={25} />
                </div>

                <span>
                  02
                </span>

              </div>

              <h3>
                Knowledge Sharing
              </h3>

              <p>
                Creating opportunities for professionals to discuss
                complex procedures, techniques and experiences and
                exchange practical knowledge.
              </p>

            </article>


            {/* =================================================
                COLLABORATION
            ================================================= */}

            <article className="about-focus-card">

              <div className="about-focus-top">

                <div className="about-focus-icon">
                  <Handshake size={25} />
                </div>

                <span>
                  03
                </span>

              </div>

              <h3>
                Collaboration
              </h3>

              <p>
                Connecting cardiovascular technologists and professionals
                to build a stronger network focused on shared learning
                and professional advancement.
              </p>

            </article>


            {/* =================================================
                INNOVATION
            ================================================= */}

            <article className="about-focus-card">

              <div className="about-focus-top">

                <div className="about-focus-icon">
                  <Sparkles size={25} />
                </div>

                <span>
                  04
                </span>

              </div>

              <h3>
                Innovation
              </h3>

              <p>
                Encouraging awareness of emerging technologies and
                approaches that can contribute to the future of
                cardiovascular interventions.
              </p>

            </article>

          </div>

        </div>

      </section>




      {/* =====================================================
          VALUES
      ===================================================== */}

      <section className="about-values">

        <div className="about-container">

          <div className="about-values-heading">

            <span className="about-section-label">
              OUR VALUES
            </span>

            <h2>
              Principles that guide
              <span> our community.</span>
            </h2>

          </div>


          <div className="about-values-grid">

            {/* =================================================
                EXCELLENCE
            ================================================= */}

            <div className="about-value">

              <div className="about-value-icon">
                <HeartPulse size={22} />
              </div>

              <h3>
                Excellence
              </h3>

              <p>
                Encouraging professional excellence and continuous
                improvement in cardiovascular care.
              </p>

            </div>


            {/* =================================================
                LEARNING
            ================================================= */}

            <div className="about-value">

              <div className="about-value-icon">
                <GraduationCap size={22} />
              </div>

              <h3>
                Learning
              </h3>

              <p>
                Promoting continuous education and sharing of
                professional knowledge.
              </p>

            </div>


            {/* =================================================
                COLLABORATION
            ================================================= */}

            <div className="about-value">

              <div className="about-value-icon">
                <Users size={22} />
              </div>

              <h3>
                Collaboration
              </h3>

              <p>
                Building meaningful professional relationships
                through communication and teamwork.
              </p>

            </div>


            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="about-value">

              <div className="about-value-icon">
                <Activity size={22} />
              </div>

              <h3>
                Progress
              </h3>

              <p>
                Supporting innovation and awareness of emerging
                cardiovascular technologies.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="about-cta">

        <div className="about-cta-grid" />

        <div className="about-container">

          <div className="about-cta-content">

            <span className="about-section-label">
              JOIN SNICT
            </span>

            <h2>
              Be part of the
              <span> professional community.</span>
            </h2>

            <p>
              Connect with professionals, participate in learning
              opportunities and contribute to the advancement of
              cardiovascular technology.
            </p>

            <div className="about-cta-actions">

              {/* <button
                type="button"
                className="about-cta-primary"
                onClick={() => {
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }

                  window.location.href = "/membership";
                }}
              >
                {user
                  ? "Become a Member"
                  : "Create Your Account"}
                <ArrowRight size={18} />
              </button> */}

              <Link
                to="/contact"
                className="about-cta-secondary"
              >
                Contact SNICT
              </Link>

            </div>

          </div>

        </div>

      </section>


      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() =>
          setShowLoginModal(false)
        }
      />

    </main>
  );
}

export default About;