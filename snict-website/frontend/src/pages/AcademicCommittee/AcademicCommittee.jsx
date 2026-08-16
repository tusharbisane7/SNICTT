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


// =========================================================
// BACKEND IMAGE URL HELPER
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


const getImageUrl = (image) => {
  if (!image) {
    return null;
  }

  const imageValue =
    String(image).trim();

  if (!imageValue) {
    return null;
  }

  // -------------------------------------------------------
  // Already complete URL
  // -------------------------------------------------------

  if (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://")
  ) {
    return imageValue;
  }

  const backendOrigin =
    getBackendOrigin();

  // -------------------------------------------------------
  // Remove accidental leading slash
  // -------------------------------------------------------

  const cleanPath =
    imageValue.startsWith("/")
      ? imageValue
      : `/${imageValue}`;

  // -------------------------------------------------------
  // Backend upload path
  // Example:
  // /uploads/committee/file.jpg
  // -------------------------------------------------------

  return `${backendOrigin}${cleanPath}`;
};


// =========================================================
// COMPONENT
// =========================================================

function AcademicCommittee() {
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
        "/committees/academic"
      );

      console.log(
        "Academic committee response:",
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
            "Unable to load Academic Committee."
        );
      }

    } catch (error) {

      console.error(
        "Academic committee error:",
        error
      );

      setMembers([]);

      setError(
        error.response?.data?.message ||
          "Unable to load Academic Committee."
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
    <main className="academic-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="academic-grid" />

      <div className="academic-glow academic-glow-one" />

      <div className="academic-glow academic-glow-two" />


     


      {/* =================================================
          MEMBERS SECTION
      ================================================= */}

      <section className="academic-members">

        <div className="academic-container">

          {/* =================================================
              HEADING
          ================================================= */}

          <header className="academic-heading">

            <span>
              SNICT
            </span>

            <h2>
              ORGANIZING
              <strong> COMMITTEE</strong>
            </h2>

            

          </header>


          {/* =================================================
              LOADING
          ================================================= */}

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


          {/* =================================================
              ERROR
          ================================================= */}

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

              <div className="academic-empty">

                <GraduationCap size={48} />

                <h3>
                  No members available
                </h3>

                <p>
                   Committee members
                  will appear here.
                </p>

              </div>

            )}


          {/* =================================================
              MEMBERS GRID
          ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="academic-members-grid">

                {members.map(
                  (member, index) => {

                    // -----------------------------------------
                    // MEMBER NAME
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
                    // IMAGE
                    //
                    // Support:
                    // photoUrl
                    // photo_url
                    // photo
                    // imageUrl
                    // image_url
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
                        className="academic-member-card"
                        key={
                          member.id ||
                          `${name}-${index}`
                        }
                      >

                        {/* =================================================
                            PHOTO
                        ================================================= */}

                        <div className="academic-photo">

                          {photo ? (

                            <img
                              src={photo}
                              alt={`${name} - ${designation}`}
                              loading="lazy"

                              onError={(event) => {

                                console.error(
                                  "Academic member image failed:",
                                  photo
                                );

                                event.currentTarget.style.display =
                                  "none";

                                const parent =
                                  event.currentTarget.parentElement;

                                if (
                                  parent &&
                                  !parent.querySelector(
                                    ".academic-photo-placeholder"
                                  )
                                ) {

                                  const placeholder =
                                    document.createElement(
                                      "div"
                                    );

                                  placeholder.className =
                                    "academic-photo-placeholder";

                                  parent.appendChild(
                                    placeholder
                                  );
                                }

                              }}
                            />

                          ) : (

                            <div className="academic-photo-placeholder">

                              <UserCircle
                                size={90}
                                strokeWidth={1}
                              />

                            </div>

                          )}


                          {/* =================================================
                              MEMBER NUMBER
                          ================================================= */}

                          <span className="academic-photo-number">

                            {String(
                              index + 1
                            ).padStart(2, "0")}

                          </span>

                        </div>


                        {/* =================================================
                            CONTENT
                        ================================================= */}

                        <div className="academic-member-content">

                          <small>
                            ORGANIZING COMMITTEE
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