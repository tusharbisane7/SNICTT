import { useState } from "react";

import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./AdminLogin.css";

import snictLogo from "../../assets/snict-logo.jpeg";


function AdminLogin() {
  const navigate = useNavigate();

  // =========================================================
  // FORM STATE
  // =========================================================

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  // =========================================================
  // UI STATE
  // =========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    // =======================================================
    // VALIDATE USERNAME
    // =======================================================

    const cleanUsername =
      username.trim();

    if (!cleanUsername) {
      setError(
        "Please enter admin username."
      );

      return;
    }

    // =======================================================
    // VALIDATE PASSWORD
    // =======================================================

    if (!password) {
      setError(
        "Please enter admin password."
      );

      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // ADMIN LOGIN API
      // =====================================================

      const response =
        await api.post(
          "/admin/login",
          {
            username:
              cleanUsername,

            password,
          }
        );

      // =====================================================
      // SUCCESS
      // =====================================================

      if (
        response.data?.success &&
        response.data?.admin
      ) {

        /*
         * Admin authentication is handled
         * by the HTTP-only cookie.
         *
         * We only store admin display
         * information locally.
         */

        localStorage.setItem(
          "snict_admin",
          JSON.stringify(
            response.data.admin
          )
        );

        navigate(
          "/admin/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // =====================================================
      // UNSUCCESSFUL RESPONSE
      // =====================================================

      setError(
        response.data?.message ||
          "Unable to login as admin."
      );

    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );

      // =====================================================
      // ERROR HANDLING
      // =====================================================

      const status =
        error.response?.status;

      const backendMessage =
        error.response?.data?.message;

      if (backendMessage) {

        setError(
          backendMessage
        );

      } else if (
        status === 401
      ) {

        setError(
          "Invalid admin username or password."
        );

      } else if (
        status === 400
      ) {

        setError(
          "Please enter username and password."
        );

      } else if (
        status === 403
      ) {

        setError(
          "You do not have administrator access."
        );

      } else if (
        status === 500
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
          "Unable to login as admin. Please try again."
        );
      }

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // CLEAR ERROR
  // =========================================================

  const clearError = () => {
    if (error) {
      setError("");
    }
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="admin-login-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="admin-login-background"
        aria-hidden="true"
      />

      {/* =====================================================
          CARD
      ===================================================== */}

      <section
        className="admin-login-card"
        aria-labelledby="admin-login-title"
      >

        {/* ===================================================
            BRAND HEADER
        =================================================== */}

        <div className="admin-login-header">

          <Link
            to="/"
            className="admin-login-logo-link"
            aria-label="SNICT Home"
          >

            <div className="admin-login-logo">

              <img
                src={snictLogo}
                alt="SNICT"
                className="admin-login-logo-image"
              />

            </div>

          </Link>

          <div className="admin-login-brand">

            <span className="admin-login-brand-name">
              SNICT
            </span>

            <span className="admin-login-brand-description">
              Society of Neo Interventional
              Cardiovascular Technologists
            </span>

          </div>

        </div>


        {/* ===================================================
            ADMIN LABEL
        =================================================== */}

        <div className="admin-login-title">

          <span className="admin-login-label">
            SNICT ADMINISTRATION
          </span>

          <h1 id="admin-login-title">
            Admin Login
          </h1>

          <p>
            Secure access to the SNICT
            administration panel.
          </p>

        </div>


        {/* ===================================================
            SECURITY BADGE
        =================================================== */}

        <div className="admin-login-security">

          <ShieldCheck size={16} />

          <span>
            Authorized administrators only
          </span>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div
            className="admin-login-error"
            role="alert"
          >

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={clearError}
              aria-label="Close error"
            >
              ×
            </button>

          </div>

        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* =================================================
              USERNAME
          ================================================= */}

          <div className="admin-login-field">

            <label htmlFor="admin-username">
              Admin Username
            </label>

            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => {

                setUsername(
                  event.target.value
                );

                clearError();

              }}
              placeholder="Enter admin username"
              autoComplete="username"
              maxLength={50}
              disabled={loading}
              required
            />

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="admin-login-field">

            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-password-wrapper">

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );

                  clearError();

                }}
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
              >

                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}

              </button>

            </div>

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >

            <span>
              {loading
                ? "Signing in..."
                : "Sign In as Admin"}
            </span>

            {!loading && (
              <ArrowRight
                size={17}
                aria-hidden="true"
              />
            )}

          </button>

        </form>


        {/* ===================================================
            BACK TO WEBSITE
        =================================================== */}

        <div className="admin-login-back">

          <Link to="/">
            ← Back to SNICT website
          </Link>

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="admin-login-footer">

          <ShieldCheck size={13} />

          <span>
            SNICT Administration Panel
          </span>

        </div>

      </section>

    </main>
  );
}

export default AdminLogin;