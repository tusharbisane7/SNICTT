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


  // =========================================================
  // BACKEND ORIGIN
  // =========================================================

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snict.net/api";


  const backendOrigin = apiUrl.endsWith("/api")
    ? apiUrl.slice(0, -4)
    : apiUrl.replace(/\/$/, "");


  // =========================================================
  // IMAGE URL HELPER
  // =========================================================

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) {
      return null;
    }

    const photo = String(photoUrl).trim();

    if (!photo) {
      return null;
    }


    // -------------------------------------------------------
    // Already full URL
    // -------------------------------------------------------

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }


    // -------------------------------------------------------
    // Cloudinary / external protocol-relative URL
    // -------------------------------------------------------

    if (photo.startsWith("//")) {
      return `https:${photo}`;
    }


    // -------------------------------------------------------
    // Backend relative upload path
    // Example:
    // /uploads/committee/photo.jpg
    // -------------------------------------------------------

    if (photo.startsWith("/")) {
      return `${backendOrigin}${photo}`;
    }


    // -------------------------------------------------------
    // Relative upload path without /
    // Example:
    // uploads/committee/photo.jpg
    // -------------------------------------------------------

    return `${backendOrigin}/${photo}`;
  };


  // =========================================================
  // FETCH MEMBERS
  // =========================================================

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");


      const response = await api.get(
        "/committees/compliance"
      );


      if (response.data?.success) {
        setMembers(
          Array.isArray(response.data.members)
            ? response.data.members
            : []
        );
      } else {
        setMembers([]);

        setError(
          response.data?.message ||
            "Unable to load Compliance Committee."
        );
      }

    } catch (error) {

      console.error(
        "Compliance committee error:",
        error
      );


      setMembers([]);

      setError(
        error.response?.data?.message ||
          "Unable to load Compliance Committee."
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
  // IMAGE ERROR HANDLER
  // =========================================================

  const handleImageError = (event) => {
    const image = event.currentTarget;

    image.style.display = "none";

    const parent =
      image.parentElement;

    if (parent) {
      parent.classList.add(
        "compliance-photo-error"
      );
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="compliance-page">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="compliance-grid" />

      <div className="compliance-glow compliance-glow-one" />

      <div className="compliance-glow compliance-glow-two" />


      


      {/* =====================================================
          MEMBERS
          ================================================= */}

      <section className="compliance-members">

        <div className="compliance-container">

          <header className="compliance-heading">

            

            <h2>
              SCIENTIFIC 
              <strong>
                {" "}COMMITTEE
              </strong>
            </h2>

         

          </header>


          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="compliance-loading">

              <div className="compliance-spinner" />

              <h3>
                Loading members...
              </h3>

              <p>
                Fetching Compliance Committee
                information.
              </p>

            </div>
          )}


          {/* =================================================
              ERROR
              ================================================= */}

          {!loading && error && (
            <div className="compliance-error">

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

              <div className="compliance-empty">

                <ShieldCheck size={48} />

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
              MEMBERS
              ================================================= */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="compliance-members-grid">

                {members.map(
                  (member, index) => {

                    const name =
                      member.memberName ||
                      member.name ||
                      "Committee Member";


                    const designation =
                      member.designation ||
                      "Committee Member";


                    const bio =
                      member.bio || "";


                    const qualification =
                      member.qualification || "";


                    // =================================================
                    // RESOLVE IMAGE URL
                    // =================================================

                    const photo =
                      getImageUrl(
                        member.photoUrl ||
                        member.photo ||
                        member.profileImageUrl
                      );


                    return (

                      <article
                        className="compliance-member-card"
                        key={
                          member.id ||
                          `${name}-${index}`
                        }
                      >

                        {/* =========================================
                            PHOTO
                            ========================================= */}

                        <div className="compliance-photo">

                          {photo ? (

                            <img
                              src={photo}
                              alt={name}
                              loading="lazy"
                              onError={
                                handleImageError
                              }
                            />

                          ) : (

                            <div className="compliance-photo-placeholder">

                              <UserCircle
                                size={90}
                                strokeWidth={1}
                              />

                            </div>

                          )}


                          {/* NUMBER */}

                          <span className="compliance-photo-number">

                            {String(
                              index + 1
                            ).padStart(2, "0")}

                          </span>


                          {/* OVERLAY */}

                          <div className="compliance-photo-overlay" />

                        </div>


                        {/* =========================================
                            CONTENT
                            ========================================= */}

                        <div className="compliance-member-content">

                          <small>
                            SCIENTIFIC COMMITTEE
                          </small>


                          <h3>
                            {name}
                          </h3>


                          <strong>
                            {designation}
                          </strong>


                          {bio && (

                            <p className="compliance-member-bio">
                              {bio}
                            </p>

                          )}


                          {qualification && (

                            <span className="compliance-member-qualification">

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


export default ComplianceCommittee;