import { useEffect, useState } from "react";

import {
  Users,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  UserCircle,
} from "lucide-react";

import api from "../../services/api";

import "./AcademicCommittee.css";

function AcademicCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/committees/academic"
      );

      if (response.data?.success) {
        setMembers(
          response.data.members || []
        );
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error(
        "Academic committee error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load Academic Committee."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <main className="academic-page">

      <div className="academic-grid" />

      <div className="academic-glow academic-glow-one" />
      <div className="academic-glow academic-glow-two" />

      {/* HERO */}

      <section className="academic-hero">

        <div className="academic-container">

          <div className="academic-hero-content">

            <div className="academic-icon">
              <GraduationCap size={37} />
            </div>

            <span>
              SNICT COMMITTEE
            </span>

            <h1>
              Academic
              <strong> Committee</strong>
            </h1>

            <p>
              Supporting academic development,
              learning initiatives, professional
              knowledge and educational growth.
            </p>

            <div className="academic-stat">

              <Users size={19} />

              <strong>
                {members.length}
              </strong>

              <span>
                Committee Members
              </span>

            </div>

          </div>

          <div className="academic-visual">

            <div className="academic-orbit academic-orbit-one" />

            <div className="academic-orbit academic-orbit-two" />

            <div className="academic-core">

              <GraduationCap
                size={65}
                strokeWidth={1.2}
              />

              <strong>
                SNICT
              </strong>

              <span>
                ACADEMIC
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* MEMBERS */}

      <section className="academic-members">

        <div className="academic-container">

          <header className="academic-heading">

            <span>
              ACADEMIC LEADERSHIP
            </span>

            <h2>
              Academic
              <strong> Committee</strong>
            </h2>

            <p>
              Meet the professionals supporting
              academic and educational development.
            </p>

          </header>

          {/* LOADING */}

          {loading && (
            <div className="academic-loading">

              <div className="academic-spinner" />

              <h3>
                Loading members...
              </h3>

              <p>
                Fetching Academic Committee
                information.
              </p>

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="academic-error">

              <AlertCircle size={27} />

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
                Retry
              </button>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            members.length === 0 && (
              <div className="academic-empty">

                <GraduationCap size={48} />

                <h3>
                  No members available
                </h3>

                <p>
                  Academic Committee members
                  will appear here.
                </p>

              </div>
            )}

          {/* MEMBERS */}

          {!loading &&
            !error &&
            members.length > 0 && (
              <div className="academic-members-grid">

                {members.map(
                  (member, index) => {

                    const name =
                      member.memberName ||
                      "Committee Member";

                    const designation =
                      member.designation ||
                      "Committee Member";

                    const bio =
                      member.bio || "";

                    const photo =
                      member.photoUrl || null;

                    const qualification =
                      member.qualification || "";

                    return (
                      <article
                        className="academic-member-card"
                        key={member.id}
                      >

                        <div className="academic-photo">

                          {photo ? (
                            <img
                              src={photo}
                              alt={name}
                              loading="lazy"
                            />
                          ) : (
                            <UserCircle
                              size={90}
                              strokeWidth={1}
                            />
                          )}

                          <span>
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </span>

                        </div>

                        <div className="academic-member-content">

                          <small>
                            ACADEMIC COMMITTEE
                          </small>

                          <h3>
                            {name}
                          </h3>

                          <strong>
                            {designation}
                          </strong>

                          {bio && (
                            <p className="academic-member-bio">
                              {bio}
                            </p>
                          )}

                          {qualification && (
                            <span className="academic-member-qualification">
                              {qualification}
                            </span>
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

export default AcademicCommittee;