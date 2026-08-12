import { useEffect, useRef, useState } from "react";

import {
  UserCircle,
  Save,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  BadgeCheck,
  Clock3,
  IndianRupee,
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
  Droplets,
  CalendarDays,
  VenusAndMars,
  AtSign,
  Camera,
  Trash2,
  BriefcaseBusiness,
  FileText,
  Upload,
  X,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Profile.css";


function Profile() {

  const { user, setUser } = useAuth();

  const fileInputRef = useRef(null);


  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    age: "",
    sex: "",
    mobile: "",
    address: "",
    bloodGroup: "",
    designation: "",
    bio: "",
  });


  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const [profileImage, setProfileImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [removePhoto, setRemovePhoto] =
    useState(false);


  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingPhoto, setDeletingPhoto] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // MEMBERSHIP
  // =========================================================

  const [membership, setMembership] =
    useState(null);

  const [membershipLoading, setMembershipLoading] =
    useState(true);


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


  const bioWordCount =
    getWordCount(form.bio);


  // =========================================================
  // PROFILE IMAGE URL
  // =========================================================

  const getProfileImageUrl = (imageUrl) => {

    if (!imageUrl) {
      return null;
    }

    // Already a complete URL
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    // Relative backend path
    const apiBaseUrl =
      api.defaults?.baseURL || "";

    const cleanBaseUrl =
      apiBaseUrl.replace(/\/api\/?$/, "");

    if (imageUrl.startsWith("/")) {
      return `${cleanBaseUrl}${imageUrl}`;
    }

    return `${cleanBaseUrl}/${imageUrl}`;
  };


  // =========================================================
  // LOAD MEMBERSHIP
  // =========================================================

  const loadMembership = async () => {
    try {
      setMembershipLoading(true);

      const response =
        await api.get("/membership/me");

      const data =
        response.data;

      const membershipData =
        data?.membership ||
        data?.data ||
        data?.member ||
        null;

      setMembership(membershipData);
    } catch (error) {
      // A user may simply not have a membership yet.
      setMembership(null);
    } finally {
      setMembershipLoading(false);
    }
  };


  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {

    if (!user) {

      setLoading(false);

      return;
    }


    setForm({

      fullName:
        user.fullName || "",

      username:
        user.username || "",

      email:
        user.email || "",

      age:
        user.age || "",

      sex:
        user.sex || "",

      mobile:
        user.mobile || "",

      address:
        user.address || "",

      bloodGroup:
        user.bloodGroup || "",

      designation:
        user.designation || "",

      bio:
        user.bio || "",
    });


    const existingImage =
      getProfileImageUrl(
        user.profileImageUrl
      );

    setImagePreview(
      existingImage
    );

    loadMembership();

    setProfileImage(null);

    setRemovePhoto(false);

    setLoading(false);

  }, [user]);


  // =========================================================
  // HANDLE CHANGE
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));


    setError("");
    setSuccess("");


    // =======================================================
    // BIO 300 WORD LIMIT
    // =======================================================

    if (name === "bio") {

      const words =
        getWordCount(value);

      if (words > 300) {

        setError(
          "Bio cannot exceed 300 words."
        );

        return;
      }
    }

  };


  // =========================================================
  // HANDLE PROFILE IMAGE
  // =========================================================

  const handleImageChange = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    setError("");
    setSuccess("");


    // =======================================================
    // FILE TYPE
    // =======================================================

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Please upload a JPG, PNG or WEBP image."
      );

      event.target.value = "";

      return;
    }


    // =======================================================
    // FILE SIZE
    // =======================================================

    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      setError(
        "Profile picture must be smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }


    // =======================================================
    // PREVIEW
    // =======================================================

    const previewUrl =
      URL.createObjectURL(file);


    setProfileImage(file);

    setImagePreview(
      previewUrl
    );

    setRemovePhoto(false);

  };


  // =========================================================
  // OPEN FILE SELECTOR
  // =========================================================

  const openImageSelector = () => {

    if (fileInputRef.current) {

      fileInputRef.current.click();

    }

  };


  // =========================================================
  // REMOVE SELECTED IMAGE
  // =========================================================

  const handleRemoveImage = () => {

    setProfileImage(null);

    setImagePreview(null);

    setRemovePhoto(true);

    setError("");
    setSuccess("");


    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {

    if (!form.fullName.trim()) {

      return "Full name is required.";

    }


    if (!form.username.trim()) {

      return "Username is required.";

    }


    if (
      form.username.trim().length < 3
    ) {

      return "Username must be at least 3 characters.";

    }


    if (
      form.username.trim().length > 20
    ) {

      return "Username must not exceed 20 characters.";

    }


    if (
      !/^[a-zA-Z0-9_]+$/.test(
        form.username.trim()
      )
    ) {

      return "Username can contain only letters, numbers and underscore.";

    }


    if (!form.email.trim()) {

      return "Email is required.";

    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {

      return "Please enter a valid email address.";

    }


    const age =
      Number(form.age);


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


    if (!form.mobile.trim()) {

      return "Mobile number is required.";

    }


    if (
      !/^[0-9]{10}$/.test(
        form.mobile.trim()
      )
    ) {

      return "Please enter a valid 10-digit mobile number.";

    }


    if (!form.address.trim()) {

      return "Address is required.";

    }


    if (!form.bloodGroup) {

      return "Please select your blood group.";

    }


    // =======================================================
    // DESIGNATION
    // =======================================================

    if (
      form.designation.trim().length > 150
    ) {

      return "Designation must not exceed 150 characters.";

    }


    // =======================================================
    // BIO
    // =======================================================

    if (
      getWordCount(form.bio) > 300
    ) {

      return "Bio must not exceed 300 words.";

    }


    return "";

  };


  // =========================================================
  // DELETE PROFILE PHOTO FROM BACKEND
  // =========================================================

  const handleDeletePhoto = async () => {

    if (
      deletingPhoto ||
      saving
    ) {
      return;
    }


    setError("");
    setSuccess("");


    // =======================================================
    // If image is newly selected but not saved yet,
    // just remove the local preview.
    // =======================================================

    if (profileImage) {

      handleRemoveImage();

      return;

    }


    if (!imagePreview) {
      return;
    }


    try {

      setDeletingPhoto(true);


      const response =
        await api.delete(
          "/auth/profile/photo"
        );


      if (
        response.data?.success
      ) {

        if (
          response.data?.user
        ) {

          setUser(
            response.data.user
          );

        }


        setImagePreview(null);

        setProfileImage(null);

        setRemovePhoto(false);


        setSuccess(
          response.data?.message ||
          "Profile photo deleted successfully."
        );

      } else {

        setError(
          response.data?.message ||
          "Unable to delete profile photo."
        );

      }

    } catch (error) {

      console.error(
        "Delete profile photo error:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Unable to delete profile photo. Please try again."
      );

    } finally {

      setDeletingPhoto(false);

    }

  };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (saving) {
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

      setSaving(true);


      // =====================================================
      // FORM DATA
      // =====================================================

      const formData =
        new FormData();


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
        "age",
        String(
          Number(form.age)
        )
      );


      formData.append(
        "sex",
        form.sex
      );


      formData.append(
        "mobile",
        form.mobile.trim()
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


      // =====================================================
      // PROFILE IMAGE
      // =====================================================

      if (profileImage) {

        formData.append(
          "profileImage",
          profileImage
        );

      }


      // =====================================================
      // REMOVE IMAGE
      // =====================================================

      if (removePhoto) {

        formData.append(
          "removeProfileImage",
          "true"
        );

      }


      // =====================================================
      // API
      // =====================================================

      const response =
        await api.put(
          "/auth/profile",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      // =====================================================
      // SUCCESS
      // =====================================================

      if (
        response.data?.success &&
        response.data?.user
      ) {

        const updatedUser =
          response.data.user;


        setUser(
          updatedUser
        );


        setForm({

          fullName:
            updatedUser.fullName || "",

          username:
            updatedUser.username || "",

          email:
            updatedUser.email || "",

          age:
            updatedUser.age || "",

          sex:
            updatedUser.sex || "",

          mobile:
            updatedUser.mobile || "",

          address:
            updatedUser.address || "",

          bloodGroup:
            updatedUser.bloodGroup || "",

          designation:
            updatedUser.designation || "",

          bio:
            updatedUser.bio || "",
        });


        setProfileImage(null);

        setRemovePhoto(false);


        setImagePreview(
          getProfileImageUrl(
            updatedUser.profileImageUrl
          )
        );


        if (fileInputRef.current) {

          fileInputRef.current.value = "";

        }

      }


      setSuccess(
        response.data?.message ||
        "Profile updated successfully."
      );


    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Unable to update profile. Please try again."
      );


    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <main className="profile-page">

        <section
          className="
            profile-card
            profile-loading
          "
        >

          <div
            className="
              profile-loading-spinner
            "
          />

          <p>
            Loading your profile...
          </p>

        </section>

      </main>

    );

  }


  // =========================================================
  // NO USER
  // =========================================================

  if (!user) {

    return (

      <main className="profile-page">

        <section
          className="
            profile-card
            profile-empty
          "
        >

          <div className="profile-icon">

            <UserCircle
              size={30}
            />

          </div>


          <span className="profile-label">
            ACCOUNT
          </span>


          <h1>
            My Profile
          </h1>


          <p>
            Please login to view your profile.
          </p>

        </section>

      </main>

    );

  }


  // =========================================================
  // MEMBERSHIP HELPERS
  // =========================================================

  const formatMembershipDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  const getMembershipAmount = () => {
    const amount =
      membership?.amount ??
      membership?.price ??
      membership?.paymentAmount ??
      membership?.plan?.price ??
      membership?.planPrice;

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "—";
    }

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };


  const getMembershipStartDate = () =>
    membership?.startDate ||
    membership?.validFrom ||
    membership?.membershipStartDate ||
    membership?.approvedAt;


  const getMembershipEndDate = () =>
    membership?.endDate ||
    membership?.expiryDate ||
    membership?.expiresAt ||
    membership?.membershipEndDate;


  const getMembershipPurchaseDate = () =>
    membership?.purchaseDate ||
    membership?.purchasedAt ||
    membership?.paymentDate ||
    membership?.createdAt;


  const membershipStatus =
    String(
      membership?.status ||
      membership?.membershipStatus ||
      ""
    ).toLowerCase();


  const isMembershipActive =
    membershipStatus === "active" ||
    membershipStatus === "approved" ||
    membership?.isActive === true;


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="profile-page">

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        className="
          profile-glow
          profile-glow-one
        "
        aria-hidden="true"
      />


      <div
        className="
          profile-glow
          profile-glow-two
        "
        aria-hidden="true"
      />


      <div className="profile-container">


        {/* =================================================
            HERO
        ================================================= */}

        <section className="profile-hero">

          <div className="profile-hero-content">

            <span className="profile-eyebrow">
              MEMBER ACCOUNT
            </span>


            <h1>
              My <span>Profile</span>
            </h1>


            <p>
              Manage your SNICT account information
              and keep your member details up to date.
            </p>

          </div>


          <div className="profile-hero-icon">

            <UserCircle
              size={48}
              strokeWidth={1.5}
            />

          </div>

        </section>


        {/* =================================================
            MAIN CARD
        ================================================= */}

        <section
          className="profile-card"
          aria-labelledby="profile-title"
        >


          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <div className="profile-header">

            <div className="profile-header-icon">

              <UserCircle
                size={25}
              />

            </div>


            <div>

              <span className="profile-label">
                MEMBER PROFILE
              </span>


              <h2 id="profile-title">
                Personal Information
              </h2>


              <p>
                Update your information below.
              </p>

            </div>

          </div>


          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <div className="profile-photo-section">

            <div className="profile-photo-wrapper">

              {imagePreview ? (

                <img
                  src={imagePreview}
                  alt={
                    form.fullName
                      ? `${form.fullName} profile`
                      : "Profile"
                  }
                  className="profile-photo"
                />

              ) : (

                <div
                  className="
                    profile-photo-placeholder
                  "
                >

                  <UserCircle
                    size={58}
                    strokeWidth={1.3}
                  />

                </div>

              )}


              <button
                type="button"
                className="
                  profile-photo-camera
                "
                onClick={
                  openImageSelector
                }
                disabled={
                  saving ||
                  deletingPhoto
                }
                aria-label="Change profile photo"
                title="Change profile photo"
              >

                <Camera
                  size={18}
                />

              </button>

            </div>


            <div className="profile-photo-info">

              <span className="profile-photo-title">
                Profile Picture
              </span>


              <p>
                Upload a professional photo
                for your SNICT member profile.
              </p>


              <div className="profile-photo-actions">

                <button
                  type="button"
                  className="
                    profile-photo-upload
                  "
                  onClick={
                    openImageSelector
                  }
                  disabled={
                    saving ||
                    deletingPhoto
                  }
                >

                  <Upload
                    size={15}
                  />

                  <span>
                    {imagePreview
                      ? "Change Photo"
                      : "Upload Photo"}
                  </span>

                </button>


                {imagePreview && (

                  <button
                    type="button"
                    className="
                      profile-photo-delete
                    "
                    onClick={
                      handleDeletePhoto
                    }
                    disabled={
                      saving ||
                      deletingPhoto
                    }
                  >

                    {deletingPhoto ? (

                      <span
                        className="
                          profile-button-spinner
                        "
                      />

                    ) : (

                      <Trash2
                        size={15}
                      />

                    )}

                    <span>
                      {deletingPhoto
                        ? "Deleting..."
                        : "Delete"}
                    </span>

                  </button>

                )}

              </div>


              <small>
                JPG, PNG or WEBP • Maximum 5 MB
              </small>

            </div>


            {/* HIDDEN FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              accept="
                image/jpeg,
                image/jpg,
                image/png,
                image/webp
              "
              onChange={
                handleImageChange
              }
              hidden
            />

          </div>


          {/* =================================================
              MESSAGES
          ================================================= */}

          {error && (

            <div
              className="
                profile-message
                profile-error
              "
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


          {success && (

            <div
              className="
                profile-message
                profile-success
              "
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
            className="profile-form"
            onSubmit={handleSubmit}
            noValidate
          >

            <div className="profile-grid">


              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div
                className="
                  profile-field
                  profile-full
                "
              >

                <label htmlFor="profile-fullName">
                  Full Name
                </label>


                <div className="profile-input-wrapper">

                  <UserCircle
                    size={17}
                  />


                  <input
                    id="profile-fullName"
                    type="text"
                    name="fullName"
                    value={
                      form.fullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      Enter your full name
                    "
                    maxLength={100}
                    autoComplete="name"
                  />

                </div>

              </div>


              {/* =================================================
                  USERNAME
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-username">
                  Username
                </label>


                <div className="profile-input-wrapper">

                  <AtSign
                    size={17}
                  />


                  <input
                    id="profile-username"
                    type="text"
                    name="username"
                    value={
                      form.username
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Username"
                    maxLength={20}
                    autoComplete="username"
                  />

                </div>


                <small>
                  Letters, numbers and underscore only.
                </small>

              </div>


              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-email">
                  Email Address
                </label>


                <div className="profile-input-wrapper">

                  <Mail
                    size={17}
                  />


                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      you@example.com
                    "
                    maxLength={150}
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* =================================================
                  DESIGNATION
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-designation">
                  Designation
                </label>


                <div className="profile-input-wrapper">

                  <BriefcaseBusiness
                    size={17}
                  />


                  <input
                    id="profile-designation"
                    type="text"
                    name="designation"
                    value={
                      form.designation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      e.g. Senior Cardiovascular Technologist
                    "
                    maxLength={150}
                  />

                </div>


                <small>
                  Maximum 150 characters.
                </small>

              </div>


              {/* =================================================
                  AGE
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-age">
                  Age
                </label>


                <div className="profile-input-wrapper">

                  <CalendarDays
                    size={17}
                  />


                  <input
                    id="profile-age"
                    type="number"
                    name="age"
                    value={
                      form.age
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    max="120"
                  />

                </div>

              </div>


              {/* =================================================
                  SEX
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-sex">
                  Sex
                </label>


                <div className="profile-input-wrapper">

                  <VenusAndMars
                    size={17}
                  />


                  <select
                    id="profile-sex"
                    name="sex"
                    value={
                      form.sex
                    }
                    onChange={
                      handleChange
                    }
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

              </div>


              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-mobile">
                  Mobile Number
                </label>


                <div className="profile-input-wrapper">

                  <Phone
                    size={17}
                  />


                  <input
                    id="profile-mobile"
                    type="tel"
                    name="mobile"
                    value={
                      form.mobile
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      10-digit mobile number
                    "
                    maxLength={10}
                    autoComplete="tel"
                  />

                </div>

              </div>


              {/* =================================================
                  BLOOD GROUP
              ================================================= */}

              <div className="profile-field">

                <label htmlFor="profile-bloodGroup">
                  Blood Group
                </label>


                <div className="profile-input-wrapper">

                  <Droplets
                    size={17}
                  />


                  <select
                    id="profile-bloodGroup"
                    name="bloodGroup"
                    value={
                      form.bloodGroup
                    }
                    onChange={
                      handleChange
                    }
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

              </div>


              {/* =================================================
                  ADDRESS
              ================================================= */}

              <div
                className="
                  profile-field
                  profile-full
                "
              >

                <label htmlFor="profile-address">
                  Address
                </label>


                <div
                  className="
                    profile-textarea-wrapper
                  "
                >

                  <MapPin
                    size={17}
                  />


                  <textarea
                    id="profile-address"
                    name="address"
                    value={
                      form.address
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      Enter your address
                    "
                    rows="3"
                    maxLength={500}
                    autoComplete="street-address"
                  />

                </div>

              </div>


              {/* =================================================
                  BIO
              ================================================= */}

              <div
                className="
                  profile-field
                  profile-full
                "
              >

                <label htmlFor="profile-bio">
                  Professional Bio
                </label>


                <div
                  className="
                    profile-textarea-wrapper
                    profile-bio-wrapper
                  "
                >

                  <FileText
                    size={17}
                  />


                  <textarea
                    id="profile-bio"
                    name="bio"
                    value={
                      form.bio
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="
                      Tell SNICT members about yourself,
                      your professional experience,
                      expertise and interests...
                    "
                    rows="6"
                    maxLength={3000}
                  />

                </div>


                <div
                  className="
                    profile-bio-footer
                  "
                >

                  <small>
                    Maximum 300 words.
                  </small>


                  <span
                    className={
                      bioWordCount > 300
                        ? "bio-limit-exceeded"
                        : bioWordCount > 270
                        ? "bio-limit-warning"
                        : ""
                    }
                  >
                    {bioWordCount}/300 words
                  </span>

                </div>

              </div>

            </div>


            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div
              className="
                profile-account-info
              "
            >

              <div
                className="
                  profile-account-item
                "
              >

                <div
                  className="
                    profile-account-icon
                  "
                >

                  <ShieldCheck
                    size={17}
                  />

                </div>


                <div>

                  <span>
                    Account Status
                  </span>


                  <strong>
                    Active Member
                  </strong>

                </div>

              </div>


              <div
                className="
                  profile-account-item
                "
              >

                <div
                  className="
                    profile-account-icon
                  "
                >

                  <AtSign
                    size={17}
                  />

                </div>


                <div>

                  <span>
                    Username
                  </span>


                  <strong>
                    @{form.username || "member"}
                  </strong>

                </div>

              </div>

            </div>


            {/* =================================================
                SAVE
            ================================================= */}

            <button
              type="submit"
              className="
                profile-save-button
              "
              disabled={
                saving ||
                deletingPhoto
              }
            >

              {saving ? (

                <span
                  className="
                    profile-button-spinner
                  "
                />

              ) : (

                <Save
                  size={17}
                />

              )}


              <span>

                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}

              </span>

            </button>

          </form>

        </section>


        {/* =================================================
            MEMBERSHIP INFORMATION
        ================================================= */}

        <section className="profile-membership-card">

          <div className="profile-membership-header">

            <div className="profile-membership-title-wrap">

              <div className="profile-membership-icon">
                <BadgeCheck size={22} />
              </div>

              <div>
                <span className="profile-label">
                  MEMBERSHIP
                </span>

                <h2>
                  Membership Information
                </h2>

                <p>
                  View your membership payment and validity details.
                </p>
              </div>

            </div>

            {membership && (
              <span
                className={
                  isMembershipActive
                    ? "profile-membership-status active"
                    : membershipStatus === "pending"
                    ? "profile-membership-status pending"
                    : "profile-membership-status"
                }
              >
                {membershipStatus
                  ? membershipStatus.charAt(0).toUpperCase() +
                    membershipStatus.slice(1)
                  : "Membership"}
              </span>
            )}

          </div>


          {membershipLoading ? (

            <div className="profile-membership-loading">
              <span className="profile-button-spinner" />
              <span>Loading membership details...</span>
            </div>

          ) : membership ? (

            <div className="profile-membership-grid">

              <div className="profile-membership-item">

                <div className="profile-membership-item-icon">
                  <IndianRupee size={17} />
                </div>

                <div>
                  <span>Amount Paid</span>
                  <strong>
                    {getMembershipAmount()}
                  </strong>
                </div>

              </div>


              <div className="profile-membership-item">

                <div className="profile-membership-item-icon">
                  <ShoppingCart size={17} />
                </div>

                <div>
                  <span>Date of Purchase</span>
                  <strong>
                    {formatMembershipDate(
                      getMembershipPurchaseDate()
                    )}
                  </strong>
                </div>

              </div>


              <div className="profile-membership-item">

                <div className="profile-membership-item-icon">
                  <CalendarDays size={17} />
                </div>

                <div>
                  <span>Membership Starts</span>
                  <strong>
                    {formatMembershipDate(
                      getMembershipStartDate()
                    )}
                  </strong>
                </div>

              </div>


              <div className="profile-membership-item">

                <div className="profile-membership-item-icon">
                  <Clock3 size={17} />
                </div>

                <div>
                  <span>Membership Expires</span>
                  <strong>
                    {formatMembershipDate(
                      getMembershipEndDate()
                    )}
                  </strong>
                </div>

              </div>

            </div>

          ) : (

            <div className="profile-membership-empty">

              <BadgeCheck size={25} />

              <div>
                <strong>
                  No membership found
                </strong>

                <p>
                  You have not purchased or activated a membership yet.
                </p>
              </div>

            </div>

          )}

        </section>


        {/* =================================================
            SECURITY NOTE
        ================================================= */}

        <div
          className="
            profile-security-note
          "
        >

          <ShieldCheck
            size={16}
          />


          <span>
            Your account information is securely
            stored and used only for SNICT member services.
          </span>

        </div>

      </div>

    </main>

  );
}


export default Profile;