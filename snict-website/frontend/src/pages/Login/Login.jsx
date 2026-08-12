import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  ArrowRight,
  LogIn,
  Clock3,
  ShieldAlert,
  XCircle,
  CalendarX,
  Mail,
  Phone,
} from "lucide-react";

import api from "../../services/api";

import "./Login.css";


// =========================================================
// LOGIN PAGE
// =========================================================

function Login() {

  const navigate =
    useNavigate();


  // =======================================================
  // FORM STATE
  // =======================================================

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");


  // =======================================================
  // UI STATE
  // =======================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =======================================================
  // MEMBERSHIP ERROR STATE
  // =======================================================

  const [membershipError, setMembershipError] =
    useState(null);


  // =======================================================
  // CLOSE MEMBERSHIP POPUP
  // =======================================================

  const closeMembershipPopup = () => {

    setMembershipError(null);

  };


  // =======================================================
  // GET MEMBERSHIP ERROR INFORMATION
  // =======================================================

  const getMembershipErrorInfo = (
    code,
    message
  ) => {

    switch (code) {

      // ---------------------------------------------------
      // PAYMENT / MEMBERSHIP PENDING
      // ---------------------------------------------------

      case "MEMBERSHIP_PENDING":

        return {

          type: "pending",

          icon:
            <Clock3 size={30} />,

          label:
            "MEMBERSHIP APPROVAL",

          title:
            "Waiting for confirmation",

          message:
            message ||
            "Your membership approval is pending. Your payment has been submitted and is waiting for administrator confirmation.",

        };


      // ---------------------------------------------------
      // PAYMENT NOT VERIFIED
      // ---------------------------------------------------

      case "PAYMENT_NOT_VERIFIED":

        return {

          type: "pending",

          icon:
            <Clock3 size={30} />,

          label:
            "PAYMENT VERIFICATION",

          title:
            "Payment verification pending",

          message:
            message ||
            "Your membership payment has not been verified by the administrator yet. Please wait for confirmation.",

        };


      // ---------------------------------------------------
      // MEMBERSHIP REQUIRED
      // ---------------------------------------------------

      case "MEMBERSHIP_REQUIRED":

        return {

          type: "warning",

          icon:
            <ShieldAlert size={30} />,

          label:
            "MEMBERSHIP REQUIRED",

          title:
            "Membership required",

          message:
            message ||
            "Your SNICT membership has not been registered. Please complete your membership registration.",

        };


      // ---------------------------------------------------
      // MEMBERSHIP NOT ACTIVE
      // ---------------------------------------------------

      case "MEMBERSHIP_NOT_ACTIVE":

        return {

          type: "warning",

          icon:
            <ShieldAlert size={30} />,

          label:
            "MEMBERSHIP INACTIVE",

          title:
            "Membership not active",

          message:
            message ||
            "Your membership is not active yet. Please wait for administrator confirmation.",

        };


      // ---------------------------------------------------
      // MEMBERSHIP REJECTED
      // ---------------------------------------------------

      case "MEMBERSHIP_REJECTED":

        return {

          type: "rejected",

          icon:
            <XCircle size={30} />,

          label:
            "MEMBERSHIP REJECTED",

          title:
            "Membership rejected",

          message:
            message ||
            "Your membership application or payment was rejected. Please contact the administrator for assistance.",

        };


      // ---------------------------------------------------
      // MEMBERSHIP NOT STARTED
      // ---------------------------------------------------

      case "MEMBERSHIP_NOT_STARTED":

        return {

          type: "warning",

          icon:
            <CalendarX size={30} />,

          label:
            "MEMBERSHIP NOT STARTED",

          title:
            "Membership has not started",

          message:
            message ||
            "Your membership has been approved but its validity has not started yet.",

        };


      // ---------------------------------------------------
      // MEMBERSHIP EXPIRED
      // ---------------------------------------------------

      case "MEMBERSHIP_EXPIRED":

        return {

          type: "expired",

          icon:
            <CalendarX size={30} />,

          label:
            "MEMBERSHIP EXPIRED",

          title:
            "Membership expired",

          message:
            message ||
            "Your SNICT membership has expired. Please renew your membership to continue.",

        };


      // ---------------------------------------------------
      // DEFAULT
      // ---------------------------------------------------

      default:

        return null;

    }

  };


  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin =
    async (event) => {

      event.preventDefault();


      setError("");
      setSuccess("");
      setMembershipError(null);


      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      const cleanIdentifier =
        String(identifier)
          .trim()
          .toLowerCase();


      if (!cleanIdentifier) {

        setError(
          "Please enter your username or email."
        );

        return;

      }


      if (!password) {

        setError(
          "Please enter your password."
        );

        return;

      }


      // =====================================================
      // LOGIN REQUEST
      // =====================================================

      try {

        setLoading(true);


        const response =
          await api.post(
            "/auth/login",
            {
              identifier:
                cleanIdentifier,

              password,
            }
          );


        // ===================================================
        // SUCCESS
        // ===================================================

        if (
          response.data?.success
        ) {

          setSuccess(
            response.data.message ||
            "Login successful"
          );


          // -----------------------------------------------
          // Redirect after successful login
          // -----------------------------------------------

          setTimeout(() => {

            navigate(
              "/dashboard",
              {
                replace: true,
              }
            );

          }, 500);


          return;

        }


        // ===================================================
        // UNEXPECTED RESPONSE
        // ===================================================

        setError(
          response.data?.message ||
          "Unable to login."
        );


      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        // ===================================================
        // BACKEND RESPONSE
        // ===================================================

        const status =
          error.response?.status;

        const backendCode =
          error.response?.data?.code;

        const backendMessage =
          error.response?.data?.message;


        // ===================================================
        // MEMBERSHIP ERROR
        // ===================================================

        const membershipInfo =
          getMembershipErrorInfo(
            backendCode,
            backendMessage
          );


        if (
          membershipInfo
        ) {

          setMembershipError(
            membershipInfo
          );

          return;

        }


        // ===================================================
        // AUTHENTICATION ERROR
        // ===================================================

        if (
          status === 401
        ) {

          setError(
            backendMessage ||
            "Invalid username/email or password."
          );

          return;

        }


        // ===================================================
        // SERVER ERROR
        // ===================================================

        if (
          status >= 500
        ) {

          setError(
            backendMessage ||
            "Server error. Please try again later."
          );

          return;

        }


        // ===================================================
        // OTHER ERROR
        // ===================================================

        setError(
          backendMessage ||
          "Unable to login. Please try again."
        );

      } finally {

        setLoading(false);

      }

    };


  // =========================================================
  // CONTACT ADMINISTRATOR
  // =========================================================

  const contactAdmin = () => {

    window.location.href =
      "mailto:support@snict.org?subject=SNICT Membership Assistance";

  };


  // =========================================================
  // CALL ADMINISTRATOR
  // =========================================================

  const callAdmin = () => {

    window.location.href =
      "tel:+919731464382";

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="login-page">


      {/* ===================================================
          LOGIN CARD
      =================================================== */}

      <section className="login-card">


        {/* =================================================
            ICON
        ================================================= */}

        <div className="login-icon">

          <LogIn size={30} />

        </div>


        {/* =================================================
            LABEL
        ================================================= */}

        <span className="login-label">

          MEMBER LOGIN

        </span>


        {/* =================================================
            TITLE
        ================================================= */}

        <h1>

          Welcome back

        </h1>


        <p>

          Login to access your
          SNICT member account.

        </p>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="login-error">

            <ShieldAlert
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

          <div className="login-success">

            {success}

          </div>

        )}


        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <form
          onSubmit={handleLogin}
          noValidate
        >


          {/* ===============================================
              USERNAME / EMAIL
          =============================================== */}

          <div className="login-field">

            <label htmlFor="identifier">

              Username or Email

            </label>


            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(event) =>
                setIdentifier(
                  event.target.value
                )
              }
              placeholder="Enter username or email"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* ===============================================
              PASSWORD
          =============================================== */}

          <div className="login-field">

            <div className="login-password-label">

              <label htmlFor="password">

                Password

              </label>


              <Link
                to="/forgot-password"
                className="login-forgot-link"
              >

                Forgot password?

              </Link>

            </div>


            <div className="login-password-wrap">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />


              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
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

                  <EyeOff
                    size={18}
                  />

                ) : (

                  <Eye
                    size={18}
                  />

                )}

              </button>

            </div>

          </div>


          {/* ===============================================
              LOGIN BUTTON
          =============================================== */}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >

            {loading ? (

              <>

                <span className="login-spinner" />

                Checking...

              </>

            ) : (

              <>

                Login

                <ArrowRight
                  size={17}
                />

              </>

            )}

          </button>

        </form>


        {/* =================================================
            SIGNUP
        ================================================= */}

        <div className="login-signup">

          <span>

            Don't have an account?

          </span>


          <Link
            to="/signup"
          >

            Create Account

          </Link>

        </div>


        {/* =================================================
            SUPPORT
        ================================================= */}

        <div className="login-support">

          <span>

            Need help?

          </span>


          <button
            type="button"
            onClick={contactAdmin}
          >

            Contact Administrator

          </button>

        </div>


      </section>


      {/* ===================================================
          MEMBERSHIP STATUS MODAL
      =================================================== */}

      {membershipError && (

        <div
          className="login-membership-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeMembershipPopup();

            }

          }}
        >

          <section
            className={
              `login-membership-modal ` +
              `login-membership-${membershipError.type}`
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-error-title"
          >


            {/* =============================================
                CLOSE
            ============================================= */}

            <button
              type="button"
              className="login-membership-close"
              onClick={
                closeMembershipPopup
              }
              aria-label="Close"
            >

              ×

            </button>


            {/* =============================================
                ICON
            ============================================= */}

            <div className="login-membership-icon">

              {membershipError.icon}

            </div>


            {/* =============================================
                LABEL
            ============================================= */}

            <span className="login-membership-label">

              {membershipError.label}

            </span>


            {/* =============================================
                TITLE
            ============================================= */}

            <h2
              id="membership-error-title"
            >

              {membershipError.title}

            </h2>


            {/* =============================================
                MESSAGE
            ============================================= */}

            <p>

              {membershipError.message}

            </p>


            {/* =============================================
                SUPPORT INFORMATION
            ============================================= */}

            <div className="login-membership-support">

              <div>

                <Mail size={16} />

                <a
                  href="mailto:support@snict.org"
                >

                  support@snict.org

                </a>

              </div>


              <div>

                <Phone size={16} />

                <a
                  href="tel:+919731464382"
                >

                  +91 97314 64382

                </a>

              </div>

            </div>


            {/* =============================================
                ACTIONS
            ============================================= */}

            <div className="login-membership-actions">

              <button
                type="button"
                className="login-membership-contact"
                onClick={contactAdmin}
              >

                <Mail size={16} />

                Contact Administrator

              </button>


              <button
                type="button"
                className="login-membership-call"
                onClick={callAdmin}
              >

                <Phone size={16} />

                Call Administrator

              </button>

            </div>


            {/* =============================================
                CLOSE
            ============================================= */}

            <button
              type="button"
              className="login-membership-later"
              onClick={
                closeMembershipPopup
              }
            >

              Close

            </button>

          </section>

        </div>

      )}

    </main>

  );

}


export default Login;