import { useEffect, useRef, useState } from "react";

import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

import snictLogo from "../../assets/snict-logo.png";

import "./Signup.css";


function Signup() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

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
    designation: "",
    bio: "",
  });

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");

  // =========================================================
  // MEMBERSHIP
  // =========================================================

  const [membershipPlans, setMembershipPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [paymentSettings, setPaymentSettings] = useState(null);

  const [membershipId, setMembershipId] = useState(null);

  const [utrNumber, setUtrNumber] = useState("");

  const [membershipStep, setMembershipStep] = useState("plan");

  const [membershipLoading, setMembershipLoading] =
    useState(false);

  // =========================================================
  // UI
  // =========================================================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // USERNAME
  // =========================================================

  const [usernameStatus, setUsernameStatus] =
    useState("idle");

  const [usernameMessage, setUsernameMessage] =
    useState("");

  const [usernameSuggestions, setUsernameSuggestions] =
    useState([]);

  // =========================================================
  // BIO WORD COUNT
  // =========================================================

  const getWordCount = (text) => {
    if (!text || !text.trim()) {
      return 0;
    }

    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  };

  const bioWordCount = getWordCount(form.bio);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    let updatedValue = value;

    if (name === "username") {
      updatedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
    }

    if (name === "mobile") {
      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    if (name === "bio") {
      const words = value
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      if (words.length > 300) {
        updatedValue = words
          .slice(0, 300)
          .join(" ");
      }
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

    if (name === "username") {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSuggestions([]);
    }
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Profile image must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileImage(file);
    setProfilePreview(previewUrl);
  };

  const removeProfileImage = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }

    setProfileImage(null);
    setProfilePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  // =========================================================
  // LOAD MEMBERSHIP PLANS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadMembershipPlans = async () => {
      try {
        const response =
          await api.get("/membership/plans");

        if (mounted) {
          setMembershipPlans(
            Array.isArray(response.data?.plans)
              ? response.data.plans
              : []
          );
        }
      } catch (error) {
        console.error(
          "Membership plans error:",
          error
        );

        if (mounted) {
          setMembershipPlans([]);
        }
      }
    };

    loadMembershipPlans();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // CHECK USERNAME
  // =========================================================

  useEffect(() => {
    const username = form.username
      .trim()
      .toLowerCase();

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

    const timer = setTimeout(async () => {
      try {
        setUsernameStatus("checking");
        setUsernameMessage("Checking username...");

        const response = await api.get(
          "/auth/check-username",
          {
            params: {
              username,
            },
          }
        );

        if (response.data?.available) {
          setUsernameStatus("available");

          setUsernameMessage(
            "Username available"
          );

          setUsernameSuggestions([]);
        } else {
          setUsernameStatus("taken");

          setUsernameMessage(
            response.data?.message ||
              "Username already taken"
          );

          setUsernameSuggestions(
            response.data?.suggestions || []
          );
        }
      } catch (error) {
        console.error(
          "Username check error:",
          error
        );

        setUsernameStatus("error");

        setUsernameMessage(
          "Unable to check username"
        );

        setUsernameSuggestions([]);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [form.username]);

  // =========================================================
  // SELECT USERNAME SUGGESTION
  // =========================================================

  const selectSuggestion = (suggestion) => {
    setForm((previous) => ({
      ...previous,
      username: suggestion,
    }));

    setUsernameStatus("checking");
    setUsernameMessage("Checking username...");
    setUsernameSuggestions([]);
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const mobile = form.mobile.trim();
    const address = form.address.trim();
    const designation = form.designation.trim();
    const bio = form.bio.trim();
    const age = Number(form.age);

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

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return (
        "Username can contain only letters, " +
        "numbers and underscore."
      );
    }

    if (usernameStatus !== "available") {
      return "Please choose an available username.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "Please enter a valid email address.";
    }

    if (!/^\d{10}$/.test(mobile)) {
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

    if (designation.length > 150) {
      return "Designation must not exceed 150 characters.";
    }

    if (getWordCount(bio) > 300) {
      return "Bio must not exceed 300 words.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    if (
      membershipPlans.length > 0 &&
      !selectedPlanId
    ) {
      return "Please select a membership plan.";
    }

    return "";
  };

  // =========================================================
  // SIGNUP
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "fullName",
        form.fullName.trim()
      );

      formData.append(
        "username",
        form.username
          .trim()
          .toLowerCase()
      );

      formData.append(
        "email",
        form.email
          .trim()
          .toLowerCase()
      );

      formData.append(
        "mobile",
        form.mobile.trim()
      );

      formData.append(
        "password",
        form.password
      );

      formData.append(
        "age",
        String(Number(form.age))
      );

      formData.append(
        "sex",
        form.sex
      );

      formData.append(
        "address",
        form.address.trim()
      );

      formData.append(
        "bloodGroup",
        form.bloodGroup
      );

      formData.append(
        "designation",
        form.designation.trim()
      );

      formData.append(
        "bio",
        form.bio.trim()
      );

      if (profileImage) {
        formData.append(
          "profileImage",
          profileImage
        );
      }

      const response = await api.post(
        "/auth/signup",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Signup successful:",
        response.data
      );

      // =====================================================
      // MEMBERSHIP FLOW
      // =====================================================

      if (selectedPlanId) {
        setMembershipLoading(true);

        try {
          // -------------------------------------------------
          // AUTO LOGIN
          // -------------------------------------------------

          const loginResponse =
            await api.post(
              "/auth/login",
              {
                identifier:
                  form.username
                    .trim()
                    .toLowerCase(),

                password:
                  form.password,
              }
            );

          if (!loginResponse.data?.success) {
            throw new Error(
              "Automatic login failed"
            );
          }

          // -------------------------------------------------
          // CREATE MEMBERSHIP
          // -------------------------------------------------

          const applyResponse =
            await api.post(
              "/membership/apply",
              {
                planId:
                  Number(selectedPlanId),
              }
            );

          const createdMembership =
            applyResponse.data?.membership;

          if (!createdMembership?.id) {
            throw new Error(
              "Membership application was not created"
            );
          }

          setMembershipId(
            createdMembership.id
          );

          // -------------------------------------------------
          // PAYMENT SETTINGS
          // -------------------------------------------------

          try {
            const settingsResponse =
              await api.get(
                "/membership/payment-settings"
              );

            setPaymentSettings(
              settingsResponse.data?.settings ||
                settingsResponse.data?.paymentSettings ||
                null
            );
          } catch (settingsError) {
            console.warn(
              "Payment settings endpoint error:",
              settingsError
            );

            setPaymentSettings(
              applyResponse.data
                ?.paymentSettings || null
            );
          }

          // -------------------------------------------------
          // SHOW PAYMENT
          // -------------------------------------------------

          setMembershipStep("payment");

          setSuccess(
            "Account created. Complete your membership payment and enter the UTR number."
          );
        } catch (membershipError) {
          console.error(
            "Membership signup flow error:",
            membershipError
          );

          setSuccess(
            response.data?.message ||
              "Account created successfully."
          );

          setError(
            membershipError.response?.data?.message ||
              "Account was created, but membership setup could not be completed. Please login and complete membership from your membership page."
          );
        } finally {
          setMembershipLoading(false);
        }
      } else {
        setSuccess(
          response.data?.message ||
            "Account created successfully."
        );

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1200);
      }
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      const backendMessage =
        error.response?.data?.message;

      if (backendMessage) {
        setError(backendMessage);
      } else if (
        error.response?.status === 409
      ) {
        setError(
          "Email, username or mobile number is already registered."
        );
      } else if (
        error.response?.status === 400
      ) {
        setError(
          "Please check your signup information."
        );
      } else if (
        error.response?.status === 413
      ) {
        setError(
          "Profile image is too large."
        );
      } else if (
        error.response?.status === 500
      ) {
        setError(
          "Server error while creating your account. Please try again."
        );
      } else if (error.request) {
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
  // SUBMIT PAYMENT / UTR
  // =========================================================

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    if (membershipLoading) {
      return;
    }

    const cleanUtr =
      String(utrNumber).trim();

    if (!membershipId) {
      setError(
        "Membership application was not created. Please login and try again."
      );

      return;
    }

    if (!cleanUtr) {
      setError(
        "Please enter your UTR / transaction number."
      );

      return;
    }

    if (
      cleanUtr.length < 6 ||
      cleanUtr.length > 50
    ) {
      setError(
        "Please enter a valid UTR / transaction number."
      );

      return;
    }

    try {
      setError("");
      setSuccess("");
      setMembershipLoading(true);

      const response =
        await api.post(
          "/membership/payment",
          {
            membershipId,
            utrNumber: cleanUtr,
          }
        );

      setSuccess(
        response.data?.message ||
          "Payment submitted successfully. Your membership is now waiting for admin approval."
      );

      setMembershipStep("submitted");
    } catch (error) {
      console.error(
        "Membership payment error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to submit payment details."
      );
    } finally {
      setMembershipLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const finishMembershipFlow = () => {
    navigate("/login", {
      replace: true,
    });
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="auth-page">

      <div
        className="auth-background"
        aria-hidden="true"
      />

      <section
        className="signup-card"
        aria-labelledby="signup-title"
      >

        {/* ===================================================
            HEADER
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
            SIGNUP FORM
            IMPORTANT:
            Payment form is NOT inside this form.
        =================================================== */}

        {membershipStep === "plan" && (
          <form
            className="signup-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* =================================================
                PROFILE PHOTO
            ================================================= */}

            <div className="profile-photo-section">

              <div className="profile-photo-preview">

                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                  />
                ) : (
                  <div className="profile-photo-placeholder">

                    <Camera size={32} />

                    <span>
                      Add Photo
                    </span>

                  </div>
                )}

              </div>

              <div className="profile-photo-actions">

                <div>

                  <h3>
                    Profile Photo
                  </h3>

                  <p>
                    Add a professional profile
                    photo for your SNICT profile.
                  </p>

                  <small>
                    JPG, PNG or WEBP • Max 5 MB
                  </small>

                </div>

                <div className="profile-photo-buttons">

                  <button
                    type="button"
                    className="profile-upload-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    <Camera size={16} />

                    {profileImage
                      ? "Change Photo"
                      : "Add Photo"}
                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      className="profile-remove-button"
                      onClick={
                        removeProfileImage
                      }
                    >
                      <Trash2 size={16} />

                      Remove
                    </button>
                  )}

                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={
                    handleProfileImageChange
                  }
                  hidden
                />

              </div>

            </div>

            {/* =================================================
                FORM GRID
            ================================================= */}

            <div className="form-grid">

              {/* FULL NAME */}

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

              {/* DESIGNATION */}

              <div className="form-field full">

                <label htmlFor="designation">
                  Designation
                </label>

                <input
                  id="designation"
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Cardiovascular Technologist"
                  maxLength={150}
                  autoComplete="organization-title"
                />

                <small className="field-help">
                  Maximum 150 characters.
                </small>

              </div>

              {/* USERNAME */}

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

                    {(usernameStatus ===
                      "taken" ||
                      usernameStatus ===
                        "invalid") && (
                      <X
                        size={19}
                        className="username-taken"
                      />
                    )}

                  </div>

                </div>

                {usernameMessage && (
                  <small
                    className={`username-message ${usernameStatus}`}
                  >
                    {usernameMessage}
                  </small>
                )}

                {usernameSuggestions.length >
                  0 && (
                  <div className="username-suggestions">

                    <span>
                      Try:
                    </span>

                    <div>

                      {usernameSuggestions.map(
                        (suggestion) => (
                          <button
                            key={suggestion}
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

              {/* EMAIL */}

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

              {/* MOBILE */}

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

              {/* AGE */}

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

              {/* SEX */}

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

              {/* BLOOD GROUP */}

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

                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

              </div>

              {/* ADDRESS */}

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

              {/* BIO */}

              <div className="form-field full">

                <label htmlFor="bio">
                  Professional Bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell the SNICT community about your professional background, experience, interests and areas of expertise..."
                  rows="6"
                  maxLength={3000}
                />

                <div className="bio-counter">

                  <span>
                    Maximum 300 words
                  </span>

                  <span
                    className={
                      bioWordCount >= 280
                        ? "bio-counter-warning"
                        : ""
                    }
                  >
                    {bioWordCount} / 300 words
                  </span>

                </div>

              </div>

              {/* PASSWORD */}

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

              {/* CONFIRM PASSWORD */}

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
                MEMBERSHIP PLAN
            ================================================= */}

            <section className="signup-membership-section">

              <div className="signup-membership-header">

                <div>

                  <span className="signup-membership-eyebrow">
                    MEMBERSHIP
                  </span>

                  <h2>
                    Choose your SNICT membership
                  </h2>

                  <p>
                    Select a membership plan. After
                    your account is created, you can
                    pay using the official payment QR
                    and submit your UTR for approval.
                  </p>

                </div>

              </div>

              {membershipPlans.length > 0 ? (
                <div className="signup-membership-plans">

                  {membershipPlans.map((plan) => {

                    const planId = String(
                      plan.id ??
                        plan.planId
                    );

                    const duration =
                      plan.durationYears ??
                      plan.duration_years ??
                      1;

                    const price = Number(
                      plan.price ??
                        plan.amount ??
                        0
                    );

                    const name =
                      plan.name ||
                      `${duration} Year Membership`;

                    const active =
                      plan.isActive ??
                      plan.is_active ??
                      true;

                    if (!active) {
                      return null;
                    }

                    return (
                      <button
                        key={planId}
                        type="button"
                        className={`signup-membership-plan ${
                          String(
                            selectedPlanId
                          ) === planId
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedPlanId(
                            planId
                          )
                        }
                      >

                        <span className="membership-plan-check">
                          {String(
                            selectedPlanId
                          ) === planId
                            ? "✓"
                            : ""}
                        </span>

                        <span className="membership-plan-name">
                          {name}
                        </span>

                        <span className="membership-plan-duration">
                          Valid for{" "}
                          {duration}{" "}
                          {Number(duration) === 1
                            ? "year"
                            : "years"}
                        </span>

                        <strong className="membership-plan-price">
                          ₹
                          {price.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </button>
                    );
                  })}

                </div>
              ) : (
                <div className="signup-membership-empty">
                  Membership plans are currently
                  unavailable. You can create your
                  account and join later from the
                  membership section.
                </div>
              )}

            </section>

            {/* =================================================
                CREATE ACCOUNT
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

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="username-spinner"
                  />

                  <span>
                    Creating account...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Create SNICT Account
                  </span>

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </>
              )}

            </button>

          </form>
        )}

        {/* =====================================================
            PAYMENT SECTION
            IMPORTANT:
            This form is now OUTSIDE signup form.
        ===================================================== */}

        {membershipStep === "payment" && (
          <section className="signup-payment-section">

            <div className="signup-payment-header">

              <span className="signup-membership-eyebrow">
                PAYMENT
              </span>

              <h2>
                Complete membership payment
              </h2>

              <p>
                Scan the official SNICT payment QR,
                complete the payment, then enter
                the UTR number below.
              </p>

            </div>

            {paymentSettings?.qrCode ? (
              <div className="signup-payment-qr">

                <img
                  src={paymentSettings.qrCode}
                  alt="SNICT membership payment QR"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";

                    const parent =
                      event.currentTarget.parentElement;

                    if (
                      parent &&
                      !parent.querySelector(
                        ".signup-payment-qr-error"
                      )
                    ) {
                      const message =
                        document.createElement("div");

                      message.className =
                        "signup-payment-qr-error";

                      message.innerText =
                        "Payment QR could not be loaded. Please contact the administrator.";

                      parent.appendChild(message);
                    }
                  }}
                />

              </div>
            ) : (
              <div className="signup-payment-qr signup-payment-qr-empty">
                <span>
                  Payment QR is currently unavailable.
                  Please contact the administrator.
                </span>
              </div>
            )}

            <div className="signup-payment-details">

              {paymentSettings?.accountName && (
                <div>

                  <span>
                    Account Name
                  </span>

                  <strong>
                    {paymentSettings.accountName}
                  </strong>

                </div>
              )}

              {paymentSettings?.upiId && (
                <div>

                  <span>
                    UPI ID
                  </span>

                  <strong>
                    {paymentSettings.upiId}
                  </strong>

                </div>
              )}

            </div>

            {/* =================================================
                SEPARATE PAYMENT FORM
            ================================================= */}

            <form
              className="signup-payment-form"
              onSubmit={
                handlePaymentSubmit
              }
              noValidate
            >

              <div className="form-field full">

                <label htmlFor="utrNumber">
                  UTR / Transaction Number
                </label>

                <input
                  id="utrNumber"
                  type="text"
                  value={utrNumber}
                  onChange={(event) =>
                    setUtrNumber(
                      event.target.value
                    )
                  }
                  placeholder="Enter payment UTR number"
                  maxLength={50}
                  autoComplete="off"
                  required
                />

                <small className="field-help">
                  Your payment will remain
                  pending until an administrator
                  verifies it.
                </small>

              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  membershipLoading
                }
              >

                {membershipLoading
                  ? "Submitting payment..."
                  : "Submit UTR for Approval"}

              </button>

            </form>

          </section>
        )}

        {/* =====================================================
            MEMBERSHIP SUBMITTED
        ===================================================== */}

        {membershipStep === "submitted" && (
          <section className="signup-membership-success">

            <div className="membership-success-icon">
              ✓
            </div>

            <h2>
              Membership application submitted
            </h2>

            <p>
              Your payment details have been
              submitted. Your membership is now
              waiting for admin approval.
            </p>

            <p>
              You cannot login until your
              membership is approved by the
              administrator.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={
                finishMembershipFlow
              }
            >
              Continue to Login
            </button>

          </section>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

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