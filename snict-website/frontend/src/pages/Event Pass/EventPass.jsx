import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import QRCode from "react-qr-code";

import api from "../../services/api";

// =========================================================
// EVENT PASS
// =========================================================

const EventPass = () => {
  const { bookingId } = useParams();

  const location = useLocation();

  const navigate = useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [booking, setBooking] = useState(
    location.state?.booking || null
  );

  const [loading, setLoading] = useState(
    !location.state?.booking
  );

  const [error, setError] = useState("");

  const [retrying, setRetrying] = useState(false);

  // =======================================================
  // HELPER
  // =======================================================

  const firstValue = (
    object,
    keys,
    fallback = ""
  ) => {
    if (!object) {
      return fallback;
    }

    for (const key of keys) {
      const value = object[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return fallback;
  };

  // =======================================================
  // DATE FORMAT
  // =======================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return String(value);
    }
  };

  // =======================================================
  // TIME FORMAT
  // =======================================================

  const formatTime = (value) => {
    if (!value) {
      return "—";
    }

    try {
      const raw = String(value);

      const time = raw.slice(0, 8);

      const parts = time.split(":");

      if (parts.length < 2) {
        return raw;
      }

      let hour = Number(parts[0]);

      const minute = parts[1];

      if (Number.isNaN(hour)) {
        return raw;
      }

      const suffix =
        hour >= 12
          ? "PM"
          : "AM";

      hour =
        hour % 12 || 12;

      return `${hour}:${minute} ${suffix}`;
    } catch {
      return String(value);
    }
  };

  // =======================================================
  // NORMALIZE API RESPONSE
  // =======================================================

  const normalizeBookingResponse = (
    responseData
  ) => {
    if (!responseData) {
      return null;
    }

    if (responseData.booking) {
      return responseData.booking;
    }

    if (
      responseData.data?.booking
    ) {
      return responseData.data.booking;
    }

    if (responseData.data) {
      return responseData.data;
    }

    return responseData;
  };

  // =======================================================
  // FETCH BOOKING
  //
  // IMPORTANT:
  // We DO NOT call:
  //
  // /bookings/:id/pass
  //
  // We only use:
  //
  // /bookings/:id
  // =======================================================

  const fetchBooking = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      if (
        !bookingId ||
        Number.isNaN(
          Number(bookingId)
        )
      ) {
        setError(
          "Invalid booking ID."
        );

        setBooking(null);

        return;
      }

      const response = await api.get(
        `/bookings/${bookingId}`
      );

      const bookingData =
        normalizeBookingResponse(
          response.data
        );

      if (!bookingData) {
        setBooking(null);

        setError(
          "Booking details could not be found."
        );

        return;
      }

      setBooking(
        bookingData
      );
    } catch (err) {
      console.error(
        "Event pass booking error:",
        err
      );

      const status =
        err?.response?.status;

      const backendMessage =
        err?.response?.data?.message;

      if (status === 401) {
        setError(
          "Your login session has expired. Please login again."
        );
      } else if (status === 403) {
        setError(
          "You are not allowed to view this booking."
        );
      } else if (status === 404) {
        setError(
          backendMessage ||
            "Booking was not found."
        );
      } else {
        setError(
          backendMessage ||
            "Unable to load booking details. Please try again."
        );
      }

      setBooking(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(
        location.state.booking
      );

      setLoading(false);

      return;
    }

    fetchBooking(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // =======================================================
  // RETRY
  // =======================================================

  const handleRetry = async () => {
    setRetrying(true);

    await fetchBooking(false);
  };

  // =======================================================
  // PRINT
  // =======================================================

  const handlePrint = () => {
    window.print();
  };

  // =======================================================
  // BACK
  // =======================================================

  const handleBack = () => {
    navigate(-1);
  };

  // =======================================================
  // BOOKING DATA
  // =======================================================

  const eventName =
    firstValue(
      booking,
      [
        "title",
        "event_title",
        "eventTitle",
        "event_name",
        "eventName",
        "name",
      ],
      "SNICT Event"
    );

  const userName =
    firstValue(
      booking,
      [
        "full_name",
        "fullName",
        "user_name",
        "userName",
        "username",
        "name",
      ],
      "Guest"
    );

  const bookingCode =
    firstValue(
      booking,
      [
        "booking_code",
        "bookingCode",
      ],
      `SNICT-BKG-${bookingId}`
    );

  // =======================================================
  // EVENT PASS DATA
  // =======================================================

  const nestedPass =
    booking?.pass ||
    booking?.eventPass ||
    booking?.event_pass ||
    null;

  const passCode =
    firstValue(
      booking,
      [
        "pass_code",
        "passCode",
        "event_pass_code",
        "eventPassCode",
      ],
      ""
    ) ||
    firstValue(
      nestedPass,
      [
        "pass_code",
        "passCode",
      ],
      ""
    );

  const passToken =
    firstValue(
      booking,
      [
        "pass_token",
        "passToken",
        "event_pass_token",
        "eventPassToken",
      ],
      ""
    ) ||
    firstValue(
      nestedPass,
      [
        "pass_token",
        "passToken",
      ],
      ""
    );

  // =======================================================
  // ATTENDANCE CODE
  //
  // Backend should return one of:
  //
  // attendance_code
  // attendanceCode
  // verification_code
  // verificationCode
  // =======================================================

  const attendanceCode =
    firstValue(
      booking,
      [
        "attendance_code",
        "attendanceCode",
        "verification_code",
        "verificationCode",
        "manual_attendance_code",
        "manualAttendanceCode",
      ],
      ""
    ) ||
    firstValue(
      nestedPass,
      [
        "attendance_code",
        "attendanceCode",
        "verification_code",
        "verificationCode",
      ],
      ""
    );

  // =======================================================
  // EVENT DATA
  // =======================================================

  const eventId =
    firstValue(
      booking,
      [
        "event_id",
        "eventId",
      ],
      null
    );

  const eventDate =
    firstValue(
      booking,
      [
        "event_date",
        "eventDate",
        "date",
      ],
      ""
    );

  const startTime =
    firstValue(
      booking,
      [
        "start_time",
        "startTime",
      ],
      ""
    );

  const endTime =
    firstValue(
      booking,
      [
        "end_time",
        "endTime",
      ],
      ""
    );

  const venue =
    firstValue(
      booking,
      [
        "venue",
        "event_venue",
        "eventVenue",
        "location",
      ],
      "Venue will be announced"
    );

  const eventMode =
    firstValue(
      booking,
      [
        "event_mode",
        "eventMode",
        "mode",
      ],
      ""
    );

  // =======================================================
  // STATUS
  // =======================================================

  const bookingStatus =
    firstValue(
      booking,
      [
        "booking_status",
        "bookingStatus",
        "status",
      ],
      "confirmed"
    );

  const paymentStatus =
    firstValue(
      booking,
      [
        "payment_status",
        "paymentStatus",
      ],
      "verified"
    );

  const transactionId =
    firstValue(
      booking,
      [
        "transaction_id",
        "transactionId",
      ],
      ""
    );

  const amount =
    firstValue(
      booking,
      [
        "amount",
        "payment_amount",
        "total_amount",
        "totalAmount",
      ],
      null
    );

  const validFrom =
    firstValue(
      booking,
      [
        "valid_from",
        "validFrom",
      ],
      ""
    ) ||
    firstValue(
      nestedPass,
      [
        "valid_from",
        "validFrom",
      ],
      ""
    );

  const validUntil =
    firstValue(
      booking,
      [
        "valid_until",
        "validUntil",
      ],
      ""
    ) ||
    firstValue(
      nestedPass,
      [
        "valid_until",
        "validUntil",
      ],
      ""
    );

  // =======================================================
  // CONFIRMED
  // =======================================================

  const normalizedBookingStatus =
    String(
      bookingStatus || ""
    ).toLowerCase();

  const isConfirmed =
    normalizedBookingStatus ===
      "confirmed" ||
    normalizedBookingStatus ===
      "completed" ||
    normalizedBookingStatus ===
      "payment_verified";

  // =======================================================
  // QR DATA
  // =======================================================

  const qrValue = useMemo(() => {
    if (!booking) {
      return "";
    }

    return JSON.stringify({
      type:
        "SNICT_EVENT_PASS",

      bookingId:
        Number(
          booking?.id ||
          bookingId
        ),

      eventId:
        eventId
          ? Number(eventId)
          : null,

      bookingCode,

      passCode:
        passCode || null,

      passToken:
        passToken || null,

      attendanceCode:
        attendanceCode || null,

      eventName,

      userName,
    });
  }, [
    booking,
    bookingId,
    eventId,
    bookingCode,
    passCode,
    passToken,
    attendanceCode,
    eventName,
    userName,
  ]);

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <>
        <style>
          {pageStyles}
        </style>

        <div className="event-pass-page">

          <div className="pass-loading">

            <div className="loading-spinner" />

            <h2>
              Loading Event Pass
            </h2>

            <p>
              Please wait while we
              load your booking.
            </p>

          </div>

        </div>
      </>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (
    error ||
    !booking
  ) {
    return (
      <>
        <style>
          {pageStyles}
        </style>

        <div className="event-pass-page">

          <div className="pass-topbar">

            <button
              type="button"
              className="back-button"
              onClick={handleBack}
            >
              ← Back
            </button>

          </div>

          <div className="pass-error-card">

            <div className="error-icon">
              !
            </div>

            <h1>
              Event Pass Unavailable
            </h1>

            <p>
              {error ||
                "The booking details are not available."}
            </p>

            <div className="error-actions">

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleRetry
                }
                disabled={
                  retrying
                }
              >
                {retrying
                  ? "Checking..."
                  : "Try Again"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleBack
                }
              >
                Back to Bookings
              </button>

            </div>

          </div>

        </div>
      </>
    );
  }

  // =======================================================
  // MAIN PASS
  // =======================================================

  return (
    <>
      <style>
        {pageStyles}
      </style>

      <div className="event-pass-page">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="pass-topbar">

          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            ← Back
          </button>

          <div className="topbar-actions">

            <button
              type="button"
              className="print-button"
              onClick={handlePrint}
            >
              🖨 Print Pass
            </button>

          </div>

        </div>

        {/* =================================================
            PASS
        ================================================= */}

        <main className="pass-container">

          <div
            id="event-pass"
            className="event-pass-card"
          >

            {/* =============================================
                HEADER
            ============================================= */}

            <div className="pass-header">

              <div className="brand-area">

               

                <div>

                  <div className="brand-name">
                    SNICT
                  </div>

                  <div className="brand-subtitle">
                    Event Pass
                  </div>

                </div>

              </div>

              <div
                className={
                  isConfirmed
                    ? "confirmed-badge"
                    : "pending-badge"
                }
              >

                <span>
                  {isConfirmed
                    ? "✓"
                    : "!"}
                </span>

                {isConfirmed
                  ? "CONFIRMED"
                  : String(
                      bookingStatus
                    )
                      .replace(
                        /_/g,
                        " "
                      )
                      .toUpperCase()}

              </div>

            </div>

            {/* =============================================
                BODY
            ============================================= */}

            <div className="pass-body">

              <div className="pass-main-content">

                <div className="pass-label">
                  EVENT PASS
                </div>

                <h1 className="event-title">
                  {eventName}
                </h1>

                <p className="welcome-text">
                  Welcome,{" "}
                  <strong>
                    {userName}
                  </strong>
                </p>

                {/* =========================================
                    EVENT INFORMATION
                ========================================= */}

                <div className="event-info-grid">

                  <div className="info-item">

                    <div className="info-icon">
                      📅
                    </div>

                    <div>

                      <span className="info-label">
                        DATE
                      </span>

                      <strong>
                        {formatDate(
                          eventDate
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="info-item">

                    <div className="info-icon">
                      ⏰
                    </div>

                    <div>

                      <span className="info-label">
                        TIME
                      </span>

                      <strong>

                        {formatTime(
                          startTime
                        )}

                        {endTime
                          ? ` - ${formatTime(
                              endTime
                            )}`
                          : ""}

                      </strong>

                    </div>

                  </div>

                  <div className="info-item">

                    <div className="info-icon">
                      📍
                    </div>

                    <div>

                      <span className="info-label">
                        VENUE
                      </span>

                      <strong>
                        {venue}
                      </strong>

                    </div>

                  </div>

                  {eventMode && (
                    <div className="info-item">

                      <div className="info-icon">
                        🎟
                      </div>

                      <div>

                        <span className="info-label">
                          MODE
                        </span>

                        <strong>
                          {eventMode}
                        </strong>

                      </div>

                    </div>
                  )}

                </div>

                {/* =========================================
                    BOOKING DETAILS
                ========================================= */}

                <div className="booking-details">

                  <div className="detail-row">

                    <span>
                      Booking Code
                    </span>

                    <strong>
                      {bookingCode}
                    </strong>

                  </div>

                  <div className="detail-row">

                    <span>
                      Pass Code
                    </span>

                    <strong>
                      {passCode ||
                        "Generated for entry"}
                    </strong>

                  </div>

                  {transactionId && (
                    <div className="detail-row">

                      <span>
                        Transaction ID
                      </span>

                      <strong>
                        {transactionId}
                      </strong>

                    </div>
                  )}

                  {amount !== null &&
                    amount !==
                      undefined && (
                      <div className="detail-row">

                        <span>
                          Amount
                        </span>

                        <strong>
                          ₹
                          {Number(
                            amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>
                    )}

                </div>

              </div>

              {/* =========================================
                  QR + MANUAL ATTENDANCE CODE
              ========================================= */}

              <div className="qr-section">

                <div className="qr-container">

                  {qrValue ? (
                    <QRCode
                      value={
                        qrValue
                      }
                      size={190}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#111827"
                    />
                  ) : (
                    <div className="qr-placeholder">
                      QR
                    </div>
                  )}

                </div>

                <p className="qr-title">
                  Scan to Verify
                </p>

                <p className="qr-description">
                  Present this QR code
                  at the event entrance.
                </p>

                {/* =========================================
                    MANUAL ATTENDANCE VERIFICATION
                ========================================= */}

                <div className="manual-code-section">

                  <div className="manual-code-divider">
                    <span>
                      OR
                    </span>
                  </div>

                  <span className="manual-code-label">
                    MANUAL VERIFICATION CODE
                  </span>

                  {attendanceCode ? (

                    <>
                      <div className="attendance-code">
                        {attendanceCode}
                      </div>

                      <p className="manual-code-help">
                        If QR scanning is
                        unavailable, show
                        this code to the
                        event coordinator.
                      </p>
                    </>

                  ) : (

                    <>
                      <div className="attendance-code unavailable">
                        Not Generated
                      </div>

                      <p className="manual-code-help warning">
                        Manual verification
                        code has not been
                        generated for this
                        booking yet.
                      </p>
                    </>

                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                PERFORATION
            ================================================= */}

            <div className="perforation">

              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="pass-footer">

              <div>

                <span className="footer-label">
                  BOOKING STATUS
                </span>

                <strong className="status-text">
                  {String(
                    bookingStatus
                  )
                    .replace(
                      /_/g,
                      " "
                    )
                    .toUpperCase()}
                </strong>

              </div>

              <div>

                <span className="footer-label">
                  PAYMENT
                </span>

                <strong className="payment-status">

                  ✓{" "}

                  {String(
                    paymentStatus
                  )
                    .replace(
                      /_/g,
                      " "
                    )
                    .toUpperCase()}

                </strong>

              </div>

              <div>

                <span className="footer-label">
                  PASS ID
                </span>

                <strong>
                  #
                  {passCode ||
                    bookingCode}
                </strong>

              </div>

            </div>

            {/* =================================================
                VALIDITY
            ================================================= */}

            {(validFrom ||
              validUntil) && (

              <div className="validity-bar">

                <span>
                  Valid
                </span>

                {validFrom && (
                  <strong>
                    {formatDate(
                      validFrom
                    )}
                  </strong>
                )}

                {validUntil && (
                  <>
                    <span>
                      to
                    </span>

                    <strong>
                      {formatDate(
                        validUntil
                      )}
                    </strong>
                  </>
                )}

              </div>

            )}

          </div>

          {/* =================================================
              INSTRUCTIONS
          ================================================= */}

          <div className="pass-instructions">

            <h3>
              Important Instructions
            </h3>

            <ul>

              <li>
                Keep this event pass
                ready when entering
                the event.
              </li>

              <li>
                Scan the QR code for
                quick attendance
                verification.
              </li>

              <li>
                If the QR code cannot
                be scanned, provide
                the manual verification
                code shown on this pass.
              </li>

              <li>
                This pass is linked
                to your booking and
                should not be shared.
              </li>

              <li>
                Carry a valid ID
                matching your booking
                details if required.
              </li>

            </ul>

          </div>

        </main>

      </div>
    </>
  );
};


// =========================================================
// CSS
// =========================================================

const pageStyles = `

* {
  box-sizing: border-box;
}

.event-pass-page {
  min-height: 100vh;

  background:
    radial-gradient(
      circle at top left,
      rgba(99, 102, 241, 0.12),
      transparent 32%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(14, 165, 233, 0.10),
      transparent 32%
    ),
    #f4f7fb;

  color: #111827;

  padding-bottom: 60px;

  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}


/* =========================================================
   TOP BAR
========================================================= */

.pass-topbar {
  width: min(
    1180px,
    calc(100% - 32px)
  );

  margin: 0 auto;

  padding: 24px 0;

  display: flex;

  align-items: center;

  justify-content: space-between;
}

.back-button,
.print-button {
  border: none;

  border-radius: 12px;

  padding: 11px 17px;

  font-size: 14px;

  font-weight: 700;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.back-button {
  background: #ffffff;

  color: #374151;

  box-shadow:
    0 4px 16px
    rgba(15, 23, 42, 0.08);
}

.print-button {
  background: #111827;

  color: #ffffff;

  box-shadow:
    0 5px 18px
    rgba(15, 23, 42, 0.18);
}

.back-button:hover,
.print-button:hover {
  transform:
    translateY(-2px);
}


/* =========================================================
   CONTAINER
========================================================= */

.pass-container {
  width: min(
    1050px,
    calc(100% - 32px)
  );

  margin: 0 auto;
}


/* =========================================================
   PASS CARD
========================================================= */

.event-pass-card {
  background: #ffffff;

  border-radius: 26px;

  overflow: hidden;

  box-shadow:
    0 24px 70px
    rgba(15, 23, 42, 0.14);

  border:
    1px solid
    rgba(148, 163, 184, 0.25);
}


/* =========================================================
   HEADER
========================================================= */

.pass-header {
  padding: 27px 32px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  background:
    linear-gradient(
      135deg,
      #111827,
      #1e293b
    );

  color: white;
}

.brand-area {
  display: flex;

  align-items: center;

  gap: 13px;
}

.brand-logo {
  width: 48px;

  height: 48px;

  border-radius: 14px;

  display: flex;

  align-items: center;

  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #06b6d4
    );

  font-size: 25px;

  font-weight: 900;

  box-shadow:
    0 7px 22px
    rgba(99, 102, 241, 0.35);
}

.brand-name {
  font-size: 21px;

  font-weight: 900;

  letter-spacing: 1.5px;
}

.brand-subtitle {
  margin-top: 2px;

  color: #cbd5e1;

  font-size: 12px;

  letter-spacing: 1px;

  text-transform: uppercase;
}

.confirmed-badge,
.pending-badge {
  display: flex;

  align-items: center;

  gap: 7px;

  padding: 9px 14px;

  border-radius: 999px;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 0.5px;
}

.confirmed-badge {
  background:
    rgba(34, 197, 94, 0.15);

  border:
    1px solid
    rgba(74, 222, 128, 0.28);

  color: #86efac;
}

.pending-badge {
  background:
    rgba(251, 191, 36, 0.15);

  border:
    1px solid
    rgba(251, 191, 36, 0.30);

  color: #fde68a;
}

.confirmed-badge span,
.pending-badge span {
  width: 19px;

  height: 19px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;
}

.confirmed-badge span {
  background: #22c55e;

  color: white;
}

.pending-badge span {
  background: #f59e0b;

  color: white;
}


/* =========================================================
   BODY
========================================================= */

.pass-body {
  padding: 40px;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    280px;

  gap: 42px;
}

.pass-label {
  color: #6366f1;

  font-size: 12px;

  font-weight: 900;

  letter-spacing: 2px;
}

.event-title {
  margin:
    10px 0 8px;

  font-size: clamp(
    28px,
    4vw,
    44px
  );

  line-height: 1.12;

  letter-spacing: -1.2px;

  color: #111827;
}

.welcome-text {
  margin: 0 0 30px;

  color: #64748b;

  font-size: 15px;
}

.welcome-text strong {
  color: #111827;
}


/* =========================================================
   EVENT INFO
========================================================= */

.event-info-grid {
  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );

  gap: 16px;

  margin-bottom: 28px;
}

.info-item {
  display: flex;

  align-items: flex-start;

  gap: 12px;

  padding: 15px;

  border:
    1px solid
    #e5e7eb;

  border-radius: 15px;

  background: #f8fafc;
}

.info-icon {
  width: 38px;

  height: 38px;

  flex-shrink: 0;

  border-radius: 11px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #eef2ff;

  font-size: 17px;
}

.info-item > div:last-child {
  min-width: 0;
}

.info-label {
  display: block;

  margin-bottom: 4px;

  color: #94a3b8;

  font-size: 9px;

  font-weight: 900;

  letter-spacing: 1px;
}

.info-item strong {
  display: block;

  color: #1e293b;

  font-size: 13px;

  line-height: 1.4;

  word-break: break-word;
}


/* =========================================================
   BOOKING DETAILS
========================================================= */

.booking-details {
  border-top:
    1px solid
    #e5e7eb;

  padding-top: 18px;
}

.detail-row {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

  padding: 9px 0;

  font-size: 13px;
}

.detail-row span {
  color: #64748b;
}

.detail-row strong {
  color: #1e293b;

  text-align: right;

  word-break: break-word;
}


/* =========================================================
   QR SECTION
========================================================= */

.qr-section {
  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: flex-start;

  text-align: center;
}

.qr-container {
  padding: 15px;

  background: white;

  border-radius: 20px;

  border:
    1px solid
    #e5e7eb;

  box-shadow:
    0 12px 35px
    rgba(15, 23, 42, 0.08);
}

.qr-container svg {
  display: block;
}

.qr-title {
  margin:
    17px 0 4px;

  font-weight: 800;

  color: #111827;

  font-size: 14px;
}

.qr-description {
  margin: 0;

  max-width: 220px;

  color: #64748b;

  font-size: 11px;

  line-height: 1.5;
}

.qr-placeholder {
  width: 190px;

  height: 190px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #f1f5f9;

  color: #64748b;

  font-size: 25px;

  font-weight: 800;
}


/* =========================================================
   MANUAL ATTENDANCE CODE
========================================================= */

.manual-code-section {
  width: 100%;

  margin-top: 22px;

  padding-top: 4px;
}

.manual-code-divider {
  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  margin:
    0 auto 15px;
}

.manual-code-divider::before,
.manual-code-divider::after {
  content: "";

  height: 1px;

  background: #e5e7eb;

  flex: 1;
}

.manual-code-divider span {
  margin:
    0 10px;

  color: #94a3b8;

  font-size: 10px;

  font-weight: 900;

  letter-spacing: 1px;
}

.manual-code-label {
  display: block;

  margin-bottom: 8px;

  color: #64748b;

  font-size: 9px;

  font-weight: 900;

  letter-spacing: 1.2px;
}

.attendance-code {
  width: 100%;

  padding:
    12px 10px;

  border-radius: 11px;

  background:
    linear-gradient(
      135deg,
      #eef2ff,
      #f0fdfa
    );

  border:
    1px solid
    #c7d2fe;

  color: #312e81;

  font-family:
    "Courier New",
    monospace;

  font-size: 13px;

  font-weight: 900;

  letter-spacing: 1.3px;

  word-break: break-all;

  text-align: center;
}

.attendance-code.unavailable {
  background: #f8fafc;

  border-color: #e2e8f0;

  color: #94a3b8;

  letter-spacing: 0.5px;
}

.manual-code-help {
  margin:
    9px auto 0;

  max-width: 230px;

  color: #64748b;

  font-size: 10px;

  line-height: 1.5;
}

.manual-code-help.warning {
  color: #b45309;
}


/* =========================================================
   PERFORATION
========================================================= */

.perforation {
  position: relative;

  height: 1px;

  margin:
    0 32px;

  border-top:
    2px dashed
    #dbe2ea;
}

.perforation span {
  position: absolute;

  top: -12px;

  width: 24px;

  height: 24px;

  border-radius: 50%;

  background: #f4f7fb;

  border:
    1px solid
    #e5e7eb;
}

.perforation span:nth-child(1) {
  left: 0;
}

.perforation span:nth-child(2) {
  left: 14%;
}

.perforation span:nth-child(3) {
  left: 28%;
}

.perforation span:nth-child(4) {
  left: 42%;
}

.perforation span:nth-child(5) {
  left: 56%;
}

.perforation span:nth-child(6) {
  left: 70%;
}

.perforation span:nth-child(7) {
  left: 84%;
}

.perforation span:nth-child(8) {
  right: 0;
}


/* =========================================================
   FOOTER
========================================================= */

.pass-footer {
  display: grid;

  grid-template-columns:
    repeat(
      3,
      1fr
    );

  gap: 20px;

  padding:
    24px 40px;

  background: #f8fafc;
}

.pass-footer > div {
  display: flex;

  flex-direction: column;

  gap: 5px;
}

.footer-label {
  color: #94a3b8;

  font-size: 9px;

  font-weight: 900;

  letter-spacing: 1px;
}

.pass-footer strong {
  color: #1e293b;

  font-size: 12px;

  word-break: break-word;
}

.status-text {
  color: #6366f1 !important;
}

.payment-status {
  color: #16a34a !important;
}


/* =========================================================
   VALIDITY
========================================================= */

.validity-bar {
  padding:
    13px 25px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  background:
    #eef2ff;

  color: #64748b;

  font-size: 11px;

  flex-wrap: wrap;
}

.validity-bar strong {
  color: #3730a3;
}


/* =========================================================
   INSTRUCTIONS
========================================================= */

.pass-instructions {
  margin-top: 22px;

  padding: 24px;

  border-radius: 18px;

  background: white;

  border:
    1px solid
    #e5e7eb;

  box-shadow:
    0 10px 30px
    rgba(15, 23, 42, 0.05);
}

.pass-instructions h3 {
  margin:
    0 0 13px;

  font-size: 16px;

  color: #111827;
}

.pass-instructions ul {
  margin: 0;

  padding-left: 20px;

  color: #64748b;

  font-size: 13px;

  line-height: 1.8;
}


/* =========================================================
   LOADING
========================================================= */

.pass-loading {
  width: min(
    500px,
    calc(100% - 32px)
  );

  margin:
    15vh auto 0;

  padding: 50px 30px;

  background: white;

  border-radius: 24px;

  text-align: center;

  box-shadow:
    0 20px 60px
    rgba(15, 23, 42, 0.1);
}

.loading-spinner {
  width: 45px;

  height: 45px;

  margin:
    0 auto 20px;

  border:
    4px solid
    #e5e7eb;

  border-top-color:
    #6366f1;

  border-radius: 50%;

  animation:
    pass-spin
    0.8s linear infinite;
}

@keyframes pass-spin {

  to {
    transform:
      rotate(360deg);
  }

}

.pass-loading h2 {
  margin:
    0 0 8px;

  font-size: 22px;
}

.pass-loading p {
  margin: 0;

  color: #64748b;

  font-size: 14px;
}


/* =========================================================
   ERROR
========================================================= */

.pass-error-card {
  width: min(
    560px,
    calc(100% - 32px)
  );

  margin:
    10vh auto 0;

  padding: 45px 30px;

  background: white;

  border-radius: 24px;

  text-align: center;

  box-shadow:
    0 20px 60px
    rgba(15, 23, 42, 0.1);
}

.error-icon {
  width: 58px;

  height: 58px;

  margin:
    0 auto 18px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #fef2f2;

  color: #dc2626;

  font-size: 28px;

  font-weight: 900;
}

.pass-error-card h1 {
  margin:
    0 0 10px;

  font-size: 24px;

  color: #111827;
}

.pass-error-card p {
  margin:
    0 auto 25px;

  max-width: 420px;

  color: #64748b;

  font-size: 14px;

  line-height: 1.6;
}

.error-actions {
  display: flex;

  justify-content: center;

  gap: 10px;

  flex-wrap: wrap;
}

.primary-button,
.secondary-button {
  border: none;

  border-radius: 11px;

  padding: 12px 18px;

  font-size: 13px;

  font-weight: 800;

  cursor: pointer;
}

.primary-button {
  background: #111827;

  color: white;
}

.secondary-button {
  background: #f1f5f9;

  color: #334155;
}

.primary-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (
  max-width: 800px
) {

  .pass-body {
    grid-template-columns: 1fr;

    gap: 30px;

    padding: 28px;
  }

  .qr-section {
    order: -1;
  }

  .event-info-grid {
    grid-template-columns: 1fr;
  }

  .pass-footer {
    padding:
      22px 28px;
  }

}


@media (
  max-width: 560px
) {

  .event-pass-page {
    padding-bottom: 30px;
  }

  .pass-topbar {
    width:
      calc(100% - 20px);

    padding:
      14px 0;
  }

  .print-button {
    font-size: 12px;

    padding:
      10px 12px;
  }

  .back-button {
    font-size: 12px;

    padding:
      10px 12px;
  }

  .pass-container {
    width:
      calc(100% - 20px);
  }

  .pass-header {
    padding:
      20px;
  }

  .brand-logo {
    width: 40px;

    height: 40px;

    font-size: 20px;
  }

  .brand-name {
    font-size: 18px;
  }

  .confirmed-badge,
  .pending-badge {
    padding:
      7px 9px;

    font-size: 9px;
  }

  .pass-body {
    padding:
      24px 20px;
  }

  .event-title {
    font-size: 28px;
  }

  .pass-footer {
    grid-template-columns: 1fr;

    gap: 15px;

    padding:
      20px;
  }

  .perforation {
    margin:
      0 20px;
  }

  .attendance-code {
    font-size: 11px;

    letter-spacing: 0.8px;
  }

}


/* =========================================================
   PRINT
========================================================= */

@media print {

  @page {
    size: A4;

    margin: 10mm;
  }

  body {
    background: white !important;
  }

  .event-pass-page {
    background: white !important;

    min-height: auto !important;

    padding: 0 !important;
  }

  .pass-topbar,
  .pass-instructions {
    display: none !important;
  }

  .pass-container {
    width: 100% !important;

    max-width: none !important;

    margin: 0 !important;
  }

  .event-pass-card {
    box-shadow: none !important;

    border:
      1px solid
      #d1d5db !important;

    border-radius: 0 !important;
  }

  .pass-header {
    -webkit-print-color-adjust: exact;

    print-color-adjust: exact;
  }

  .validity-bar {
    -webkit-print-color-adjust: exact;

    print-color-adjust: exact;
  }

  .attendance-code {
    -webkit-print-color-adjust: exact;

    print-color-adjust: exact;
  }

}
`;


// =========================================================
// EXPORT
// =========================================================

export default EventPass;