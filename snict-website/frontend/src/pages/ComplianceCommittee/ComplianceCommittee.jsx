import { useEffect, useState } from "react";

import {
  Users,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  UserCircle,
} from "lucide-react";

import api from "../../services/api";

import "./ComplianceCommittee.css";


function ComplianceCommittee() {

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const fetchMembers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/committees/compliance"
        );

      if (response.data?.success) {

        setMembers(
          response.data.members || []
        );

      }

    } catch (error) {

      console.error(
        "Compliance committee error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load Compliance Committee."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    fetchMembers();

  }, []);


  return (

    <main className="compliance-page">

      <div className="compliance-grid" />

      <div className="compliance-glow compliance-glow-one" />
      <div className="compliance-glow compliance-glow-two" />


      {/* HERO */}

      <section className="compliance-hero">

        <div className="compliance-container">

          <div className="compliance-hero-content">

            <div className="compliance-icon">
              <ShieldCheck size={37} />
            </div>

            <span>
              SNICT COMMITTEE
            </span>

            <h1>
              Compliance
              <strong> Committee</strong>
            </h1>

            <p>
              Supporting professional standards,
              governance, ethical practices and
              regulatory compliance.
            </p>

            <div className="compliance-stat">

              <Users size={19} />

              <strong>
                {members.length}
              </strong>

              <span>
                Committee Members
              </span>

            </div>

          </div>


          <div className="compliance-visual">

            <div className="compliance-ring compliance-ring-one" />

            <div className="compliance-ring compliance-ring-two" />

            <div className="compliance-core">

              <ShieldCheck
                size={65}
                strokeWidth={1.2}
              />

              <strong>
                SNICT
              </strong>

              <span>
                COMPLIANCE
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* MEMBERS */}

      <section className="compliance-members">

        <div className="compliance-container">

          <header className="compliance-heading">

            <span>
              PROFESSIONAL GOVERNANCE
            </span>

            <h2>
              Compliance
              <strong> Committee</strong>
            </h2>

            <p>
              Meet the members responsible for
              supporting professional standards
              and compliance.
            </p>

          </header>


          {loading && (

            <div className="compliance-loading">

              <div className="compliance-spinner" />

              <p>
                Loading members...
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="compliance-error">

              <AlertCircle size={27} />

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

              <div className="compliance-empty">

                <ShieldCheck size={48} />

                <h3>
                  No members available
                </h3>

                <p>
                  Compliance Committee members
                  will appear here.
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="compliance-members-grid">

                {members.map(
                  (member, index) => (

                    <article
                      className="compliance-member-card"
                      key={member.id}
                    >

                      <div className="compliance-photo">

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
                            size={76}
                            strokeWidth={1}
                          />

                        )}

                        <span>
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                      </div>


                      <div className="compliance-member-content">

                        <small>
                          COMPLIANCE COMMITTEE
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


export default ComplianceCommittee;