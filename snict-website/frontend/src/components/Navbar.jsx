import { useEffect, useState } from "react";

import {
  Menu,
  X,
  ChevronDown,
  UserRound,
  ArrowRight,
  LayoutDashboard,
  UserCircle,
  KeyRound,
  LogOut,
  ShieldCheck,
  CreditCard,
  Users,
} from "lucide-react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import snictLogo from "../assets/snict-logo.png";

import "./Navbar.css";


function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  // =========================================================
  // USER STATE
  // =========================================================

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const [teamOpen, setTeamOpen] =
    useState(false);

  const [eventsOpen, setEventsOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [mobileUserMenuOpen, setMobileUserMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);


  // =========================================================
  // ADMIN STATE
  // =========================================================

  const [admin, setAdmin] =
    useState(null);

  const [adminMenuOpen, setAdminMenuOpen] =
    useState(false);

  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] =
    useState(false);

  const [adminLoggingOut, setAdminLoggingOut] =
    useState(false);


  // =========================================================
  // LOAD ADMIN SESSION
  // =========================================================

  useEffect(() => {

    const loadAdmin = async () => {

      try {

        const response =
          await api.get(
            "/admin/profile"
          );

        if (
          response.data?.success &&
          response.data?.admin
        ) {

          setAdmin(
            response.data.admin
          );

          localStorage.setItem(
            "snict_admin",
            JSON.stringify(
              response.data.admin
            )
          );

        } else {

          setAdmin(null);

        }

      } catch (error) {

        if (
          error.response?.status !== 401
        ) {

          console.error(
            "Admin session error:",
            error
          );

        }

        setAdmin(null);

        localStorage.removeItem(
          "snict_admin"
        );

      }

    };

    loadAdmin();

  }, [location.pathname]);


  // =========================================================
  // SCROLL
  // =========================================================

  useEffect(() => {

    const handleScroll = () => {

      setScrolled(
        window.scrollY > 15
      );

    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    handleScroll();

    return () => {

      window.removeEventListener(
        "scroll",
        handleScroll
      );

    };

  }, []);


  // =========================================================
  // CLOSE MENUS ON ROUTE CHANGE
  // =========================================================

  useEffect(() => {

    setMenuOpen(false);
    setTeamOpen(false);
    setEventsOpen(false);
    setUserMenuOpen(false);
    setMobileUserMenuOpen(false);
    setAdminMenuOpen(false);
    setMobileAdminMenuOpen(false);

  }, [location.pathname]);


  // =========================================================
  // BODY SCROLL LOCK
  // =========================================================

  useEffect(() => {

    if (menuOpen) {

      document.body.style.overflow =
        "hidden";

    } else {

      document.body.style.overflow =
        "";

    }

    return () => {

      document.body.style.overflow =
        "";

    };

  }, [menuOpen]);


  // =========================================================
  // OUTSIDE CLICK
  // =========================================================

  useEffect(() => {

    const handleOutsideClick = (
      event
    ) => {

      if (
        !event.target.closest(
          ".navbar-user-wrapper"
        )
      ) {

        setUserMenuOpen(false);

      }

      if (
        !event.target.closest(
          ".navbar-admin-wrapper"
        )
      ) {

        setAdminMenuOpen(false);

      }

    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  // =========================================================
  // CLOSE MOBILE MENU
  // =========================================================

  const closeMenu = () => {

    setMenuOpen(false);
    setTeamOpen(false);
    setEventsOpen(false);
    setUserMenuOpen(false);
    setMobileUserMenuOpen(false);
    setAdminMenuOpen(false);
    setMobileAdminMenuOpen(false);

  };


  // =========================================================
  // USER LOGOUT
  // =========================================================

  const handleLogout = async () => {

    if (loggingOut) {
      return;
    }

    try {

      setLoggingOut(true);

      await logout();

      setUserMenuOpen(false);
      setMobileUserMenuOpen(false);

      navigate(
        "/",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    } finally {

      setLoggingOut(false);

      closeMenu();

    }

  };


  // =========================================================
  // ADMIN LOGOUT
  // =========================================================

  const handleAdminLogout = async () => {

    if (adminLoggingOut) {
      return;
    }

    try {

      setAdminLoggingOut(true);

      await api.post(
        "/admin/logout"
      );

    } catch (error) {

      console.error(
        "Admin logout error:",
        error
      );

    } finally {

      localStorage.removeItem(
        "snict_admin"
      );

      setAdmin(null);

      setAdminMenuOpen(false);
      setMobileAdminMenuOpen(false);

      navigate(
        "/",
        {
          replace: true,
        }
      );

      setAdminLoggingOut(false);

      closeMenu();

    }

  };


  // =========================================================
  // USER DISPLAY
  // =========================================================

  const displayName =
    user?.fullName ||
    user?.username ||
    "SNICT Member";

  const displayUsername =
    user?.username
      ? `@${user.username}`
      : "";

  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const profileImage =
    user?.profileImageUrl ||
    user?.profilePic ||
    user?.profileImage ||
    user?.photo ||
    user?.avatar ||
    null;


  // =========================================================
  // PROFILE IMAGE URL
  // =========================================================

  const getProfileImageUrl = (image) => {

    if (!image) {
      return null;
    }

    const imageString = String(image).trim();

    if (!imageString) {
      return null;
    }

    // Already a complete URL
    if (
      imageString.startsWith("http://") ||
      imageString.startsWith("https://") ||
      imageString.startsWith("data:")
    ) {
      return imageString;
    }

    // Use the configured API URL.
    // Example: https://snict.net/api
    const apiBaseUrl =
      import.meta.env.VITE_API_URL ||
      api.defaults?.baseURL ||
      "https://snict.net/api";

    const cleanApiUrl = String(apiBaseUrl)
      .trim()
      .replace(/\/+$/, "");

    // Convert API origin from:
    // https://domain.com/api
    // to:
    // https://domain.com
    const backendOrigin = cleanApiUrl.replace(
      /\/api\/?$/,
      ""
    );

    // Backend normally stores paths like:
    // /uploads/profile/profile-123.jpg
    if (imageString.startsWith("/")) {
      return `${backendOrigin}${imageString}`;
    }

    // Also support paths without the leading slash.
    return `${backendOrigin}/${imageString}`;
  };


  const profileImageUrl =
    getProfileImageUrl(profileImage);


  // =========================================================
  // ADMIN DISPLAY
  // =========================================================

  const adminName =
    admin?.name ||
    admin?.username ||
    "Administrator";

  const adminUsername =
    admin?.username
      ? `@${admin.username}`
      : "";

  const adminLetter =
    adminName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // ADMIN PAGE
  // =========================================================

  const isAdminPage =
    location.pathname.startsWith(
      "/admin"
    );


  // =========================================================
  // TEAM ACTIVE
  // =========================================================

  const isTeamSection =
    location.pathname.startsWith(
      "/team"
    ) ||
    location.pathname.startsWith(
      "/members"
    ) ||
    location.pathname.startsWith(
      "/committees"
    );


  // =========================================================
  // PROFILE AVATAR
  // =========================================================

  const ProfileAvatar = ({
    sizeClass = "",
    dropdown = false,
    mobile = false,
  }) => {

    const [imageFailed, setImageFailed] =
      useState(false);

    // Reset the fallback state whenever the logged-in
    // user's image changes.
    useEffect(() => {
      setImageFailed(false);
    }, [profileImageUrl]);

    const imageAvailable =
      Boolean(
        profileImageUrl &&
        !imageFailed
      );

    const handleImageError = () => {
      console.error(
        "SNICT profile image failed to load:",
        profileImageUrl
      );

      setImageFailed(true);
    };

    // -------------------------------------------------------
    // DROPDOWN AVATAR
    // -------------------------------------------------------

    if (dropdown) {
      return (
        <div
          className={`user-dropdown-avatar ${sizeClass}`}
        >
          {imageAvailable ? (
            <img
              src={profileImageUrl}
              alt={`${displayName} profile`}
              className="user-dropdown-profile-image"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <span className="user-dropdown-avatar-letter">
              {avatarLetter}
            </span>
          )}
        </div>
      );
    }

    // -------------------------------------------------------
    // MOBILE AVATAR
    // -------------------------------------------------------

    if (mobile) {
      return (
        <div
          className={`mobile-user-avatar ${sizeClass}`}
        >
          {imageAvailable ? (
            <img
              src={profileImageUrl}
              alt={`${displayName} profile`}
              className="mobile-profile-image"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <span className="mobile-avatar-letter">
              {avatarLetter}
            </span>
          )}
        </div>
      );
    }

    // -------------------------------------------------------
    // DESKTOP NAVBAR AVATAR
    // -------------------------------------------------------

    return (
      <div
        className={`navbar-user-avatar ${sizeClass}`}
      >
        {imageAvailable ? (
          <img
            src={profileImageUrl}
            alt={`${displayName} profile`}
            className="navbar-profile-image"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <span className="navbar-avatar-letter">
            {avatarLetter}
          </span>
        )}
      </div>
    );
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <>

      {/* =====================================================
          DESKTOP / MAIN NAVBAR
      ===================================================== */}

      <header
        className={`snict-navbar ${
          scrolled
            ? "navbar-scrolled"
            : ""
        } ${
          isAdminPage
            ? "navbar-admin-page"
            : ""
        }`}
      >

        <div className="navbar-inner">


          {/* =================================================
              BRAND
          ================================================= */}

          <Link
            to="/"
            className="snict-brand"
            onClick={closeMenu}
          >

            <div className="brand-logo">

              <img
                src={snictLogo}
                alt="SNICT Logo"
              />

            </div>

            <div className="brand-content">

              <span className="brand-name">
                SNICT
              </span>

              <span className="brand-description">
                Society of Neo Interventional
                <br />
                Cardiovascular Technologists
              </span>

            </div>

          </Link>


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav className="desktop-navigation">


            {/* HOME */}

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `desktop-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Home
            </NavLink>


            {/* ABOUT */}

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `desktop-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              About
            </NavLink>


            {/* =================================================
                TEAM
            ================================================= */}

            <div className="desktop-dropdown">

              <button
                type="button"
                className={`desktop-link dropdown-button ${
                  isTeamSection
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setTeamOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={
                  teamOpen
                }
              >

                <span>
                  Team
                </span>

                <ChevronDown
                  size={14}
                  className={
                    teamOpen
                      ? "chevron-open"
                      : ""
                  }
                />

              </button>


              {teamOpen && (

                <div className="dropdown-panel">

                  <div className="dropdown-heading">
                    OUR PEOPLE
                  </div>


                  {/* OUR TEAM */}

                  <Link
                    to="/team"
                    onClick={closeMenu}
                  >

                    <span>
                      Members
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>


                  {/* MEMBERS */}

                  {/* <Link
                    to="/members"
                    onClick={closeMenu}
                  >

                    <span>
                      Members
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link> */}


                  {/* PLACEMENT COMMITTEE */}

                  <Link
                    to="/committees/placement"
                    onClick={closeMenu}
                  >

                    <span>
                      Placement Committee
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>


                  {/* WORKING COMMITTEE */}

                  <Link
                    to="/committees/working"
                    onClick={closeMenu}
                  >

                    <span>
                      Working Committee
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>


                  {/* ACADEMIC COMMITTEE */}

                  <Link
                    to="/committees/academic"
                    onClick={closeMenu}
                  >

                    <span>
                      Academic Committee
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>


                  {/* COMPLIANCE COMMITTEE */}

                  <Link
                    to="/committees/compliance"
                    onClick={closeMenu}
                  >

                    <span>
                      Compliance Committee
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>

                </div>

              )}

            </div>


            {/* =================================================
                EVENTS
            ================================================= */}

            <div className="desktop-dropdown">

              <button
                type="button"
                className={`desktop-link dropdown-button ${
                  location.pathname.startsWith(
                    "/events"
                  )
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setEventsOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={
                  eventsOpen
                }
              >

                <span>
                  Events
                </span>

                <ChevronDown
                  size={14}
                  className={
                    eventsOpen
                      ? "chevron-open"
                      : ""
                  }
                />

              </button>


              {eventsOpen && (

                <div className="dropdown-panel">

                  <div className="dropdown-heading">
                    EVENTS & CME
                  </div>


                  <Link
                    to="/events"
                    onClick={closeMenu}
                  >

                    <span>
                      Upcoming Events
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>


                  <Link
                    to="/events"
                    onClick={closeMenu}
                  >

                    <span>
                      Previous Events
                    </span>

                    <ArrowRight
                      size={14}
                    />

                  </Link>

                </div>

              )}

            </div>


            {/* CONTACT */}

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `desktop-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Contact
            </NavLink>

          </nav>


          {/* =================================================
              DESKTOP ACTIONS
          ================================================= */}

          <div className="navbar-actions">


            {/* =================================================
                ADMIN
            ================================================= */}

            {admin ? (

              <div className="navbar-admin-wrapper">


                <button
                  type="button"
                  className={`navbar-admin-button ${
                    adminMenuOpen
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setAdminMenuOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-expanded={
                    adminMenuOpen
                  }
                >

                  <div className="navbar-admin-avatar">
                    {adminLetter}
                  </div>

                  <div className="navbar-admin-info">

                    <span className="navbar-admin-name">
                      {adminName}
                    </span>

                    <span className="navbar-admin-role">
                      ADMIN
                    </span>

                  </div>

                  <ChevronDown
                    size={15}
                    className={
                      adminMenuOpen
                        ? "user-chevron-open"
                        : ""
                    }
                  />

                </button>


                {adminMenuOpen && (

                  <div className="navbar-admin-dropdown">


                    {/* ADMIN HEADER */}

                    <div className="admin-dropdown-header">

                      <div className="admin-dropdown-avatar">
                        {adminLetter}
                      </div>

                      <div>

                        <strong>
                          {adminName}
                        </strong>

                        <span>
                          {adminUsername}
                        </span>

                      </div>

                    </div>


                    <div className="user-dropdown-divider" />


                    {/* DASHBOARD */}

                    <Link
                      to="/admin/dashboard"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <LayoutDashboard
                        size={16}
                      />

                      <span>
                        Admin Dashboard
                      </span>

                    </Link>


                    {/* PAYMENTS */}

                    <Link
                      to="/admin/payments"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <CreditCard
                        size={16}
                      />

                      <span>
                        Payment Management
                      </span>

                    </Link>


                    {/* BOOKINGS */}

                    <Link
                      to="/admin/bookings"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <ShieldCheck
                        size={16}
                      />

                      <span>
                        Booking Management
                      </span>

                    </Link>


                    {/* COMMITTEE MANAGEMENT */}

                    <Link
                      to="/admin/committees"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <Users
                        size={16}
                      />

                      <span>
                        Manage Committees
                      </span>

                    </Link>


                    <div className="user-dropdown-divider" />


                    {/* ADMIN PROFILE */}

                    <Link
                      to="/admin/profile"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <UserCircle
                        size={16}
                      />

                      <span>
                        Admin Profile
                      </span>

                    </Link>


                    {/* CHANGE PASSWORD */}

                    <Link
                      to="/admin/profile"
                      onClick={() =>
                        setAdminMenuOpen(
                          false
                        )
                      }
                    >

                      <KeyRound
                        size={16}
                      />

                      <span>
                        Change Password
                      </span>

                    </Link>


                    <div className="user-dropdown-divider" />


                    {/* LOGOUT */}

                    <button
                      type="button"
                      className="navbar-admin-logout"
                      onClick={
                        handleAdminLogout
                      }
                      disabled={
                        adminLoggingOut
                      }
                    >

                      <LogOut
                        size={16}
                      />

                      <span>
                        {adminLoggingOut
                          ? "Logging out..."
                          : "Admin Logout"}
                      </span>

                    </button>

                  </div>

                )}

              </div>


            ) : !user ? (

              /* =================================================
                 GUEST
              ================================================= */

              <>

                <Link
                  to="/login"
                  className="navbar-login"
                >

                  <UserRound
                    size={16}
                  />

                  <span>
                    Login
                  </span>

                </Link>


                <Link
                  to="/signup"
                  className="navbar-join"
                >

                  <span>
                    Join SNICT
                  </span>

                  <ArrowRight
                    size={16}
                  />

                </Link>

              </>


            ) : (

              /* =================================================
                 NORMAL USER
              ================================================= */

              <div className="navbar-user-wrapper">


                {/* USER BUTTON */}

                <button
                  type="button"
                  className={`navbar-user-button ${
                    userMenuOpen
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setUserMenuOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-expanded={
                    userMenuOpen
                  }
                >

                  <ProfileAvatar />

                  <div className="navbar-user-info">

                    <span className="navbar-user-name">
                      {displayName}
                    </span>

                    <span className="navbar-user-username">
                      {displayUsername}
                    </span>

                  </div>

                  <ChevronDown
                    size={15}
                    className={
                      userMenuOpen
                        ? "user-chevron-open"
                        : ""
                    }
                  />

                </button>


                {/* USER DROPDOWN */}

                {userMenuOpen && (

                  <div className="navbar-user-dropdown">


                    {/* PROFILE HEADER */}

                    <div className="user-dropdown-header">

                      <ProfileAvatar
                        dropdown
                      />

                      <div>

                        <strong>
                          {displayName}
                        </strong>

                        <span>
                          {user?.email ||
                            "SNICT Member"}
                        </span>

                      </div>

                    </div>


                    <div className="user-dropdown-divider" />


                    {/* DASHBOARD */}

                    <Link
                      to="/dashboard"
                      onClick={() =>
                        setUserMenuOpen(
                          false
                        )
                      }
                    >

                      <LayoutDashboard
                        size={16}
                      />

                      <span>
                        Dashboard
                      </span>

                    </Link>


                    {/* PROFILE */}

                    <Link
                      to="/profile"
                      onClick={() =>
                        setUserMenuOpen(
                          false
                        )
                      }
                    >

                      <UserCircle
                        size={16}
                      />

                      <span>
                        My Profile
                      </span>

                    </Link>


                    {/* CHANGE PASSWORD */}

                    <Link
                      to="/change-password"
                      onClick={() =>
                        setUserMenuOpen(
                          false
                        )
                      }
                    >

                      <KeyRound
                        size={16}
                      />

                      <span>
                        Change Password
                      </span>

                    </Link>


                    <div className="user-dropdown-divider" />


                    {/* LOGOUT */}

                    <button
                      type="button"
                      className="navbar-logout-button"
                      onClick={
                        handleLogout
                      }
                      disabled={
                        loggingOut
                      }
                    >

                      <LogOut
                        size={16}
                      />

                      <span>
                        {loggingOut
                          ? "Logging out..."
                          : "Logout"}
                      </span>

                    </button>

                  </div>

                )}

              </div>

            )}

          </div>


          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}

          <button
            type="button"
            className={`mobile-menu-button ${
              menuOpen
                ? "open"
                : ""
            }`}
            onClick={() =>
              setMenuOpen(
                (previous) =>
                  !previous
              )
            }
            aria-label={
              menuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={
              menuOpen
            }
          >

            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}

          </button>

        </div>


        {/* =====================================================
            MOBILE NAVIGATION
        ===================================================== */}

        <div
          className={`mobile-navigation ${
            menuOpen
              ? "mobile-navigation-open"
              : ""
          }`}
        >

          <div className="mobile-navigation-inner">


            {/* HOME */}

            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `mobile-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span>
                Home
              </span>

              <ArrowRight
                size={16}
              />

            </NavLink>


            {/* ABOUT */}

            <NavLink
              to="/about"
              onClick={closeMenu}
              className={({ isActive }) =>
                `mobile-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span>
                About
              </span>

              <ArrowRight
                size={16}
              />

            </NavLink>


            {/* =================================================
                MOBILE TEAM
            ================================================= */}

            <div className="mobile-dropdown">

              <button
                type="button"
                className={`mobile-dropdown-button ${
                  isTeamSection
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setTeamOpen(
                    (previous) =>
                      !previous
                  )
                }
              >

                <span>
                  Team
                </span>

                <ChevronDown
                  size={17}
                  className={
                    teamOpen
                      ? "chevron-open"
                      : ""
                  }
                />

              </button>


              <div
                className={`mobile-submenu ${
                  teamOpen
                    ? "mobile-submenu-open"
                    : ""
                }`}
              >


                {/* OUR TEAM */}

                <Link
                  to="/team"
                  onClick={closeMenu}
                >

                  <span>
                    Members
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>


                {/* MEMBERS */}

                {/* <Link
                  to="/members"
                  onClick={closeMenu}
                >

                  <span>
                    Members
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link> */}


                {/* PLACEMENT COMMITTEE */}

                <Link
                  to="/committees/placement"
                  onClick={closeMenu}
                >

                  <span>
                    Placement Committee
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>


                {/* WORKING COMMITTEE */}

                <Link
                  to="/committees/working"
                  onClick={closeMenu}
                >

                  <span>
                    Working Committee
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>


                {/* ACADEMIC COMMITTEE */}

                <Link
                  to="/committees/academic"
                  onClick={closeMenu}
                >

                  <span>
                    Academic Committee
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>


                {/* COMPLIANCE COMMITTEE */}

                <Link
                  to="/committees/compliance"
                  onClick={closeMenu}
                >

                  <span>
                    Compliance Committee
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>

            </div>


            {/* =================================================
                MOBILE EVENTS
            ================================================= */}

            <div className="mobile-dropdown">

              <button
                type="button"
                className={`mobile-dropdown-button ${
                  location.pathname.startsWith(
                    "/events"
                  )
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setEventsOpen(
                    (previous) =>
                      !previous
                  )
                }
              >

                <span>
                  Events
                </span>

                <ChevronDown
                  size={17}
                  className={
                    eventsOpen
                      ? "chevron-open"
                      : ""
                  }
                />

              </button>


              <div
                className={`mobile-submenu ${
                  eventsOpen
                    ? "mobile-submenu-open"
                    : ""
                }`}
              >

                <Link
                  to="/events"
                  onClick={closeMenu}
                >

                  <span>
                    Upcoming Events
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>


                <Link
                  to="/events"
                  onClick={closeMenu}
                >

                  <span>
                    Previous Events
                  </span>

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>

            </div>


            {/* CONTACT */}

            <NavLink
              to="/contact"
              onClick={closeMenu}
              className={({ isActive }) =>
                `mobile-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span>
                Contact
              </span>

              <ArrowRight
                size={16}
              />

            </NavLink>


            {/* =================================================
                MOBILE ACCOUNT
            ================================================= */}

            <div className="mobile-user-section">


              {/* =================================================
                  MOBILE ADMIN
              ================================================= */}

              {admin ? (

                <>


                  <button
                    type="button"
                    className={`mobile-admin-button ${
                      mobileAdminMenuOpen
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setMobileAdminMenuOpen(
                        (previous) =>
                          !previous
                      )
                    }
                  >

                    <div className="mobile-admin-avatar">
                      {adminLetter}
                    </div>

                    <div className="mobile-admin-info">

                      <span>
                        {adminName}
                      </span>

                      <small>
                        ADMIN
                      </small>

                    </div>

                    <ChevronDown
                      size={17}
                      className={
                        mobileAdminMenuOpen
                          ? "user-chevron-open"
                          : ""
                      }
                    />

                  </button>


                  {mobileAdminMenuOpen && (

                    <div className="mobile-admin-menu">


                      {/* ADMIN DASHBOARD */}

                      <Link
                        to="/admin/dashboard"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <LayoutDashboard
                            size={17}
                          />

                          <span>
                            Admin Dashboard
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* PAYMENTS */}

                      <Link
                        to="/admin/payments"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <CreditCard
                            size={17}
                          />

                          <span>
                            Payment Management
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* BOOKINGS */}

                      <Link
                        to="/admin/bookings"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <ShieldCheck
                            size={17}
                          />

                          <span>
                            Booking Management
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* COMMITTEES */}

                      <Link
                        to="/admin/committees"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <Users
                            size={17}
                          />

                          <span>
                            Manage Committees
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      <div className="mobile-admin-divider" />


                      {/* ADMIN PROFILE */}

                      <Link
                        to="/admin/profile"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <UserCircle
                            size={17}
                          />

                          <span>
                            Admin Profile
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* CHANGE PASSWORD */}

                      <Link
                        to="/admin/profile"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <KeyRound
                            size={17}
                          />

                          <span>
                            Change Password
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* LOGOUT */}

                      <button
                        type="button"
                        className="mobile-user-action logout"
                        onClick={
                          handleAdminLogout
                        }
                        disabled={
                          adminLoggingOut
                        }
                      >

                        <span className="mobile-user-action-left">

                          <LogOut
                            size={17}
                          />

                          <span>
                            {adminLoggingOut
                              ? "Logging out..."
                              : "Admin Logout"}
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </button>

                    </div>

                  )}

                </>


              ) : !user ? (

                /* =================================================
                   MOBILE GUEST
                ================================================= */

                <div className="mobile-actions">


                  <Link
                    to="/login"
                    className="mobile-login"
                    onClick={closeMenu}
                  >

                    <UserRound
                      size={17}
                    />

                    <span>
                      Login
                    </span>

                  </Link>


                  <Link
                    to="/signup"
                    className="mobile-join"
                    onClick={closeMenu}
                  >

                    <span>
                      Join SNICT
                    </span>

                    <ArrowRight
                      size={17}
                    />

                  </Link>

                </div>


              ) : (

                /* =================================================
                   MOBILE USER
                ================================================= */

                <>


                  <button
                    type="button"
                    className={`mobile-user-button ${
                      mobileUserMenuOpen
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setMobileUserMenuOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-expanded={
                      mobileUserMenuOpen
                    }
                  >

                    <ProfileAvatar
                      mobile
                    />

                    <div className="mobile-user-info">

                      <span className="mobile-user-name">
                        {displayName}
                      </span>

                      <span className="mobile-user-username">
                        {displayUsername}
                      </span>

                    </div>

                    <ChevronDown
                      size={17}
                      className={
                        mobileUserMenuOpen
                          ? "user-chevron-open"
                          : ""
                      }
                    />

                  </button>


                  {mobileUserMenuOpen && (

                    <div className="mobile-user-menu">


                      {/* DASHBOARD */}

                      <Link
                        to="/dashboard"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <LayoutDashboard
                            size={17}
                          />

                          <span>
                            Dashboard
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* PROFILE */}

                      <Link
                        to="/profile"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <UserCircle
                            size={17}
                          />

                          <span>
                            My Profile
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      {/* CHANGE PASSWORD */}

                      <Link
                        to="/change-password"
                        className="mobile-user-action"
                        onClick={closeMenu}
                      >

                        <span className="mobile-user-action-left">

                          <KeyRound
                            size={17}
                          />

                          <span>
                            Change Password
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </Link>


                      <div className="user-dropdown-divider" />


                      {/* LOGOUT */}

                      <button
                        type="button"
                        className="mobile-user-action logout"
                        onClick={
                          handleLogout
                        }
                        disabled={
                          loggingOut
                        }
                      >

                        <span className="mobile-user-action-left">

                          <LogOut
                            size={17}
                          />

                          <span>
                            {loggingOut
                              ? "Logging out..."
                              : "Logout"}
                          </span>

                        </span>

                        <ArrowRight
                          size={15}
                        />

                      </button>

                    </div>

                  )}

                </>

              )}

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          NAVBAR SPACER
      ===================================================== */}

      <div className="navbar-page-spacer" />

    </>

  );

}


export default Navbar;