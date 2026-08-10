import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  IndianRupee,
  ArrowRight,
  AlertCircle,
  TicketCheck,
  CreditCard,
  MapPin,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Hourglass,
  XCircle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./BookingHistory.css";


function BookingHistory() {

  const navigate = useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  useEffect(() => {

    loadBookings();

  }, []);


  const loadBookings = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await api.get(
          "/bookings"
        );


      if (
        response.data?.success
      ) {

        setBookings(
          response.data.bookings ||
            []
        );

      } else {

        setBookings([]);

        setError(
          response.data?.message ||
            "Unable to load bookings."
        );

      }

    } catch (error) {

      console.error(
        "Booking history error:",
        error
      );


      // =====================================================
      // LOGIN REQUIRED
      // =====================================================

      if (
        error.response?.status ===
        401
      ) {

        navigate(
          "/login",
          {
            state: {
              from:
                "/booking-history",
            },
          }
        );

        return;
      }


      setError(
        error.response?.data?.message ||
          "Unable to load booking history."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {

    if (!date) {
      return "-";
    }


    const value =
      date
        .toString()
        .slice(0, 10);


    const parts =
      value.split("-");


    if (
      parts.length !== 3
    ) {

      return value;

    }


    const [
      year,
      month,
      day,
    ] = parts;


    const dateObject =
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );


    return dateObject.toLocaleDateString(
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

  const formatTime = (time) => {

    if (!time) {
      return "-";
    }


    const value =
      time
        .toString()
        .slice(0, 5);


    const parts =
      value.split(":");


    if (
      parts.length < 2
    ) {

      return value;

    }


    let hour =
      Number(parts[0]);


    const minute =
      parts[1];


    if (
      Number.isNaN(hour)
    ) {

      return value;

    }


    const suffix =
      hour >= 12
        ? "PM"
        : "AM";


    hour =
      hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;

  };


  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status) => {

    if (!status) {
      return "Unknown";
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
  // EVENT STATUS
  // =========================================================

  const getEventStatus =
    (booking) => {

      if (
        booking?.event_status
      ) {

        return booking.event_status;

      }


      if (
        !booking?.event_date
      ) {

        return null;

      }


      try {

        const date =
          booking.event_date
            .toString()
            .slice(0, 10);


        const start =
          booking.start_time
            ?.toString()
            .slice(0, 8) ||
          "00:00:00";


        const end =
          booking.end_time
            ?.toString()
            .slice(0, 8) ||
          "23:59:59";


        const eventStart =
          new Date(
            `${date}T${start}+05:30`
          );


        const eventEnd =
          new Date(
            `${date}T${end}+05:30`
          );


        const now =
          new Date();


        if (
          now < eventStart
        ) {

          return "upcoming";

        }


        if (
          now >= eventStart &&
          now <= eventEnd
        ) {

          return "ongoing";

        }


        return "past";

      } catch (
        error
      ) {

        console.error(
          "Event status error:",
          error
        );

        return null;

      }

    };


  // =========================================================
  // PAYMENT STATE
  // =========================================================

  const getPaymentState =
    (booking) => {

      const paymentStatus =
        String(
          booking?.payment_status ||
            "pending"
        ).toLowerCase();


      const bookingStatus =
        String(
          booking?.booking_status ||
            ""
        ).toLowerCase();


      // -----------------------------------------------------
      // VERIFIED
      // -----------------------------------------------------

      if (
        paymentStatus ===
          "verified" ||
        paymentStatus ===
          "paid"
      ) {

        return "verified";

      }


      // -----------------------------------------------------
      // SUBMITTED
      // -----------------------------------------------------

      if (
        paymentStatus ===
        "submitted"
      ) {

        return "verification";

      }


      // -----------------------------------------------------
      // REJECTED
      // -----------------------------------------------------

      if (
        paymentStatus ===
          "rejected" ||
        bookingStatus ===
          "rejected"
      ) {

        return "rejected";

      }


      // -----------------------------------------------------
      // PAYMENT PENDING
      // -----------------------------------------------------

      return "pending";

    };


  // =========================================================
  // PAYMENT BADGE
  // =========================================================

  const PaymentBadge = ({
    booking,
  }) => {

    const state =
      getPaymentState(
        booking
      );


    // =====================================================
    // VERIFIED
    // =====================================================

    if (
      state ===
      "verified"
    ) {

      return (

        <div className="booking-payment-badge verified">

          <CheckCircle2
            size={15}
          />

          <div>

            <strong>
              PAYMENT VERIFIED
            </strong>

            <span>
              Booking confirmed
            </span>

          </div>

        </div>

      );

    }


    // =====================================================
    // WAITING FOR VERIFICATION
    // =====================================================

    if (
      state ===
      "verification"
    ) {

      return (

        <div className="booking-payment-badge verification">

          <Hourglass
            size={15}
          />

          <div>

            <strong>
              WAITING FOR VERIFICATION
            </strong>

            <span>
              Payment submitted successfully
            </span>

          </div>

        </div>

      );

    }


    // =====================================================
    // REJECTED
    // =====================================================

    if (
      state ===
      "rejected"
    ) {

      return (

        <div className="booking-payment-badge rejected">

          <XCircle
            size={15}
          />

          <div>

            <strong>
              PAYMENT REJECTED
            </strong>

            <span>
              Contact SNICT administration
            </span>

          </div>

        </div>

      );

    }


    // =====================================================
    // PAYMENT PENDING
    // =====================================================

    return (

      <div className="booking-payment-badge pending">

        <CreditCard
          size={15}
        />

        <div>

          <strong>
            PAYMENT PENDING
          </strong>

          <span>
            Complete payment to confirm
          </span>

        </div>

      </div>

    );

  };


  // =========================================================
  // ACTION LABEL
  // =========================================================

  const getActionLabel =
    (booking) => {

      const state =
        getPaymentState(
          booking
        );


      if (
        state ===
        "pending"
      ) {

        return "Complete Payment";

      }


      if (
        state ===
        "verification"
      ) {

        return "View Payment";

      }


      if (
        state ===
        "verified"
      ) {

        return "View Booking";

      }


      if (
        state ===
        "rejected"
      ) {

        return "View Payment";

      }


      return "View Details";

    };


  // =========================================================
  // ACTION CLASS
  // =========================================================

  const getActionClass =
    (booking) => {

      const state =
        getPaymentState(
          booking
        );


      if (
        state ===
        "pending"
      ) {

        return "booking-history-view payment-required";

      }


      if (
        state ===
        "verification"
      ) {

        return "booking-history-view payment-submitted";

      }


      if (
        state ===
        "verified"
      ) {

        return "booking-history-view payment-verified";

      }


      if (
        state ===
        "rejected"
      ) {

        return "booking-history-view payment-rejected";

      }


      return "booking-history-view";

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <main className="booking-history-page">

        <section className="booking-history-hero">

          <div className="booking-history-hero-glow" />

          <div className="booking-history-hero-content">

            <span>
              SNICT MEMBER AREA
            </span>

            <h1>
              My Bookings
            </h1>

            <p>
              View your event registrations,
              payment details and booking
              status in one place.
            </p>

          </div>

        </section>


        <section className="booking-history-container">

          <div className="booking-history-state">

            <div className="booking-history-spinner" />

            <p>
              Loading your bookings...
            </p>

          </div>

        </section>

      </main>

    );

  }


  // =========================================================
  // MAIN
  // =========================================================

  return (

    <main className="booking-history-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="booking-history-hero">

        <div className="booking-history-hero-glow" />

        <div className="booking-history-hero-content">

          <span>
            SNICT MEMBER AREA
          </span>


          <h1>
            My Bookings
          </h1>


          <p>
            View your event registrations,
            payment details and booking
            status in one place.
          </p>

        </div>

      </section>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="booking-history-container">


        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading &&
          error && (

            <div className="booking-history-state error">

              <AlertCircle
                size={32}
              />


              <h3>
                Unable to Load Bookings
              </h3>


              <p>
                {error}
              </p>


              <button
                type="button"
                onClick={
                  loadBookings
                }
              >

                <RefreshCw
                  size={16}
                />

                Try Again

              </button>

            </div>

          )}


        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          !error &&
          bookings.length === 0 && (

            <div className="booking-history-empty">

              <div className="booking-empty-icon">

                <CalendarDays
                  size={40}
                />

              </div>


              <span>
                NO REGISTRATIONS
              </span>


              <h2>
                No bookings yet
              </h2>


              <p>
                You haven't registered
                for any SNICT event yet.
              </p>


              <Link
                to="/events"
                className="booking-empty-button"
              >

                Explore Events

                <ArrowRight
                  size={16}
                />

              </Link>

            </div>

          )}


        {/* ===================================================
            BOOKING LIST
        =================================================== */}

        {!loading &&
          !error &&
          bookings.length > 0 && (

            <div className="booking-history-list">


              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="booking-history-summary">


                <div>

                  <span>
                    TOTAL BOOKINGS
                  </span>

                  <strong>
                    {bookings.length}
                  </strong>

                </div>


                <div>

                  <span>
                    CONFIRMED
                  </span>


                  <strong>

                    {
                      bookings.filter(
                        (booking) =>
                          getPaymentState(
                            booking
                          ) ===
                          "verified"
                      ).length
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    WAITING
                  </span>


                  <strong>

                    {
                      bookings.filter(
                        (booking) =>
                          getPaymentState(
                            booking
                          ) ===
                          "verification"
                      ).length
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    PAYMENT PENDING
                  </span>


                  <strong>

                    {
                      bookings.filter(
                        (booking) =>
                          getPaymentState(
                            booking
                          ) ===
                          "pending"
                      ).length
                    }

                  </strong>

                </div>

              </div>


              {/* =================================================
                  BOOKING CARDS
              ================================================= */}

              {bookings.map(
                (booking) => {

                  const eventStatus =
                    getEventStatus(
                      booking
                    );


                  const amount =
                    Number(
                      booking.amount ||
                        0
                    );


                  const paymentState =
                    getPaymentState(
                      booking
                    );


                  return (

                    <article
                      className={`booking-history-card ${paymentState}`}
                      key={
                        booking.id
                      }
                    >


                      {/* =========================================
                          EVENT ICON
                      ========================================= */}

                      <div className="booking-history-event-icon">

                        <CalendarDays
                          size={26}
                        />

                      </div>


                      {/* =========================================
                          MAIN
                      ========================================= */}

                      <div className="booking-history-main">


                        <div className="booking-history-top">

                          <span className="booking-code">

                            {booking.booking_code ||
                              `BOOKING #${booking.id}`}

                          </span>


                          {eventStatus && (

                            <span
                              className={`booking-event-status ${eventStatus}`}
                            >

                              {formatStatus(
                                eventStatus
                              )}

                            </span>

                          )}

                        </div>


                        <h2>

                          {booking.title ||
                            "SNICT Event"}

                        </h2>


                        {booking.doctor_name && (

                          <p className="booking-doctor">

                            {booking.doctor_name}

                            {booking.specialization &&
                              ` • ${booking.specialization}`}

                          </p>

                        )}


                        {/* EVENT DETAILS */}

                        <div className="booking-history-meta">


                          {booking.event_date && (

                            <span>

                              <CalendarDays
                                size={15}
                              />

                              {formatDate(
                                booking.event_date
                              )}

                            </span>

                          )}


                          {booking.start_time && (

                            <span>

                              <Clock3
                                size={15}
                              />

                              {formatTime(
                                booking.start_time
                              )}

                            </span>

                          )}


                          {booking.venue && (

                            <span>

                              <MapPin
                                size={15}
                              />

                              {booking.venue}

                            </span>

                          )}

                        </div>


                        {/* SECURITY */}

                        {paymentState ===
                          "verification" && (

                          <div className="verification-note">

                            <ShieldCheck
                              size={15}
                            />

                            <span>
                              Your payment has been
                              received and is waiting
                              for admin verification.
                            </span>

                          </div>

                        )}

                      </div>


                      {/* =========================================
                          RIGHT SIDE
                      ========================================= */}

                      <div className="booking-history-payment">


                        {/* AMOUNT */}

                        <div className="booking-history-price">

                          <IndianRupee
                            size={16}
                          />

                          <strong>

                            {amount.toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </div>


                        {/* BOOKING STATUS */}

                        <div
                          className={`booking-status ${
                            booking.booking_status ||
                            "payment_pending"
                          }`}
                        >

                          <TicketCheck
                            size={14}
                          />

                          {formatStatus(
                            booking.booking_status ||
                              "payment_pending"
                          )}

                        </div>


                        {/* PAYMENT BADGE */}

                        <PaymentBadge
                          booking={
                            booking
                          }
                        />


                        {/* ACTION */}

                        <Link
                          to={`/events/booking/${booking.id}`}
                          className={
                            getActionClass(
                              booking
                            )
                          }
                        >

                          {getActionLabel(
                            booking
                          )}

                          <ArrowRight
                            size={15}
                          />

                        </Link>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

      </section>

    </main>

  );

}


export default BookingHistory;