import { useEffect, useState } from "react";

import {
  Users,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  UserCircle,
} from "lucide-react";

import api from "../../services/api";

import "./PlacementCommittee.css";


function PlacementCommittee() {

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // FETCH MEMBERS
  // =========================================================

  const fetchMembers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/committees/placement"
        );

      if (
        response.data?.success
      ) {

        setMembers(
          response.data.members || []
        );

      } else {

        setMembers([]);

      }

    } catch (error) {

      console.error(
        "Placement committee error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load Placement Committee members."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    fetchMembers();

  }, []);


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="placement-page">

      {/* BACKGROUND */}

      <div className="placement-grid" />

      <div className="placement-glow placement-glow-one" />

      <div className="placement-glow placement-glow-two" />


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="placement-hero">

        <div className="placement-container">

          <div className="placement-hero-content">

            <div className="placement-icon">
              <BriefcaseBusiness size={36} />
            </div>

            <span className="placement-label">
              SNICT COMMITTEE
            </span>

            <h1>
              Placement
              <span> Committee</span>
            </h1>

            <p>
              Supporting SNICT members with
              professional opportunities,
              career development and industry
              connections.
            </p>

            <div className="placement-stats">

              <div>
                <Users size={18} />

                <span>
                  {members.length}
                </span>

                <small>
                  Members
                </small>
              </div>


              <div>
                <ShieldCheck size={18} />

                <span>
                  Active
                </span>

                <small>
                  Committee
                </small>
              </div>

            </div>

          </div>


          <div className="placement-hero-visual">

            <div className="placement-orbit placement-orbit-one" />

            <div className="placement-orbit placement-orbit-two" />

            <div className="placement-core">

              <BriefcaseBusiness
                size={65}
                strokeWidth={1.2}
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
          MEMBERS
      ===================================================== */}

      <section className="placement-members">

        <div className="placement-container">

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
              Our committee members working
              towards professional growth and
              career opportunities.
            </p>

          </div>


          {/* LOADING */}

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


          {/* ERROR */}

          {!loading && error && (

            <div className="placement-error">

              <AlertCircle size={28} />

              <div>

                <h3>
                  Unable to load members
                </h3>

                <p>
                  {error}
                </p>

              </div>

              <button
                onClick={fetchMembers}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            members.length === 0 && (

              <div className="placement-empty">

                <Users size={45} />

                <h3>
                  No committee members
                </h3>

                <p>
                  Members will appear here
                  after the administrator adds
                  them.
                </p>

              </div>

            )}


          {/* MEMBERS GRID */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="placement-members-grid">

                {members.map(
                  (member, index) => {

                    const photo =
                      member.photo_url;

                    return (

                      <article
                        className="placement-member-card"
                        key={member.id}
                      >

                        <div className="placement-member-photo">

                          {photo ? (

                            <img
                              src={photo}
                              alt={
                                member.member_name
                              }
                              loading="lazy"
                            />

                          ) : (

                            <UserCircle
                              size={80}
                              strokeWidth={1}
                            />

                          )}

                          <span>
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </span>

                        </div>


                        <div className="placement-member-info">

                          <small>
                            COMMITTEE MEMBER
                          </small>

                          <h3>
                            {member.member_name}
                          </h3>

                          <strong>
                            {member.designation ||
                              "Committee Member"}
                          </strong>

                          {member.qualification && (
                            <p>
                              {member.qualification}
                            </p>
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

    </main>
  );
}


export default PlacementCommittee;