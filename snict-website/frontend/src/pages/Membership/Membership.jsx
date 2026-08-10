import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  RefreshCw,
  QrCode,
  LogIn,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";

import "./Membership.css";

function Membership() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [membership, setMembership] =
    useState(null);

  const [hasMembership, setHasMembership] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [applying, setApplying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD MEMBERSHIP
  // =========================================================

  const loadMembership = async () => {
    if (!user) {
      setMembership(null);
      setHasMembership(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/membership/me"
      );

      if (response.data?.success) {
        setHasMembership(
          Boolean(
            response.data.hasMembership
          )
        );

        setMembership(
          response.data.membership || null
        );
      } else {
        setHasMembership(false);
        setMembership(null);

        setError(
          response.data?.message ||
            "Unable to load membership."
        );
      }
    } catch (error) {
      console.error(
        "Load membership error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load membership."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD AFTER AUTH
  // =========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadMembership();
  }, [user, authLoading]);

  // =========================================================
  // APPLY MEMBERSHIP
  // =========================================================

  const handleApply = async () => {
    if (applying || !user) {
      return;
    }

    try {
      setApplying(true);

      setError("");
      setSuccess("");

      const response = await api.post(
        "/membership/apply"
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to submit membership application."
        );
      }

      setMembership(
        response.data.membership || null
      );

      setHasMembership(true);

      setSuccess(
        response.data?.message ||
          "Membership application submitted successfully."
      );
    } catch (error) {
      console.error(
        "Apply membership error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit membership application."
      );

      if (
        error.response?.data?.membership
      ) {
        setMembership(
          error.response.data.membership
        );

        setHasMembership(true);
      }
    } finally {
      setApplying(false);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (
    authLoading ||
    loading
  ) {
    return (
      <main className="membership-page">
        <div className="membership-container">
          <div className="membership-loading">
            <div className="membership-loading-spinner" />

            <p>
              Loading membership...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // STATES
  // =========================================================

  const isLoggedIn =
    Boolean(user);

  const status =
    membership?.status || null;

  const isPending =
    status === "pending";

  const isApproved =
    status === "approved";

  const isRejected =
    status === "rejected";

  // =========================================================
  // USER DETAILS
  // =========================================================

  const memberName =
    membership?.user?.fullName ||
    user?.fullName ||
    user?.name ||
    "Member";

  const username =
    membership?.user?.username ||
    user?.username ||
    "—";

  const membershipNumber =
    membership?.membershipNumber ||
    "—";

  const membershipType =
    membership?.membershipType ||
    "Regular";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="membership-page">

      <div className="membership-container">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

       


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="membership-alert membership-alert-error">

            <AlertCircle size={18} />

            <span>
              {error}
            </span>

          </div>
        )}


        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="membership-alert membership-alert-success">

            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* =================================================
            NOT LOGGED IN
        ================================================= */}

        {!isLoggedIn && (

          <section className="membership-login-card">

            <div className="membership-login-icon">
              <LogIn size={28} />
            </div>

            <div className="membership-login-content">

              <span>
                SNICT MEMBERSHIP
              </span>

              <h2>
                Become a SNICT Member
              </h2>

              <p>
                Login to your SNICT account
                to apply for professional
                membership.
              </p>

              <div className="membership-actions">

                <Link
                  to="/login"
                  className="membership-primary-btn"
                >
                  <LogIn size={17} />
                  Login
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/signup"
                  className="membership-secondary-btn"
                >
                  <UserPlus size={17} />
                  Create Account
                </Link>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            LOGGED IN - NO MEMBERSHIP
        ================================================= */}

        {isLoggedIn &&
          !hasMembership && (

          <section className="membership-apply-card">

            <div className="membership-apply-left">

              <div className="membership-card-icon">
                <ShieldCheck size={27} />
              </div>

              <div>

                <span>
                  SNICT MEMBERSHIP
                </span>

                <h2>
                  Become a Member
                </h2>

                <p>
                  Submit your membership
                  application using your
                  registered SNICT account.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="membership-primary-btn"
              onClick={handleApply}
              disabled={applying}
            >

              {applying ? (
                <>
                  <RefreshCw
                    size={17}
                    className="membership-spin"
                  />

                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus size={17} />

                  Become a Member

                  <ArrowRight size={15} />
                </>
              )}

            </button>

          </section>

        )}


        {/* =================================================
            PENDING
        ================================================= */}

        {isLoggedIn &&
          hasMembership &&
          isPending && (

          <section className="membership-status-card pending">

            <div className="membership-status-icon">
              <Clock3 size={30} />
            </div>

            <div className="membership-status-content">

              <span className="membership-status-label">
                MEMBERSHIP APPLICATION
              </span>

              <h2>
                Application Under Review
              </h2>

              <p>
                Your membership application
                has been successfully submitted.
                Our administrator will review
                your application.
              </p>

              <div className="membership-status-details">

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    Pending
                  </strong>
                </div>

                <div>
                  <span>
                    Applied On
                  </span>

                  <strong>
                    {formatDate(
                      membership?.appliedAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Membership Type
                  </span>

                  <strong>
                    {membershipType}
                  </strong>
                </div>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            REJECTED
        ================================================= */}

        {isLoggedIn &&
          hasMembership &&
          isRejected && (

          <section className="membership-status-card rejected">

            <div className="membership-status-icon">
              <AlertCircle size={30} />
            </div>

            <div className="membership-status-content">

              <span className="membership-status-label">
                MEMBERSHIP APPLICATION
              </span>

              <h2>
                Application Rejected
              </h2>

              <p>
                Your membership application
                was not approved by the
                SNICT administration.
              </p>

              {membership?.rejectionReason && (

                <div className="membership-rejection-box">

                  <span>
                    ADMINISTRATOR REASON
                  </span>

                  <p>
                    {membership.rejectionReason}
                  </p>

                </div>

              )}

              <button
                type="button"
                className="membership-primary-btn"
                onClick={handleApply}
                disabled={applying}
              >

                {applying ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="membership-spin"
                    />

                    Applying...
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />

                    Apply Again

                    <ArrowRight size={15} />
                  </>
                )}

              </button>

            </div>

          </section>

        )}


        {/* =================================================
            APPROVED MEMBER
        ================================================= */}

        {isLoggedIn &&
          hasMembership &&
          isApproved && (

          <div className="membership-approved-wrapper">

            {/* =================================================
                APPROVED MEMBERSHIP CARD
            ================================================= */}

            <section className="membership-approved-card">

              {/* HEADER */}

              <div className="membership-approved-header">

                <div>

                  <span>
                    SNICT MEMBERSHIP
                  </span>

                  <h2>
                    Membership Approved
                  </h2>

                </div>

                <div className="membership-approved-badge">

                  <CheckCircle2 size={17} />

                  <span>
                    Approved
                  </span>

                </div>

              </div>


              {/* BODY */}

              <div className="membership-approved-body">

                {/* =================================================
                    MEMBER INFORMATION
                ================================================= */}

                <div className="membership-member-section">

                  <div className="membership-section-title">
                    <ShieldCheck size={17} />

                    <span>
                      MEMBER INFORMATION
                    </span>
                  </div>


                  <div className="membership-member-details">

                    <div className="membership-detail-card">

                      <span>
                        Member Name
                      </span>

                      <strong>
                        {memberName}
                      </strong>

                    </div>


                    <div className="membership-detail-card">

                      <span>
                        Membership Number
                      </span>

                      <strong className="membership-number">
                        {membershipNumber}
                      </strong>

                    </div>


                    <div className="membership-detail-card">

                      <span>
                        Username
                      </span>

                      <strong>
                        @{username}
                      </strong>

                    </div>


                    <div className="membership-detail-card">

                      <span>
                        Membership Type
                      </span>

                      <strong>
                        {membershipType}
                      </strong>

                    </div>


                    <div className="membership-detail-card">

                      <span>
                        Approved On
                      </span>

                      <strong>
                        {formatDate(
                          membership?.approvedAt
                        )}
                      </strong>

                    </div>


                    <div className="membership-detail-card">

                      <span>
                        Status
                      </span>

                      <strong className="membership-approved-text">
                        Active Member
                      </strong>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    QR CODE
                ================================================= */}

                <div className="membership-qr-section">

                  <div className="membership-qr-header">

                    <QrCode size={18} />

                    <span>
                      MEMBER QR
                    </span>

                  </div>

                  <div className="membership-qr-box">

                    {membership?.qrCode ? (

                      <img
                        src={
                          membership.qrCode
                        }
                        alt="SNICT Membership QR Code"
                      />

                    ) : (

                      <div className="membership-qr-empty">

                        <QrCode size={38} />

                        <span>
                          QR unavailable
                        </span>

                      </div>

                    )}

                  </div>

                  <p>
                    Scan to verify membership
                  </p>

                  <span className="membership-qr-number">
                    {membershipNumber}
                  </span>

                </div>

              </div>

            </section>


            {/* =================================================
                ADMIN APPROVAL INFORMATION
            ================================================= */}

            <section className="membership-approval-card">

              <div className="membership-approval-icon">
                <ShieldCheck size={24} />
              </div>

              <div className="membership-approval-content">

                <span>
                  ADMINISTRATOR VERIFICATION
                </span>

                <h3>
                  Your membership has been
                  officially approved
                </h3>

                <p>
                  This membership was reviewed
                  and approved by the SNICT
                  administration team.
                </p>

                <div className="membership-approval-meta">

                  <div>
                    <span>
                      Membership ID
                    </span>

                    <strong>
                      {membershipNumber}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Approval Date
                    </span>

                    <strong>
                      {formatDate(
                        membership?.approvedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong className="approval-active">
                      Active
                    </strong>
                  </div>

                </div>

              </div>

            </section>

          </div>

        )}


        {/* =================================================
            REFRESH
        ================================================= */}

        {isLoggedIn && (

          <div className="membership-refresh">

            <button
              type="button"
              onClick={loadMembership}
              disabled={
                loading ||
                applying
              }
            >

              <RefreshCw
                size={15}
                className={
                  loading
                    ? "membership-spin"
                    : ""
                }
              />

              Refresh Membership Status

            </button>

          </div>

        )}

      </div>

    </main>
  );
}

export default Membership;