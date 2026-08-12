import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  KeyRound,
  ArrowRight,
  Phone,
  Mail,
} from "lucide-react";

import api from "../../services/api";

import "./ForgotPassword.css";


function ForgotPassword() {

  const navigate =
    useNavigate();


  // =========================================================
  // FORM STATES
  // =========================================================

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // =========================================================
  // STEP
  // =========================================================

  const [step, setStep] =
    useState(1);


  // =========================================================
  // UI STATES
  // =========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================================
  // SEND OTP
  // =========================================================

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


  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const resetPassword =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");


      // -------------------------------------------------------
      // PASSWORD MATCH
      // -------------------------------------------------------

      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "Passwords do not match"
        );

        return;

      }


      // -------------------------------------------------------
      // PASSWORD LENGTH
      // -------------------------------------------------------

      if (
        newPassword.length < 8
      ) {

        setError(
          "Password must be at least 8 characters"
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


        // -----------------------------------------------------
        // REDIRECT TO LOGIN
        // -----------------------------------------------------

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


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="forgot-page">

      <section className="forgot-card">


        {/* ===================================================
            ICON
        =================================================== */}

        <div className="forgot-icon">

          <KeyRound size={30} />

        </div>


        {/* ===================================================
            LABEL
        =================================================== */}

        <span className="forgot-label">

          ACCOUNT RECOVERY

        </span>


        {/* ===================================================
            TITLE
        =================================================== */}

        <h1>

          Forgot password?

        </h1>


        <p>

          Reset your SNICT account
          password .

        </p>


      


       

    
        {/* ===================================================
            ADMIN HELP
        =================================================== */}

        <div className="forgot-admin-help">

          <div className="forgot-admin-help-icon">

            <KeyRound
              size={18}
            />

          </div>


          <div className="forgot-admin-help-content">

            <strong>

              Can't remember your password?

            </strong>


            <p>

              If you are unable to reset
              your password, please contact
              the administrator.

            </p>


            <div className="forgot-admin-contact">


              {/* PHONE */}

              <a
                href="tel:+919731464382"
                className="forgot-contact-phone"
              >

                <Phone
                  size={14}
                />

                <span>

                  +91 9731464382

                </span>

              </a>


              {/* EMAIL */}

              <a
                href="mailto:support@snict.org"
                className="forgot-contact-email"
              >

                <Mail
                  size={14}
                />

                <span>

                  support@snict.org

                </span>

              </a>


            </div>

          </div>

        </div>


        {/* ===================================================
            BACK TO LOGIN
        =================================================== */}

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