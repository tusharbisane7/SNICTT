import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Mail,
  ArrowRight,
  RefreshCw,
  HeartPulse,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "./Team.css";

function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER
  const [selectedDesignation, setSelectedDesignation] =
    useState("All");

  // =========================================================
  // LOAD MEMBERS
  // =========================================================

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/committees");

      console.log("TEAM API:", response.data);

      if (response.data?.success) {
        const data =
          response.data.members ||
          response.data.committees ||
          response.data.data ||
          [];

        setMembers(Array.isArray(data) ? data : []);
      } else {
        setError(
          response.data?.message ||
            "Unable to load team members."
        );
      }
    } catch (err) {
      console.error("Team loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to connect to SNICT server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // =========================================================
  // GET UNIQUE DESIGNATIONS
  // =========================================================

  const designations = useMemo(() => {
    const values = members
      .map(
        (member) =>
          member.designation ||
          member.position ||
          member.role
      )
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [members]);

  // =========================================================
  // FILTER MEMBERS
  // =========================================================

  const filteredMembers = useMemo(() => {
    if (selectedDesignation === "All") {
      return members;
    }

    return members.filter((member) => {
      const designation =
        member.designation ||
        member.position ||
        member.role ||
        "";

      return designation === selectedDesignation;
    });
  }, [members, selectedDesignation]);

  // =========================================================
  // IMAGE ERROR
  // =========================================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";

    const placeholder =
      event.currentTarget.parentElement.querySelector(
        ".team-image-placeholder"
      );

    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="team-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="team-hero">

        <div className="team-hero-bg">
          <div className="team-grid"></div>
          <div className="team-glow team-glow-one"></div>
          <div className="team-glow team-glow-two"></div>
        </div>

        <div className="team-hero-container">

          <div className="team-hero-content">

            <div className="team-badge">
              <span></span>
              SNICT PROFESSIONAL COMMUNITY
            </div>

            <h1>
              Meet Our
              <span> Team.</span>
            </h1>

            <p>
              Meet the professionals who contribute
              to SNICT through education,
              collaboration and advancement in
              cardiovascular technology.
            </p>

            <div className="team-hero-actions">

              <a
                href="#members"
                className="team-primary-btn"
              >
                Meet Our Members
                <ArrowRight size={17} />
              </a>

              <Link
                to="/membership"
                className="team-secondary-btn"
              >
                Join SNICT
              </Link>

            </div>

          </div>

          <div className="team-hero-visual">

            <div className="team-orbit team-orbit-one"></div>
            <div className="team-orbit team-orbit-two"></div>
            <div className="team-orbit team-orbit-three"></div>

            <div className="team-core">

              <HeartPulse
                size={78}
                strokeWidth={1.2}
              />

              <strong>SNICT</strong>

              <span>OUR TEAM</span>

            </div>

            <div className="team-floating-card team-floating-one">
              <Users size={17} />
              <span>Professionals</span>
            </div>

            <div className="team-floating-card team-floating-two">
              <HeartPulse size={17} />
              <span>Cardiovascular Care</span>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          MEMBERS
      ===================================================== */}

      <section
        className="team-members-section"
        id="members"
      >

        <div className="team-container">

          <div className="members-header">

            <div>
              <span className="section-label">
                SNICT PROFESSIONALS
              </span>

              <h2>
                Our Team
              </h2>

              <p>
                Meet the members and professionals
                contributing to SNICT.
              </p>
            </div>


            {/* MEMBER COUNT */}

            <div className="member-count">
              <Users size={17} />

              <span>
                {filteredMembers.length}{" "}
                {filteredMembers.length === 1
                  ? "Member"
                  : "Members"}
              </span>
            </div>

          </div>


          {/* =================================================
              FILTER
          ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="team-filter-bar">

                <div className="filter-left">

                  <span className="filter-label">
                    FILTER BY DESIGNATION
                  </span>

                  <div className="filter-select-wrapper">

                    <select
                      value={selectedDesignation}
                      onChange={(event) =>
                        setSelectedDesignation(
                          event.target.value
                        )
                      }
                      className="team-filter-select"
                    >

                      {designations.map(
                        (designation) => (
                          <option
                            value={designation}
                            key={designation}
                          >
                            {designation === "All"
                              ? "All Members"
                              : designation}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={17}
                      className="filter-chevron"
                    />

                  </div>

                </div>


                <div className="filter-result">
                  Showing{" "}
                  <strong>
                    {filteredMembers.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {members.length}
                  </strong>{" "}
                  members
                </div>

              </div>
            )}


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="team-state">

              <div className="loading-spinner"></div>

              <h3>
                Loading team members...
              </h3>

              <p>
                Fetching members from SNICT database.
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (

            <div className="team-state error-state">

              <div className="state-icon">
                <HeartPulse size={27} />
              </div>

              <h3>
                Unable to load team
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="retry-button"
                onClick={loadMembers}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>

          )}


          {/* =================================================
              NO MEMBERS
          ================================================= */}

          {!loading &&
            !error &&
            members.length === 0 && (

              <div className="team-state">

                <div className="state-icon">
                  <Users size={28} />
                </div>

                <h3>
                  No team members found
                </h3>

                <p>
                  Add members from the Admin
                  Committee Management panel.
                </p>

              </div>

            )}


          {/* =================================================
              FILTER EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 &&
            filteredMembers.length === 0 && (

              <div className="team-state">

                <div className="state-icon">
                  <Users size={28} />
                </div>

                <h3>
                  No members found
                </h3>

                <p>
                  No member matches the selected
                  designation.
                </p>

                <button
                  type="button"
                  className="retry-button"
                  onClick={() =>
                    setSelectedDesignation("All")
                  }
                >
                  Show All Members
                </button>

              </div>

            )}


          {/* =================================================
              MEMBER CARDS
          ================================================= */}

          {!loading &&
            !error &&
            filteredMembers.length > 0 && (

              <div className="members-grid">

                {filteredMembers.map(
                  (member, index) => {

                    const name =
                      member.name ||
                      member.full_name ||
                      member.fullName ||
                      "SNICT Member";

                    const designation =
                      member.designation ||
                      member.position ||
                      member.role ||
                      "Member";

                    const image =
                      member.image_url ||
                      member.imageUrl ||
                      member.image ||
                      member.photo ||
                      member.photo_url ||
                      "";

                    const email =
                      member.email || "";

                    const bio =
                      member.bio ||
                      member.description ||
                      "";

                    return (
                      <article
                        className="member-card"
                        key={
                          member.id ||
                          member._id ||
                          index
                        }
                      >

                        {/* MEMBER IMAGE */}

                        <div className="member-image-wrapper">

                          {image && (
                            <img
                              src={image}
                              alt={`${name} - ${designation}`}
                              className="member-image"
                              onError={
                                handleImageError
                              }
                            />
                          )}

                          <div
                            className="team-image-placeholder"
                            style={{
                              display: image
                                ? "none"
                                : "flex",
                            }}
                          >
                            <Users
                              size={58}
                              strokeWidth={1.1}
                            />
                          </div>

                          <div className="member-image-overlay"></div>

                          <span className="member-index">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </span>

                        </div>


                        {/* MEMBER INFORMATION */}

                        <div className="member-info">

                          {/* DESIGNATION */}

                          <span className="member-designation">
                            {designation}
                          </span>


                          {/* NAME */}

                          <h3 className="member-name">
                            {name}
                          </h3>


                          {/* BIO */}

                          {bio && (
                            <p className="member-bio">
                              {bio}
                            </p>
                          )}


                          {/* EMAIL */}

                          {email && (
                            <a
                              href={`mailto:${email}`}
                              className="member-email"
                            >

                              <Mail size={15} />

                              <span>
                                {email}
                              </span>

                            </a>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="team-cta">

        <div className="team-container">

          <span className="section-label">
            JOIN SNICT
          </span>

          <h2>
            Be part of the
            <span> professional community.</span>
          </h2>

          <p>
            Connect with cardiovascular
            technologists and contribute to
            knowledge sharing and professional
            advancement.
          </p>

          <Link
            to="/signup"
            className="team-cta-button"
          >
            Become a Member
            <ArrowRight size={18} />
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Team;