import {
  ArrowRight,
  Activity,
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

import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./About.css";

function About() {
  const { user } = useAuth();

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

              {!user && (
                <Link
                  to="/membership"
                  className="about-primary-btn"
                >
                  Become a Member
                  <ArrowRight size={17} />
                </Link>
              )}

              <Link
                to="/team"
                className="about-secondary-btn"
              >
                Meet Our Team
              </Link>

            </div>

          </div>


          {/* HERO VISUAL */}

          <div className="about-hero-visual">

            <div className="about-orbit about-orbit-one" />
            <div className="about-orbit about-orbit-two" />
            <div className="about-orbit about-orbit-three" />

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


            <div className="about-floating-card about-card-one">

              <GraduationCap size={19} />

              <div>
                <strong>
                  Education
                </strong>

                <span>
                  Continuous Learning
                </span>
              </div>

            </div>


            <div className="about-floating-card about-card-two">

              <Users size={19} />

              <div>
                <strong>
                  Community
                </strong>

                <span>
                  Professional Collaboration
                </span>
              </div>

            </div>


            <div className="about-floating-card about-card-three">

              <Sparkles size={17} />

              <span>
                Innovation
              </span>

            </div>

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

            {/* VISION */}

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


            {/* MISSION */}

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

            {/* EDUCATION */}

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


            {/* KNOWLEDGE */}

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


            {/* COLLABORATION */}

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


            {/* INNOVATION */}

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
          PROFESSIONAL COMMUNITY
      ===================================================== */}

      <section className="about-community">

        <div className="about-community-glow" />

        <div className="about-container">

          <div className="about-community-grid">

            <div className="about-community-visual">

              <div className="community-circle community-circle-one" />
              <div className="community-circle community-circle-two" />

              <div className="community-center">

                <Users size={52} />

                <strong>
                  SNICT
                </strong>

                <span>
                  Professional Community
                </span>

              </div>

            </div>


            <div className="about-community-content">

              <span className="about-section-label">
                OUR COMMUNITY
              </span>

              <h2>
                Connecting professionals
                <span> beyond institutions.</span>
              </h2>

              <p>
                Cardiovascular care continues to evolve rapidly.
                Professionals need opportunities to communicate,
                learn from one another and stay connected with
                developments in their field.
              </p>

              <p>
                SNICT provides a platform for such professional
                interaction by bringing cardiovascular technologists
                together around common interests, experiences and
                learning opportunities.
              </p>

              <Link
                to="/team"
                className="about-community-btn"
              >
                Meet Our Community
                <ArrowRight size={17} />
              </Link>

            </div>

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

              {!user && (
                <Link
                  to="/signup"
                  className="about-cta-primary"
                >
                  Create Your Account
                  <ArrowRight size={18} />
                </Link>
              )}

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

    </main>
  );
}

export default About