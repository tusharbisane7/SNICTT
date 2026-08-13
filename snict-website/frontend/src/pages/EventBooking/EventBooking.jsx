import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  IndianRupee,
  Smartphone,
  CalendarDays,
  Clock3,
  UserRound,
  AlertCircle,
  Copy,
  MapPin,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import "./EventBooking.css";

// =========================================================
// EVENT BOOKING PAGE
// =========================================================

function EventBooking() {
  const { id } = useParams();

  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [booking, setBooking] =
    useState(null);

  const [transactionId, setTransactionId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  // =========================================================
  // LOAD BOOKING ON PAGE LOAD
  // =========================================================

  useEffect(() => {
    if (!id) {
      setError("Invalid booking.");
      setLoading(false);
      return;
    }

    loadBooking();
  }, [id]);

  // =========================================================
  // LOAD BOOKING
  // GET /api/bookings/:id
  // =========================================================

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/bookings/${id}`
      );

      if (
        response.data?.success &&
        response.data?.booking
      ) {
        setBooking(
          response.data.booking
        );

        return;
      }

      setError(
        response.data?.message ||
          "Booking not found."
      );
    } catch (error) {
      console.error(
        "Booking loading error:",
        error
      );

      // =====================================================
      // LOGIN REQUIRED
      // =====================================================

      if (
        error.response?.status === 401
      ) {
        navigate("/login", {
          state: {
            from:
              `/events/booking/${id}`,
          },
        });

        return;
      }

      // =====================================================
      // NOT FOUND
      // =====================================================

      if (
        error.response?.status === 404
      ) {
        setError(
          error.response?.data?.message ||
            "Booking not found."
        );

        return;
      }

      // =====================================================
      // OTHER ERROR
      // =====================================================

      setError(
        error.response?.data?.message ||
          "Unable to load booking."
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

    const value = date
      .toString()
      .slice(0, 10);

    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const [
      year,
      month,
      day,
    ] = parts;

    const dateObject = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return dateObject.toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
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

    const value = time
      .toString()
      .slice(0, 5);

    const parts = value.split(":");

    if (parts.length < 2) {
      return value;
    }

    let hour = Number(parts[0]);

    const minute = parts[1];

    if (Number.isNaN(hour)) {
      return value;
    }

    const suffix =
      hour >= 12
        ? "PM"
        : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
  };

  // =========================================================
  // COPY UPI ID
  // =========================================================

  const copyUpiId = async () => {
    const upiId =
      booking?.upi_id ||
      booking?.payment_upi_id ||
      "";

    if (!upiId) {
      setError(
        "UPI ID is not available."
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(
        upiId
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Copy UPI error:",
        error
      );

      setError(
        "Unable to copy UPI ID."
      );
    }
  };

  // =========================================================
  // SUBMIT PAYMENT
  // POST /api/payment/:bookingId
  // =========================================================

  const handlePayment = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    // =====================================================
    // CHECK BOOKING
    // =====================================================

    if (!booking) {
      setError(
        "Booking information is unavailable."
      );

      return;
    }

    // =====================================================
    // CHECK PAYMENT STATUS
    // =====================================================

    const paymentStatus =
      booking.payment_status;

    if (
      paymentStatus === "submitted" ||
      paymentStatus === "verified" ||
      paymentStatus === "paid"
    ) {
      setError(
        "Payment has already been submitted for this booking."
      );

      return;
    }

    // =====================================================
    // VALIDATE TRANSACTION ID
    // =====================================================

    const utr =
      transactionId.trim();

    if (!utr) {
      setError(
        "Please enter your UPI Transaction ID / UTR."
      );

      return;
    }

    if (utr.length < 6) {
      setError(
        "Please enter a valid UPI Transaction ID / UTR."
      );

      return;
    }

    try {
      setSubmitting(true);

      // ===================================================
      // SUBMIT PAYMENT
      //
      // IMPORTANT:
      //
      // Backend route:
      // POST /api/payment/:bookingId
      //
      // NOT:
      // /api/payments/:bookingId
      // ===================================================

      const response =
        await api.post(
          `/payment/${id}`,
          {
            transactionId: utr,
          }
        );

      if (
        response.data?.success
      ) {
        setSuccess(true);

        setBooking(
          (previous) => ({
            ...previous,

            payment_status:
              "submitted",

            /*
             * Backend booking status
             * is payment_pending.
             */

            booking_status:
              "payment_pending",

            transaction_id:
              utr,
          })
        );

        return;
      }

      setError(
        response.data?.message ||
          "Unable to submit payment."
      );
    } catch (error) {
      console.error(
        "Payment submission error:",
        error
      );

      // ===================================================
      // LOGIN REQUIRED
      // ===================================================

      if (
        error.response?.status === 401
      ) {
        navigate("/login", {
          state: {
            from:
              `/events/booking/${id}`,
          },
        });

        return;
      }

      // ===================================================
      // BOOKING / PAYMENT NOT FOUND
      // ===================================================

      if (
        error.response?.status === 404
      ) {
        setError(
          error.response?.data?.message ||
            "Booking or payment record not found."
        );

        return;
      }

      // ===================================================
      // CONFLICT
      // ===================================================

      if (
        error.response?.status === 409
      ) {
        setError(
          error.response?.data?.message ||
            "This payment has already been submitted."
        );

        await loadBooking();

        return;
      }

      // ===================================================
      // BAD REQUEST
      // ===================================================

      if (
        error.response?.status === 400
      ) {
        setError(
          error.response?.data?.message ||
            "Payment cannot be submitted."
        );

        await loadBooking();

        return;
      }

      // ===================================================
      // SERVER ERROR
      // ===================================================

      setError(
        error.response?.data?.message ||
          "Unable to submit payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="event-booking-page">
        <div className="booking-loading">
          <div className="booking-spinner" />

          <p>
            Loading booking...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // SUCCESS
  // =========================================================

  if (success) {
    return (
      <main className="event-booking-page">
        <div className="booking-success">
          <div className="booking-success-icon">
            <CheckCircle2
              size={58}
            />
          </div>

          <span className="booking-success-label">
            PAYMENT SUBMITTED
          </span>

          <h1>
            Booking Under Verification
          </h1>

          <p>
            Your payment details have
            been submitted successfully.

            <br />

            The SNICT administration
            team will verify your
            payment and update your
            booking status.
          </p>

          <div className="booking-reference">
            <span>
              BOOKING ID
            </span>

            <strong>
              #{booking?.id}
            </strong>
          </div>

          <div className="booking-success-actions">
            <Link
              to="/booking-history"
              className="booking-primary-btn"
            >
              View Booking History
            </Link>

            <Link
              to="/events"
              className="booking-secondary-btn"
            >
              Explore More Events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // BOOKING ERROR
  // =========================================================

  if (
    error &&
    !booking
  ) {
    return (
      <main className="event-booking-page">
        <div className="booking-error-page">
          <AlertCircle
            size={42}
          />

          <h1>
            Booking Unavailable
          </h1>

          <p>
            {error}
          </p>

          <Link
            to="/booking-history"
            className="booking-primary-btn"
          >
            Booking History
          </Link>
        </div>
      </main>
    );
  }

  // =========================================================
  // BOOKING DATA
  // =========================================================

  const amount = Number(
    booking?.amount ||
      booking?.price ||
      0
  );

  // =========================================================
  // UPI ID
  // =========================================================

  const upiId =
    booking?.upi_id ||
    booking?.payment_upi_id ||
    "";

  // =========================================================
  // QR CODE
  // =========================================================

  const qrCode =
    booking?.upi_qr_url ||
    booking?.qr_code_url ||
    booking?.payment_qr_url ||
    "";

  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  const paymentStatus =
    booking?.payment_status ||
    "pending";

  const isSubmitted =
    paymentStatus ===
      "submitted" ||
    paymentStatus ===
      "verified" ||
    paymentStatus ===
      "paid";

  const isRejected =
    paymentStatus ===
    "rejected";

  // =========================================================
  // BOOKING STATUS
  // =========================================================

  const bookingStatus =
    booking?.booking_status ||
    "payment_pending";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="event-booking-page">
      <div className="booking-container">

        {/* ===================================================
            BACK
        =================================================== */}

        <Link
          to={`/events/${booking?.event_id}`}
          className="booking-back"
        >
          <ArrowLeft
            size={16}
          />

          Back to Event
        </Link>

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="booking-header">
          <span>
            EVENT REGISTRATION
          </span>

          <h1>
            Complete Your Booking
          </h1>

          <p>
            Pay the registration fee
            using UPI and submit your
            transaction ID for verification.
          </p>
        </header>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="booking-error">
            <AlertCircle
              size={18}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ===================================================
            BOOKING GRID
        =================================================== */}

        <div className="booking-grid">

          {/* =================================================
              EVENT SUMMARY
          ================================================= */}

          <section className="booking-event-card">
            <span className="booking-card-label">
              EVENT
            </span>

            <h2>
              {booking?.title ||
                "SNICT Event"}
            </h2>

            {/* DOCTOR */}

            {booking?.doctor_name && (
              <div className="booking-doctor">
                <UserRound
                  size={16}
                />

                <span>
                  {booking.doctor_name}

                  {booking?.specialization &&
                    ` • ${booking.specialization}`}
                </span>
              </div>
            )}

            {/* EVENT DETAILS */}

            <div className="booking-event-details">

              {/* DATE */}

              {booking?.event_date && (
                <div>
                  <CalendarDays
                    size={17}
                  />

                  <span>
                    {formatDate(
                      booking.event_date
                    )}
                  </span>
                </div>
              )}

              {/* TIME */}

              {booking?.start_time && (
                <div>
                  <Clock3
                    size={17}
                  />

                  <span>
                    {formatTime(
                      booking.start_time
                    )}

                    {booking?.end_time &&
                      ` - ${formatTime(
                        booking.end_time
                      )}`}
                  </span>
                </div>
              )}

              {/* VENUE */}

              {booking?.venue && (
                <div>
                  <MapPin
                    size={17}
                  />

                  <span>
                    {booking.venue}
                  </span>
                </div>
              )}

            </div>

            {/* =================================================
                AMOUNT
            ================================================= */}

            <div className="booking-amount">
              <span>
                REGISTRATION FEE
              </span>

              <strong>
                <IndianRupee
                  size={23}
                />

                {amount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            {/* =================================================
                BOOKING STATUS
            ================================================= */}

            <div className="booking-status">
              <span>
                Booking Status
              </span>

              <strong>
                {bookingStatus}
              </strong>
            </div>

            {/* =================================================
                PAYMENT STATUS
            ================================================= */}

            <div className="booking-status">
              <span>
                Payment Status
              </span>

              <strong>
                {paymentStatus}
              </strong>
            </div>

          </section>

          {/* =================================================
              PAYMENT CARD
          ================================================= */}

          <section className="upi-payment-card">

            {/* =================================================
                PAYMENT HEADER
            ================================================= */}

            <div className="upi-heading">
              <div className="upi-heading-icon">
                <Smartphone
                  size={22}
                />
              </div>

              <div>
                <span>
                  UPI PAYMENT
                </span>

                <h2>
                  Pay Registration Fee
                </h2>
              </div>
            </div>

            {/* =================================================
                QR CODE
            ================================================= */}

            <div className="upi-box">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="SNICT UPI QR Code"
                  className="upi-qr-image"
                />
              ) : (
                <div className="upi-placeholder">
                  <Smartphone
                    size={36}
                  />

                  <span>
                    UPI QR
                  </span>

                  <small>
                    QR code unavailable
                  </small>
                </div>
              )}

              <strong>
                SNICT Registration
              </strong>

              <span>
                Pay ₹
                {amount.toLocaleString(
                  "en-IN"
                )}
              </span>

              <small>
                Google Pay • PhonePe •
                Paytm • BHIM
              </small>
            </div>

            {/* =================================================
                UPI ID
            ================================================= */}

            {upiId && (
              <div className="upi-id-box">
                <div>
                  <span>
                    UPI ID
                  </span>

                  <strong>
                    {upiId}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={
                    copyUpiId
                  }
                >
                  <Copy
                    size={15}
                  />

                  {copied
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>
            )}

            {/* =================================================
                PAYMENT INSTRUCTIONS
            ================================================= */}

            <div className="payment-instruction">
              <strong>
                How to complete payment
              </strong>

              <ol>
                <li>
                  Pay the exact
                  registration amount.
                </li>

                <li>
                  Complete payment
                  using any UPI app.
                </li>

                <li>
                  Copy the UPI
                  Transaction ID / UTR.
                </li>

                <li>
                  Enter the UTR below.
                </li>

                <li>
                  Submit it for
                  verification.
                </li>
              </ol>
            </div>

            {/* =================================================
                REJECTED PAYMENT
            ================================================= */}

            {isRejected ? (
              <div className="booking-error">
                <AlertCircle
                  size={20}
                />

                <span>
                  Your previous payment
                  was rejected. Please
                  contact SNICT administration
                  before submitting another
                  payment.
                </span>
              </div>
            ) : isSubmitted ? (

              /* =================================================
                  ALREADY SUBMITTED
              ================================================= */

              <div className="payment-already-submitted">
                <CheckCircle2
                  size={20}
                />

                <div>
                  <strong>
                    Payment Submitted
                  </strong>

                  <span>
                    Your payment is
                    already under
                    verification.
                  </span>
                </div>
              </div>

            ) : (

              /* =================================================
                  PAYMENT FORM
              ================================================= */

              <form
                onSubmit={
                  handlePayment
                }
              >
                <label
                  htmlFor="transactionId"
                >
                  UPI Transaction ID /
                  UTR
                </label>

                <input
                  id="transactionId"
                  type="text"
                  value={
                    transactionId
                  }
                  onChange={(e) =>
                    setTransactionId(
                      e.target.value
                    )
                  }
                  placeholder="Enter UTR / transaction ID"
                  maxLength={100}
                  autoComplete="off"
                  disabled={
                    submitting
                  }
                />

                <button
                  type="submit"
                  className="payment-submit-btn"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Payment"}
                </button>
              </form>
            )}

          </section>

        </div>

        {/* ===================================================
            SECURITY NOTE
        =================================================== */}

        <div className="booking-security-note">
          <CheckCircle2
            size={16}
          />

          <span>
            Your payment information is
            submitted securely to SNICT
            administration for verification.
          </span>
        </div>

      </div>
    </main>
  );
}

export default EventBooking;