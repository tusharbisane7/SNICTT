import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MailCheck,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

import "./VerifyEmail.css";

function VerifyEmail() {
  const navigate = useNavigate();

  // =========================================================
  // GET PENDING EMAIL
  // =========================================================

  const email =
    localStorage.getItem(
      "snict_pending_email"
    ) || "";

  // =========================================================
  // STATE
  // =========================================================

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // OTP CHANGE
  // =========================================================

  const handleOtpChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setOtp(value);

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // =========================================================
  // VERIFY EMAIL
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    // =======================================================
    // EMAIL CHECK
    // =======================================================

    if (!email) {
      setError(
        "Verification email not found. Please signup again."
      );

      return;
    }

    // =======================================================
    // OTP CHECK
    // =======================================================

    if (!otp) {
      setError(
        "Please enter the verification OTP."
      );

      return;
    }

    if (otp.length !== 6) {
      setError(
        "Please enter the complete 6-digit OTP."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/auth/verify-email",
          {
            email,
            otp,
          }
        );

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(
        response.data?.message ||
          "Email verified successfully."
      );

      // Remove pending verification email
      localStorage.removeItem(
        "snict_pending_email"
      );

      // Redirect to login
      setTimeout(() => {
        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }, 1000);

    } catch (error) {
      console.error(
        "Email verification error:",
        error
      );

      const backendMessage =
        error.response?.data?.message;

      if (backendMessage) {
        setError(
          backendMessage
        );
      } else if (
        error.response?.status === 400
      ) {
        setError(
          "Invalid or expired OTP."
        );
      } else if (
        error.response?.status === 404
      ) {
        setError(
          "Account not found. Please signup again."
        );
      } else if (
        error.response?.status === 500
      ) {
        setError(
          "Server error while verifying your email. Please try again."
        );
      } else if (
        error.request
      ) {
        setError(
          "Unable to connect to SNICT server."
        );
      } else {
        setError(
          "Unable to verify email. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="auth-page">

      <section
        className="verify-card"
        aria-labelledby="verify-title"
      >

        {/* ===================================================
            ICON
        =================================================== */}

        <div
          className="verify-icon"
          aria-hidden="true"
        >
          <MailCheck size={35} />
        </div>

        {/* ===================================================
            LABEL
        =================================================== */}

        <span className="verify-label">
          EMAIL VERIFICATION
        </span>

        {/* ===================================================
            TITLE
        =================================================== */}

        <h1 id="verify-title">
          Verify your email
        </h1>

        <p>
          Enter the 6-digit verification
          code sent to:
        </p>

        <strong>
          {email || "your email"}
        </strong>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="verify-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div
            className="verify-success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          noValidate
        >

          <label
            htmlFor="verification-otp"
            className="sr-only"
          >
            Verification OTP
          </label>

          <input
            id="verification-otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            required
            aria-label="6 digit verification OTP"
          />

          <button
            type="submit"
            disabled={
              loading ||
              otp.length !== 6
            }
          >

            <span>
              {loading
                ? "Verifying..."
                : "Verify Email"}
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
            BACK TO SIGNUP
        =================================================== */}

        <Link
          to="/signup"
          className="verify-back"
        >
          Create another account
        </Link>

      </section>

    </main>
  );
}

export default VerifyEmail;