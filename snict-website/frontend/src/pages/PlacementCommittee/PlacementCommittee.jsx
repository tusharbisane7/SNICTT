import { useEffect, useState } from "react";

import {
  Users,
  BriefcaseBusiness,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  UserCircle,
  GraduationCap,
  FileText,
} from "lucide-react";

import api from "../../services/api";

import "./PlacementCommittee.css";


function PlacementCommittee() {

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =========================================================
  // FETCH PLACEMENT COMMITTEE MEMBERS
  // =========================================================

  const fetchMembers = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await api.get(
        "/committees/placement"
      );


      if (response.data?.success) {

        setMembers(
          Array.isArray(
            response.data.members
          )
            ? response.data.members
            : []
        );

      } else {

        setMembers([]);

        setError(
          response.data?.message ||
          "Unable to load Placement Committee members."
        );

      }

    } catch (error) {

      console.error(
        "Placement committee error:",
        error
      );

      setMembers([]);

      setError(
        error.response?.data?.message ||
        "Unable to load Placement Committee members."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    fetchMembers();

  }, []);


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="placement-page">


      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="placement-grid" />

      <div
        className="
          placement-glow
          placement-glow-one
        "
      />

      <div
        className="
          placement-glow
          placement-glow-two
        "
      />


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="placement-hero">

        <div className="placement-container">

          <div className="placement-hero-content">


            {/* ICON */}

            <div className="placement-icon">

              <BriefcaseBusiness
                size={38}
                strokeWidth={1.7}
              />

            </div>


            {/* LABEL */}

            <span className="placement-label">

              SNICT COMMITTEE

            </span>


            {/* TITLE */}

            <h1>

              Placement

              <span>
                {" "}Committee
              </span>

            </h1>


            {/* DESCRIPTION */}

            <p>

              Supporting SNICT members with
              professional opportunities,
              career development and industry
              connections.

            </p>


            {/* =================================================
                STATS
            ================================================= */}

            <div className="placement-stats">


              {/* MEMBERS */}

              <div className="placement-stat">

                <div className="placement-stat-icon">

                  <Users
                    size={20}
                  />

                </div>

                <div>

                  <span>
                    {members.length}
                  </span>

                  <small>
                    Members
                  </small>

                </div>

              </div>


              {/* STATUS */}

              <div className="placement-stat">

                <div className="placement-stat-icon">

                  <ShieldCheck
                    size={20}
                  />

                </div>

                <div>

                  <span>
                    Active
                  </span>

                  <small>
                    Committee
                  </small>

                </div>

              </div>


            </div>

          </div>


          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="placement-hero-visual">

            <div
              className="
                placement-orbit
                placement-orbit-one
              "
            />

            <div
              className="
                placement-orbit
                placement-orbit-two
              "
            />


            <div className="placement-core">

              <BriefcaseBusiness
                size={68}
                strokeWidth={1.15}
              />

              <strong>
                SNICT
              </strong>

              <span>
                PLACEMENT
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MEMBERS SECTION
      ===================================================== */}

      <section className="placement-members">

        <div className="placement-container">


          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <div className="placement-section-header">

            <span>
              COMMITTEE MEMBERS
            </span>

            <h2>

              Meet the{" "}

              <strong>
                Placement Committee
              </strong>

            </h2>

            <p>

              Meet the professionals working
              together to support career
              development and industry
              opportunities for SNICT members.

            </p>

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="placement-loading">

              <div className="placement-spinner" />

              <h3>
                Loading members...
              </h3>

              <p>
                Fetching Placement Committee
                information.
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (

            <div className="placement-error">


              <div className="placement-error-icon">

                <AlertCircle
                  size={28}
                />

              </div>


              <div className="placement-error-content">

                <h3>
                  Unable to load members
                </h3>

                <p>
                  {error}
                </p>

              </div>


              <button
                type="button"
                onClick={fetchMembers}
                className="placement-retry-button"
              >

                <RefreshCw
                  size={17}
                />

                Try Again

              </button>

            </div>

          )}


          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            members.length === 0 && (

              <div className="placement-empty">

                <div className="placement-empty-icon">

                  <Users
                    size={45}
                  />

                </div>

                <h3>
                  No committee members
                </h3>

                <p>

                  Members will appear here
                  after the administrator
                  adds them.

                </p>

              </div>

            )}


          {/* =================================================
              MEMBERS GRID
          ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="placement-members-grid">

                {members.map(
                  (member, index) => {

                    const photo =
                      member.photoUrl ||
                      member.photo_url ||
                      null;

                    const name =
                      member.memberName ||
                      member.member_name ||
                      "Committee Member";

                    const designation =
                      member.designation ||
                      "Committee Member";

                    const qualification =
                      member.qualification ||
                      "";

                    const bio =
                      member.bio ||
                      member.memberBio ||
                      "";


                    return (

                      <article
                        className="placement-member-card"
                        key={member.id}
                      >


                        {/* =================================================
                            PHOTO
                        ================================================= */}

                        <div className="placement-member-photo">


                          {photo ? (

                            <img
                              src={photo}
                              alt={`${name} - ${designation}`}
                              loading="lazy"
                            />

                          ) : (

                            <div className="placement-photo-placeholder">

                              <UserCircle
                                size={85}
                                strokeWidth={1}
                              />

                            </div>

                          )}


                          {/* NUMBER */}

                          <span className="placement-member-number">

                            {String(
                              index + 1
                            ).padStart(2, "0")}

                          </span>


                          {/* PHOTO OVERLAY */}

                          <div className="placement-photo-overlay" />

                        </div>


                        {/* =================================================
                            MEMBER INFORMATION
                        ================================================= */}

                        <div className="placement-member-info">


                          {/* TAG */}

                          <small className="placement-member-tag">

                            COMMITTEE MEMBER

                          </small>


                          {/* NAME */}

                          <h3>
                            {name}
                          </h3>


                          {/* DESIGNATION */}

                          <div className="placement-designation">

                            <BriefcaseBusiness
                              size={15}
                            />

                            <strong>
                              {designation}
                            </strong>

                          </div>


                          {/* QUALIFICATION */}

                          {qualification && (

                            <div className="placement-qualification">

                              <GraduationCap
                                size={15}
                              />

                              <span>
                                {qualification}
                              </span>

                            </div>

                          )}


                          {/* BIO */}

                          {bio && (

                            <div className="placement-member-bio">

                              <div className="placement-bio-icon">

                                <FileText
                                  size={15}
                                />

                              </div>

                              <p>
                                {bio}
                              </p>

                            </div>

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
          BOTTOM CTA
      ===================================================== */}

      {!loading &&
        !error &&
        members.length > 0 && (

          <section className="placement-bottom">

            <div className="placement-container">

              <div className="placement-bottom-card">

                <div>

                  <span>
                    SNICT PLACEMENT
                  </span>

                  <h2>
                    Building careers.
                    <strong>
                      Creating opportunities.
                    </strong>
                  </h2>

                  <p>
                    Our Placement Committee
                    works towards connecting
                    members with meaningful
                    professional opportunities.
                  </p>

                </div>

                <BriefcaseBusiness
                  size={55}
                  strokeWidth={1.1}
                />

              </div>

            </div>

          </section>

        )}

    </main>

  );

}


export default PlacementCommittee;