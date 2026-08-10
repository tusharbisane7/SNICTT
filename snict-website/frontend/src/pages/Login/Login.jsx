import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import "./Login.css";

// =========================================================
// SNICT LOGO
// Change this path only if your logo is stored elsewhere.
// =========================================================
import snictLogo from "../../assets/snict-logo.jpeg";


function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  // =========================================================
  // FORM STATE
  // =========================================================

  const [identifier, setIdentifier] =
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
    // VALIDATE IDENTIFIER
    // =======================================================

    const cleanIdentifier =
      identifier.trim();

    if (!cleanIdentifier) {
      setError(
        "Please enter your email or username."
      );

      return;
    }

    // =======================================================
    // VALIDATE PASSWORD
    // =======================================================

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    // =======================================================
    // API LOGIN
    // =======================================================

    try {
      setLoading(true);

      await login(
        cleanIdentifier,
        password
      );

      // =====================================================
      // REDIRECT
      // =====================================================

      const redirect =
        location.state?.from ||
        "/dashboard";

      if (
        typeof redirect === "string"
      ) {
        navigate(
          redirect,
          {
            replace: true,
          }
        );
      } else {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      }

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      // =====================================================
      // BACKEND ERROR
      // =====================================================

      const backendMessage =
        error.response?.data?.message;

      if (backendMessage) {
        setError(
          backendMessage
        );
      } else if (
        error.response?.status === 401
      ) {
        setError(
          "Invalid email/username or password."
        );
      } else if (
        error.response?.status === 400
      ) {
        setError(
          "Please enter your email/username and password."
        );
      } else if (
        error.response?.status === 500
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
          "Unable to login. Please try again."
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
    <main className="login-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="login-glow"
        aria-hidden="true"
      />


      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <section
        className="login-card"
        aria-labelledby="login-title"
      >

        {/* ===================================================
            LOGO
        =================================================== */}

        <Link
          to="/"
          className="login-logo"
          aria-label="SNICT Home"
        >

          <img
            src={snictLogo}
            alt="SNICT Logo"
            className="login-logo-image"
          />

        </Link>


        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="login-brand">

          <span className="login-brand-name">
            SNICT
          </span>

          <span className="login-brand-description">
            Society of Neo Interventional
            <br />
            Cardiovascular Technologists
          </span>

        </div>


        {/* ===================================================
            LABEL
        =================================================== */}

        <span className="login-label">
          SNICT MEMBER ACCESS
        </span>


        {/* ===================================================
            TITLE
        =================================================== */}

        <h1 id="login-title">
          Welcome back
        </h1>


        <p className="login-subtitle">
          Sign in to access your SNICT
          member dashboard.
        </p>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="login-error"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* =================================================
              EMAIL / USERNAME
          ================================================= */}

          <div className="login-field">

            <label htmlFor="login-identifier">
              Email or Username
            </label>

            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(event) => {

                setIdentifier(
                  event.target.value
                );

                if (error) {
                  setError("");
                }

              }}
              placeholder="Enter email or username"
              autoComplete="username"
              maxLength={150}
              required
            />

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="login-field">

            <div className="login-label-row">

              <label htmlFor="login-password">
                Password
              </label>

              <Link
                to="/forgot-password"
              >
                Forgot password?
              </Link>

            </div>


            <div className="login-password">

              <input
                id="login-password"
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

                  if (error) {
                    setError("");
                  }

                }}
                placeholder="Enter password"
                autoComplete="current-password"
                minLength={8}
                required
              />


              <button
                type="button"
                className="login-password-toggle"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
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
            className="login-submit"
            type="submit"
            disabled={loading}
          >

            <span>
              {loading
                ? "Signing in..."
                : "Sign In"}
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
            REGISTER
        =================================================== */}

        <div className="login-register">

          <span>
            Don't have an account?
          </span>

          <Link to="/signup">
            Create account
          </Link>

        </div>


        {/* ===================================================
            SECURITY FOOTER
        =================================================== */}

        <div className="login-security">

          <span className="login-security-dot" />

          <span>
            Secure SNICT Member Access
          </span>

        </div>

      </section>

    </main>
  );
}

export default Login;