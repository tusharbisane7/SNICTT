import { useEffect, useState } from "react";

import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
  Loader2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

import snictLogo from "../../assets/snict-logo.jpeg";

import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  // =========================================================
  // FORM STATE
  // =========================================================

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    age: "",
    sex: "",
    address: "",
    bloodGroup: "",
  });

  // =========================================================
  // UI STATE
  // =========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // USERNAME STATE
  // =========================================================

  const [usernameStatus, setUsernameStatus] =
    useState("idle");

  const [usernameMessage, setUsernameMessage] =
    useState("");

  const [usernameSuggestions, setUsernameSuggestions] =
    useState([]);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    let updatedValue = value;

    // Username always lowercase
    if (name === "username") {
      updatedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
    }

    // Mobile only numbers
    if (name === "mobile") {
      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    setForm((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }

    // Reset username status when username changes
    if (name === "username") {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSuggestions([]);
    }
  };

  // =========================================================
  // CHECK USERNAME
  // =========================================================

  useEffect(() => {
    const username =
      form.username.trim().toLowerCase();

    if (!username) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSuggestions([]);
      return;
    }

    if (username.length < 3) {
      setUsernameStatus("invalid");

      setUsernameMessage(
        "Username must be at least 3 characters"
      );

      setUsernameSuggestions([]);

      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameStatus("invalid");

      setUsernameMessage(
        "Only letters, numbers and underscore are allowed"
      );

      setUsernameSuggestions([]);

      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setUsernameStatus("checking");

          setUsernameMessage(
            "Checking username..."
          );

          const response =
            await api.get(
              "/auth/check-username",
              {
                params: {
                  username,
                },
              }
            );

          if (
            response.data?.available
          ) {
            setUsernameStatus(
              "available"
            );

            setUsernameMessage(
              "Username available"
            );

            setUsernameSuggestions([]);
          } else {
            setUsernameStatus(
              "taken"
            );

            setUsernameMessage(
              response.data?.message ||
                "Username already taken"
            );

            setUsernameSuggestions(
              response.data?.suggestions ||
                []
            );
          }
        } catch (error) {
          console.error(
            "Username check error:",
            error
          );

          setUsernameStatus(
            "error"
          );

          setUsernameMessage(
            "Unable to check username"
          );

          setUsernameSuggestions([]);
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }, [form.username]);

  // =========================================================
  // SELECT USERNAME SUGGESTION
  // =========================================================

  const selectSuggestion = (
    suggestion
  ) => {
    setForm((previous) => ({
      ...previous,
      username: suggestion,
    }));

    setUsernameStatus("checking");

    setUsernameMessage(
      "Checking username..."
    );

    setUsernameSuggestions([]);
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const fullName =
      form.fullName.trim();

    const username =
      form.username.trim();

    const email =
      form.email.trim();

    const mobile =
      form.mobile.trim();

    const address =
      form.address.trim();

    const age =
      Number(form.age);

    if (
      !fullName ||
      !username ||
      !email ||
      !mobile ||
      !address
    ) {
      return "Please fill in all required fields.";
    }

    if (
      username.length < 3 ||
      username.length > 20
    ) {
      return "Username must be between 3 and 20 characters.";
    }

    if (
      !/^[a-zA-Z0-9_]+$/.test(
        username
      )
    ) {
      return "Username can contain only letters, numbers and underscore.";
    }

    if (
      usernameStatus !==
      "available"
    ) {
      return "Please choose an available username.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      !/^\d{10}$/.test(
        mobile
      )
    ) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (
      !Number.isInteger(age) ||
      age < 1 ||
      age > 120
    ) {
      return "Please enter a valid age.";
    }

    if (!form.sex) {
      return "Please select your sex.";
    }

    if (!form.bloodGroup) {
      return "Please select your blood group.";
    }

    if (
      form.password.length < 8
    ) {
      return "Password must be at least 8 characters.";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  // =========================================================
  // SUBMIT
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

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/auth/signup",
          {
            fullName:
              form.fullName.trim(),

            username:
              form.username
                .trim()
                .toLowerCase(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            mobile:
              form.mobile.trim(),

            password:
              form.password,

            age:
              Number(form.age),

            sex:
              form.sex,

            address:
              form.address.trim(),

            bloodGroup:
              form.bloodGroup,
          }
        );

      console.log(
        "Signup successful:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Account created successfully."
      );

      // =====================================================
      // REDIRECT TO LOGIN
      // =====================================================

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);

    } catch (error) {
      console.error(
        "Signup error:",
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
        409
      ) {
        setError(
          "Email, username or mobile number is already registered."
        );
      } else if (
        error.response?.status ===
        400
      ) {
        setError(
          "Please check your signup information."
        );
      } else if (
        error.response?.status ===
        500
      ) {
        setError(
          "Server error while creating your account. Please try again."
        );
      } else if (
        error.request
      ) {
        setError(
          "Unable to connect to SNICT server. Please make sure the backend is running."
        );
      } else {
        setError(
          "Unable to create account. Please try again."
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

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="auth-background"
        aria-hidden="true"
      />


      {/* =====================================================
          SIGNUP CARD
      ===================================================== */}

      <section
        className="signup-card"
        aria-labelledby="signup-title"
      >

        {/* ===================================================
            HEADER / LOGO
        =================================================== */}

        <div className="auth-header">

          <Link
            to="/"
            className="auth-logo-link"
            aria-label="SNICT Home"
          >

            <div className="auth-logo">

              <img
                src={snictLogo}
                alt="SNICT Logo"
                className="auth-logo-image"
              />

            </div>

          </Link>


          <div className="auth-brand-block">

            <span className="auth-brand">
              SNICT
            </span>

            <span className="auth-brand-subtitle">
              Society of Neo Interventional
              <br />
              Cardiovascular Technologists
            </span>

          </div>

        </div>


        {/* ===================================================
            TITLE
        =================================================== */}

        <div className="auth-title">

          <span>
            CREATE ACCOUNT
          </span>

          <h1 id="signup-title">
            Join SNICT
          </h1>

          <p>
            Create your professional
            SNICT account.
          </p>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="auth-error"
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
            className="auth-success"
            role="status"
          >
            {success}
          </div>
        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          className="signup-form"
          onSubmit={handleSubmit}
          noValidate
        >

          <div className="form-grid">

            {/* =================================================
                FULL NAME
            ================================================= */}

            <div className="form-field full">

              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={100}
                required
              />

            </div>


            {/* =================================================
                USERNAME
            ================================================= */}

            <div className="form-field">

              <label htmlFor="username">
                Username
              </label>

              <div className="username-wrapper">

                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  required
                />

                <div className="username-status">

                  {usernameStatus ===
                    "checking" && (
                    <Loader2
                      size={18}
                      className="username-spinner"
                    />
                  )}

                  {usernameStatus ===
                    "available" && (
                    <Check
                      size={19}
                      className="username-available"
                    />
                  )}

                  {(
                    usernameStatus ===
                      "taken" ||
                    usernameStatus ===
                      "invalid"
                  ) && (
                    <X
                      size={19}
                      className="username-taken"
                    />
                  )}

                </div>

              </div>


              {/* USERNAME MESSAGE */}

              {usernameMessage && (
                <small
                  className={`username-message ${usernameStatus}`}
                >
                  {usernameMessage}
                </small>
              )}


              {/* USERNAME SUGGESTIONS */}

              {usernameSuggestions.length >
                0 && (
                <div className="username-suggestions">

                  <span>
                    Try:
                  </span>

                  <div>

                    {usernameSuggestions.map(
                      (
                        suggestion
                      ) => (
                        <button
                          key={
                            suggestion
                          }
                          type="button"
                          onClick={() =>
                            selectSuggestion(
                              suggestion
                            )
                          }
                        >
                          {suggestion}
                        </button>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>


            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="form-field">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={150}
                required
              />

            </div>


            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="form-field">

              <label htmlFor="mobile">
                Mobile Number
              </label>

              <input
                id="mobile"
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                required
              />

            </div>


            {/* =================================================
                AGE
            ================================================= */}

            <div className="form-field">

              <label htmlFor="age">
                Age
              </label>

              <input
                id="age"
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                min="1"
                max="120"
                placeholder="Age"
                autoComplete="off"
                required
              />

            </div>


            {/* =================================================
                SEX
            ================================================= */}

            <div className="form-field">

              <label htmlFor="sex">
                Sex
              </label>

              <select
                id="sex"
                name="sex"
                value={form.sex}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select sex
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

                <option value="Prefer not to say">
                  Prefer not to say
                </option>

              </select>

            </div>


            {/* =================================================
                BLOOD GROUP
            ================================================= */}

            <div className="form-field">

              <label htmlFor="bloodGroup">
                Blood Group
              </label>

              <select
                id="bloodGroup"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select blood group
                </option>

                <option value="A+">
                  A+
                </option>

                <option value="A-">
                  A-
                </option>

                <option value="B+">
                  B+
                </option>

                <option value="B-">
                  B-
                </option>

                <option value="AB+">
                  AB+
                </option>

                <option value="AB-">
                  AB-
                </option>

                <option value="O+">
                  O+
                </option>

                <option value="O-">
                  O-
                </option>

              </select>

            </div>


            {/* =================================================
                ADDRESS
            ================================================= */}

            <div className="form-field full">

              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your address"
                rows="3"
                autoComplete="street-address"
                maxLength={500}
                required
              />

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
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
                CONFIRM PASSWORD
            ================================================= */}

            <div className="form-field">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="password-wrapper">

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={
                    form.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
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
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </div>

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              usernameStatus !==
                "available"
            }
          >

            <span>
              {loading
                ? "Creating account..."
                : "Create SNICT Account"}
            </span>

            {!loading && (
              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            )}

          </button>

        </form>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Login
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Signup;