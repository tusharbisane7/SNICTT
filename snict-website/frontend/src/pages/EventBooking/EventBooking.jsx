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
// QR CODE
// =========================================================
//
// Put your QR image here:
//
// src/assets/qr.jpeg
//
// =========================================================

import qrCodeImage from "../../assets/qr.jpeg";


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
  // LOAD BOOKING
  // =========================================================

  useEffect(() => {

    if (!id) {

      setError(
        "Invalid booking."
      );

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


      console.log(
        "Loading booking:",
        id
      );


      const response =
        await api.get(
          `/bookings/${id}`
        );


      console.log(
        "Booking response:",
        response.data
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


      console.error(
        "Booking response:",
        error.response?.data
      );


      console.error(
        "Booking status:",
        error.response?.status
      );


      console.error(
        "Booking URL:",
        error.config?.url
      );


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


      if (
        error.response?.status === 404
      ) {

        setError(
          error.response?.data?.message ||
          "Booking not found."
        );

        return;
      }


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


    const value =
      date
        .toString()
        .slice(0, 10);


    const parts =
      value.split("-");


    if (parts.length !== 3) {
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


    const value =
      time
        .toString()
        .slice(0, 5);


    const parts =
      value.split(":");


    if (parts.length < 2) {
      return value;
    }


    let hour =
      Number(parts[0]);

    const minute =
      parts[1];


    if (Number.isNaN(hour)) {
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
  // POST /api/payments/:bookingId
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
    // BOOKING ID
    // =====================================================

    const bookingId =
      booking?.id ||
      booking?.booking_id ||
      id;


    if (!bookingId) {

      setError(
        "Invalid booking ID."
      );

      return;
    }


    // =====================================================
    // BOOKING STATUS
    // =====================================================

    const bookingStatus =
      booking?.booking_status;


    if (
      bookingStatus &&
      ![
        "payment_pending",
      ].includes(
        bookingStatus
      )
    ) {

      if (
        [
          "confirmed",
          "completed",
        ].includes(
          bookingStatus
        )
      ) {

        setError(
          "This booking is already confirmed. Payment submission is not required."
        );

        return;
      }


      if (
        bookingStatus ===
        "rejected"
      ) {

        setError(
          "This booking has been rejected. Please contact SNICT administration."
        );

        return;
      }

    }


    // =====================================================
    // PAYMENT STATUS
    // =====================================================

    const paymentStatus =
      booking?.payment_status;


    if (
      paymentStatus ===
        "submitted" ||
      paymentStatus ===
        "verified" ||
      paymentStatus ===
        "paid"
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
      // DEBUG
      // ===================================================

      console.log(
        "Submitting payment:",
        {
          bookingId,
          transactionId: utr,
          endpoint:
            `/payments/${bookingId}`,
        }
      );


      // ===================================================
      // SUBMIT PAYMENT
      // ===================================================

      const response =
        await api.post(
          `/payments/${bookingId}`,
          {
            transactionId: utr,
          }
        );


      console.log(
        "Payment submission response:",
        response.data
      );


      // ===================================================
      // SUCCESS
      // ===================================================

      if (
        response.data?.success
      ) {

        setBooking(
          (previous) => ({

            ...previous,

            payment_status:
              "submitted",

            booking_status:
              previous?.booking_status ||
              "payment_pending",

            transaction_id:
              utr,

          })
        );


        setSuccess(true);

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


      console.error(
        "Payment response data:",
        error.response?.data
      );


      console.error(
        "Payment response status:",
        error.response?.status
      );


      console.error(
        "Payment request URL:",
        error.config?.url
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
              `/events/booking/${bookingId}`,

          },

        });

        return;
      }


      // ===================================================
      // NOT FOUND
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
      // FORBIDDEN
      // ===================================================

      if (
        error.response?.status === 403
      ) {

        setError(
          error.response?.data?.message ||
          "You are not allowed to submit payment for this booking."
        );

        return;
      }


      // ===================================================
      // SERVER ERROR
      // ===================================================

      if (
        error.response?.status >= 500
      ) {

        setError(
          error.response?.data?.message ||
          "Server error while submitting payment. Please try again."
        );

        return;
      }


      // ===================================================
      // NETWORK ERROR
      // ===================================================

      if (
        !error.response
      ) {

        setError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );

        return;
      }


      // ===================================================
      // FALLBACK
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

              #
              {booking?.id ||
                booking?.booking_id ||
                id}

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

  const amount =
    Number(
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
                booking?.event_title ||
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
                YOUR QR CODE
            ================================================= */}

            <div className="upi-box">

              <div className="upi-qr-wrapper">

                <img
                  src={qrCodeImage}
                  alt="SNICT UPI Payment QR Code"
                  className="upi-qr-image"
                />

              </div>


              <strong>
                SNICT Registration
              </strong>


              <span>

                Scan & Pay ₹
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
                  Scan the QR code using
                  your UPI app.
                </li>


                <li>
                  Pay the exact
                  registration amount.
                </li>


                <li>
                  Complete the payment
                  using Google Pay,
                  PhonePe, Paytm or BHIM.
                </li>


                <li>
                  Copy the UPI
                  Transaction ID / UTR.
                </li>


                <li>
                  Enter the UTR below
                  and submit it.
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