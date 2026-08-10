import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  TicketCheck,
  UserCircle,
  WalletCards,
  AlertCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";

import "./Dashboard.css";


function Dashboard() {

  // =========================================================
  // AUTH
  // =========================================================

  const { user } = useAuth();


  // =========================================================
  // STATE
  // =========================================================

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  useEffect(() => {

    const loadBookings = async () => {

      try {

        setLoading(true);

        setError("");


        const response = await api.get(
          "/bookings"
        );


        if (response.data?.success) {

          setBookings(
            response.data.bookings || []
          );

        } else {

          setBookings([]);

        }

      } catch (error) {

        console.error(
          "Dashboard bookings error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Unable to load your bookings."
        );

      } finally {

        setLoading(false);

      }

    };


    loadBookings();

  }, []);


  // =========================================================
  // USER INFORMATION
  // =========================================================

  const displayName =
    user?.fullName ||
    user?.username ||
    "SNICT Member";


  const email =
    user?.email ||
    "SNICT Member";


  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // BOOKING HELPERS
  // =========================================================

  const getBookingStatus = (booking) => {

    return String(
      booking?.booking_status ||
      booking?.status ||
      "pending"
    ).toLowerCase();

  };


  const getPaymentStatus = (booking) => {

    return String(
      booking?.payment_status ||
      "pending"
    ).toLowerCase();

  };


  const getEventTitle = (booking) => {

    return (
      booking?.title ||
      booking?.event_title ||
      "SNICT Event"
    );

  };


  const getBookingAmount = (booking) => {

    return Number(
      booking?.amount ||
      booking?.payment_amount ||
      0
    );

  };


  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {

    const total =
      bookings.length;


    const confirmed =
      bookings.filter(
        (booking) =>
          getBookingStatus(booking) ===
          "confirmed"
      ).length;


    /*
     * Payment has NOT been submitted.
     */

    const pending =
      bookings.filter(
        (booking) => {

          const status =
            getBookingStatus(
              booking
            );

          const payment =
            getPaymentStatus(
              booking
            );

          return (
            (
              status ===
                "payment_pending" ||
              status ===
                "pending"
            ) &&
            payment ===
              "pending"
          );

        }
      ).length;


    /*
     * Payment submitted by user.
     * Waiting for admin verification.
     */

    const waitingVerification =
      bookings.filter(
        (booking) =>
          getPaymentStatus(
            booking
          ) ===
          "submitted"
      ).length;


    const completed =
      bookings.filter(
        (booking) =>
          getBookingStatus(
            booking
          ) ===
          "completed"
      ).length;


    return {
      total,
      confirmed,
      pending,
      waitingVerification,
      completed,
    };

  }, [bookings]);


  // =========================================================
  // RECENT BOOKINGS
  // =========================================================

  const recentBookings =
    useMemo(() => {

      return [...bookings]
        .sort((a, b) => {

          const first =
            new Date(
              a.created_at ||
              a.createdAt ||
              0
            ).getTime();


          const second =
            new Date(
              b.created_at ||
              b.createdAt ||
              0
            ).getTime();


          return second - first;

        })
        .slice(0, 4);

    }, [bookings]);


  // =========================================================
  // UPCOMING EVENT
  // =========================================================

  const upcomingBooking =
    useMemo(() => {

      const now =
        new Date();


      const upcoming =
        bookings
          .filter((booking) => {

            if (
              !booking.event_date
            ) {
              return false;
            }


            const eventDate =
              new Date(
                `${booking.event_date}T${
                  booking.start_time ||
                  "00:00:00"
                }`
              );


            const status =
              getBookingStatus(
                booking
              );


            return (
              eventDate >= now &&
              status !==
                "cancelled" &&
              status !==
                "rejected"
            );

          })
          .sort((a, b) => {

            const first =
              new Date(
                `${a.event_date}T${
                  a.start_time ||
                  "00:00:00"
                }`
              ).getTime();


            const second =
              new Date(
                `${b.event_date}T${
                  b.start_time ||
                  "00:00:00"
                }`
              ).getTime();


            return first - second;

          });


      return (
        upcoming[0] ||
        null
      );

    }, [bookings]);


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (value) => {

    if (!value) {
      return "";
    }


    const parts =
      String(value).split(":");


    if (
      parts.length < 2
    ) {
      return value;
    }


    const hours =
      Number(parts[0]);


    const minutes =
      Number(parts[1]);


    const date =
      new Date();


    date.setHours(
      hours,
      minutes,
      0,
      0
    );


    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  // =========================================================
  // STATUS LABEL
  // =========================================================

  const formatStatus = (status) => {

    if (!status) {
      return "Pending";
    }


    return String(status)
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  };


  // =========================================================
  // PAYMENT BADGE
  // =========================================================

  const renderPaymentBadge = (
    payment
  ) => {

    switch (payment) {

      case "submitted":

        return (
          <small
            className="dashboard-payment-status submitted"
          >

            <Clock3
              size={12}
            />

            <span>
              Waiting for Verification
            </span>

          </small>
        );


      case "verified":

        return (
          <small
            className="dashboard-payment-status verified"
          >

            <CheckCircle2
              size={12}
            />

            <span>
              Payment Verified
            </span>

          </small>
        );


      case "rejected":

        return (
          <small
            className="dashboard-payment-status rejected"
          >

            <AlertCircle
              size={12}
            />

            <span>
              Payment Rejected
            </span>

          </small>
        );


      case "refunded":

        return (
          <small
            className="dashboard-payment-status refunded"
          >

            <AlertCircle
              size={12}
            />

            <span>
              Payment Refunded
            </span>

          </small>
        );


      default:

        return (
          <small
            className="dashboard-payment-status pending"
          >

            <WalletCards
              size={12}
            />

            <span>
              Payment Pending
            </span>

          </small>
        );

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <main className="member-dashboard-page">

        <div className="member-dashboard-container">

          <div className="dashboard-loading">

            <div className="dashboard-loading-spinner" />

            <p>
              Loading your dashboard...
            </p>

          </div>

        </div>

      </main>
    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <main className="member-dashboard-page">

      <div className="member-dashboard-container">


        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="dashboard-welcome">

          <div className="dashboard-welcome-content">

            <span className="dashboard-eyebrow">
              SNICT MEMBER AREA
            </span>


            <h1>
              Welcome back,{" "}
              <span>
                {displayName}
              </span>
            </h1>


            <p>
              Manage your SNICT membership,
              event registrations and bookings
              from one place.
            </p>

          </div>


          {/* MEMBER CARD */}

          <div className="dashboard-member-card">

            <div className="dashboard-member-avatar">
              {avatarLetter}
            </div>


            <div className="dashboard-member-info">

              <strong>
                {displayName}
              </strong>


              <span>
                {email}
              </span>


              <small>

                <CheckCircle2
                  size={12}
                />

                Active Member

              </small>

            </div>

          </div>

        </section>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="dashboard-stats">


          {/* TOTAL */}

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">

              <TicketCheck
                size={21}
              />

            </div>


            <div className="dashboard-stat-content">

              <span>
                Total Bookings
              </span>


              <strong>
                {stats.total}
              </strong>

            </div>

          </div>


          {/* CONFIRMED */}

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">

              <CheckCircle2
                size={21}
              />

            </div>


            <div className="dashboard-stat-content">

              <span>
                Confirmed
              </span>


              <strong>
                {stats.confirmed}
              </strong>

            </div>

          </div>


          {/* PAYMENT PENDING */}

          <div className="dashboard-stat-card dashboard-stat-pending">

            <div className="dashboard-stat-icon">

              <Clock3
                size={21}
              />

            </div>


            <div className="dashboard-stat-content">

              <span>
                Payment Pending
              </span>


              <strong>
                {stats.pending}
              </strong>

            </div>

          </div>


          {/* WAITING VERIFICATION */}

          <div className="dashboard-stat-card dashboard-stat-verification">

            <div className="dashboard-stat-icon">

              <Clock3
                size={21}
              />

            </div>


            <div className="dashboard-stat-content">

              <span>
                Waiting Verification
              </span>


              <strong>
                {stats.waitingVerification}
              </strong>

            </div>

          </div>


          {/* COMPLETED */}

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon">

              <HeartPulse
                size={21}
              />

            </div>


            <div className="dashboard-stat-content">

              <span>
                Completed
              </span>


              <strong>
                {stats.completed}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <section className="dashboard-main-grid">


          {/* =================================================
              UPCOMING EVENT
          ================================================= */}

          <article className="dashboard-card dashboard-upcoming-card">

            <header className="dashboard-card-header">

              <div className="dashboard-card-header-left">

                <span className="dashboard-section-label">
                  NEXT REGISTRATION
                </span>


                <h2>
                  Upcoming Event
                </h2>

              </div>


              <div className="dashboard-card-header-icon">

                <CalendarDays
                  size={21}
                />

              </div>

            </header>


            {upcomingBooking ? (

              <div className="dashboard-upcoming-event">

                <div className="dashboard-event-date">

                  <span>
                    {new Date(
                      `${upcomingBooking.event_date}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        weekday:
                          "short",
                      }
                    )}
                  </span>


                  <strong>
                    {new Date(
                      `${upcomingBooking.event_date}T00:00:00`
                    ).getDate()}
                  </strong>


                  <small>
                    {new Date(
                      `${upcomingBooking.event_date}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        month:
                          "short",
                      }
                    )}
                  </small>

                </div>


                <div className="dashboard-upcoming-details">

                  <span className="dashboard-event-type">

                    {upcomingBooking.event_type ||
                      "SNICT EVENT"}

                  </span>


                  <h3>
                    {getEventTitle(
                      upcomingBooking
                    )}
                  </h3>


                  {upcomingBooking.doctor_name && (

                    <p>
                      {upcomingBooking.doctor_name}
                    </p>

                  )}


                  <div className="dashboard-event-meta">

                    <span>

                      <CalendarDays
                        size={15}
                      />

                      {formatDate(
                        upcomingBooking.event_date
                      )}

                    </span>


                    {upcomingBooking.start_time && (

                      <span>

                        <Clock3
                          size={15}
                        />

                        {formatTime(
                          upcomingBooking.start_time
                        )}

                      </span>

                    )}

                  </div>


                  <Link
                    to={`/booking-history/${upcomingBooking.id}`}
                    className="dashboard-event-button"
                  >

                    View Booking

                    <ArrowRight
                      size={15}
                    />

                  </Link>

                </div>

              </div>

            ) : (

              <div className="dashboard-no-event">

                <div className="dashboard-no-event-icon">

                  <CalendarDays
                    size={27}
                  />

                </div>


                <h3>
                  No upcoming events
                </h3>


                <p>
                  You don't have any upcoming
                  event registrations.
                </p>


                <Link
                  to="/events"
                  className="dashboard-explore-link"
                >

                  Explore Events

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>

            )}

          </article>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <article className="dashboard-card dashboard-services-card">

            <header className="dashboard-card-header">

              <div className="dashboard-card-header-left">

                <span className="dashboard-section-label">
                  MEMBER SERVICES
                </span>


                <h2>
                  Quick Actions
                </h2>

              </div>


              <WalletCards
                size={21}
                className="dashboard-card-header-icon"
              />

            </header>


            <div className="dashboard-services-list">


              {/* EVENTS */}

              <Link
                to="/events"
                className="dashboard-service-link"
              >

                <div className="dashboard-service-icon">

                  <CalendarDays
                    size={19}
                  />

                </div>


                <div className="dashboard-service-content">

                  <strong>
                    Browse Events
                  </strong>


                  <span>
                    Find upcoming SNICT events
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="dashboard-service-arrow"
                />

              </Link>


              {/* BOOKINGS */}

              <Link
                to="/booking-history"
                className="dashboard-service-link"
              >

                <div className="dashboard-service-icon">

                  <TicketCheck
                    size={19}
                  />

                </div>


                <div className="dashboard-service-content">

                  <strong>
                    My Bookings
                  </strong>


                  <span>
                    View your registrations
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="dashboard-service-arrow"
                />

              </Link>


              {/* PROFILE */}

              <Link
                to="/profile"
                className="dashboard-service-link"
              >

                <div className="dashboard-service-icon">

                  <UserCircle
                    size={19}
                  />

                </div>


                <div className="dashboard-service-content">

                  <strong>
                    My Profile
                  </strong>


                  <span>
                    Manage your member profile
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="dashboard-service-arrow"
                />

              </Link>


              {/* SECURITY */}

              <Link
                to="/change-password"
                className="dashboard-service-link"
              >

                <div className="dashboard-service-icon">

                  <WalletCards
                    size={19}
                  />

                </div>


                <div className="dashboard-service-content">

                  <strong>
                    Account Security
                  </strong>


                  <span>
                    Manage your account settings
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="dashboard-service-arrow"
                />

              </Link>

            </div>

          </article>

        </section>


        {/* =================================================
            RECENT BOOKINGS
        ================================================= */}

        <section className="dashboard-card dashboard-recent-card">

          <header className="dashboard-recent-header">

            <div>

              <span className="dashboard-section-label">
                ACTIVITY
              </span>


              <h2>
                Recent Bookings
              </h2>

            </div>


            <Link
              to="/booking-history"
              className="dashboard-view-all"
            >

              View All

              <ArrowRight
                size={15}
              />

            </Link>

          </header>


          {error && (

            <div className="dashboard-error">
              {error}
            </div>

          )}


          {recentBookings.length === 0 ? (

            <div className="dashboard-empty-bookings">

              <TicketCheck
                size={35}
              />


              <h3>
                No bookings yet
              </h3>


              <p>
                Register for an upcoming
                SNICT event to see your
                bookings here.
              </p>

            </div>

          ) : (

            <div className="dashboard-recent-list">

              {recentBookings.map(
                (booking) => {

                  const status =
                    getBookingStatus(
                      booking
                    );


                  const payment =
                    getPaymentStatus(
                      booking
                    );


                  return (

                    <div
                      className="dashboard-booking-item"
                      key={
                        booking.id
                      }
                    >


                      {/* LEFT */}

                      <div className="dashboard-booking-left">

                        <div className="dashboard-booking-icon">

                          <TicketCheck
                            size={18}
                          />

                        </div>


                        <div className="dashboard-booking-info">

                          <strong>
                            {getEventTitle(
                              booking
                            )}
                          </strong>


                          <span>
                            {booking.booking_code ||
                              `Booking #${booking.id}`}
                          </span>

                        </div>

                      </div>


                      {/* MIDDLE */}

                      <div className="dashboard-booking-middle">

                        <span>
                          {formatDate(
                            booking.event_date ||
                            booking.created_at
                          )}
                        </span>


                        <strong>

                          ₹
                          {getBookingAmount(
                            booking
                          ).toLocaleString(
                            "en-IN"
                          )}

                        </strong>

                      </div>


                      {/* STATUS */}

                      <div className="dashboard-booking-right">

                        <span
                          className={`dashboard-booking-status ${status}`}
                        >

                          {formatStatus(
                            status
                          )}

                        </span>


                        {renderPaymentBadge(
                          payment
                        )}

                      </div>


                      {/* VIEW */}

                      <Link
                        to={`/booking-history/${booking.id}`}
                        className="dashboard-booking-view"
                        title="View booking"
                      >

                        <ArrowRight
                          size={16}
                        />

                      </Link>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>


      </div>

    </main>

  );

}


export default Dashboard;