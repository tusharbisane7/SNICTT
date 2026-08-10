import { useEffect, useState } from "react";

import {
  UserCircle,
  ShieldCheck,
  Mail,
  Phone,
  AtSign,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../../../services/api";

import "./AdminProfile.css";


function AdminProfile() {

  // =========================================================
  // ADMIN
  // =========================================================

  const [admin, setAdmin] =
    useState(null);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // PROFILE FORM
  // =========================================================

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  // =========================================================
  // PASSWORD
  // =========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  const loadProfile = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get(
          "/admin/profile"
        );

      if (
        response.data?.success &&
        response.data?.admin
      ) {

        const data =
          response.data.admin;

        setAdmin(data);

        setName(
          data.name ||
          data.full_name ||
          ""
        );

        setUsername(
          data.username ||
          ""
        );

        setEmail(
          data.email ||
          ""
        );

        setMobile(
          data.mobile ||
          ""
        );

        localStorage.setItem(
          "snict_admin",
          JSON.stringify(data)
        );

      } else {

        setError(
          response.data?.message ||
          "Unable to load admin profile."
        );

      }

    } catch (error) {

      console.error(
        "Admin profile error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load admin profile."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    loadProfile();

  }, []);


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = async (
    event
  ) => {

    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {

      setError(
        "Name is required."
      );

      return;
    }

    if (!username.trim()) {

      setError(
        "Username is required."
      );

      return;
    }

    try {

      setSaving(true);

      const response =
        await api.put(
          "/admin/profile",
          {
            name:
              name.trim(),

            username:
              username.trim(),

            email:
              email.trim() ||
              null,

            mobile:
              mobile.trim() ||
              null,
          }
        );

      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to update profile."
        );

      }

      const updatedAdmin =
        response.data.admin ||
        {
          ...admin,
          name:
            name.trim(),
          username:
            username.trim(),
          email:
            email.trim(),
          mobile:
            mobile.trim(),
        };

      setAdmin(
        updatedAdmin
      );

      localStorage.setItem(
        "snict_admin",
        JSON.stringify(
          updatedAdmin
        )
      );

      setSuccess(
        response.data?.message ||
        "Admin profile updated successfully."
      );

    } catch (error) {

      console.error(
        "Update admin profile error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to update profile."
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = async (
    event
  ) => {

    event.preventDefault();

    if (changingPassword) {
      return;
    }

    setError("");
    setSuccess("");

    if (!currentPassword) {

      setError(
        "Please enter your current password."
      );

      return;

    }

    if (!newPassword) {

      setError(
        "Please enter a new password."
      );

      return;

    }

    if (newPassword.length < 8) {

      setError(
        "New password must be at least 8 characters."
      );

      return;

    }

    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "New passwords do not match."
      );

      return;

    }

    try {

      setChangingPassword(true);

      const response =
        await api.put(
          "/admin/change-password",
          {
            currentPassword,
            newPassword,
          }
        );

      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to change password."
        );

      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        response.data?.message ||
        "Password changed successfully."
      );

    } catch (error) {

      console.error(
        "Admin password change error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to change password."
      );

    } finally {

      setChangingPassword(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <main className="admin-profile-page">

        <div className="admin-profile-loading">

          <RefreshCw
            size={26}
            className="admin-profile-spin"
          />

          <p>
            Loading admin profile...
          </p>

        </div>

      </main>

    );

  }


  // =========================================================
  // AVATAR
  // =========================================================

  const displayName =
    name ||
    username ||
    "Administrator";

  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="admin-profile-page">

      <div className="admin-profile-container">


        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="admin-profile-header">

          <div>

            <span className="admin-profile-eyebrow">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Admin Profile
            </h1>

            <p>
              View and manage your administrator
              account information and security.
            </p>

          </div>


          <Link
            to="/admin/dashboard"
            className="admin-profile-back"
          >

            <ArrowLeft size={16} />

            Dashboard

          </Link>

        </header>


        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (

          <div className="admin-profile-alert error">

            <AlertCircle size={18} />

            <span>
              {error}
            </span>

          </div>

        )}


        {success && (

          <div className="admin-profile-alert success">

            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

          </div>

        )}


        {/* =====================================================
            PROFILE HERO
        ===================================================== */}

        <section className="admin-profile-hero">

          <div className="admin-profile-avatar">

            {avatarLetter}

          </div>


          <div className="admin-profile-hero-content">

            <span>
              ADMINISTRATOR ACCOUNT
            </span>

            <h2>
              {displayName}
            </h2>

            <p>
              @{username || "administrator"}
            </p>

          </div>


          <div className="admin-profile-role">

            <ShieldCheck size={16} />

            Administrator

          </div>

        </section>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="admin-profile-grid">


          {/* ===================================================
              PERSONAL INFORMATION
          =================================================== */}

          <section className="admin-profile-card">

            <div className="admin-profile-card-header">

              <div>

                <span>
                  ACCOUNT INFORMATION
                </span>

                <h2>
                  Personal Information
                </h2>

              </div>

              <div className="admin-profile-card-icon">

                <UserCircle size={19} />

              </div>

            </div>


            <form
              className="admin-profile-form"
              onSubmit={
                handleSaveProfile
              }
            >

              {/* NAME */}

              <div className="admin-profile-field">

                <label htmlFor="admin-name">
                  Full Name
                </label>

                <div className="admin-profile-input">

                  <UserCircle size={16} />

                  <input
                    id="admin-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Enter full name"
                    maxLength={100}
                  />

                </div>

              </div>


              {/* USERNAME */}

              <div className="admin-profile-field">

                <label htmlFor="admin-username">
                  Username
                </label>

                <div className="admin-profile-input">

                  <AtSign size={16} />

                  <input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    placeholder="Enter username"
                    maxLength={50}
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="admin-profile-field">

                <label htmlFor="admin-email">
                  Email Address
                </label>

                <div className="admin-profile-input">

                  <Mail size={16} />

                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="admin@example.com"
                    maxLength={150}
                  />

                </div>

              </div>


              {/* MOBILE */}

              <div className="admin-profile-field">

                <label htmlFor="admin-mobile">
                  Mobile Number
                </label>

                <div className="admin-profile-input">

                  <Phone size={16} />

                  <input
                    id="admin-mobile"
                    type="tel"
                    value={mobile}
                    onChange={(event) =>
                      setMobile(
                        event.target.value
                      )
                    }
                    placeholder="+91 XXXXX XXXXX"
                    maxLength={20}
                  />

                </div>

              </div>


              {/* SAVE */}

              <button
                type="submit"
                className="admin-profile-save"
                disabled={saving}
              >

                {saving ? (

                  <>
                    <RefreshCw
                      size={17}
                      className="admin-profile-spin"
                    />

                    Saving...
                  </>

                ) : (

                  <>
                    <Save size={17} />

                    Save Changes
                  </>

                )}

              </button>

            </form>

          </section>


          {/* ===================================================
              SECURITY
          =================================================== */}

          <section className="admin-profile-card">

            <div className="admin-profile-card-header">

              <div>

                <span>
                  ACCOUNT SECURITY
                </span>

                <h2>
                  Change Password
                </h2>

              </div>

              <div className="admin-profile-card-icon security">

                <LockKeyhole size={19} />

              </div>

            </div>


            <form
              className="admin-profile-form"
              onSubmit={
                handleChangePassword
              }
            >

              {/* CURRENT PASSWORD */}

              <div className="admin-profile-field">

                <label htmlFor="current-password">
                  Current Password
                </label>

                <div className="admin-profile-password">

                  <input
                    id="current-password"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      currentPassword
                    }
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-label={
                      showCurrentPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showCurrentPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>

              </div>


              {/* NEW PASSWORD */}

              <div className="admin-profile-field">

                <label htmlFor="new-password">
                  New Password
                </label>

                <div className="admin-profile-password">

                  <input
                    id="new-password"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      newPassword
                    }
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    minLength={8}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (previous) =>
                          !previous
                      )
                    }
                  >

                    {showNewPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>

              </div>


              {/* CONFIRM */}

              <div className="admin-profile-field">

                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>

                <div className="admin-profile-password">

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    minLength={8}
                  />

                  <button
                    type="button"
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


              <div className="admin-password-note">

                <ShieldCheck size={16} />

                <span>
                  Use a strong password with at least
                  8 characters.
                </span>

              </div>


              <button
                type="submit"
                className="admin-password-save"
                disabled={
                  changingPassword
                }
              >

                {changingPassword ? (

                  <>
                    <RefreshCw
                      size={17}
                      className="admin-profile-spin"
                    />

                    Updating Password...
                  </>

                ) : (

                  <>
                    <LockKeyhole size={17} />

                    Change Password
                  </>

                )}

              </button>

            </form>

          </section>

        </div>


        {/* =====================================================
            ACCOUNT STATUS
        ===================================================== */}

        <section className="admin-account-status">

          <div className="admin-account-status-icon">

            <ShieldCheck size={21} />

          </div>

          <div>

            <span>
              ACCOUNT STATUS
            </span>

            <h3>
              Administrator account is active
            </h3>

            <p>
              Your account has administrator access
              to the SNICT management panel.
            </p>

          </div>

          <strong>
            Active
          </strong>

        </section>

      </div>

    </main>

  );
}

export default AdminProfile;