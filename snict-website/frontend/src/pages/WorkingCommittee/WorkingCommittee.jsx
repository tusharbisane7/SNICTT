import { useEffect, useState } from "react";

import {
  Users,
  ClipboardCheck,
  AlertCircle,
  RefreshCw,
  UserCircle,
} from "lucide-react";

import api from "../../services/api";

import "./WorkingCommittee.css";

function WorkingCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/committees/working"
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
        "Working committee error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load Working Committee."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <main className="working-page">

      <div className="working-grid" />

      <div className="working-glow working-glow-one" />
      <div className="working-glow working-glow-two" />

      {/* HERO */}

      <section className="working-hero">

        <div className="working-container">

          <div className="working-hero-content">

            <div className="working-icon">
              <ClipboardCheck size={37} />
            </div>

            <span>
              SNICT COMMITTEE
            </span>

            <h1>
              Working
              <strong> Committee</strong>
            </h1>

            <p>
              Coordinating SNICT activities,
              initiatives, member engagement
              and organizational operations.
            </p>

            <div className="working-stat">

              <Users size={19} />

              <strong>
                {members.length}
              </strong>

              <span>
                Committee Members
              </span>

            </div>

          </div>

          <div className="working-visual">

            <div className="working-orbit working-orbit-one" />

            <div className="working-orbit working-orbit-two" />

            <div className="working-core">

              <ClipboardCheck
                size={65}
                strokeWidth={1.2}
              />

              <strong>
                SNICT
              </strong>

              <span>
                WORKING
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* MEMBERS */}

      <section className="working-members">

        <div className="working-container">

          <header className="working-heading">

            <span>
              ORGANIZATIONAL LEADERSHIP
            </span>

            <h2>
              Working
              <strong> Committee</strong>
            </h2>

            <p>
              Meet the professionals coordinating
              SNICT's activities and initiatives.
            </p>

          </header>

          {/* LOADING */}

          {loading && (
            <div className="working-loading">

              <div className="working-spinner" />

              <h3>
                Loading members...
              </h3>

              <p>
                Fetching Working Committee
                information.
              </p>

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="working-error">

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
              <div className="working-empty">

                <ClipboardCheck size={48} />

                <h3>
                  No members available
                </h3>

                <p>
                  Working Committee members
                  will appear here.
                </p>

              </div>
            )}

          {/* MEMBERS */}

          {!loading &&
            !error &&
            members.length > 0 && (
              <div className="working-members-grid">

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
                        className="working-member-card"
                        key={member.id}
                      >

                        {/* PROFILE IMAGE */}

                        <div className="working-photo">

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

                        {/* MEMBER INFORMATION */}

                        <div className="working-member-content">

                          <small>
                            WORKING COMMITTEE
                          </small>

                          {/* NAME */}

                          <h3>
                            {name}
                          </h3>

                          {/* DESIGNATION */}

                          <strong>
                            {designation}
                          </strong>

                          {/* BIO */}

                          {bio && (
                            <p className="working-member-bio">
                              {bio}
                            </p>
                          )}

                          {/* QUALIFICATION */}

                          {qualification && (
                            <span className="working-member-qualification">
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

export default WorkingCommittee;