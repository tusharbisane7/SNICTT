import { useEffect, useState } from "react";

import {
  Users,
  GraduationCap,
  ShieldCheck,
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

      const response =
        await api.get(
          "/committees/academic"
        );

      if (response.data?.success) {

        setMembers(
          response.data.members || []
        );

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
              <GraduationCap size={36} />
            </div>

            <span>
              SNICT COMMITTEE
            </span>

            <h1>
              Academic
              <strong> Committee</strong>
            </h1>

            <p>
              Driving academic excellence,
              professional education and
              continuous learning for SNICT
              members.
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

            <div className="academic-orbit" />

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
              Our Academic
              <strong> Committee</strong>
            </h2>

            <p>
              Meet the professionals contributing
              to SNICT's academic initiatives.
            </p>

          </header>


          {loading && (

            <div className="academic-loading">

              <div className="academic-spinner" />

              <p>
                Loading members...
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="academic-error">

              <AlertCircle size={26} />

              <span>
                {error}
              </span>

              <button
                onClick={fetchMembers}
              >
                <RefreshCw size={16} />
                Retry
              </button>

            </div>

          )}


          {!loading &&
            !error &&
            members.length === 0 && (

              <div className="academic-empty">

                <GraduationCap size={45} />

                <h3>
                  No members available
                </h3>

                <p>
                  Academic Committee members
                  will appear here.
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="academic-grid-members">

                {members.map(
                  (member, index) => (

                    <article
                      className="academic-member-card"
                      key={member.id}
                    >

                      <div className="academic-photo">

                        {member.photo_url ? (

                          <img
                            src={
                              member.photo_url
                            }
                            alt={
                              member.member_name
                            }
                          />

                        ) : (

                          <UserCircle
                            size={75}
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

                  )
                )}

              </div>

            )}

        </div>

      </section>

    </main>
  );
}


export default AcademicCommittee;