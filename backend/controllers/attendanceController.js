const pool = require("../config/db");

// =========================================================
// HELPER
// =========================================================

// ---------------------------------------------------------
// GET ADMIN ID
// ---------------------------------------------------------
//
// Your adminMiddleware may store the admin ID differently.
// This helper supports common formats.
//
// If your adminMiddleware uses another property, we can
// adjust this later without changing the attendance logic.
// ---------------------------------------------------------

const getAdminId = (req) => {
  return (
    req.adminId ||
    req.admin?.id ||
    req.admin?.userId ||
    req.userId ||
    null
  );
};


// =========================================================
// HELPER
// =========================================================
// Normalize attendance code
// =========================================================

const normalizeAttendanceCode = (
  code
) => {

  if (!code) {
    return null;
  }

  return String(code)
    .trim()
    .toUpperCase();
};


// =========================================================
// HELPER
// =========================================================
// Normalize QR payload
// =========================================================

const parseQrPayload = (
  qrData
) => {

  if (!qrData) {
    return null;
  }

  // -------------------------------------------------------
  // Already an object
  // -------------------------------------------------------

  if (
    typeof qrData ===
    "object"
  ) {
    return qrData;
  }

  // -------------------------------------------------------
  // JSON string
  // -------------------------------------------------------

  if (
    typeof qrData ===
    "string"
  ) {

    try {

      return JSON.parse(
        qrData
      );

    } catch (error) {

      return null;
    }
  }

  return null;
};


// =========================================================
// HELPER
// =========================================================
// Check event validity
// =========================================================

const checkPassValidity = (
  validFrom,
  validUntil
) => {

  const now =
    new Date();

  // -------------------------------------------------------
  // VALID FROM
  // -------------------------------------------------------

  if (validFrom) {

    const from =
      new Date(
        validFrom
      );

    if (
      !Number.isNaN(
        from.getTime()
      ) &&
      now < from
    ) {

      return {
        valid: false,

        reason:
          "This event pass is not valid yet.",
      };
    }
  }

  // -------------------------------------------------------
  // VALID UNTIL
  // -------------------------------------------------------

  if (validUntil) {

    const until =
      new Date(
        validUntil
      );

    if (
      !Number.isNaN(
        until.getTime()
      ) &&
      now > until
    ) {

      return {
        valid: false,

        reason:
          "This event pass has expired.",
      };
    }
  }

  return {
    valid: true,
    reason: null,
  };
};


// =========================================================
// INTERNAL
// GET / VERIFY BOOKING
// =========================================================
//
// This is the main security validation used by both:
//
// 1. QR scanner
// 2. Manual attendance code
//
// ---------------------------------------------------------
//
// It checks:
//
// - booking exists
// - correct event
// - payment verified
// - booking confirmed
// - event pass exists
// - attendance record exists
// - pass token/code is valid
// - pass validity
// - attendance status
// =========================================================

const getVerifiedAttendanceRecord =
  async ({
    bookingId,
    eventId,
    passToken,
    attendanceCode,
  }) => {

    const values = [];

    const conditions = [
      "b.id = $1",
    ];

    values.push(
      bookingId
    );

    // -------------------------------------------------------
    // EVENT CHECK
    // -------------------------------------------------------

    if (eventId) {

      values.push(
        eventId
      );

      conditions.push(
        `b.event_id = $${values.length}`
      );
    }

    // -------------------------------------------------------
    // QUERY
    // -------------------------------------------------------

    const result =
      await pool.query(
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

          e.id AS event_id,
          e.title AS event_name,
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode,

          p.id AS payment_id,
          p.payment_status,
          p.transaction_id,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at,
          ea.marked_by

        FROM event_bookings b

        INNER JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN event_payments p
          ON p.booking_id = b.id

        LEFT JOIN event_passes ep
          ON ep.booking_id = b.id

        LEFT JOIN event_attendance ea
          ON ea.booking_id = b.id

        WHERE
          ${conditions.join(
            " AND "
          )}

        LIMIT 1
        `,
        values
      );

    // -------------------------------------------------------
    // BOOKING NOT FOUND
    // -------------------------------------------------------

    if (
      result.rows.length ===
      0
    ) {

      return {
        success: false,

        statusCode: 404,

        message:
          "Booking not found.",
      };
    }

    const record =
      result.rows[0];

    // =====================================================
    // PAYMENT VALIDATION
    // =====================================================

    if (
      record.payment_status !==
      "verified"
    ) {

      return {
        success: false,

        statusCode: 403,

        message:
          "Payment has not been verified. Attendance is not allowed.",
      };
    }

    // =====================================================
    // BOOKING VALIDATION
    // =====================================================

    if (
      record.booking_status !==
      "confirmed"
    ) {

      return {
        success: false,

        statusCode: 403,

        message:
          "This booking is not confirmed. Attendance is not allowed.",
      };
    }

    // =====================================================
    // EVENT PASS VALIDATION
    // =====================================================

    if (
      !record.pass_id
    ) {

      return {
        success: false,

        statusCode: 403,

        message:
          "Valid event pass was not found.",
      };
    }

    // =====================================================
    // ATTENDANCE RECORD
    // =====================================================

    if (
      !record.attendance_id
    ) {

      return {
        success: false,

        statusCode: 500,

        message:
          "Attendance record was not generated for this booking.",
      };
    }

    // =====================================================
    // PASS TOKEN VALIDATION
    // =====================================================

    if (passToken) {

      if (
        String(
          record.pass_token
        ) !==
        String(
          passToken
        )
      ) {

        return {
          success: false,

          statusCode: 403,

          message:
            "Invalid event pass QR code.",
        };
      }
    }

    // =====================================================
    // ATTENDANCE CODE VALIDATION
    // =====================================================

    if (attendanceCode) {

      const normalizedCode =
        normalizeAttendanceCode(
          attendanceCode
        );

      if (
        normalizedCode !==
        normalizeAttendanceCode(
          record.attendance_code
        )
      ) {

        return {
          success: false,

          statusCode: 403,

          message:
            "Invalid attendance code.",
        };
      }
    }

    // =====================================================
    // PASS VALIDITY
    // =====================================================

    const validity =
      checkPassValidity(
        record.valid_from,
        record.valid_until
      );

    if (
      !validity.valid
    ) {

      return {
        success: false,

        statusCode: 403,

        message:
          validity.reason,
      };
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return {
      success: true,

      record,
    };
  };


// =========================================================
// VERIFY QR CODE
// POST /api/attendance/verify-qr
// =========================================================
//
// Expected body:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "bookingId": "...",
//     "eventId": "...",
//     "passToken": "...",
//     "attendanceCode": "..."
//   }
// }
//
// OR:
//
// {
//   "qrData": "{\"type\":\"SNICT_EVENT_PASS\",...}"
// }
//
// Optional eventId can also be sent separately.
// =========================================================

const verifyQrCode =
  async (
    req,
    res
  ) => {

    try {

      const {
        qrData,
        eventId:
          requestedEventId,
      } = req.body;

      // =====================================================
      // QR REQUIRED
      // =====================================================

      if (!qrData) {

        return res.status(400).json({

          success: false,

          message:
            "QR code data is required.",
        });
      }

      // =====================================================
      // PARSE QR
      // =====================================================

      const qr =
        parseQrPayload(
          qrData
        );

      if (!qr) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid QR code format.",
        });
      }

      // =====================================================
      // QR TYPE
      // =====================================================

      if (
        qr.type !==
        "SNICT_EVENT_PASS"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "This QR code is not a valid SNICT event pass.",
        });
      }

      // =====================================================
      // BOOKING ID
      // =====================================================

      if (
        !qr.bookingId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Booking information is missing from QR code.",
        });
      }

      // =====================================================
      // EVENT ID
      // =====================================================

      const eventId =
        requestedEventId ||
        qr.eventId ||
        null;

      // =====================================================
      // VERIFY
      // =====================================================

      const verification =
        await getVerifiedAttendanceRecord({
          bookingId:
            qr.bookingId,

          eventId,

          passToken:
            qr.passToken,

          attendanceCode:
            null,
        });

      if (
        !verification.success
      ) {

        return res.status(
          verification.statusCode
        ).json({

          success: false,

          message:
            verification.message,
        });
      }

      const record =
        verification.record;

      // =====================================================
      // EXTRA QR ATTENDANCE CODE CHECK
      // =====================================================
      //
      // The QR contains attendanceCode.
      // We verify it against database too.
      // =====================================================

      if (
        qr.attendanceCode &&
        normalizeAttendanceCode(
          qr.attendanceCode
        ) !==
        normalizeAttendanceCode(
          record.attendance_code
        )
      ) {

        return res.status(403).json({

          success: false,

          message:
            "QR attendance information is invalid.",
        });
      }

      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        record.attendance_status ===
        "present"
      ) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "This attendee has already been marked present.",

          attendee: {

            bookingId:
              record.booking_id,

            bookingCode:
              record.booking_code,

            name:
              record.full_name,

            username:
              record.username,

            email:
              record.email,

            eventId:
              record.event_id,

            eventName:
              record.event_name,

            eventDate:
              record.event_date,

            startTime:
              record.start_time,

            endTime:
              record.end_time,

            venue:
              record.venue,

            attendanceCode:
              record.attendance_code,

            attendanceStatus:
              record.attendance_status,

            markedAt:
              record.marked_at,
          },
        });
      }

      // =====================================================
      // VALID BUT NOT PRESENT
      // =====================================================

      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "QR code verified successfully. Attendee can be marked present.",

        attendee: {

          bookingId:
            record.booking_id,

          bookingCode:
            record.booking_code,

          name:
            record.full_name,

          username:
            record.username,

          email:
            record.email,

          mobile:
            record.mobile,

          profileImage:
            record.profile_image_url,

          eventId:
            record.event_id,

          eventName:
            record.event_name,

          eventDate:
            record.event_date,

          startTime:
            record.start_time,

          endTime:
            record.end_time,

          venue:
            record.venue,

          eventMode:
            record.event_mode,

          passCode:
            record.pass_code,

          attendanceCode:
            record.attendance_code,

          attendanceStatus:
            record.attendance_status,

          validFrom:
            record.valid_from,

          validUntil:
            record.valid_until,
        },
      });

    } catch (error) {

      console.error(
        "Verify QR attendance error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to verify QR code.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// VERIFY MANUAL ATTENDANCE CODE
// POST /api/attendance/verify-code
// =========================================================
//
// Expected body:
//
// {
//   "attendanceCode": "SNICT-ATT-ABC123",
//   "eventId": "..."
// }
//
// QR not scanning? Admin enters this code.
// =========================================================

const verifyAttendanceCode =
  async (
    req,
    res
  ) => {

    try {

      const {
        attendanceCode,
        eventId,
      } = req.body;

      // =====================================================
      // CODE REQUIRED
      // =====================================================

      if (
        !attendanceCode
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Attendance code is required.",
        });
      }

      const normalizedCode =
        normalizeAttendanceCode(
          attendanceCode
        );

      // =====================================================
      // GET ATTENDANCE
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT
            booking_id,
            event_id
          FROM event_attendance
          WHERE attendance_code = $1
          LIMIT 1
          `,
          [
            normalizedCode,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Invalid attendance code.",
        });
      }

      const attendance =
        result.rows[0];

      // =====================================================
      // EVENT CHECK
      // =====================================================

      if (
        eventId &&
        String(
          attendance.event_id
        ) !==
        String(eventId)
      ) {

        return res.status(403).json({

          success: false,

          message:
            "This attendance code belongs to another event.",
        });
      }

      // =====================================================
      // VERIFY BOOKING
      // =====================================================

      const verification =
        await getVerifiedAttendanceRecord({

          bookingId:
            attendance.booking_id,

          eventId:
            eventId ||
            attendance.event_id,

          passToken:
            null,

          attendanceCode:
            normalizedCode,
        });

      if (
        !verification.success
      ) {

        return res.status(
          verification.statusCode
        ).json({

          success: false,

          message:
            verification.message,
        });
      }

      const record =
        verification.record;

      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        record.attendance_status ===
        "present"
      ) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "This attendee has already been marked present.",

          attendee: {

            bookingId:
              record.booking_id,

            bookingCode:
              record.booking_code,

            name:
              record.full_name,

            username:
              record.username,

            email:
              record.email,

            eventId:
              record.event_id,

            eventName:
              record.event_name,

            eventDate:
              record.event_date,

            startTime:
              record.start_time,

            endTime:
              record.end_time,

            venue:
              record.venue,

            attendanceCode:
              record.attendance_code,

            attendanceStatus:
              record.attendance_status,

            markedAt:
              record.marked_at,
          },
        });
      }

      // =====================================================
      // VALID CODE
      // =====================================================

      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "Attendance code verified successfully.",

        attendee: {

          bookingId:
            record.booking_id,

          bookingCode:
            record.booking_code,

          name:
            record.full_name,

          username:
            record.username,

          email:
            record.email,

          mobile:
            record.mobile,

          profileImage:
            record.profile_image_url,

          eventId:
            record.event_id,

          eventName:
            record.event_name,

          eventDate:
            record.event_date,

          startTime:
            record.start_time,

          endTime:
            record.end_time,

          venue:
            record.venue,

          eventMode:
            record.event_mode,

          passCode:
            record.pass_code,

          attendanceCode:
            record.attendance_code,

          attendanceStatus:
            record.attendance_status,

          validFrom:
            record.valid_from,

          validUntil:
            record.valid_until,
        },
      });

    } catch (error) {

      console.error(
        "Verify attendance code error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to verify attendance code.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// MARK ATTENDANCE PRESENT
// POST /api/attendance/:bookingId/mark-present
// =========================================================
//
// Expected body:
//
// {
//   "eventId": "..."
// }
//
// The booking must first pass all validations.
// =========================================================

const markPresent =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const {
        bookingId,
      } = req.params;

      const {
        eventId,
      } = req.body;

      // =====================================================
      // BOOKING ID
      // =====================================================

      if (
        !bookingId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Booking ID is required.",
        });
      }

      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // LOCK ATTENDANCE RECORD
      // =====================================================

      const attendanceResult =
        await client.query(
          `
          SELECT

            ea.*,

            b.booking_code,
            b.user_id,
            b.event_id,
            b.booking_status,

            p.payment_status,

            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,

            e.title AS event_name,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode

          FROM event_attendance ea

          INNER JOIN event_bookings b
            ON b.id = ea.booking_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          WHERE ea.booking_id = $1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
        );

      if (
        attendanceResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          success: false,

          message:
            "Attendance record not found.",
        });
      }

      const record =
        attendanceResult.rows[0];

      // =====================================================
      // EVENT CHECK
      // =====================================================

      if (
        eventId &&
        String(
          record.event_id
        ) !==
        String(eventId)
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({

          success: false,

          message:
            "This booking belongs to another event.",
        });
      }

      // =====================================================
      // PAYMENT CHECK
      // =====================================================

      if (
        record.payment_status !==
        "verified"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({

          success: false,

          message:
            "Payment has not been verified.",
        });
      }

      // =====================================================
      // BOOKING CHECK
      // =====================================================

      if (
        record.booking_status !==
        "confirmed"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({

          success: false,

          message:
            "Booking is not confirmed.",
        });
      }

      // =====================================================
      // PASS CHECK
      // =====================================================

      if (
        !record.pass_code ||
        !record.pass_token
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({

          success: false,

          message:
            "Valid event pass not found.",
        });
      }

      // =====================================================
      // VALIDITY CHECK
      // =====================================================

      const validity =
        checkPassValidity(
          record.valid_from,
          record.valid_until
        );

      if (
        !validity.valid
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({

          success: false,

          message:
            validity.reason,
        });
      }

      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        record.attendance_status ===
        "present"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({

          success: false,

          alreadyPresent:
            true,

          message:
            "Attendance is already marked present.",

          attendee: {

            bookingId:
              record.booking_id,

            bookingCode:
              record.booking_code,

            name:
              record.full_name,

            attendanceCode:
              record.attendance_code,

            attendanceStatus:
              record.attendance_status,

            markedAt:
              record.marked_at,
          },
        });
      }

      // =====================================================
      // ADMIN ID
      // =====================================================

      const adminId =
        getAdminId(req);

      // =====================================================
      // MARK PRESENT
      // =====================================================

      const updateResult =
        await client.query(
          `
          UPDATE event_attendance

          SET

            attendance_status =
              'present',

            marked_at =
              CURRENT_TIMESTAMP,

            marked_by =
              $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE booking_id = $2

          RETURNING *
          `,
          [
            adminId,
            bookingId,
          ]
        );

      if (
        updateResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(500).json({

          success: false,

          message:
            "Unable to mark attendance.",
        });
      }

      await client.query(
        "COMMIT"
      );

      // =====================================================
      // RESPONSE
      // =====================================================

      const updated =
        updateResult.rows[0];

      return res.json({

        success: true,

        message:
          "Attendance marked as present successfully.",

        attendance: {

          id:
            updated.id,

          bookingId:
            record.booking_id,

          bookingCode:
            record.booking_code,

          eventId:
            record.event_id,

          eventName:
            record.event_name,

          attendeeName:
            record.full_name,

          username:
            record.username,

          email:
            record.email,

          attendanceCode:
            updated.attendance_code,

          attendanceStatus:
            updated.attendance_status,

          markedAt:
            updated.marked_at,

          markedBy:
            updated.marked_by,
        },
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
          "Attendance rollback error:",
          rollbackError
        );
      }

      console.error(
        "Mark attendance error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to mark attendance.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });

    } finally {

      client.release();
    }
  };


// =========================================================
// GET EVENT ATTENDANCE
// GET /api/attendance/event/:eventId
// =========================================================
//
// Admin can see all attendees for a specific event.
// =========================================================

const getEventAttendance =
  async (
    req,
    res
  ) => {

    try {

      const {
        eventId,
      } = req.params;

      // =====================================================
      // OPTIONAL SEARCH
      // =====================================================

      const {
        search,
        status,
      } = req.query;

      const values = [
        eventId,
      ];

      const conditions = [
        "ea.event_id = $1",
      ];

      // =====================================================
      // STATUS FILTER
      // =====================================================

      if (
        status ===
        "present" ||
        status ===
        "not_present"
      ) {

        values.push(
          status
        );

        conditions.push(
          `ea.attendance_status = $${values.length}`
        );
      }

      // =====================================================
      // SEARCH
      // =====================================================

      if (
        search &&
        String(search).trim()
      ) {

        values.push(
          `%${String(
            search
          ).trim()}%`
        );

        conditions.push(
          `
          (
            u.full_name ILIKE $${values.length}
            OR u.username ILIKE $${values.length}
            OR u.email ILIKE $${values.length}
            OR b.booking_code ILIKE $${values.length}
            OR ea.attendance_code ILIKE $${values.length}
          )
          `
        );
      }

      // =====================================================
      // QUERY
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT

            ea.id AS attendance_id,

            ea.booking_id,
            ea.event_id,

            ea.attendance_code,
            ea.attendance_status,

            ea.marked_at,
            ea.marked_by,

            ea.created_at,
            ea.updated_at,

            -- BOOKING
            b.booking_code,
            b.amount,
            b.booking_status,

            -- USER
            u.id AS user_id,
            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,

            -- EVENT
            e.title AS event_name,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,

            -- PAYMENT
            p.payment_status,

            -- PASS
            ep.pass_code,
            ep.valid_from,
            ep.valid_until

          FROM event_attendance ea

          INNER JOIN event_bookings b
            ON b.id = ea.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = ea.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          WHERE
            ${conditions.join(
              " AND "
            )}

          ORDER BY
            CASE
              WHEN ea.attendance_status =
                'present'
              THEN 0
              ELSE 1
            END,

            ea.marked_at DESC NULLS LAST,

            u.full_name ASC
          `,
          values
        );

      return res.json({

        success: true,

        eventId,

        total:
          result.rows.length,

        attendance:
          result.rows,
      });

    } catch (error) {

      console.error(
        "Get event attendance error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch event attendance.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// GET EVENT ATTENDANCE STATS
// GET /api/attendance/event/:eventId/stats
// =========================================================

const getEventAttendanceStats =
  async (
    req,
    res
  ) => {

    try {

      const {
        eventId,
      } = req.params;

      // =====================================================
      // GET COUNTS
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT

            COUNT(*)::INTEGER
              AS total,

            COUNT(
              CASE
                WHEN attendance_status =
                  'present'
                THEN 1
              END
            )::INTEGER
              AS present,

            COUNT(
              CASE
                WHEN attendance_status =
                  'not_present'
                THEN 1
              END
            )::INTEGER
              AS not_present

          FROM event_attendance

          WHERE event_id = $1
          `,
          [
            eventId,
          ]
        );

      const stats =
        result.rows[0] || {
          total: 0,
          present: 0,
          not_present: 0,
        };

      // =====================================================
      // NUMERIC VALUES
      // =====================================================

      const total =
        Number(
          stats.total || 0
        );

      const present =
        Number(
          stats.present || 0
        );

      const notPresent =
        Number(
          stats.not_present || 0
        );

      // =====================================================
      // ATTENDANCE PERCENTAGE
      // =====================================================

      const attendancePercentage =
        total > 0
          ? Number(
              (
                (present /
                  total) *
                100
              ).toFixed(2)
            )
          : 0;

      return res.json({

        success: true,

        eventId,

        stats: {

          total,

          present,

          notPresent,

          attendancePercentage,
        },
      });

    } catch (error) {

      console.error(
        "Get attendance stats error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch attendance statistics.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// GET SINGLE ATTENDANCE
// GET /api/attendance/booking/:bookingId
// =========================================================

const getBookingAttendance =
  async (
    req,
    res
  ) => {

    try {

      const {
        bookingId,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT

            ea.id AS attendance_id,

            ea.booking_id,
            ea.event_id,

            ea.attendance_code,
            ea.attendance_status,

            ea.marked_at,
            ea.marked_by,

            ea.created_at,
            ea.updated_at,

            b.booking_code,
            b.booking_status,
            b.amount,

            u.full_name,
            u.username,
            u.email,
            u.mobile,

            e.title AS event_name,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,

            p.payment_status,

            ep.pass_code,
            ep.valid_from,
            ep.valid_until

          FROM event_attendance ea

          INNER JOIN event_bookings b
            ON b.id = ea.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = ea.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          WHERE ea.booking_id = $1

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
            "Attendance record not found.",
        });
      }

      return res.json({

        success: true,

        attendance:
          result.rows[0],
      });

    } catch (error) {

      console.error(
        "Get booking attendance error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch attendance.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  verifyQrCode,

  verifyAttendanceCode,

  markPresent,

  getEventAttendance,

  getEventAttendanceStats,

  getBookingAttendance,

};