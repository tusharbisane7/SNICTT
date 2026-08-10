import { useEffect, useMemo, useState } from "react";

import {
  Users,
  HeartPulse,
  Filter,
  ChevronDown,
  Building2,
} from "lucide-react";

import api from "../../services/api";

import "./Committees.css";

function Committees() {
  const [members, setMembers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCommittee, setSelectedCommittee] =
    useState("all");

  // =========================================================
  // LOAD COMMITTEE MEMBERS
  // =========================================================

  useEffect(() => {
    const loadCommittees = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/committees");

        if (
          response.data?.success &&
          Array.isArray(
            response.data?.members
          )
        ) {
          setMembers(
            response.data.members
          );
        } else {
          setMembers(
            response.data?.members || []
          );
        }
      } catch (error) {
        console.error(
          "Committee loading error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load committees."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCommittees();
  }, []);

  // =========================================================
  // GET UNIQUE ORGANIZATIONS / COMMITTEES
  // =========================================================

  const committees = useMemo(() => {
    const uniqueCommittees =
      members
        .map(
          (member) =>
            member.committee_name
        )
        .filter(Boolean);

    return [
      ...new Set(uniqueCommittees),
    ];
  }, [members]);

  // =========================================================
  // FILTER MEMBERS
  // =========================================================

  const filteredMembers = useMemo(() => {
    if (
      selectedCommittee === "all"
    ) {
      return members;
    }

    return members.filter(
      (member) =>
        member.committee_name ===
        selectedCommittee
    );
  }, [
    members,
    selectedCommittee,
  ]);

  // =========================================================
  // GROUP FILTERED MEMBERS
  // =========================================================

  const grouped = useMemo(() => {
    return filteredMembers.reduce(
      (groups, member) => {
        const committeeName =
          member.committee_name ||
          "Other";

        if (
          !groups[committeeName]
        ) {
          groups[committeeName] = [];
        }

        groups[committeeName].push(
          member
        );

        return groups;
      },
      {}
    );
  }, [filteredMembers]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="committees-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="committees-hero">

        <div className="committees-hero-content">

          <span className="committees-hero-label">
            SNICT
          </span>

          <h1>
            Our Committees
          </h1>

          <p>
            Meet the professionals
            contributing to the SNICT
            community through leadership,
            education and collaboration.
          </p>

        </div>

      </section>


      {/* =================================================
          FILTER SECTION
      ================================================= */}

      {!loading &&
        !error &&
        members.length > 0 && (

          <section className="committees-filter-section">

            <div className="committees-filter-container">

              <div className="committees-filter-info">

                <div className="committees-filter-icon">
                  <Filter size={19} />
                </div>

                <div>

                  <span>
                    FILTER COMMITTEES
                  </span>

                  <strong>
                    Explore by organization
                  </strong>

                </div>

              </div>


              <div className="committees-filter-control">

                <label
                  htmlFor="committee-filter"
                >
                  Organization
                </label>

                <div className="committee-select-wrapper">

                  <Building2
                    size={17}
                    className="committee-select-icon"
                  />

                  <select
                    id="committee-filter"
                    value={
                      selectedCommittee
                    }
                    onChange={(event) =>
                      setSelectedCommittee(
                        event.target.value
                      )
                    }
                    className="committee-filter-select"
                  >

                    <option value="all">
                      All Organizations
                    </option>

                    {committees.map(
                      (committee) => (
                        <option
                          key={committee}
                          value={committee}
                        >
                          {committee}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={17}
                    className="committee-select-chevron"
                  />

                </div>

              </div>


              <div className="committees-filter-count">

                <strong>
                  {
                    filteredMembers.length
                  }
                </strong>

                <span>
                  {filteredMembers.length ===
                  1
                    ? "Member"
                    : "Members"}
                </span>

              </div>

            </div>

          </section>
        )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="committees-state">

          <div className="committees-spinner"></div>

          <h3>
            Loading committees
          </h3>

          <p>
            Please wait while we load
            the SNICT committee members.
          </p>

        </div>
      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (
        <div className="committees-state committees-error-state">

          <div className="committees-state-icon">
            <HeartPulse size={25} />
          </div>

          <h3>
            Unable to load committees
          </h3>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="committees-retry-button"
            onClick={() =>
              window.location.reload()
            }
          >
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

          <div className="committees-state">

            <div className="committees-state-icon">
              <Users size={25} />
            </div>

            <h3>
              No committee members yet
            </h3>

            <p>
              Committee information will
              appear here once members are
              added by the administrator.
            </p>

          </div>
        )}


      {/* =================================================
          COMMITTEE LIST
      ================================================= */}

      {!loading &&
        !error &&
        members.length > 0 && (

          <section className="committees-container">

            {Object.entries(grouped).length >
            0 ? (

              Object.entries(grouped).map(
                ([
                  committeeName,
                  committeeMembers,
                ]) => (

                  <article
                    className="committee-public-card"
                    key={committeeName}
                  >

                    {/* ===============================
                        COMMITTEE HEADER
                    =============================== */}

                    <div className="committee-public-header">

                      <div className="committee-public-icon">
                        <Users size={22} />
                      </div>

                      <div className="committee-public-heading">

                        <span>
                          ORGANIZATION
                        </span>

                        <h2>
                          {committeeName}
                        </h2>

                      </div>

                      <div className="committee-member-count">

                        {committeeMembers.length}

                        <span>
                          {committeeMembers.length ===
                          1
                            ? "Member"
                            : "Members"}
                        </span>

                      </div>

                    </div>


                    {/* ===============================
                        MEMBERS
                    =============================== */}

                    <div className="committee-public-members">

                      {committeeMembers.map(
                        (
                          member,
                          index
                        ) => (

                          <div
                            className="public-member"
                            key={
                              member.id ||
                              `${committeeName}-${index}`
                            }
                          >

                            {/* PHOTO */}

                            <div className="public-member-photo">

                              {member.photo_url ? (

                                <img
                                  src={
                                    member.photo_url
                                  }
                                  alt={
                                    member.member_name ||
                                    "Committee Member"
                                  }
                                  loading="lazy"
                                />

                              ) : (

                                <div className="public-member-placeholder">

                                  <HeartPulse
                                    size={25}
                                  />

                                </div>

                              )}

                            </div>


                            {/* DETAILS */}

                            <div className="public-member-details">

                              <h3>
                                {
                                  member.member_name ||
                                  "SNICT Member"
                                }
                              </h3>


                              {member.designation && (
                                <span className="public-member-designation">
                                  {
                                    member.designation
                                  }
                                </span>
                              )}


                              {member.qualification && (
                                <small className="public-member-qualification">
                                  {
                                    member.qualification
                                  }
                                </small>
                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </article>

                )
              )

            ) : (

              <div className="committees-state">

                <div className="committees-state-icon">
                  <Filter size={25} />
                </div>

                <h3>
                  No members found
                </h3>

                <p>
                  No members are available
                  for the selected organization.
                </p>

                <button
                  type="button"
                  className="committees-retry-button"
                  onClick={() =>
                    setSelectedCommittee(
                      "all"
                    )
                  }
                >
                  Show All Members
                </button>

              </div>

            )}

          </section>
        )}

    </main>
  );
}

export default Committees;