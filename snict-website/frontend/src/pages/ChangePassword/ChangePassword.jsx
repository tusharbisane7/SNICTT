import { useState } from "react";

import {
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from "lucide-react";

import api from "../../services/api";

import "./ChangePassword.css";


function ChangePassword() {

  // =========================================================
  // FORM STATE
  // =========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // =========================================================
  // UI STATE
  // =========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  const clearMessages = () => {

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }

  };


  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (loading) {
      return;
    }


    setError("");
    setSuccess("");


    // =======================================================
    // VALIDATION
    // =======================================================

    if (!currentPassword) {

      setError(
        "Please enter your current password."
      );

      return;
    }


    if (!newPassword) {

      setError(
        "Please enter your new password."
      );

      return;
    }


    if (newPassword.length < 8) {

      setError(
        "New password must be at least 8 characters."
      );

      return;
    }


    if (!confirmPassword) {

      setError(
        "Please confirm your new password."
      );

      return;
    }


    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "New passwords do not match."
      );

      return;
    }


    if (
      currentPassword ===
      newPassword
    ) {

      setError(
        "New password must be different from your current password."
      );

      return;
    }


    // =======================================================
    // API REQUEST
    // =======================================================

    try {

      setLoading(true);


      const response =
        await api.put(
          "/auth/change-password",
          {
            currentPassword,
            newPassword,
          }
        );


      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(
        response.data?.message ||
        "Password changed successfully."
      );


      // Clear form

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");


      // Reset visibility

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);


    } catch (error) {

      console.error(
        "Change password error:",
        error
      );


      const backendMessage =
        error.response?.data?.message;


      if (backendMessage) {

        setError(
          backendMessage
        );

      } else if (
        error.response?.status ===
        400
      ) {

        setError(
          "Please check your password information."
        );

      } else if (
        error.response?.status ===
        401
      ) {

        setError(
          "Your session has expired. Please login again."
        );

      } else if (
        error.response?.status ===
        404
      ) {

        setError(
          "User account was not found."
        );

      } else if (
        error.response?.status ===
        500
      ) {

        setError(
          "Server error. Please try again later."
        );

      } else if (
        error.request
      ) {

        setError(
          "Unable to connect to SNICT server. Please make sure the backend is running."
        );

      } else {

        setError(
          "Unable to change password. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="change-password-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="change-password-glow change-password-glow-one"
        aria-hidden="true"
      />

      <div
        className="change-password-glow change-password-glow-two"
        aria-hidden="true"
      />


      <div className="change-password-container">


        {/* ===================================================
            HERO
        =================================================== */}

        <section className="change-password-hero">

          <div className="change-password-hero-content">

            <span className="change-password-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h1>
              Protect Your <span>Account</span>
            </h1>

            <p>
              Keep your SNICT account secure by
              regularly updating your password.
            </p>

          </div>


          <div className="change-password-hero-icon">

            <ShieldCheck
              size={45}
              strokeWidth={1.5}
            />

          </div>

        </section>


        {/* ===================================================
            CARD
        =================================================== */}

        <section
          className="change-password-card"
          aria-labelledby="change-password-title"
        >


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="change-password-header">

            <div className="change-password-icon">

              <LockKeyhole
                size={25}
              />

            </div>


            <div>

              <span className="change-password-label">
                SECURITY SETTINGS
              </span>

              <h2 id="change-password-title">
                Change Password
              </h2>

              <p>
                Update your password to protect
                your SNICT member account.
              </p>

            </div>

          </div>


          {/* =================================================
              SECURITY INFO
          ================================================= */}

          <div className="change-password-security">

            <div className="security-info-icon">

              <ShieldCheck
                size={17}
              />

            </div>


            <div>

              <strong>
                Password Security
              </strong>

              <span>
                Use at least 8 characters for
                a stronger password.
              </span>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              className="change-message change-error"
              role="alert"
            >

              <AlertCircle
                size={17}
              />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (

            <div
              className="change-message change-success"
              role="status"
            >

              <CheckCircle
                size={17}
              />

              <span>
                {success}
              </span>

            </div>

          )}


          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="change-password-form"
            onSubmit={handleSubmit}
            noValidate
          >


            {/* =================================================
                CURRENT PASSWORD
            ================================================= */}

            <div className="change-password-field">

              <label htmlFor="currentPassword">
                Current Password
              </label>


              <div className="change-password-input">

                <KeyRound
                  className="password-field-icon"
                  size={17}
                />


                <input
                  id="currentPassword"
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    currentPassword
                  }
                  onChange={(event) => {

                    setCurrentPassword(
                      event.target.value
                    );

                    clearMessages();

                  }}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />


                <button
                  type="button"
                  className="password-visibility"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  onClick={() =>
                    setShowCurrentPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  {showCurrentPassword ? (

                    <EyeOff
                      size={17}
                    />

                  ) : (

                    <Eye
                      size={17}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* =================================================
                NEW PASSWORD
            ================================================= */}

            <div className="change-password-field">

              <label htmlFor="newPassword">
                New Password
              </label>


              <div className="change-password-input">

                <LockKeyhole
                  className="password-field-icon"
                  size={17}
                />


                <input
                  id="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    newPassword
                  }
                  onChange={(event) => {

                    setNewPassword(
                      event.target.value
                    );

                    clearMessages();

                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />


                <button
                  type="button"
                  className="password-visibility"
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                  onClick={() =>
                    setShowNewPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  {showNewPassword ? (

                    <EyeOff
                      size={17}
                    />

                  ) : (

                    <Eye
                      size={17}
                    />

                  )}

                </button>

              </div>


              <span className="password-hint">
                Minimum 8 characters
              </span>

            </div>


            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div className="change-password-field">

              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>


              <div className="change-password-input">

                <LockKeyhole
                  className="password-field-icon"
                  size={17}
                />


                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) => {

                    setConfirmPassword(
                      event.target.value
                    );

                    clearMessages();

                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />


                <button
                  type="button"
                  className="password-visibility"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  {showConfirmPassword ? (

                    <EyeOff
                      size={17}
                    />

                  ) : (

                    <Eye
                      size={17}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              className="change-password-submit"
              disabled={loading}
            >

              {loading ? (

                <span className="change-button-spinner" />

              ) : (

                <ShieldCheck
                  size={17}
                />

              )}


              <span>

                {loading
                  ? "Updating Password..."
                  : "Update Password"}

              </span>


              {!loading && (

                <ArrowRight
                  size={17}
                  className="submit-arrow"
                />

              )}

            </button>

          </form>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="change-password-footer">

            <ShieldCheck
              size={15}
            />

            <span>
              Your password is securely
              encrypted and protected.
            </span>

          </div>

        </section>


        {/* ===================================================
            SECURITY NOTE
        =================================================== */}

        <div className="change-security-note">

          <CheckCircle
            size={15}
          />

          <span>
            Never share your password with anyone.
          </span>

        </div>


      </div>

    </main>
  );
}


export default ChangePassword;