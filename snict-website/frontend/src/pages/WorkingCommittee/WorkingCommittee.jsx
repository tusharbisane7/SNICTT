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


// =========================================================
// BACKEND ORIGIN
// =========================================================

const getBackendOrigin = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snict.net/api";

  try {
    return new URL(apiUrl).origin;
  } catch (error) {
    console.error(
      "Invalid API URL:",
      apiUrl
    );

    return "https://snict.net";
  }
};


// =========================================================
// IMAGE URL HELPER
// =========================================================

const getImageUrl = (image) => {
  if (!image) {
    return null;
  }

  const imageValue =
    String(image).trim();

  if (!imageValue) {
    return null;
  }

  // Already complete URL
  if (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://")
  ) {
    return imageValue;
  }

  const backendOrigin =
    getBackendOrigin();

  const cleanPath =
    imageValue.startsWith("/")
      ? imageValue
      : `/${imageValue}`;

  return `${backendOrigin}${cleanPath}`;
};


// =========================================================
// COMPONENT
// =========================================================

function WorkingCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =======================================================
  // FETCH MEMBERS
  // =======================================================

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/committees/working"
      );

      console.log(
        "Working committee response:",
        response.data
      );

      if (
        response.data?.success
      ) {
        setMembers(
          response.data.members || []
        );
      } else {
        setMembers([]);

        setError(
          response.data?.message ||
            "Unable to load Working Committee."
        );
      }

    } catch (error) {

      console.error(
        "Working committee error:",
        error
      );

      setMembers([]);

      setError(
        error.response?.data?.message ||
          "Unable to load Working Committee."
      );

    } finally {
      setLoading(false);
    }
  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    fetchMembers();
  }, []);


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main className="working-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="working-grid" />

      <div className="working-glow working-glow-one" />

      <div className="working-glow working-glow-two" />


   


      {/* =================================================
          MEMBERS SECTION
      ================================================= */}

      <section className="working-members">

        <div className="working-container">

          {/* =================================================
              HEADING
          ================================================= */}

          <header className="working-heading">

            <span>
              ORGANIZATIONAL LEADERSHIP
            </span>

            <h2>
              Office
              <strong> Bearers</strong>
            </h2>

            <p>
              Meet the professionals coordinating
              SNICT's activities and initiatives.
            </p>

          </header>


          {/* =================================================
              LOADING
          ================================================= */}

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


          {/* =================================================
              ERROR
          ================================================= */}

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
                type="button"
                onClick={fetchMembers}
              >

                <RefreshCw size={16} />

                Retry

              </button>

            </div>

          )}


          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            members.length === 0 && (

              <div className="working-empty">

                <ClipboardCheck size={48} />

                <h3>
                  No members available
                </h3>

               

              </div>

            )}


          {/* =================================================
              MEMBERS GRID
          ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="working-members-grid">

                {members.map(
                  (member, index) => {

                    // -----------------------------------------
                    // NAME
                    // -----------------------------------------

                    const name =
                      member.memberName ||
                      member.member_name ||
                      member.name ||
                      "Committee Member";


                    // -----------------------------------------
                    // DESIGNATION
                    // -----------------------------------------

                    const designation =
                      member.designation ||
                      "Committee Member";


                    // -----------------------------------------
                    // BIO
                    // -----------------------------------------

                    const bio =
                      member.bio || "";


                    // -----------------------------------------
                    // QUALIFICATION
                    // -----------------------------------------

                    const qualification =
                      member.qualification || "";


                    // -----------------------------------------
                    // PHOTO
                    // -----------------------------------------

                    const rawPhoto =
                      member.photoUrl ||
                      member.photo_url ||
                      member.photo ||
                      member.imageUrl ||
                      member.image_url ||
                      null;


                    const photo =
                      getImageUrl(
                        rawPhoto
                      );


                    return (

                      <article
                        className="working-member-card"
                        key={
                          member.id ||
                          `${name}-${index}`
                        }
                      >

                        {/* ===================================
                            PROFILE IMAGE
                        =================================== */}

                        <div className="working-photo">

                          {photo ? (

                            <img
                              src={photo}
                              alt={`${name} - ${designation}`}
                              loading="lazy"

                              onError={(event) => {

                                console.error(
                                  "Working committee image failed:",
                                  photo
                                );

                                event.currentTarget.style.display =
                                  "none";

                                const parent =
                                  event.currentTarget.parentElement;

                                if (
                                  parent &&
                                  !parent.querySelector(
                                    ".working-photo-placeholder"
                                  )
                                ) {

                                  const placeholder =
                                    document.createElement(
                                      "div"
                                    );

                                  placeholder.className =
                                    "working-photo-placeholder";

                                  parent.appendChild(
                                    placeholder
                                  );
                                }

                              }}
                            />

                          ) : (

                            <div className="working-photo-placeholder">

                              <UserCircle
                                size={90}
                                strokeWidth={1}
                              />

                            </div>

                          )}


                          {/* ===================================
                              MEMBER NUMBER
                          =================================== */}

                          <span className="working-photo-number">

                            {String(
                              index + 1
                            ).padStart(2, "0")}

                          </span>

                        </div>


                        {/* ===================================
                            MEMBER INFORMATION
                        =================================== */}

                        <div className="working-member-content">

                          <small>
                          Office Bearers
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