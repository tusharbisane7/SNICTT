import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  KeyRound,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

import "./ForgotPassword.css";


function ForgotPassword() {

  const navigate =
    useNavigate();


  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [step, setStep] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const sendOtp = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    try {

      setLoading(true);


      const response =
        await api.post(
          "/auth/forgot-password",
          {
            email,
          }
        );


      setSuccess(
        response.data.message
      );

      setStep(2);

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Unable to send reset OTP"
      );

    } finally {

      setLoading(false);

    }
  };


  const resetPassword =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");


      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match"
        );

        return;
      }


      try {

        setLoading(true);


        const response =
          await api.post(
            "/auth/reset-password",
            {
              email,
              otp,
              newPassword,
            }
          );


        setSuccess(
          response.data.message
        );


        setTimeout(() => {
          navigate("/login");
        }, 1200);


      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Unable to reset password"
        );

      } finally {

        setLoading(false);

      }
    };


  return (
    <main className="forgot-page">

      <section className="forgot-card">

        <div className="forgot-icon">
          <KeyRound size={30} />
        </div>

        <span className="forgot-label">
          ACCOUNT RECOVERY
        </span>

        <h1>
          Forgot password?
        </h1>

        <p>
          Reset your SNICT account
          password securely.
        </p>


        {error && (
          <div className="forgot-error">
            {error}
          </div>
        )}


        {success && (
          <div className="forgot-success">
            {success}
          </div>
        )}


        {step === 1 && (

          <form
            onSubmit={sendOtp}
          >

            <label>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your registered email"
              required
            />


            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Reset OTP"}

              {!loading && (
                <ArrowRight size={17} />
              )}
            </button>

          </form>

        )}


        {step === 2 && (

          <form
            onSubmit={resetPassword}
          >

            <label>
              Verification OTP
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                )
              }
              placeholder="6-digit OTP"
              required
            />


            <label>
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              placeholder="Minimum 8 characters"
              minLength="8"
              required
            />


            <label>
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Repeat password"
              minLength="8"
              required
            />


            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}

              {!loading && (
                <ArrowRight size={17} />
              )}
            </button>

          </form>

        )}


        <Link
          to="/login"
          className="forgot-login"
        >
          Back to Login
        </Link>

      </section>

    </main>
  );
}

export default ForgotPassword;