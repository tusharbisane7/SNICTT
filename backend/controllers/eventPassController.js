const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// EVENT PASS CONTROLLER
// SNICT
// =========================================================
//
// RESPONSIBILITIES
//
// - Create event pass
// - Reuse existing event pass
// - Get user's event pass
// - Get admin event passes
// - Get admin pass by booking ID
// - Generate secure pass code
// - Generate secure pass token
// - Generate attendance code
// - Create/reuse attendance record
// - Generate QR payload
//
// BOOKING LOGIC:
// controllers/bookingController.js
//
// ATTENDANCE VERIFICATION:
// controllers/attendanceController.js
//
// =========================================================


// =========================================================
// CONSTANTS
// =========================================================

const CONFIRMED_BOOKING_STATUSES = [
  "confirmed",
  "completed",
];

const VERIFIED_PAYMENT_STATUS = "verified";

const EVENT_PASS_TYPE = "SNICT_EVENT_PASS";


// =========================================================
// GENERATE UNIQUE PASS CODE
//
// Example:
//
// SNICT-PASS-A1B2C3D4E5
// =========================================================

const generatePassCode = () => {
  return (
    "SNICT-PASS-" +
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase()
  );
};


// =========================================================
// GENERATE SECURE PASS TOKEN
// =========================================================

const generatePassToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};


// =========================================================
// GENERATE ATTENDANCE CODE
//
// Example:
//
// SNICT-ATT-A1B2C3D4E5F6
//
// Manual fallback when QR scanning
// is not possible.
// =========================================================

const generateAttendanceCode = () => {
  return (
    "SNICT-ATT-" +
    crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase()
  );
};


// =========================================================
// DATABASE ERROR HANDLER
// =========================================================

const sendDatabaseError = (
  res,
  message,
  error
) => {
  console.error(
    "======================================"
  );

  console.error(
    "EVENT PASS ERROR"
  );

  console.error(
    "Message:",
    error?.message
  );

  console.error(
    "Code:",
    error?.code
  );

  console.error(
    "Detail:",
    error?.detail
  );

  console.error(
    "Hint:",
    error?.hint
  );

  console.error(
    "Table:",
    error?.table
  );

  console.error(
    "Column:",
    error?.column
  );

  console.error(
    "Constraint:",
    error?.constraint
  );

  console.error(
    "======================================"
  );

  return res.status(500).json({
    success: false,

    message,

    debug:
      process.env.NODE_ENV !== "production"
        ? {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            hint: error?.hint,
            table: error?.table,
            column: error?.column,
            constraint: error?.constraint,
          }
        : undefined,
  });
};


// =========================================================
// GET BOOKING DETAILS
//
// IMPORTANT
//
// event_date is converted directly in PostgreSQL:
//
// TO_CHAR(e.event_date, 'YYYY-MM-DD')
//
// This prevents:
//
// Sat Aug 29
//
// timestamp errors.
// =========================================================

const getBookingDetails = async (
  client,
  bookingId
) => {
  const result =
    await client.query(
      `
      SELECT

        b.id AS booking_id,
        b.booking_code,
        b.user_id,
        b.event_id,
        b.amount,
        b.booking_status,

        u.full_name,
        u.username,
        u.email,
        u.mobile,
        u.profile_image_url,

        e.title AS event_title,
        e.event_type,
        e.description,
        e.doctor_name,
        e.specialization,

        TO_CHAR(
          e.event_date,
          'YYYY-MM-DD'
        ) AS event_date,

        e.start_time,
        e.end_time,
        e.venue,
        e.event_mode,
        e.image_url,

        p.id AS payment_id,
        p.payment_status,
        p.transaction_id,
        p.payment_method,
        p.amount AS payment_amount

      FROM event_bookings b

      INNER JOIN users u
        ON u.id = b.user_id

      INNER JOIN events e
        ON e.id = b.event_id

      LEFT JOIN LATERAL (

        SELECT
          id,
          payment_status,
          transaction_id,
          payment_method,
          amount

        FROM event_payments

        WHERE booking_id = b.id

        ORDER BY id DESC

        LIMIT 1

      ) p ON TRUE

      WHERE b.id = $1

      LIMIT 1
      `,
      [bookingId]
    );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
};


// =========================================================
// GET ATTENDANCE RECORD
// =========================================================

const getAttendanceRecord = async (
  client,
  bookingId
) => {
  const result =
    await client.query(
      `
      SELECT *

      FROM event_attendance

      WHERE booking_id = $1

      ORDER BY id DESC

      LIMIT 1

      FOR UPDATE
      `,
      [bookingId]
    );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
};


// =========================================================
// GENERATE UNIQUE ATTENDANCE CODE
// =========================================================

const createUniqueAttendanceCode = async (
  client
) => {
  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    const attendanceCode =
      generateAttendanceCode();

    const result =
      await client.query(
        `
        SELECT id

        FROM event_attendance

        WHERE attendance_code = $1

        LIMIT 1
        `,
        [attendanceCode]
      );

    if (
      result.rows.length === 0
    ) {
      return attendanceCode;
    }
  }

  throw new Error(
    "Unable to generate unique attendance code"
  );
};


// =========================================================
// ENSURE ATTENDANCE RECORD
//
// IMPORTANT:
//
// This function handles ALL cases:
//
// 1. No attendance record
//    -> create record + code
//
// 2. Attendance exists with code
//    -> reuse it
//
// 3. Attendance exists without code
//    -> generate code + update it
//
// This fixes old bookings/event passes where
// attendance_code was NULL.
// =========================================================

const ensureAttendanceRecord = async (
  client,
  booking
) => {
  if (!booking) {
    return null;
  }

  // -------------------------------------------------------
  // Attendance is required only for confirmed/completed
  // bookings.
  // -------------------------------------------------------

  if (
    !CONFIRMED_BOOKING_STATUSES.includes(
      booking.booking_status
    )
  ) {
    return null;
  }

  // -------------------------------------------------------
  // GET EXISTING ATTENDANCE
  // -------------------------------------------------------

  const existing =
    await getAttendanceRecord(
      client,
      booking.booking_id
    );

  // -------------------------------------------------------
  // EXISTING RECORD
  // -------------------------------------------------------

  if (existing) {
    // -----------------------------------------------------
    // Existing record already has attendance code
    // -----------------------------------------------------

    if (
      existing.attendance_code
    ) {
      return existing;
    }

    // -----------------------------------------------------
    // Existing record has NO attendance code
    //
    // Generate one now.
    // -----------------------------------------------------

    const attendanceCode =
      await createUniqueAttendanceCode(
        client
      );

    const updated =
      await client.query(
        `
        UPDATE event_attendance

        SET
          attendance_code = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING *
        `,
        [
          attendanceCode,
          existing.id,
        ]
      );

    return (
      updated.rows[0] ||
      existing
    );
  }

  // =======================================================
  // CREATE NEW ATTENDANCE RECORD
  // =======================================================

  const attendanceCode =
    await createUniqueAttendanceCode(
      client
    );

  const inserted =
    await client.query(
      `
      INSERT INTO event_attendance
      (
        booking_id,
        event_id,
        attendance_code,
        attendance_status,
        created_at,
        updated_at
      )

      VALUES
      (
        $1,
        $2,
        $3,
        'not_present',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )

      RETURNING *
      `,
      [
        booking.booking_id,
        booking.event_id,
        attendanceCode,
      ]
    );

  return (
    inserted.rows[0] ||
    null
  );
};


// =========================================================
// GENERATE UNIQUE PASS CODE
// =========================================================

const createUniquePassCode = async (
  client
) => {
  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    const passCode =
      generatePassCode();

    const result =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_code = $1

        LIMIT 1
        `,
        [passCode]
      );

    if (
      result.rows.length === 0
    ) {
      return passCode;
    }
  }

  throw new Error(
    "Unable to generate unique event pass code"
  );
};


// =========================================================
// GENERATE UNIQUE PASS TOKEN
// =========================================================

const createUniquePassToken = async (
  client
) => {
  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    const passToken =
      generatePassToken();

    const result =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_token = $1

        LIMIT 1
        `,
        [passToken]
      );

    if (
      result.rows.length === 0
    ) {
      return passToken;
    }
  }

  throw new Error(
    "Unable to generate unique event pass token"
  );
};


// =========================================================
// FORMAT TIME
//
// PostgreSQL TIME may be returned as:
//
// 11:36:00
//
// Sometimes frontend/database values may be:
//
// 11:36
//
// This normalizes everything to:
//
// HH:MM:SS
// =========================================================

const formatTime = (
  value,
  fallback
) => {
  if (!value) {
    return fallback;
  }

  // -------------------------------------------------------
  // String
  // -------------------------------------------------------

  if (
    typeof value === "string"
  ) {
    const trimmed =
      value.trim();

    // HH:MM
    if (
      /^\d{2}:\d{2}$/.test(
        trimmed
      )
    ) {
      return `${trimmed}:00`;
    }

    // HH:MM:SS
    if (
      /^\d{2}:\d{2}:\d{2}$/.test(
        trimmed
      )
    ) {
      return trimmed;
    }

    // ISO datetime
    const parsed =
      new Date(trimmed);

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return [
        String(
          parsed.getHours()
        ).padStart(2, "0"),

        String(
          parsed.getMinutes()
        ).padStart(2, "0"),

        String(
          parsed.getSeconds()
        ).padStart(2, "0"),
      ].join(":");
    }

    return fallback;
  }

  // -------------------------------------------------------
  // Date object
  // -------------------------------------------------------

  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return fallback;
    }

    return [
      String(
        value.getHours()
      ).padStart(2, "0"),

      String(
        value.getMinutes()
      ).padStart(2, "0"),

      String(
        value.getSeconds()
      ).padStart(2, "0"),
    ].join(":");
  }

  return fallback;
};


// =========================================================
// CREATE EVENT PASS
//
// Called from bookingController.confirmPayment()
//
// Flow:
//
// Payment verified
//       ↓
// Booking confirmed
//       ↓
// createEventPass()
//       ↓
// Existing pass?
//       ↓
// YES → reuse
// NO  → create
//       ↓
// Ensure attendance
//       ↓
// Attendance code available
//
// =========================================================

const createEventPass = async (
  client,
  bookingId
) => {
  const normalizedBookingId =
    Number(bookingId);

  if (
    !Number.isInteger(
      normalizedBookingId
    ) ||
    normalizedBookingId <= 0
  ) {
    throw new Error(
      "Invalid booking ID while creating event pass"
    );
  }

  // =======================================================
  // GET BOOKING
  // =======================================================

  const booking =
    await getBookingDetails(
      client,
      normalizedBookingId
    );

  if (!booking) {
    throw new Error(
      "Booking not found while creating event pass"
    );
  }

  // =======================================================
  // PAYMENT CHECK
  // =======================================================

  if (
    booking.payment_status !==
    VERIFIED_PAYMENT_STATUS
  ) {
    return null;
  }

  // =======================================================
  // BOOKING STATUS CHECK
  // =======================================================

  if (
    !CONFIRMED_BOOKING_STATUSES.includes(
      booking.booking_status
    )
  ) {
    return null;
  }

  // =======================================================
  // CHECK EXISTING PASS
  // =======================================================

  const existingPassResult =
    await client.query(
      `
      SELECT

        id,
        booking_id,
        pass_code,
        pass_token,
        valid_from,
        valid_until,
        created_at

      FROM event_passes

      WHERE booking_id = $1

      ORDER BY id DESC

      LIMIT 1
      `,
      [normalizedBookingId]
    );

  // =======================================================
  // EXISTING PASS
  // =======================================================

  if (
    existingPassResult.rows.length >
    0
  ) {
    // Make sure old pass also has attendance record/code.
    await ensureAttendanceRecord(
      client,
      booking
    );

    return existingPassResult.rows[0];
  }

  // =======================================================
  // UNIQUE PASS CODE
  // =======================================================

  const passCode =
    await createUniquePassCode(
      client
    );

  // =======================================================
  // UNIQUE PASS TOKEN
  // =======================================================

  const passToken =
    await createUniquePassToken(
      client
    );

  // =======================================================
  // EVENT DATE
  //
  // getBookingDetails() already returns:
  //
  // YYYY-MM-DD
  //
  // =======================================================

  const eventDate =
    booking.event_date;

  if (
    !eventDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      eventDate
    )
  ) {
    throw new Error(
      `Invalid event date while creating event pass: ${eventDate}`
    );
  }

  // =======================================================
  // EVENT TIME
  // =======================================================

  const startTime =
    formatTime(
      booking.start_time,
      "00:00:00"
    );

  const endTime =
    formatTime(
      booking.end_time,
      "23:59:59"
    );

  // =======================================================
  // PASS VALIDITY
  //
  // Asia/Kolkata
  //
  // Example:
  //
  // 2026-08-29T11:36:00+05:30
  //
  // =======================================================

  const validFrom =
    `${eventDate}T${startTime}+05:30`;

  const validUntil =
    `${eventDate}T${endTime}+05:30`;

  console.log(
    "🎫 Creating event pass:",
    {
      bookingId:
        normalizedBookingId,

      eventDate,

      startTime,

      endTime,

      validFrom,

      validUntil,
    }
  );

  // =======================================================
  // INSERT PASS
  // =======================================================

  const passResult =
    await client.query(
      `
      INSERT INTO event_passes
      (
        booking_id,
        pass_code,
        pass_token,
        valid_from,
        valid_until
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )

      ON CONFLICT (booking_id)

      DO NOTHING

      RETURNING

        id,
        booking_id,
        pass_code,
        pass_token,
        valid_from,
        valid_until,
        created_at
      `,
      [
        normalizedBookingId,
        passCode,
        passToken,
        validFrom,
        validUntil,
      ]
    );

  let finalPass;

  // =======================================================
  // PASS CREATED
  // =======================================================

  if (
    passResult.rows.length >
    0
  ) {
    finalPass =
      passResult.rows[0];
  } else {
    // =====================================================
    // PASS WAS CREATED BY ANOTHER REQUEST
    // =====================================================

    const existing =
      await client.query(
        `
        SELECT

          id,
          booking_id,
          pass_code,
          pass_token,
          valid_from,
          valid_until,
          created_at

        FROM event_passes

        WHERE booking_id = $1

        ORDER BY id DESC

        LIMIT 1
        `,
        [normalizedBookingId]
      );

    if (
      existing.rows.length ===
      0
    ) {
      throw new Error(
        "Event pass could not be created"
      );
    }

    finalPass =
      existing.rows[0];
  }

  // =======================================================
  // ENSURE ATTENDANCE
  // =======================================================

  await ensureAttendanceRecord(
    client,
    booking
  );

  return finalPass;
};


// =========================================================
// BUILD QR DATA
//
// QR contains:
//
// - Event pass information
// - Booking information
// - Attendance code
//
// Frontend should encode:
//
// JSON.stringify(pass.qr_data)
//
// OR:
//
// pass.qr_payload
//
// =========================================================

const buildQrData = (
  pass
) => {
  return {
    type: EVENT_PASS_TYPE,

    version: 1,

    passId:
      pass.pass_id ??
      pass.id ??
      null,

    passCode:
      pass.pass_code ??
      null,

    passToken:
      pass.pass_token ??
      null,

    bookingId:
      pass.booking_id ??
      null,

    bookingCode:
      pass.booking_code ??
      null,

    userId:
      pass.user_id ??
      null,

    userName:
      pass.full_name ??
      null,

    eventId:
      pass.event_id ??
      null,

    eventName:
      pass.event_title ??
      pass.event_name ??
      null,

    eventDate:
      pass.event_date ??
      null,

    startTime:
      pass.start_time ??
      null,

    endTime:
      pass.end_time ??
      null,

    venue:
      pass.venue ??
      null,

    eventMode:
      pass.event_mode ??
      null,

    validFrom:
      pass.valid_from ??
      null,

    validUntil:
      pass.valid_until ??
      null,

    // =====================================================
    // ATTENDANCE
    // =====================================================

    attendanceCode:
      pass.attendance_code ??
      pass.manual_attendance_code ??
      null,

    manualAttendanceCode:
      pass.manual_attendance_code ??
      pass.attendance_code ??
      null,
  };
};


// =========================================================
// BUILD FINAL USER PASS
// =========================================================

const buildFinalPass = (
  booking,
  pass,
  attendance
) => {
  const finalPass = {
    id:
      pass.pass_id ??
      pass.id,

    pass_id:
      pass.pass_id ??
      pass.id,

    booking_id:
      booking.booking_id,

    booking_code:
      booking.booking_code,

    pass_code:
      pass.pass_code,

    pass_token:
      pass.pass_token,

    valid_from:
      pass.valid_from,

    valid_until:
      pass.valid_until,

    pass_created_at:
      pass.pass_created_at ??
      pass.created_at,

    // =====================================================
    // USER
    // =====================================================

    user_id:
      booking.user_id,

    full_name:
      booking.full_name,

    username:
      booking.username,

    email:
      booking.email,

    mobile:
      booking.mobile,

    profile_image_url:
      booking.profile_image_url,

    // =====================================================
    // EVENT
    // =====================================================

    event_id:
      booking.event_id,

    event_title:
      booking.event_title,

    event_name:
      booking.event_title,

    event_type:
      booking.event_type,

    description:
      booking.description,

    doctor_name:
      booking.doctor_name,

    specialization:
      booking.specialization,

    event_date:
      booking.event_date,

    start_time:
      booking.start_time,

    end_time:
      booking.end_time,

    venue:
      booking.venue,

    event_mode:
      booking.event_mode,

    image_url:
      booking.image_url,

    // =====================================================
    // PAYMENT / BOOKING
    // =====================================================

    amount:
      booking.amount,

    payment_amount:
      booking.payment_amount,

    payment_status:
      booking.payment_status,

    transaction_id:
      booking.transaction_id,

    payment_method:
      booking.payment_method,

    booking_status:
      booking.booking_status,

    // =====================================================
    // ATTENDANCE
    // =====================================================

    attendance_id:
      attendance?.id ??
      null,

    attendance_event_id:
      attendance?.event_id ??
      booking.event_id,

    attendance_code:
      attendance?.attendance_code ??
      null,

    manual_attendance_code:
      attendance?.attendance_code ??
      null,

    attendance_status:
      attendance?.attendance_status ??
      "not_present",

    attendance_marked_at:
      attendance?.marked_at ??
      null,

    attendance_marked_by:
      attendance?.marked_by ??
      null,

    attendance_required:
      true,

    has_attendance:
      Boolean(attendance),

    status: "valid",
  };

  // =======================================================
  // QR
  // =======================================================

  const qrData =
    buildQrData(
      finalPass
    );

  finalPass.qr_data =
    qrData;

  finalPass.qr_payload =
    JSON.stringify(
      qrData
    );

  return finalPass;
};


// =========================================================
// GET MY EVENT PASS
//
// GET:
//
// /api/event-passes/booking/:bookingId
//
// Also compatible with:
//
// /api/bookings/:id/pass
//
// =========================================================

const getMyPass = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  try {
    // =====================================================
    // USER ID
    // =====================================================

    const userId =
      req.userId;

    // =====================================================
    // BOOKING ID
    // =====================================================

    const bookingId =
      Number(
        req.params.bookingId ??
        req.params.id
      );

    // =====================================================
    // AUTH
    // =====================================================

    if (
      userId === undefined ||
      userId === null ||
      userId === ""
    ) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // =====================================================
    // BOOKING ID VALIDATION
    // =====================================================

    if (
      !Number.isInteger(
        bookingId
      ) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID",
      });
    }

    // =====================================================
    // BEGIN TRANSACTION
    // =====================================================

    await client.query(
      "BEGIN"
    );

    // =====================================================
    // GET USER'S BOOKING
    // =====================================================

    const bookingResult =
      await client.query(
        `
        SELECT

          b.id AS booking_id,
          b.booking_code,
          b.user_id,
          b.event_id,
          b.amount,
          b.booking_status,

          u.full_name,
          u.username,
          u.email,
          u.mobile,
          u.profile_image_url,

          e.title AS event_title,
          e.event_type,
          e.description,
          e.doctor_name,
          e.specialization,

          TO_CHAR(
            e.event_date,
            'YYYY-MM-DD'
          ) AS event_date,

          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode,
          e.image_url,

          p.id AS payment_id,
          p.payment_status,
          p.transaction_id,
          p.payment_method,
          p.amount AS payment_amount

        FROM event_bookings b

        INNER JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN LATERAL (

          SELECT

            id,
            payment_status,
            transaction_id,
            payment_method,
            amount

          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1

        ) p ON TRUE

        WHERE b.id = $1

        AND b.user_id = $2

        LIMIT 1
        `,
        [
          bookingId,
          userId,
        ]
      );

    // =====================================================
    // BOOKING NOT FOUND
    // =====================================================

    if (
      bookingResult.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    const booking =
      bookingResult.rows[0];

    // =====================================================
    // PAYMENT CHECK
    // =====================================================

    if (
      booking.payment_status !==
      VERIFIED_PAYMENT_STATUS
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,

        message:
          "Event pass is available only after payment is verified.",

        payment_status:
          booking.payment_status ||
          "pending",

        booking_status:
          booking.booking_status,
      });
    }

    // =====================================================
    // BOOKING STATUS CHECK
    // =====================================================

    if (
      !CONFIRMED_BOOKING_STATUSES.includes(
        booking.booking_status
      )
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,

        message:
          "Booking is not confirmed yet.",

        booking_status:
          booking.booking_status,
      });
    }

    // =====================================================
    // GET EXISTING PASS
    // =====================================================

    const passResult =
      await client.query(
        `
        SELECT

          id AS pass_id,
          booking_id,
          pass_code,
          pass_token,
          valid_from,
          valid_until,
          created_at AS pass_created_at

        FROM event_passes

        WHERE booking_id = $1

        ORDER BY id DESC

        LIMIT 1
        `,
        [bookingId]
      );

    let pass;

    // =====================================================
    // EXISTING PASS
    // =====================================================

    if (
      passResult.rows.length >
      0
    ) {
      pass =
        passResult.rows[0];
    } else {
      // ===================================================
      // CREATE PASS
      // ===================================================

      pass =
        await createEventPass(
          client,
          bookingId
        );

      if (!pass) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to generate event pass",
        });
      }
    }

    // =====================================================
    // ALWAYS ENSURE ATTENDANCE
    // =====================================================

    const attendance =
      await ensureAttendanceRecord(
        client,
        booking
      );

    // =====================================================
    // BUILD FINAL PASS
    // =====================================================

    const finalPass =
      buildFinalPass(
        booking,
        pass,
        attendance
      );

    // =====================================================
    // COMMIT
    // =====================================================

    await client.query(
      "COMMIT"
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        "Event pass loaded successfully",

      pass: finalPass,
    });
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch (
      rollbackError
    ) {
      console.error(
        "Event pass rollback error:",
        rollbackError.message
      );
    }

    return sendDatabaseError(
      res,
      "Unable to fetch event pass",
      error
    );
  } finally {
    client.release();
  }
};


// =========================================================
// ADMIN - GET ALL EVENT PASSES
//
// GET /api/event-passes/admin
// =========================================================

const getAdminPasses = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(
        `
        SELECT

          ep.id AS pass_id,
          ep.booking_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,

          b.booking_code,
          b.event_id,
          b.user_id,
          b.amount,
          b.booking_status,
          b.created_at AS booking_created_at,

          u.full_name,
          u.username,
          u.email,
          u.mobile,
          u.profile_image_url,

          e.title AS event_title,
          e.event_type,
          e.description,
          e.doctor_name,
          e.specialization,

          TO_CHAR(
            e.event_date,
            'YYYY-MM-DD'
          ) AS event_date,

          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode,
          e.image_url,

          p.id AS payment_id,
          p.transaction_id,
          p.payment_method,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_by,
          p.verified_at,

          ea.id AS attendance_id,
          ea.event_id AS attendance_event_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

        FROM event_passes ep

        INNER JOIN event_bookings b
          ON b.id = ep.booking_id

        INNER JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN LATERAL (

          SELECT *

          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1

        ) p ON TRUE

        LEFT JOIN LATERAL (

          SELECT *

          FROM event_attendance

          WHERE booking_id = b.id

          ORDER BY created_at DESC

          LIMIT 1

        ) ea ON TRUE

        ORDER BY
          ep.created_at DESC
        `
      );

    // =====================================================
    // MAKE SURE OLD PASSES HAVE ATTENDANCE
    // =====================================================

    const passes =
      result.rows.map(
        (pass) => {
          const qrData =
            buildQrData(
              pass
            );

          return {
            ...pass,

            qr_data:
              qrData,

            qr_payload:
              JSON.stringify(
                qrData
              ),

            attendance_required:
              true,

            has_attendance:
              Boolean(
                pass.attendance_id
              ),

            attendance_code:
              pass.attendance_code ??
              null,

            manual_attendance_code:
              pass.attendance_code ??
              null,

            attendance_status:
              pass.attendance_status ||
              "not_present",

            status:
              "valid",
          };
        }
      );

    return res.status(200).json({
      success: true,

      passes,

      total:
        passes.length,
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      "Unable to fetch event passes",
      error
    );
  }
};


// =========================================================
// ADMIN - GET PASS BY BOOKING ID
//
// Supports:
//
// /api/event-passes/admin/booking/:bookingId
//
// and:
//
// /api/event-passes/admin/:id/pass
//
// =========================================================

const getAdminPassByBookingId =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.bookingId ??
          req.params.id
        );

      // ===================================================
      // VALIDATE ID
      // ===================================================

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID",
        });
      }

      // ===================================================
      // GET PASS
      // ===================================================

      const result =
        await pool.query(
          `
          SELECT

            ep.id AS pass_id,
            ep.booking_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at AS pass_created_at,

            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount,
            b.booking_status,

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,

            e.title AS event_title,
            e.event_type,
            e.description,
            e.doctor_name,
            e.specialization,

            TO_CHAR(
              e.event_date,
              'YYYY-MM-DD'
            ) AS event_date,

            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.image_url,

            p.id AS payment_id,
            p.transaction_id,
            p.payment_method,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,

            ea.id AS attendance_id,
            ea.event_id AS attendance_event_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id = ep.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (

            SELECT *

            FROM event_payments

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1

          ) p ON TRUE

          LEFT JOIN LATERAL (

            SELECT *

            FROM event_attendance

            WHERE booking_id = b.id

            ORDER BY created_at DESC

            LIMIT 1

          ) ea ON TRUE

          WHERE ep.booking_id = $1

          LIMIT 1
          `,
          [bookingId]
        );

      // ===================================================
      // NOT FOUND
      // ===================================================

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Event pass not found for this booking",
        });
      }

      const pass =
        result.rows[0];

      // ===================================================
      // QR DATA
      // ===================================================

      const qrData =
        buildQrData(
          pass
        );

      // ===================================================
      // RESPONSE
      // ===================================================

      return res.status(200).json({
        success: true,

        pass: {
          ...pass,

          qr_data:
            qrData,

          qr_payload:
            JSON.stringify(
              qrData
            ),

          attendance_required:
            true,

          has_attendance:
            Boolean(
              pass.attendance_id
            ),

          attendance_code:
            pass.attendance_code ??
            null,

          manual_attendance_code:
            pass.attendance_code ??
            null,

          attendance_status:
            pass.attendance_status ||
            "not_present",

          status:
            "valid",
        },
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        "Unable to fetch event pass",
        error
      );
    }
  };


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

  // =======================================================
  // PASS CREATION
  // =======================================================

  createEventPass,

  // =======================================================
  // USER
  // =======================================================

  getMyPass,

  // =======================================================
  // ADMIN
  // =======================================================

  getAdminPasses,

  getAdminPassByBookingId,
};