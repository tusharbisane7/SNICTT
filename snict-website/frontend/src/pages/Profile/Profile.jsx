import { useEffect, useState } from "react";

import {
  UserCircle,
  Save,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Droplets,
  CalendarDays,
  VenusAndMars,
  AtSign,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Profile.css";


function Profile() {

  const { user, setUser } = useAuth();


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
  });


  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


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
    });


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


    return "";

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

      setError(validationError);

      return;

    }


    try {

      setSaving(true);


      const response =
        await api.put(
          "/auth/profile",
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

            age:
              Number(form.age),

            sex:
              form.sex,

            mobile:
              form.mobile.trim(),

            address:
              form.address.trim(),

            bloodGroup:
              form.bloodGroup,
          }
        );


      if (
        response.data?.success &&
        response.data?.user
      ) {

        setUser(
          response.data.user
        );


        setForm({
          fullName:
            response.data.user.fullName ||
            "",

          username:
            response.data.user.username ||
            "",

          email:
            response.data.user.email ||
            "",

          age:
            response.data.user.age ||
            "",

          sex:
            response.data.user.sex ||
            "",

          mobile:
            response.data.user.mobile ||
            "",

          address:
            response.data.user.address ||
            "",

          bloodGroup:
            response.data.user.bloodGroup ||
            "",
        });

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

        <section className="profile-card profile-loading">

          <div className="profile-loading-spinner" />

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

        <section className="profile-card profile-empty">

          <div className="profile-icon">
            <UserCircle size={30} />
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
  // UI
  // =========================================================

  return (

    <main className="profile-page">

      <div
        className="profile-glow profile-glow-one"
        aria-hidden="true"
      />

      <div
        className="profile-glow profile-glow-two"
        aria-hidden="true"
      />


      <div className="profile-container">

        {/* =================================================
            HEADER
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

          {/* HEADER */}

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
              MESSAGES
          ================================================= */}

          {error && (

            <div
              className="profile-message profile-error"
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
              className="profile-message profile-success"
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


              {/* FULL NAME */}

              <div className="profile-field profile-full">

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
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    maxLength={100}
                    autoComplete="name"
                  />

                </div>

              </div>


              {/* USERNAME */}

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
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Username"
                    maxLength={30}
                    autoComplete="username"
                  />

                </div>

                <small>
                  Letters, numbers and underscore only.
                </small>

              </div>


              {/* EMAIL */}

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
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    maxLength={150}
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* AGE */}

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
                    value={form.age}
                    onChange={handleChange}
                    min="1"
                    max="120"
                  />

                </div>

              </div>


              {/* SEX */}

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
                    value={form.sex}
                    onChange={handleChange}
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


              {/* MOBILE */}

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
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    autoComplete="tel"
                  />

                </div>

              </div>


              {/* BLOOD GROUP */}

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
                    value={form.bloodGroup}
                    onChange={handleChange}
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


              {/* ADDRESS */}

              <div className="profile-field profile-full">

                <label htmlFor="profile-address">
                  Address
                </label>

                <div className="profile-textarea-wrapper">

                  <MapPin
                    size={17}
                  />

                  <textarea
                    id="profile-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    rows="3"
                    maxLength={500}
                    autoComplete="street-address"
                  />

                </div>

              </div>

            </div>


            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div className="profile-account-info">

              <div className="profile-account-item">

                <div className="profile-account-icon">

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


              <div className="profile-account-item">

                <div className="profile-account-icon">

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
              className="profile-save-button"
              disabled={saving}
            >

              {saving ? (

                <span className="profile-button-spinner" />

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


        {/* SECURITY NOTE */}

        <div className="profile-security-note">

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