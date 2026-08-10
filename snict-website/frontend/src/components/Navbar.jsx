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
} from "lucide-react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import api from "../services/api";

import snictLogo from "../assets/snict-logo.jpeg";

import "./Navbar.css";


function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();


  // =========================================================
  // NORMAL USER STATE
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
  // ADMIN SESSION
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
          error.response?.status !==
          401
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

    setMobileUserMenuOpen(false);

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
  // RENDER
  // =========================================================

  return (
    <>

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
                  location.pathname.startsWith(
                    "/team"
                  ) ||
                  location.pathname.startsWith(
                    "/committees"
                  )
                    ? "active"
                    : ""
                }`}
              >

                <span>
                  Team
                </span>

                <ChevronDown
                  size={14}
                />

              </button>


              <div className="dropdown-panel">

                <div className="dropdown-heading">
                  OUR PEOPLE
                </div>


                <Link
                  to="/team"
                  onClick={closeMenu}
                >

                  <span>
                    Our Team
                  </span>

                  <ArrowRight
                    size={14}
                  />

                </Link>


                <Link
                  to="/committees"
                  onClick={closeMenu}
                >

                  <span>
                    Committees
                  </span>

                  <ArrowRight
                    size={14}
                  />

                </Link>

              </div>

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
              >

                <span>
                  Events
                </span>

                <ChevronDown
                  size={14}
                />

              </button>


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

            </div>


            {/* =================================================
                MEMBERSHIP
            ================================================= */}

            <NavLink
              to="/membership"
              className={({ isActive }) =>
                `desktop-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Membership
            </NavLink>


            {/* =================================================
                CONTACT
            ================================================= */}

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
                ADMIN LOGGED IN
            ================================================= */}

            {admin ? (

              <div className="navbar-admin-wrapper">


                {/* ADMIN BUTTON */}

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


                {/* =================================================
                    ADMIN DROPDOWN
                ================================================= */}

                {adminMenuOpen && (

                  <div className="navbar-admin-dropdown">


                    {/* PROFILE HEADER */}

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


                    {/* PAYMENT MANAGEMENT */}

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


                    {/* BOOKING MANAGEMENT */}

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


                    {/* COMMITTEES */}

                    <Link
                      to="/admin/committees"
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
                        Manage Committees
                      </span>

                    </Link>


                    <div className="user-dropdown-divider" />


                    {/* =================================================
                        ADMIN PROFILE
                    ================================================= */}

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


                    {/* =================================================
                        CHANGE PASSWORD
                    ================================================= */}

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


                <Link
                  to="/admin/login"
                  className="navbar-admin-login"
                >

                  <ShieldCheck
                    size={15}
                  />

                  <span>
                    Admin
                  </span>

                </Link>

              </>


            ) : (

              /* =================================================
                 NORMAL USER
              ================================================= */

              <div className="navbar-user-wrapper">


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

                  <div className="navbar-user-avatar">
                    {avatarLetter}
                  </div>


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


                {userMenuOpen && (

                  <div className="navbar-user-dropdown">


                    <div className="user-dropdown-header">

                      <div className="user-dropdown-avatar">
                        {avatarLetter}
                      </div>


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


            {/* TEAM */}

            <div className="mobile-dropdown">

              <button
                type="button"
                className="mobile-dropdown-button"
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

                <Link
                  to="/team"
                  onClick={closeMenu}
                >
                  Our Team
                </Link>


                <Link
                  to="/committees"
                  onClick={closeMenu}
                >
                  Committees
                </Link>

              </div>

            </div>


            {/* EVENTS */}

            <div className="mobile-dropdown">

              <button
                type="button"
                className="mobile-dropdown-button"
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
                  Upcoming Events
                </Link>


                <Link
                  to="/events"
                  onClick={closeMenu}
                >
                  Previous Events
                </Link>

              </div>

            </div>


            {/* MEMBERSHIP */}

            <NavLink
              to="/membership"
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
                Membership
              </span>

              <ArrowRight
                size={16}
              />

            </NavLink>


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


                      {/* DASHBOARD */}

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


                      {/* PAYMENT MANAGEMENT */}

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

                          <UserCircle
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


                      {/* DIVIDER */}

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


                  <Link
                    to="/admin/login"
                    className="mobile-admin-login"
                    onClick={closeMenu}
                  >

                    <ShieldCheck
                      size={17}
                    />

                    <span>
                      Admin Login
                    </span>

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

                    <div className="mobile-user-avatar">
                      {avatarLetter}
                    </div>


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