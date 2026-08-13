import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Ticket,
  UserCircle,
  X,
  Printer,
  QrCode,
  UserCheck,
  Circle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./BookingHistory.css";


// =========================================================
// COMPONENT
// =========================================================

function BookingHistory() {
  const navigate = useNavigate();

  const { user } = useAuth();

  // =========================================================
  // STATE
  // =========================================================

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedPass, setSelectedPass] =
    useState(null);

  const [printingPass, setPrintingPass] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);


  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  const loadBookings = useCallback(
    async (
      showFullLoader = true
    ) => {
      try {
        if (showFullLoader) {
          setLoading(true);
        }

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

        // ===================================================
        // LOGIN REQUIRED
        // ===================================================

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
        if (showFullLoader) {
          setLoading(false);
        }
      }
    },
    [navigate]
  );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadBookings(true);
  }, [loadBookings]);


  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        await loadBookings(false);
      } finally {
        setRefreshing(false);
      }
    };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    const value =
      String(date).slice(
        0,
        10
      );

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

  const formatTime = (
    time
  ) => {
    if (!time) {
      return "-";
    }

    const value =
      String(time).slice(
        0,
        5
      );

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
  // FORMAT DATETIME
  // =========================================================

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    try {
      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return String(value);
    }
  };


  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (
    status
  ) => {
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
          String(
            booking.event_date
          ).slice(
            0,
            10
          );

        const start =
          String(
            booking.start_time ||
              "00:00:00"
          ).slice(
            0,
            8
          );

        const end =
          String(
            booking.end_time ||
              "23:59:59"
          ).slice(
            0,
            8
          );

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
      } catch {
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

      // VERIFIED
      if (
        paymentStatus ===
          "verified" ||
        paymentStatus ===
          "paid" ||
        bookingStatus ===
          "confirmed"
      ) {
        return "verified";
      }

      // SUBMITTED
      if (
        paymentStatus ===
        "submitted"
      ) {
        return "verification";
      }

      // REJECTED
      if (
        paymentStatus ===
          "rejected" ||
        bookingStatus ===
          "rejected"
      ) {
        return "rejected";
      }

      return "pending";
    };


  // =========================================================
  // PAYMENT COMPLETED
  // =========================================================

  const isPaymentCompleted =
    (booking) => {
      const state =
        getPaymentState(
          booking
        );

      return (
        state ===
        "verified"
      );
    };


  // =========================================================
  // ATTENDANCE STATE
  // =========================================================

  const getAttendanceStatus =
    (booking) => {
      const status =
        String(
          booking?.attendance_status ||
            booking?.attendanceStatus ||
            booking?.attendance?.status ||
            "not_present"
        ).toLowerCase();

      if (
        status ===
          "present" ||
        status ===
          "marked_present"
      ) {
        return "present";
      }

      return "not_present";
    };


  // =========================================================
  // ATTENDANCE CODE
  // =========================================================

  const getAttendanceCode =
    (booking) => {
      return (
        booking?.attendance_code ||
        booking?.attendanceCode ||
        booking?.attendance?.code ||
        ""
      );
    };


  // =========================================================
  // ATTENDANCE MARKED TIME
  // =========================================================

  const getAttendanceMarkedAt =
    (booking) => {
      return (
        booking?.attendance_marked_at ||
        booking?.attendanceMarkedAt ||
        booking?.attendance?.markedAt ||
        null
      );
    };


  // =========================================================
  // GET PROFILE IMAGE
  // =========================================================

  const getProfileImage = (
    pass = null
  ) => {
    return (
      pass?.profile_image_url ||
      pass?.profileImageUrl ||
      user?.profileImageUrl ||
      user?.profile_image_url ||
      user?.photoUrl ||
      user?.photo_url ||
      user?.avatar ||
      null
    );
  };


  // =========================================================
  // PASS VALIDITY
  // =========================================================

  const getPassValidity =
    (booking) => {
      if (
        !booking?.event_date
      ) {
        return "Valid for registered event";
      }

      return `Valid only on ${formatDate(
        booking.event_date
      )}`;
    };


  // =========================================================
  // QR PAYLOAD
  // =========================================================

  const getQrPayload =
    (pass) => {
      if (!pass) {
        return "";
      }

      // =====================================================
      // BACKEND QR PAYLOAD
      // =====================================================

      if (
        pass.qr_payload
      ) {
        return pass.qr_payload;
      }


      // =====================================================
      // BACKEND QR OBJECT
      // =====================================================

      if (
        pass.qr_data
      ) {
        try {
          return JSON.stringify(
            pass.qr_data
          );
        } catch {
          return "";
        }
      }


      // =====================================================
      // FALLBACK
      // =====================================================

      const attendanceCode =
        pass.attendance_code ||
        pass.attendanceCode ||
        pass.attendance?.code ||
        "";

      const fallback = {
        type:
          "SNICT_EVENT_PASS",

        passId:
          pass.pass_id ||
          pass.passId ||
          pass.id ||
          "",

        passCode:
          pass.pass_code ||
          pass.passCode ||
          "",

        passToken:
          pass.pass_token ||
          pass.passToken ||
          "",

        bookingId:
          pass.booking_id ||
          pass.bookingId ||
          pass.id ||
          "",

        bookingCode:
          pass.booking_code ||
          "",

        userId:
          pass.user_id ||
          pass.userId ||
          user?.id ||
          "",

        userName:
          pass.full_name ||
          pass.fullName ||
          user?.fullName ||
          "",

        eventId:
          pass.event_id ||
          pass.eventId ||
          "",

        eventName:
          pass.event_name ||
          pass.event_title ||
          pass.title ||
          "",

        eventDate:
          pass.event_date ||
          "",

        startTime:
          pass.start_time ||
          "",

        endTime:
          pass.end_time ||
          "",

        venue:
          pass.venue ||
          "",

        validFrom:
          pass.valid_from ||
          "",

        validUntil:
          pass.valid_until ||
          "",

        attendanceCode,
      };

      return JSON.stringify(
        fallback
      );
    };


  // =========================================================
  // QR IMAGE
  // =========================================================

  const getQrImageUrl =
    (pass) => {
      const payload =
        getQrPayload(
          pass
        );

      if (!payload) {
        return "";
      }

      return (
        "https://api.qrserver.com/v1/create-qr-code/" +
        "?size=280x280" +
        "&margin=10" +
        "&data=" +
        encodeURIComponent(
          payload
        )
      );
    };


  // =========================================================
  // FETCH LATEST PASS
  // =========================================================

  const fetchPass =
    async (booking) => {
      if (!booking?.id) {
        throw new Error(
          "Booking ID is missing."
        );
      }

      const response =
        await api.get(
          `/bookings/${booking.id}/pass`
        );

      if (
        !response.data?.success ||
        !response.data?.pass
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to load event pass."
        );
      }

      return {
        ...booking,
        ...response.data.pass,
      };
    };


  // =========================================================
  // VIEW PASS
  // =========================================================

  const handleViewPass =
    async (booking) => {
      if (
        !isPaymentCompleted(
          booking
        )
      ) {
        return;
      }

      try {
        setError("");

        const pass =
          await fetchPass(
            booking
          );

        setSelectedPass(
          pass
        );
      } catch (error) {
        console.error(
          "View pass error:",
          error
        );

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
            error.message ||
            "Unable to load event pass."
        );
      }
    };


  // =========================================================
  // PRINT PASS
  // =========================================================

  const handlePrintPass =
    async (booking) => {
      if (
        !isPaymentCompleted(
          booking
        )
      ) {
        return;
      }

      try {
        setPrintingPass(
          true
        );

        setError("");

        const pass =
          await fetchPass(
            booking
          );

        setSelectedPass(
          pass
        );

        setTimeout(() => {
          window.print();

          setPrintingPass(
            false
          );
        }, 500);

      } catch (error) {
        console.error(
          "Print pass error:",
          error
        );

        setPrintingPass(
          false
        );

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
            error.message ||
            "Unable to print event pass."
        );
      }
    };


  // =========================================================
  // CLOSE PASS
  // =========================================================

  const closePass = () => {
    setSelectedPass(
      null
    );
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

    // VERIFIED
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


    // WAITING
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


    // REJECTED
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


    // PENDING
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
  // ATTENDANCE BADGE
  // =========================================================

  const AttendanceBadge = ({
    booking,
  }) => {
    const paymentVerified =
      isPaymentCompleted(
        booking
      );

    if (
      !paymentVerified
    ) {
      return null;
    }

    const status =
      getAttendanceStatus(
        booking
      );

    if (
      status ===
      "present"
    ) {
      return (
        <div className="booking-attendance-badge present">
          <UserCheck
            size={15}
          />

          <div>
            <strong>
              ATTENDANCE MARKED
            </strong>

            <span>
              Present at event
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="booking-attendance-badge not-present">
        <Circle
          size={14}
        />

        <div>
          <strong>
            ATTENDANCE PENDING
          </strong>

          <span>
            Scan your QR at event entrance
          </span>
        </div>
      </div>
    );
  };


  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const summary =
    useMemo(() => {
      const confirmed =
        bookings.filter(
          (booking) =>
            getPaymentState(
              booking
            ) === "verified"
        ).length;

      const waiting =
        bookings.filter(
          (booking) =>
            getPaymentState(
              booking
            ) === "verification"
        ).length;

      const pending =
        bookings.filter(
          (booking) =>
            getPaymentState(
              booking
            ) === "pending"
        ).length;

      const present =
        bookings.filter(
          (booking) =>
            getAttendanceStatus(
              booking
            ) === "present"
        ).length;

      return {
        confirmed,
        waiting,
        pending,
        present,
      };
    }, [bookings]);


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
              payment details, passes and
              attendance status in one place.
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
            payment details, event passes
            and attendance status in one place.
          </p>

        </div>

      </section>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="booking-history-container">

        {/* ===================================================
            TOP ACTION BAR
        =================================================== */}

        <div className="booking-history-toolbar">

          <div>
            <span>
              EVENT REGISTRATIONS
            </span>

            <h2>
              Booking History
            </h2>
          </div>

          <button
            type="button"
            className="booking-history-refresh"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "booking-refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
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
              onClick={() =>
                loadBookings(true)
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

        {!error &&
          bookings.length ===
            0 && (
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

        {!error &&
          bookings.length >
            0 && (
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
                    {summary.confirmed}
                  </strong>
                </div>


                <div>
                  <span>
                    WAITING
                  </span>

                  <strong>
                    {summary.waiting}
                  </strong>
                </div>


                <div>
                  <span>
                    PAYMENT PENDING
                  </span>

                  <strong>
                    {summary.pending}
                  </strong>
                </div>


                <div>
                  <span>
                    PRESENT
                  </span>

                  <strong>
                    {summary.present}
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

                  const attendanceStatus =
                    getAttendanceStatus(
                      booking
                    );

                  const attendanceCode =
                    getAttendanceCode(
                      booking
                    );

                  const attendanceMarkedAt =
                    getAttendanceMarkedAt(
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
                            booking.event_title ||
                            booking.event_name ||
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

                              {booking.end_time &&
                                ` - ${formatTime(
                                  booking.end_time
                                )}`}
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


                        {/* =================================================
                            PAYMENT WAITING
                        ================================================= */}

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


                        {/* =================================================
                            ATTENDANCE INFORMATION
                        ================================================= */}

                        {isPaymentCompleted(
                          booking
                        ) && (
                          <div
                            className={`booking-attendance-inline ${
                              attendanceStatus ===
                              "present"
                                ? "present"
                                : "not-present"
                            }`}
                          >

                            {attendanceStatus ===
                            "present" ? (
                              <UserCheck
                                size={16}
                              />
                            ) : (
                              <QrCode
                                size={16}
                              />
                            )}

                            <div>

                              <strong>
                                {attendanceStatus ===
                                "present"
                                  ? "Attendance Marked — Present"
                                  : "Attendance Not Marked"}
                              </strong>

                              <span>
                                {attendanceStatus ===
                                "present"
                                  ? attendanceMarkedAt
                                    ? `Marked on ${formatDateTime(
                                        attendanceMarkedAt
                                      )}`
                                    : "You are marked present."
                                  : attendanceCode
                                    ? `Attendance Code: ${attendanceCode}`
                                    : "Show your event QR at the entrance."}
                              </span>

                            </div>

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


                        {/* PAYMENT */}

                        <PaymentBadge
                          booking={
                            booking
                          }
                        />


                        {/* ATTENDANCE */}

                        <AttendanceBadge
                          booking={
                            booking
                          }
                        />


                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        {isPaymentCompleted(
                          booking
                        ) ? (

                          <div className="booking-pass-actions">

                            {/* VIEW PASS */}

                            <button
                              type="button"
                              className="booking-history-view booking-pass-button"
                              onClick={() =>
                                handleViewPass(
                                  booking
                                )
                              }
                            >

                              <Ticket
                                size={16}
                              />

                              <span>
                                View Event Pass
                              </span>

                              <ArrowRight
                                size={15}
                              />

                            </button>


                            {/* PRINT PASS */}

                            <button
                              type="button"
                              className="booking-history-view booking-pass-print-button"
                              onClick={() =>
                                handlePrintPass(
                                  booking
                                )
                              }
                              disabled={
                                printingPass
                              }
                            >

                              <Printer
                                size={16}
                              />

                              <span>
                                {printingPass
                                  ? "Preparing..."
                                  : "Print Pass"}
                              </span>

                            </button>

                          </div>

                        ) : (

                          <Link
                            to={`/events/booking/${booking.id}`}
                            className={
                              getPaymentState(
                                booking
                              ) ===
                              "rejected"
                                ? "booking-history-view payment-rejected"
                                : "booking-history-view"
                            }
                          >

                            {getPaymentState(
                              booking
                            ) === "pending"
                              ? "Complete Payment"
                              : getPaymentState(
                                  booking
                                ) ===
                                "verification"
                                ? "View Payment"
                                : "View Details"}

                            <ArrowRight
                              size={15}
                            />

                          </Link>
                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>


      {/* =====================================================
          EVENT PASS MODAL
      ===================================================== */}

      {selectedPass && (
        <div
          className="booking-pass-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-pass-title"
          onClick={
            closePass
          }
        >

          <div
            className="booking-pass-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                PASS HEADER
            ================================================= */}

            <div className="booking-pass-header">

              <div className="booking-pass-header-top">

                <div>

                  <span className="booking-pass-eyebrow">
                    SNICT EVENT PASS
                  </span>

                  <h2
                    id="event-pass-title"
                  >
                    {selectedPass.event_name ||
                      selectedPass.event_title ||
                      selectedPass.title ||
                      "SNICT Event"}
                  </h2>

                </div>


                <button
                  type="button"
                  className="booking-pass-close"
                  onClick={
                    closePass
                  }
                  aria-label="Close event pass"
                >

                  <X
                    size={20}
                  />

                </button>

              </div>

            </div>


            {/* =================================================
                PASS BODY
            ================================================= */}

            <div className="booking-pass-body">

              {/* =================================================
                  USER
              ================================================= */}

              <div className="booking-pass-user">

                {getProfileImage(
                  selectedPass
                ) ? (

                  <img
                    src={getProfileImage(
                      selectedPass
                    )}
                    alt={
                      user?.fullName ||
                      selectedPass.full_name ||
                      "Member"
                    }
                    className="booking-pass-user-image"
                  />

                ) : (

                  <div className="booking-pass-user-placeholder">

                    <UserCircle
                      size={42}
                    />

                  </div>

                )}


                <div>

                  <span className="booking-pass-field-label">
                    MEMBER
                  </span>

                  <strong className="booking-pass-user-name">

                    {selectedPass.full_name ||
                      selectedPass.fullName ||
                      user?.fullName ||
                      "SNICT Member"}

                  </strong>


                  {(selectedPass.username ||
                    user?.username) && (

                    <span className="booking-pass-username">

                      @
                      {selectedPass.username ||
                        user?.username}

                    </span>
                  )}

                </div>

              </div>


              {/* =================================================
                  EVENT INFORMATION
              ================================================= */}

              <div className="booking-pass-grid">

                {/* EVENT ID */}

                <div className="booking-pass-field">

                  <span>
                    EVENT ID
                  </span>

                  <strong>
                    {selectedPass.event_id ||
                      selectedPass.eventId ||
                      "-"}
                  </strong>

                </div>


                {/* BOOKING ID */}

                <div className="booking-pass-field">

                  <span>
                    BOOKING ID
                  </span>

                  <strong>
                    {selectedPass.booking_code ||
                      `#${selectedPass.booking_id ||
                        selectedPass.id}`}
                  </strong>

                </div>


                {/* DATE */}

                <div className="booking-pass-field">

                  <span>
                    DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedPass.event_date
                    )}
                  </strong>

                </div>


                {/* TIME */}

                <div className="booking-pass-field">

                  <span>
                    TIME
                  </span>

                  <strong>

                    {formatTime(
                      selectedPass.start_time
                    )}

                    {selectedPass.end_time &&
                      ` - ${formatTime(
                        selectedPass.end_time
                      )}`}

                  </strong>

                </div>


                {/* AMOUNT */}

                <div className="booking-pass-field">

                  <span>
                    AMOUNT PAID
                  </span>

                  <strong>

                    ₹
                    {Number(
                      selectedPass.payment_amount ||
                        selectedPass.amount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </strong>

                </div>


                {/* VENUE */}

                <div className="booking-pass-field">

                  <span>
                    VENUE
                  </span>

                  <strong>
                    {selectedPass.venue ||
                      "SNICT Event Venue"}
                  </strong>

                </div>

              </div>


              {/* =================================================
                  QR CODE
              ================================================= */}

              <div className="booking-pass-qr-section">

                <div className="booking-pass-qr-heading">

                  <QrCode
                    size={20}
                  />

                  <div>

                    <strong>
                      EVENT ENTRY QR
                    </strong>

                    <span>
                      Scan this QR code at the event entrance
                    </span>

                  </div>

                </div>


                <div className="booking-pass-qr-box">

                  {getQrImageUrl(
                    selectedPass
                  ) ? (

                    <img
                      src={getQrImageUrl(
                        selectedPass
                      )}
                      alt="SNICT Event Pass QR Code"
                      className="booking-pass-qr-image"
                    />

                  ) : (

                    <div className="booking-pass-qr-error">

                      <QrCode
                        size={70}
                      />

                      <span>
                        QR unavailable
                      </span>

                    </div>
                  )}

                </div>


                {/* =================================================
                    ATTENDANCE CODE
                ================================================= */}

                <div className="booking-pass-attendance-code">

                  <span>
                    ATTENDANCE CODE
                  </span>

                  <strong>
                    {selectedPass.attendance_code ||
                      selectedPass.attendanceCode ||
                      selectedPass.attendance?.code ||
                      "Not generated"}
                  </strong>

                  <small>
                    If QR scanning is unavailable,
                    provide this code to the event administrator.
                  </small>

                </div>


                {/* =================================================
                    ATTENDANCE STATUS
                ================================================= */}

                <div
                  className={`booking-pass-attendance-status ${
                    getAttendanceStatus(
                      selectedPass
                    ) ===
                    "present"
                      ? "present"
                      : "not-present"
                  }`}
                >

                  {getAttendanceStatus(
                    selectedPass
                  ) ===
                  "present" ? (

                    <UserCheck
                      size={20}
                    />

                  ) : (

                    <QrCode
                      size={20}
                    />

                  )}


                  <div>

                    <strong>

                      {getAttendanceStatus(
                        selectedPass
                      ) ===
                      "present"
                        ? "ATTENDANCE MARKED"
                        : "ATTENDANCE NOT MARKED"}

                    </strong>


                    <span>

                      {getAttendanceStatus(
                        selectedPass
                      ) ===
                      "present"
                        ? getAttendanceMarkedAt(
                            selectedPass
                          )
                          ? `Present — ${formatDateTime(
                              getAttendanceMarkedAt(
                                selectedPass
                              )
                            )}`
                          : "You are marked present."
                        : "Show this QR code at the event entrance to mark your attendance."}

                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  VALIDITY
              ================================================= */}

              <div className="booking-pass-validity">

                <CheckCircle2
                  size={20}
                />

                <div>

                  <strong>
                    PAYMENT VERIFIED
                  </strong>

                  <span>

                    {selectedPass.valid_from &&
                    selectedPass.valid_until
                      ? `Valid from ${new Date(
                          selectedPass.valid_from
                        ).toLocaleString(
                          "en-IN"
                        )} to ${new Date(
                          selectedPass.valid_until
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : getPassValidity(
                          selectedPass
                        )}

                  </span>

                </div>

              </div>


              {/* =================================================
                  PASS FOOTER
              ================================================= */}

              <div className="booking-pass-footer">

                <div>

                  <span className="booking-pass-field-label">
                    PASS STATUS
                  </span>

                  <strong className="booking-pass-valid">
                    VALID
                  </strong>

                </div>


                <button
                  type="button"
                  className="booking-pass-print"
                  onClick={() =>
                    window.print()
                  }
                >

                  <Printer
                    size={15}
                  />

                  Print / Save Pass

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}


// =========================================================
// EXPORT
// =========================================================

export default BookingHistory;