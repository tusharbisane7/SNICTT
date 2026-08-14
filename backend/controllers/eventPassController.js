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
// IMPORTANT
//
// Booking logic:
// controllers/bookingController.js
//
// Attendance verification logic:
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

const EVENT_PASS_TYPE =
  "SNICT_EVENT_PASS";


// =========================================================
// GENERATE UNIQUE PASS CODE
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
// This is the manual fallback code
// when QR scanning is not possible.
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
    "===================================="
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
    "===================================="
  );

  return res.status(500).json({

    success: false,

    message,

    debug:
      process.env.NODE_ENV !==
      "production"
        ? {
            message:
              error?.message,

            code:
              error?.code,

            detail:
              error?.detail,

            hint:
              error?.hint,

            table:
              error?.table,

            column:
              error?.column,

            constraint:
              error?.constraint,
          }
        : undefined,

  });
};


// =========================================================
// GET BOOKING DETAILS
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
        e.event_date,
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
      [
        bookingId,
      ]
    );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
};


// =========================================================
// ENSURE ATTENDANCE RECORD
//
// IMPORTANT
//
// This is the main fix for:
//
// "manual unique attendance code not showing"
//
// If attendance record exists:
//     reuse it
//
// If attendance record does not exist:
//     generate SNICT-ATT-XXXXXXXXXXXX
//     create record
//
// =========================================================

const ensureAttendanceRecord = async (
  client,
  booking
) => {

  if (!booking) {
    return null;
  }

  if (
    !CONFIRMED_BOOKING_STATUSES.includes(
      booking.booking_status
    )
  ) {
    return null;
  }


  // ---------------------------------------------------------
  // CHECK EXISTING ATTENDANCE
  // ---------------------------------------------------------

  const existing =
    await client.query(
      `
      SELECT *

      FROM event_attendance

      WHERE booking_id = $1

      ORDER BY id DESC

      LIMIT 1

      FOR UPDATE
      `,
      [
        booking.booking_id,
      ]
    );


  if (
    existing.rows.length > 0
  ) {

    return existing.rows[0];

  }


  // ---------------------------------------------------------
  // GENERATE UNIQUE ATTENDANCE CODE
  // ---------------------------------------------------------

  let attendanceCode = null;


  for (
    let i = 0;
    i < 20;
    i++
  ) {

    const generatedCode =
      generateAttendanceCode();


    const check =
      await client.query(
        `
        SELECT id

        FROM event_attendance

        WHERE attendance_code = $1

        LIMIT 1
        `,
        [
          generatedCode,
        ]
      );


    if (
      check.rows.length === 0
    ) {

      attendanceCode =
        generatedCode;

      break;

    }

  }


  if (!attendanceCode) {

    throw new Error(
      "Unable to generate unique attendance code"
    );

  }


  // ---------------------------------------------------------
  // CREATE ATTENDANCE
  // ---------------------------------------------------------

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
// CREATE EVENT PASS
//
// Called by bookingController.confirmPayment()
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
// YES → reuse pass
// NO  → create pass
//       ↓
// Ensure attendance record
//       ↓
// Manual attendance code ready
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


  // ---------------------------------------------------------
  // GET BOOKING
  // ---------------------------------------------------------

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


  // ---------------------------------------------------------
  // PAYMENT CHECK
  // ---------------------------------------------------------

  if (
    booking.payment_status !==
    VERIFIED_PAYMENT_STATUS
  ) {

    return null;

  }


  // ---------------------------------------------------------
  // BOOKING STATUS CHECK
  // ---------------------------------------------------------

  if (
    !CONFIRMED_BOOKING_STATUSES.includes(
      booking.booking_status
    )
  ) {

    return null;

  }


  // ---------------------------------------------------------
  // CHECK EXISTING PASS
  // ---------------------------------------------------------

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
      [
        normalizedBookingId,
      ]
    );


  // ---------------------------------------------------------
  // EXISTING PASS
  // ---------------------------------------------------------

  if (
    existingPassResult.rows.length >
    0
  ) {

    // IMPORTANT:
    // Even when pass already exists,
    // attendance must also exist.

    await ensureAttendanceRecord(
      client,
      booking
    );


    return existingPassResult.rows[0];

  }


  // ---------------------------------------------------------
  // GENERATE UNIQUE PASS CODE
  // ---------------------------------------------------------

  let passCode = null;


  for (
    let i = 0;
    i < 20;
    i++
  ) {

    const generatedCode =
      generatePassCode();


    const check =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_code = $1

        LIMIT 1
        `,
        [
          generatedCode,
        ]
      );


    if (
      check.rows.length === 0
    ) {

      passCode =
        generatedCode;

      break;

    }

  }


  if (!passCode) {

    throw new Error(
      "Unable to generate unique event pass code"
    );

  }


  // ---------------------------------------------------------
  // GENERATE PASS TOKEN
  // ---------------------------------------------------------

  let passToken = null;


  for (
    let i = 0;
    i < 20;
    i++
  ) {

    const generatedToken =
      generatePassToken();


    const check =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_token = $1

        LIMIT 1
        `,
        [
          generatedToken,
        ]
      );


    if (
      check.rows.length === 0
    ) {

      passToken =
        generatedToken;

      break;

    }

  }


  if (!passToken) {

    throw new Error(
      "Unable to generate unique event pass token"
    );

  }


  // ---------------------------------------------------------
  // EVENT DATE
  // ---------------------------------------------------------

  const eventDate =
    booking.event_date
      ?.toString()
      .slice(
        0,
        10
      );


  if (!eventDate) {

    throw new Error(
      "Event date is missing while creating event pass"
    );

  }


  // ---------------------------------------------------------
  // EVENT TIME
  // ---------------------------------------------------------

  const startTime =
    booking.start_time
      ?.toString()
      .slice(
        0,
        8
      ) ||
    "00:00:00";


  const endTime =
    booking.end_time
      ?.toString()
      .slice(
        0,
        8
      ) ||
    "23:59:59";


  // ---------------------------------------------------------
  // PASS VALIDITY
  // Asia/Kolkata
  // ---------------------------------------------------------

  const validFrom =
    `${eventDate}T${startTime}+05:30`;


  const validUntil =
    `${eventDate}T${endTime}+05:30`;


  // ---------------------------------------------------------
  // INSERT EVENT PASS
  // ---------------------------------------------------------

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


  // ---------------------------------------------------------
  // PASS CREATED
  // ---------------------------------------------------------

  if (
    passResult.rows.length >
    0
  ) {

    finalPass =
      passResult.rows[0];

  } else {

    // -------------------------------------------------------
    // ANOTHER REQUEST CREATED IT
    // -------------------------------------------------------

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
        [
          normalizedBookingId,
        ]
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


  // ---------------------------------------------------------
  // IMPORTANT FIX
  //
  // CREATE ATTENDANCE AFTER PASS CREATION
  // ---------------------------------------------------------

  await ensureAttendanceRecord(
    client,
    booking
  );


  return finalPass;
};


// =========================================================
// BUILD QR DATA
//
// QR contains BOTH:
//
// 1. Event pass credentials
// 2. Attendance code
//
// So scanner can verify the pass and attendance.
// =========================================================

const buildQrData = (
  pass
) => {

  return {

    type:
      EVENT_PASS_TYPE,

    version:
      1,

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

    // IMPORTANT
    // Manual attendance fallback
    attendanceCode:
      pass.attendance_code ??
      null,

  };
};


// =========================================================
// GET MY EVENT PASS
//
// GET /api/event-passes/booking/:bookingId
//
// ALSO compatible with:
//
// GET /api/bookings/:id/pass
//
// depending on route configuration.
//
// =========================================================

const getMyPass = async (
  req,
  res
) => {

  const client =
    await pool.connect();


  try {

    const userId =
      req.userId;


    const bookingId =
      Number(
        req.params.bookingId ??
        req.params.id
      );


    // -------------------------------------------------------
    // AUTH
    // -------------------------------------------------------

    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "User authentication required",

      });

    }


    // -------------------------------------------------------
    // BOOKING ID
    // -------------------------------------------------------

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


    await client.query(
      "BEGIN"
    );


    // -------------------------------------------------------
    // GET OWN BOOKING
    // -------------------------------------------------------

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
          e.event_date,
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


    // -------------------------------------------------------
    // PAYMENT
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // BOOKING STATUS
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // GET / CREATE EVENT PASS
    // -------------------------------------------------------

    let passResult =
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
        [
          bookingId,
        ]
      );


    let pass;


    if (
      passResult.rows.length >
      0
    ) {

      pass =
        passResult.rows[0];

    } else {

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


    // -------------------------------------------------------
    // IMPORTANT FIX
    //
    // ALWAYS ENSURE ATTENDANCE
    //
    // This fixes missing manual code for
    // old event passes.
    // -------------------------------------------------------

    const attendance =
      await ensureAttendanceRecord(
        client,
        booking
      );


    // -------------------------------------------------------
    // FINAL PASS OBJECT
    // -------------------------------------------------------

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


      // -----------------------------------------------------
      // ATTENDANCE
      // -----------------------------------------------------

      attendance_id:
        attendance?.id ??
        null,

      attendance_event_id:
        attendance?.event_id ??
        booking.event_id,

      attendance_code:
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
        Boolean(
          attendance
        ),

      status:
        "valid",

    };


    // -------------------------------------------------------
    // QR DATA
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // COMMIT
    // -------------------------------------------------------

    await client.query(
      "COMMIT"
    );


    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({

      success: true,

      message:
        "Event pass loaded successfully",

      pass:
        finalPass,

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
          e.event_date,
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
// GET /api/event-passes/admin/booking/:bookingId
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
            e.event_date,
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
          [
            bookingId,
          ]
        );


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


      const qrData =
        buildQrData(
          pass
        );


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

  // PASS CREATION
  createEventPass,

  // USER
  getMyPass,

  // ADMIN
  getAdminPasses,
  getAdminPassByBookingId,

};