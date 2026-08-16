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



// =========================================================
// GET COMMITTEE IMAGE URL
// =========================================================
// Backend may return either:
// 1. Full URL: https://snict.net/uploads/committee/...
// 2. Relative path: /uploads/committee/...
// 3. Relative path without leading slash
// =========================================================

const getCommitteeImage = (member) => {
  const rawImage =
    member?.photoUrl ||
    member?.photo_url ||
    member?.imageUrl ||
    member?.image_url ||
    member?.photo ||
    member?.image ||
    "";

  if (!rawImage) {
    return "";
  }

  const imageValue = String(rawImage).trim();

  if (!imageValue) {
    return "";
  }

  // Already a complete URL or data URL
  if (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://") ||
    imageValue.startsWith("data:") ||
    imageValue.startsWith("blob:")
  ) {
    return imageValue;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snict.net/api";

  // Remove /api from the API URL without using a problematic regex.
  let backendOrigin = apiUrl.trim();

  if (backendOrigin.endsWith("/api")) {
    backendOrigin = backendOrigin.slice(
      0,
      backendOrigin.length - 4
    );
  }

  backendOrigin = backendOrigin.replace(/\/+$/, "");

  const cleanPath = imageValue.startsWith("/")
    ? imageValue
    : `/${imageValue}`;

  return `${backendOrigin}${cleanPath}`;
};

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
                COMMERCIAL COURSE DIRECTOR FACULTY
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
                      getCommitteeImage(member);

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
                              onError={(event) => {
                                console.warn(
                                  "Committee image failed to load:",
                                  photo
                                );

                                event.currentTarget.style.display =
                                  "none";

                                const parent =
                                  event.currentTarget.parentElement;

                                if (parent) {
                                  parent.classList.add(
                                    "placement-photo-error"
                                  );
                                }
                              }}
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

             

            </div>

          </section>

        )}

    </main>

  );

}


export default PlacementCommittee;