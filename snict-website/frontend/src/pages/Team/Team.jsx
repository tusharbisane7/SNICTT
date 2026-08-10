import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  Mail,
  ArrowRight,
  RefreshCw,
  HeartPulse,
  ChevronDown,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import "./Team.css";


function Team() {

  // =========================================================
  // STATE
  // =========================================================

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedDesignation, setSelectedDesignation] =
    useState("All");

  const [selectedMember, setSelectedMember] =
    useState(null);


  // =========================================================
  // LOAD REGISTERED MEMBERS
  // =========================================================

  const loadMembers = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get("/auth/members");

      console.log(
        "REGISTERED MEMBERS:",
        response.data
      );


      if (response.data?.success) {

        const data =
          response.data.members ||
          response.data.data ||
          [];

        setMembers(
          Array.isArray(data)
            ? data
            : []
        );

      } else {

        setError(
          response.data?.message ||
          "Unable to load members."
        );

      }

    } catch (err) {

      console.error(
        "Members loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to connect to SNICT server."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // LOAD MEMBERS
  // =========================================================

  useEffect(() => {

    loadMembers();

  }, []);


  // =========================================================
  // GET DESIGNATIONS
  // =========================================================

  const designations = useMemo(() => {

    const values =
      members
        .map(
          (member) =>
            member.designation ||
            member.position ||
            member.role
        )
        .filter(Boolean);


    return [
      "All",
      ...new Set(values),
    ];

  }, [members]);


  // =========================================================
  // FILTER MEMBERS
  // =========================================================

  const filteredMembers =
    useMemo(() => {

      if (
        selectedDesignation === "All"
      ) {

        return members;

      }


      return members.filter(
        (member) => {

          const designation =
            member.designation ||
            member.position ||
            member.role ||
            "";

          return (
            designation ===
            selectedDesignation
          );

        }
      );

    }, [
      members,
      selectedDesignation,
    ]);


  // =========================================================
  // MEMBER NAME
  // IMPORTANT:
  // ACTUAL REGISTERED USER NAME
  // =========================================================

  const getMemberName = (member) => {

    return (
      member.fullName ||
      member.full_name ||
      member.name ||
      member.username ||
      "Member"
    );

  };


  // =========================================================
  // MEMBER IMAGE
  // =========================================================

  const getMemberImage = (member) => {

    return (
      member.profileImageUrl ||
      member.profile_image_url ||
      member.image_url ||
      member.imageUrl ||
      member.image ||
      member.photo ||
      member.photo_url ||
      ""
    );

  };


  // =========================================================
  // MEMBER DESIGNATION
  // =========================================================

  const getMemberDesignation =
    (member) => {

      return (
        member.designation ||
        member.position ||
        member.role ||
        "SNICT Member"
      );

    };


  // =========================================================
  // MEMBER BIO
  // =========================================================

  const getMemberBio = (member) => {

    return (
      member.bio ||
      member.description ||
      ""
    );

  };


  // =========================================================
  // SHORT BIO
  // =========================================================

  const getShortBio = (bio) => {

    if (!bio) {

      return "";

    }


    const words =
      bio
        .trim()
        .split(/\s+/);


    if (words.length <= 28) {

      return bio;

    }


    return (
      words
        .slice(0, 28)
        .join(" ") +
      "..."
    );

  };


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  const handleImageError = (event) => {

    event.currentTarget.style.display =
      "none";


    const placeholder =
      event.currentTarget.parentElement
        ?.querySelector(
          ".team-image-placeholder"
        );


    if (placeholder) {

      placeholder.style.display =
        "flex";

    }

  };


  // =========================================================
  // OPEN MEMBER DETAILS
  // =========================================================

  const openMember = (member) => {

    setSelectedMember(member);

  };


  // =========================================================
  // CLOSE MEMBER DETAILS
  // =========================================================

  const closeMember = () => {

    setSelectedMember(null);

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


          {/* =================================================
              HERO CONTENT
          ================================================= */}

          <div className="team-hero-content">

            <div className="team-badge">

              <span></span>

              SNICT PROFESSIONAL COMMUNITY

            </div>


            <h1>

              Meet Our

              <span>
                {" "}Members.
              </span>

            </h1>


            <p>

              Meet the registered professionals
              who contribute to SNICT through
              education, collaboration and
              advancement in cardiovascular
              technology.

            </p>


            <div className="team-hero-actions">

              <a
                href="#members"
                className="team-primary-btn"
              >

                Meet Our Members

                <ArrowRight
                  size={17}
                />

              </a>


              {/* <Link
                to="/membership"
                className="team-secondary-btn"
              >

                Join SNICT

              </Link> */}

            </div>

          </div>


          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="team-hero-visual">

            <div className="team-orbit team-orbit-one"></div>

            <div className="team-orbit team-orbit-two"></div>

            <div className="team-orbit team-orbit-three"></div>


            <div className="team-core">

              <HeartPulse
                size={78}
                strokeWidth={1.2}
              />

              <strong>
                SNICT
              </strong>

              <span>
                OUR MEMBERS
              </span>

            </div>


            <div className="team-floating-card team-floating-one">

              <Users
                size={17}
              />

              <span>
                Professionals
              </span>

            </div>


            <div className="team-floating-card team-floating-two">

              <HeartPulse
                size={17}
              />

              <span>
                Cardiovascular Care
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MEMBERS SECTION
      ===================================================== */}

      <section
        className="team-members-section"
        id="members"
      >

        <div className="team-container">


          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <div className="members-header">

            <div>

              <span className="section-label">

                SNICT PROFESSIONALS

              </span>


              <h2>
                Our Members
              </h2>


              <p>

                Meet our registered members
                and cardiovascular professionals.

              </p>

            </div>


            {/* MEMBER COUNT */}

            <div className="member-count">

              <Users
                size={17}
              />

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
                      value={
                        selectedDesignation
                      }
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
                Loading members...
              </h3>


              <p>
                Fetching registered members
                from SNICT database.
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading &&
            error && (

              <div className="team-state error-state">

                <div className="state-icon">

                  <HeartPulse
                    size={27}
                  />

                </div>


                <h3>
                  Unable to load members
                </h3>


                <p>
                  {error}
                </p>


                <button
                  type="button"
                  className="retry-button"
                  onClick={loadMembers}
                >

                  <RefreshCw
                    size={16}
                  />

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

                  <Users
                    size={28}
                  />

                </div>


                <h3>
                  No registered members found
                </h3>


                <p>

                  Once users register with
                  SNICT, their profiles will
                  appear here.

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

                  <Users
                    size={28}
                  />

                </div>


                <h3>
                  No members found
                </h3>


                <p>

                  No member matches the
                  selected designation.

                </p>


                <button
                  type="button"
                  className="retry-button"
                  onClick={() =>
                    setSelectedDesignation(
                      "All"
                    )
                  }
                >

                  Show All Members

                </button>

              </div>

            )}


          {/* =================================================
              MEMBERS GRID
          ================================================= */}

          {!loading &&
            !error &&
            filteredMembers.length > 0 && (

              <div className="members-grid">

                {filteredMembers.map(
                  (
                    member,
                    index
                  ) => {

                    // =================================================
                    // ACTUAL REGISTERED NAME
                    // =================================================

                    const name =
                      getMemberName(
                        member
                      );


                    const designation =
                      getMemberDesignation(
                        member
                      );


                    const image =
                      getMemberImage(
                        member
                      );


                    const bio =
                      getMemberBio(
                        member
                      );


                    const shortBio =
                      getShortBio(
                        bio
                      );


                    const email =
                      member.email ||
                      "";


                    return (

                      <article
                        className="member-card"
                        key={
                          member.id ||
                          member._id ||
                          member.username ||
                          index
                        }
                      >


                        {/* =================================================
                            PROFILE IMAGE
                        ================================================= */}

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


                          {!image && (

                            <div
                              className="team-image-placeholder"
                              style={{
                                display: "flex",
                              }}
                            >

                              <Users
                                size={58}
                                strokeWidth={1.1}
                              />

                            </div>

                          )}


                          <div className="member-image-overlay"></div>


                          <span className="member-index">

                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}

                          </span>

                        </div>


                        {/* =================================================
                            MEMBER INFORMATION
                        ================================================= */}

                        <div className="member-info">


                          {/* DESIGNATION */}

                          <span className="member-designation">

                            {designation}

                          </span>


                          {/* =================================================
                              MEMBER NAME
                              THIS SHOWS REGISTERED USER NAME
                          ================================================= */}

                          <h3 className="member-name">

                            {name}

                          </h3>


                          {/* USERNAME */}

                          {member.username && (

                            <span className="member-username">

                              @{member.username}

                            </span>

                          )}


                          {/* SHORT BIO */}

                          {shortBio && (

                            <p className="member-bio">

                              {shortBio}

                            </p>

                          )}


                          {/* EMAIL */}

                          {email && (

                            <a
                              href={`mailto:${email}`}
                              className="member-email"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >

                              <Mail
                                size={15}
                              />

                              <span>
                                {email}
                              </span>

                            </a>

                          )}


                          {/* READ MORE */}

                          {bio && (

                            <button
                              type="button"
                              className="member-read-more"
                              onClick={() =>
                                openMember(
                                  member
                                )
                              }
                            >

                              Read Full Bio

                              <ArrowRight
                                size={14}
                              />

                            </button>

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
          MEMBER BIO MODAL
      ===================================================== */}

      {selectedMember && (

        <div
          className="member-modal-overlay"
          onClick={closeMember}
        >

          <div
            className="member-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="member-modal-close"
              onClick={closeMember}
              aria-label="Close"
            >

              <X
                size={20}
              />

            </button>


            {/* PROFILE IMAGE */}

            <div className="member-modal-image">

              {getMemberImage(
                selectedMember
              ) ? (

                <img
                  src={
                    getMemberImage(
                      selectedMember
                    )
                  }
                  alt={getMemberName(
                    selectedMember
                  )}
                />

              ) : (

                <Users
                  size={55}
                />

              )}

            </div>


            {/* DESIGNATION */}

            <span className="member-designation">

              {getMemberDesignation(
                selectedMember
              )}

            </span>


            {/* NAME */}

            <h2>

              {getMemberName(
                selectedMember
              )}

            </h2>


            {/* USERNAME */}

            {selectedMember.username && (

              <span className="member-modal-username">

                @{selectedMember.username}

              </span>

            )}


            {/* FULL BIO */}

            <p className="member-modal-bio">

              {getMemberBio(
                selectedMember
              )}

            </p>


            {/* EMAIL */}

            {selectedMember.email && (

              <a
                href={`mailto:${selectedMember.email}`}
                className="member-modal-email"
              >

                <Mail
                  size={16}
                />

                {selectedMember.email}

              </a>

            )}

          </div>

        </div>

      )}


   

  


    </main>

  );

}


export default Team;