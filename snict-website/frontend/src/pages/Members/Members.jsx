import { useEffect, useState } from "react";

import {
  UserCircle,
  Users,
  ArrowRight,
  Search,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";

import api from "../../services/api";

import "./Members.css";


// =========================================================
// HELPERS
// =========================================================

const getInitials = (name = "") => {

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

};


const getShortBio = (
  bio = "",
  words = 25
) => {

  const text = bio.trim();

  if (!text) {
    return "SNICT member.";
  }

  const parts =
    text.split(/\s+/);

  if (parts.length <= words) {
    return text;
  }

  return (
    parts
      .slice(0, words)
      .join(" ") + "..."
  );

};


// =========================================================
// MEMBERS PAGE
// =========================================================

function Members() {

  // =======================================================
  // STATE
  // =======================================================

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedMember, setSelectedMember] =
    useState(null);


  // =======================================================
  // FETCH MEMBERS
  // =======================================================

  const fetchMembers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/auth/members"
        );

      if (
        response.data?.success
      ) {

        setMembers(
          response.data.members ||
          []
        );

      } else {

        setMembers([]);

        setError(
          response.data?.message ||
          "Unable to load members."
        );

      }

    } catch (error) {

      console.error(
        "Members fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load SNICT members. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // LOAD
  // =======================================================

  useEffect(() => {

    fetchMembers();

  }, []);


  // =======================================================
  // SEARCH
  // =======================================================

  const filteredMembers =
    members.filter(
      (member) => {

        const searchText =
          search
            .trim()
            .toLowerCase();

        if (!searchText) {
          return true;
        }

        return (

          member.fullName
            ?.toLowerCase()
            .includes(searchText) ||

          member.username
            ?.toLowerCase()
            .includes(searchText) ||

          member.designation
            ?.toLowerCase()
            .includes(searchText) ||

          member.bio
            ?.toLowerCase()
            .includes(searchText)

        );

      }
    );


  // =======================================================
  // IMAGE URL
  // =======================================================

  const getImageUrl = (
    image
  ) => {

    if (!image) {
      return "";
    }

    // Cloud URL
    if (
      image.startsWith(
        "http://"
      ) ||
      image.startsWith(
        "https://"
      )
    ) {

      return image;

    }

    // Local backend image
    const baseUrl =
      api.defaults?.baseURL
        ?.replace(
          /\/api\/?$/,
          ""
        ) || "";

    return `${baseUrl}${image}`;

  };


  // =======================================================
  // OPEN MEMBER
  // =======================================================

  const openMember = (
    member
  ) => {

    setSelectedMember(
      member
    );

    document.body.style.overflow =
      "hidden";

  };


  // =======================================================
  // CLOSE MEMBER
  // =======================================================

  const closeMember = () => {

    setSelectedMember(
      null
    );

    document.body.style.overflow =
      "";

  };


  // =======================================================
  // CLEANUP
  // =======================================================

  useEffect(() => {

    return () => {

      document.body.style.overflow =
        "";

    };

  }, []);


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <main className="members-page">

        <div
          className="members-background"
          aria-hidden="true"
        />

        <div className="members-container">

          <section className="members-loading">

            <div className="members-loading-icon">

              <Users
                size={32}
              />

            </div>

            <div className="members-loader" />

            <h2>
              Loading Members
            </h2>

            <p>
              Fetching registered SNICT members...
            </p>

          </section>

        </div>

      </main>

    );

  }


  // =======================================================
  // ERROR
  // =======================================================

  if (
    error &&
    members.length === 0
  ) {

    return (

      <main className="members-page">

        <div
          className="members-background"
          aria-hidden="true"
        />

        <div className="members-container">

          <section className="members-error">

            <div className="members-error-icon">

              <AlertCircle
                size={30}
              />

            </div>

            <span>
              MEMBERS
            </span>

            <h1>
              Unable to Load Members
            </h1>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={
                fetchMembers
              }
              className="members-retry"
            >

              <RefreshCw
                size={17}
              />

              Try Again

            </button>

          </section>

        </div>

      </main>

    );

  }


  // =======================================================
  // UI
  // =======================================================

  return (

    <main className="members-page">

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        className="members-background"
        aria-hidden="true"
      />

      <div
        className="members-orb members-orb-one"
        aria-hidden="true"
      />

      <div
        className="members-orb members-orb-two"
        aria-hidden="true"
      />


      {/* ===================================================
          CONTAINER
      =================================================== */}

      <div className="members-container">


        {/* =================================================
            HERO
        ================================================= */}

        <section className="members-hero">

          <div className="members-hero-content">

            <div className="members-eyebrow">

              <Users
                size={16}
              />

              <span>
                SNICT COMMUNITY
              </span>

            </div>


            <h1>
              Meet Our{" "}
              <span>
                Members
              </span>
            </h1>


            <p>
              Discover the professionals
              and members who are part of
              the SNICT community.
            </p>

          </div>


          <div className="members-hero-stat">

            <div className="members-stat-icon">

              <Users
                size={25}
              />

            </div>

            <strong>
              {members.length}
            </strong>

            <span>
              Registered Members
            </span>

          </div>

        </section>


        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="members-toolbar">

          <div className="members-search">

            <Search
              size={20}
            />

            <input
              type="search"
              placeholder="Search members, designation or username..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (

              <button
                type="button"
                className="members-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >

                <X
                  size={17}
                />

              </button>

            )}

          </div>


          <div className="members-result-count">

            <strong>
              {filteredMembers.length}
            </strong>

            <span>
              {filteredMembers.length === 1
                ? "Member"
                : "Members"}
            </span>

          </div>

        </section>


        {/* =================================================
            EMPTY SEARCH
        ================================================= */}

        {filteredMembers.length ===
          0 && (

          <section className="members-empty">

            <div className="members-empty-icon">

              <Search
                size={28}
              />

            </div>

            <h2>
              No Members Found
            </h2>

            <p>
              No member matches your
              current search.
            </p>

            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
            >
              Clear Search
            </button>

          </section>

        )}


        {/* =================================================
            MEMBER GRID
        ================================================= */}

        {filteredMembers.length >
          0 && (

          <section
            className="members-grid"
            aria-label="SNICT Members"
          >

            {filteredMembers.map(
              (
                member,
                index
              ) => {

                const image =
                  getImageUrl(
                    member.profileImageUrl
                  );

                return (

                  <article
                    className="member-card"
                    key={
                      member.id
                    }
                    style={{
                      "--member-index":
                        index,
                    }}
                  >

                    {/* CARD TOP */}

                    <div className="member-card-top">

                      <div className="member-number">

                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}

                      </div>


                      <div className="member-status">

                        <span />

                        SNICT MEMBER

                      </div>

                    </div>


                    {/* PHOTO */}

                    <div className="member-photo-wrap">

                      <div className="member-photo-ring" />

                      {image ? (

                        <img
                          src={image}
                          alt={
                            member.fullName ||
                            "SNICT Member"
                          }
                          className="member-photo"
                          loading="lazy"
                          onError={(
                            event
                          ) => {

                            event.currentTarget.style.display =
                              "none";

                            const fallback =
                              event.currentTarget
                                .parentElement
                                ?.querySelector(
                                  ".member-photo-fallback"
                                );

                            if (
                              fallback
                            ) {

                              fallback.style.display =
                                "flex";

                            }

                          }}
                        />

                      ) : null}


                      <div
                        className="member-photo-fallback"
                        style={{
                          display:
                            image
                              ? "none"
                              : "flex",
                        }}
                      >

                        {member.fullName
                          ? getInitials(
                              member.fullName
                            )
                          : (
                            <UserCircle
                              size={54}
                            />
                          )}

                      </div>

                    </div>


                    {/* INFO */}

                    <div className="member-info">

                      <h2>
                        {member.fullName ||
                          "SNICT Member"}
                      </h2>


                      <div className="member-designation">

                        {member.designation ||
                          "SNICT Member"}

                      </div>


                      {member.username && (

                        <div className="member-username">

                          @{member.username}

                        </div>

                      )}


                      <p className="member-bio">

                        {getShortBio(
                          member.bio
                        )}

                      </p>

                    </div>


                    {/* ACTION */}

                    <button
                      type="button"
                      className="member-read-more"
                      onClick={() =>
                        openMember(
                          member
                        )
                      }
                    >

                      <span>
                        Read More
                      </span>

                      <ArrowRight
                        size={18}
                      />

                    </button>

                  </article>

                );

              }
            )}

          </section>

        )}


        {/* =================================================
            FOOTER INFO
        ================================================= */}

        {members.length > 0 && (

          <div className="members-bottom-note">

            <span />

            <p>
              SNICT • Society of Neo
              Interventional Cardiovascular
              Technologists
            </p>

            <span />

          </div>

        )}

      </div>


      {/* ===================================================
          MEMBER MODAL
      =================================================== */}

      {selectedMember && (

        <div
          className="member-modal-overlay"
          onClick={closeMember}
          role="presentation"
        >

          <div
            className="member-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-modal-title"
          >

            {/* CLOSE */}

            <button
              type="button"
              className="member-modal-close"
              onClick={closeMember}
              aria-label="Close member profile"
            >

              <X
                size={21}
              />

            </button>


            {/* PHOTO */}

            <div className="member-modal-photo-wrap">

              {getImageUrl(
                selectedMember.profileImageUrl
              ) ? (

                <img
                  src={getImageUrl(
                    selectedMember.profileImageUrl
                  )}
                  alt={
                    selectedMember.fullName ||
                    "SNICT Member"
                  }
                  className="member-modal-photo"
                />

              ) : (

                <div className="member-modal-fallback">

                  {getInitials(
                    selectedMember.fullName
                  )}

                </div>

              )}

            </div>


            {/* LABEL */}

            <span className="member-modal-label">

              SNICT MEMBER

            </span>


            {/* NAME */}

            <h2 id="member-modal-title">

              {selectedMember.fullName}

            </h2>


            {/* DESIGNATION */}

            <div className="member-modal-designation">

              {selectedMember.designation ||
                "SNICT Member"}

            </div>


            {/* USERNAME */}

            {selectedMember.username && (

              <div className="member-modal-username">

                @{selectedMember.username}

              </div>

            )}


            {/* BIO */}

            <div className="member-modal-bio">

              <span>
                ABOUT MEMBER
              </span>

              <p>

                {selectedMember.bio?.trim()
                  ? selectedMember.bio
                  : "This member has not added a biography yet."}

              </p>

            </div>


            {/* CLOSE */}

            <button
              type="button"
              className="member-modal-done"
              onClick={closeMember}
            >

              Close Profile

            </button>

          </div>

        </div>

      )}

    </main>

  );

}


export default Members;