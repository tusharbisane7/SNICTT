import { useEffect, useState } from "react";

import {
  ShieldCheck,
  Users,
  UserRoundCheck,
  UserCog,
  LogOut,
  ArrowRight,
  Activity,
  CalendarDays,
  TicketCheck,
  BadgeCheck,
  CreditCard,
  SlidersHorizontal,
  QrCode,
  MessageSquare,
  Ticket,
  LayoutDashboard,
  Settings,
  FileText,
  CheckCircle2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../../services/api";

import "./AdminDashboard.css";


// =========================================================
// ADMIN DASHBOARD
// SNICT
// =========================================================
//
// Dashboard includes:
//
// - Admin profile
// - Committees
// - Events
// - Registered Users in Event
// - Bookings
// - Payments
// - Members
// - Memberships
// - Sliders
// - Attendance
// - Event Passes
// - Contact Management
// - Users
//
// =========================================================


function AdminDashboard() {

  const navigate = useNavigate();


  // =======================================================
  // STATE
  // =======================================================

  const [admin, setAdmin] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD ADMIN PROFILE
  // =======================================================

  useEffect(() => {

    let mounted = true;


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

          if (!mounted) {
            return;
          }


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


        if (!mounted) {
          return;
        }


        setError(
          error.response?.data?.message ||
          error.message ||
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

        if (mounted) {

          setLoading(false);

        }

      }

    };


    loadAdminProfile();


    return () => {

      mounted = false;

    };

  }, [navigate]);


  // =======================================================
  // ADMIN LOGOUT
  // =======================================================

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


  // =======================================================
  // LOADING
  // =======================================================

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


  // =======================================================
  // ERROR
  // =======================================================

  if (error && !admin) {

    return (

      <main className="admin-dashboard-page">

        <div className="admin-dashboard-error">

          <div className="admin-error-icon">

            <ShieldCheck size={38} />

          </div>


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

            <span>
              Go to Admin Login
            </span>

            <ArrowRight size={16} />

          </Link>

        </div>

      </main>

    );

  }


  // =======================================================
  // ADMIN DISPLAY
  // =======================================================

  const adminName =
    admin?.name ||
    admin?.full_name ||
    admin?.username ||
    "Administrator";


  const adminUsername =
    admin?.username ||
    "admin";


  const adminLetter =
    adminName
      .charAt(0)
      .toUpperCase();


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <main className="admin-dashboard-page">

      <div className="admin-dashboard-container">


        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="admin-dashboard-header">


          {/* HEADER CONTENT */}

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
              events, bookings, payments,
              attendance, event passes,
              contact enquiries and
              organization content from
              one place.
            </p>


            {/* ADMIN USER */}

            <div className="admin-dashboard-user">

              <div className="admin-dashboard-avatar">

                {adminLetter}

              </div>


              <div>

                <strong>
                  {adminName}
                </strong>

                <span>
                  @{adminUsername}
                </span>

              </div>

            </div>

          </div>


          {/* LOGOUT */}

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

        </header>


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
                COMMITTEES
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
                  displayed on the
                  SNICT website.
                </p>

              </div>


              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                SLIDERS
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
                EVENTS
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
                REGISTERED USERS IN EVENT
            ================================================= */}

            <Link
              to="/admin/events/registered-users"
              className="admin-management-card"
            >

              <div className="admin-management-icon">

                <UserRoundCheck size={23} />

              </div>


              <div className="admin-management-content">

                <span>
                  EVENT REGISTRATION
                </span>

                <h3>
                  Registered Users in Event
                </h3>

                <p>
                  View users registered
                  for each event, check
                  booking and payment
                  information and export
                  member lists.
                </p>

              </div>


              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                BOOKINGS
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
                PAYMENTS
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
                ATTENDANCE
            ================================================= */}

            <Link
              to="/admin/attendance"
              className="admin-management-card"
            >

              <div className="admin-management-icon">

                <QrCode size={23} />

              </div>


              <div className="admin-management-content">

                <span>
                  ATTENDANCE MANAGEMENT
                </span>

                <h3>
                  Event Attendance
                </h3>

                <p>
                  Scan attendee QR codes,
                  verify manual attendance
                  codes and mark registered
                  members as present.
                </p>

              </div>


              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                MEMBERSHIPS
            ================================================= */}

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

            </Link>


            {/* =================================================
                USERS
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
                CONTACT MANAGEMENT
            ================================================= */}

            <Link
              to="/admin/contacts"
              className="admin-management-card"
            >

              <div className="admin-management-icon">

                <MessageSquare size={23} />

              </div>


              <div className="admin-management-content">

                <span>
                  COMMUNICATION
                </span>

                <h3>
                  Contact Enquiries
                </h3>

                <p>
                  View enquiries submitted
                  from the contact page,
                  review sender details
                  and manage responses.
                </p>

              </div>


              <ArrowRight
                size={19}
                className="admin-card-arrow"
              />

            </Link>


            {/* =================================================
                SYSTEM
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
                  SNICT administration
                  system is currently
                  available and ready
                  for management.
                </p>

              </div>


              <div className="admin-system-active">

                <CheckCircle2 size={14} />

                <span>
                  Active
                </span>

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


            {/* REGISTERED USERS */}

            <Link
              to="/admin/events/registered-users"
              className="admin-quick-card"
            >

              <UserRoundCheck size={18} />

              <span>
                Registered Users
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


            {/* EVENT PASSES */}

            <Link
              to="/admin/event-passes"
              className="admin-quick-card"
            >

              <Ticket size={18} />

              <span>
                Event Passes
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* ATTENDANCE */}

            <Link
              to="/admin/attendance"
              className="admin-quick-card"
            >

              <QrCode size={18} />

              <span>
                Attendance
              </span>

              <ArrowRight size={15} />

            </Link>


            {/* CONTACT ENQUIRIES */}

            <Link
              to="/admin/contacts"
              className="admin-quick-card"
            >

              <MessageSquare size={18} />

              <span>
                Contact Enquiries
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


          </div>

        </section>


        {/* =================================================
            FOOTER STATUS
        ================================================= */}

        <div className="admin-dashboard-footer">

          <div>

            <LayoutDashboard size={15} />

            <span>
              SNICT Administration Panel
            </span>

          </div>


          <div>

            <CheckCircle2 size={14} />

            <span>
              System Active
            </span>

          </div>

        </div>


      </div>

    </main>

  );

}


export default AdminDashboard;