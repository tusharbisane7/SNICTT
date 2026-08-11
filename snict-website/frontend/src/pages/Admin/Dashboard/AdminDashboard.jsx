import { useEffect, useState } from "react";

import {
  ShieldCheck,
  Users,
  UserCog,
  LogOut,
  ArrowRight,
  Activity,
  CalendarDays,
  TicketCheck,
  BadgeCheck,
  CreditCard,
  SlidersHorizontal,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../../services/api";

import "./AdminDashboard.css";

// =========================================================
// ADMIN DASHBOARD
// =========================================================

function AdminDashboard() {

  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [admin, setAdmin] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD ADMIN PROFILE
  // =========================================================

  useEffect(() => {

    const loadAdminProfile = async () => {

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

          throw new Error(
            "Admin session not found"
          );

        }

      } catch (error) {

        console.error(
          "Admin dashboard error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load admin dashboard"
        );

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {

          localStorage.removeItem(
            "snict_admin"
          );

          navigate(
            "/admin/login",
            {
              replace: true,
            }
          );

        }

      } finally {

        setLoading(false);

      }

    };

    loadAdminProfile();

  }, [navigate]);


  // =========================================================
  // ADMIN LOGOUT
  // =========================================================

  const handleLogout = async () => {

    if (loggingOut) {
      return;
    }

    try {

      setLoggingOut(true);

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

      navigate(
        "/admin/login",
        {
          replace: true,
        }
      );

      setLoggingOut(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <main className="admin-dashboard-page">

        <div className="admin-dashboard-loading">

          <div className="admin-loading-spinner" />

          <p>
            Loading admin dashboard...
          </p>

        </div>

      </main>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error && !admin) {

    return (

      <main className="admin-dashboard-page">

        <div className="admin-dashboard-error">

          <ShieldCheck size={38} />

          <h2>
            Admin Access Required
          </h2>

          <p>
            {error}
          </p>

          <Link
            to="/admin/login"
            className="admin-error-button"
          >

            Go to Admin Login

            <ArrowRight size={16} />

          </Link>

        </div>

      </main>

    );

  }


  // =========================================================
  // ADMIN DISPLAY
  // =========================================================

  const adminName =
    admin?.name ||
    admin?.username ||
    "Administrator";

  const adminUsername =
    admin?.username ||
    "admin";

  const adminLetter =
    adminName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="admin-dashboard-page">

      <div className="admin-dashboard-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-dashboard-header">

          <div className="admin-dashboard-heading">

            <div className="admin-dashboard-badge">

              <ShieldCheck size={15} />

              <span>
                ADMINISTRATOR
              </span>

            </div>

            <h1>
              Welcome, {adminName}
            </h1>

            <p>
              Manage your SNICT website,
              members, memberships,
              events, bookings, payments
              and organization content
              from one place.
            </p>

          </div>


          <button
            type="button"
            className="admin-dashboard-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >

            <LogOut size={17} />

            <span>
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>

          </button>

        </div>


      
        {/* =================================================
            QUICK STATS
        ================================================= */}

      

          {/* COMMITTEES */}

         


          {/* EVENTS */}

         


          {/* BOOKINGS */}

          

          {/* PAYMENTS */}

          


          {/* MEMBERS */}



          {/* SLIDERS */}

        


        {/* =================================================
            WEBSITE MANAGEMENT
        ================================================= */}

        <section className="admin-management-section">

          <div className="admin-section-heading">

            <div>

              <span>
                ADMINISTRATION
              </span>

              <h2>
                Website Management
              </h2>

            </div>

          </div>


          <div className="admin-management-grid">


            {/* =================================================
                COMMITTEE MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/committees"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <Users size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  TEAM MANAGEMENT
                </span>

                <h3>
                  Manage Committees
                </h3>

                <p>
                  Add, edit or remove
                  committee members
                  displayed on the SNICT
                  website.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                SLIDER MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/sliders"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <SlidersHorizontal size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  WEBSITE CONTENT
                </span>

                <h3>
                  Manage Sliders
                </h3>

                <p>
                  Add, edit, publish or
                  hide homepage sliders
                  with images, titles,
                  dates and descriptions.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                EVENTS MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/events"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <CalendarDays size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  EVENT MANAGEMENT
                </span>

                <h3>
                  Manage Events
                </h3>

                <p>
                  Create, edit and delete
                  SNICT events, CME
                  programs and professional
                  learning opportunities.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                BOOKING MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/bookings"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <TicketCheck size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  BOOKING MANAGEMENT
                </span>

                <h3>
                  Manage Bookings
                </h3>

                <p>
                  View event registrations,
                  manage member booking
                  status and review
                  booking information.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                PAYMENT MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/payments"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <CreditCard size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  PAYMENT MANAGEMENT
                </span>

                <h3>
                  Manage Payments
                </h3>

                <p>
                  View UPI payments,
                  verify transactions,
                  review payment proofs
                  and monitor payment status.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                MEMBERSHIP MANAGEMENT
            ================================================= */}
{/* 
            <Link
              to="/admin/memberships"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <BadgeCheck size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  MEMBERSHIP MANAGEMENT
                </span>

                <h3>
                  Manage Memberships
                </h3>

                <p>
                  Review membership
                  applications, approve or
                  reject requests and
                  manage member status.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link> */}


            {/* =================================================
                USER MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/users"
              className="admin-management-card"
            >

              <div className="admin-management-icon">
                <UserCog size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  USER MANAGEMENT
                </span>

                <h3>
                  Member Accounts
                </h3>

                <p>
                  Manage registered
                  SNICT members, view
                  their profiles and
                  account information.
                </p>

              </div>

              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                SYSTEM STATUS
            ================================================= */}

            <div className="admin-management-card">

              <div className="admin-management-icon">
                <Activity size={23} />
              </div>

              <div className="admin-management-content">

                <span>
                  SYSTEM
                </span>

                <h3>
                  System Status
                </h3>

                <p>
                  Monitor the current
                  status of the SNICT
                  administration system.
                </p>

              </div>

              <div className="admin-system-active">

                <span className="admin-status-dot" />

                Active

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="admin-quick-section">

          <div className="admin-section-heading">

            <div>

              <span>
                QUICK ACTIONS
              </span>

              <h2>
                Frequently Used
              </h2>

            </div>

          </div>


          <div className="admin-quick-grid">


            {/* COMMITTEES */}

            <Link
              to="/admin/committees"
              className="admin-quick-card"
            >

              <Users size={18} />

              <span>
                Committees
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* SLIDERS */}

            <Link
              to="/admin/sliders"
              className="admin-quick-card"
            >

              <SlidersHorizontal size={18} />

              <span>
                Sliders
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* EVENTS */}

            <Link
              to="/admin/events"
              className="admin-quick-card"
            >

              <CalendarDays size={18} />

              <span>
                Events
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* BOOKINGS */}

            <Link
              to="/admin/bookings"
              className="admin-quick-card"
            >

              <TicketCheck size={18} />

              <span>
                Bookings
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* PAYMENTS */}

            <Link
              to="/admin/payments"
              className="admin-quick-card"
            >

              <CreditCard size={18} />

              <span>
                Payments
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* MEMBERSHIPS */}

            <Link
              to="/admin/memberships"
              className="admin-quick-card"
            >

              <BadgeCheck size={18} />

              <span>
                Memberships
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* USERS */}

            <Link
              to="/admin/users"
              className="admin-quick-card"
            >

              <UserCog size={18} />

              <span>
                Users
              </span>

              <ArrowRight size={15} />

            </Link>

          </div>

        </section>


      </div>

    </main>

  );

}

export default AdminDashboard;