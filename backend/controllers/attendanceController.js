const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// ATTENDANCE CONTROLLER
// =========================================================
//
// DOES NOT MODIFY:
// - bookingController.js
// - paymentController.js
//
// Uses:
// - event_bookings
// - event_passes
// - event_attendance
//
// =========================================================


// =========================================================
// HELPER - GENERATE ATTENDANCE CODE
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
// HELPER - DATABASE ERROR
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
    "ATTENDANCE ERROR"
  );

  console.error(
    "Message:",
    error.message
  );

  console.error(
    "Code:",
    error.code
  );

  console.error(
    "Detail:",
    error.detail
  );

  console.error(
    "Hint:",
    error.hint
  );

  console.error(
    "Constraint:",
    error.constraint
  );

  console.error(
    "Table:",
    error.table
  );

  console.error(
    "Column:",
    error.column
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
            error:
              error.message,

            code:
              error.code,

            detail:
              error.detail,

            hint:
              error.hint,

            constraint:
              error.constraint,

            table:
              error.table,

            column:
              error.column,
          }
        : undefined,

  });

};


// =========================================================
// HELPER - GET BOOKING
// =========================================================

const getBooking =
  async (
    client,
    bookingId
  ) => {

    const result =
      await client.query(
        `
        SELECT

          b.id,
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

          e.title AS event_name,
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode

        FROM event_bookings b

        LEFT JOIN users u
          ON u.id = b.user_id

        LEFT JOIN events e
          ON e.id = b.event_id

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
// HELPER - ENSURE ATTENDANCE RECORD
// =========================================================
//
// If attendance does not exist,
// create it.
//
// IMPORTANT:
// This does NOT change payment or booking.
//
// =========================================================

const ensureAttendanceRecord =
  async (
    client,
    bookingId
  ) => {

    const booking =
      await getBooking(
        client,
        bookingId
      );


    if (!booking) {

      return null;

    }


    // =======================================================
    // BOOKING MUST BE CONFIRMED / COMPLETED
    // =======================================================

    if (
      ![
        "confirmed",
        "completed",
      ].includes(
        booking.booking_status
      )
    ) {

      return null;

    }


    // =======================================================
    // EXISTING ATTENDANCE
    // =======================================================

    const existing =
      await client.query(
        `
        SELECT *

        FROM event_attendance

        WHERE booking_id = $1

        LIMIT 1

        FOR UPDATE
        `,
        [
          bookingId,
        ]
      );


    if (
      existing.rows.length > 0
    ) {

      return {

        attendance:
          existing.rows[0],

        booking,

      };

    }


    // =======================================================
    // CREATE UNIQUE ATTENDANCE CODE
    // =======================================================

    let attendanceCode =
      null;


    for (
      let i = 0;
      i < 20;
      i++
    ) {

      const code =
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
            code,
          ]
        );


      if (
        check.rows.length === 0
      ) {

        attendanceCode =
          code;

        break;

      }

    }


    if (!attendanceCode) {

      throw new Error(
        "Unable to generate unique attendance code"
      );

    }


    // =======================================================
    // CREATE ATTENDANCE
    // =======================================================

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
          bookingId,
          booking.event_id,
          attendanceCode,
        ]
      );


    return {

      attendance:
        inserted.rows[0],

      booking,

    };

};


// =========================================================
// HELPER - MARK PRESENT
// =========================================================

const markAttendancePresent =
  async (
    client,
    attendanceId,
    adminId
  ) => {

    const result =
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

        WHERE id = $2

        AND attendance_status =
          'not_present'

        RETURNING *
        `,
        [
          adminId || null,
          attendanceId,
        ]
      );


    return result.rows[0] || null;

};


// =========================================================
// GET ALL ATTENDANCE
// GET /api/attendance/admin
// =========================================================

const getAllAttendance =
  async (
    req,
    res
  ) => {

    try {

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
            b.amount,
            b.booking_status,

            u.id AS user_id,
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

          LEFT JOIN event_bookings b
            ON b.id = ea.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = ea.event_id

          ORDER BY
            ea.created_at DESC
          `
        );


      return res.json({

        success: true,

        attendance:
          result.rows,

        total:
          result.rows.length,

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to fetch attendance",
        error
      );

    }

  };


// =========================================================
// GET EVENT ATTENDANCE
// GET /api/attendance/event/:eventId
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


      const {
        search,
        status,
      } = req.query;


      const values = [
        eventId,
      ];


      let whereClause =
        `
        WHERE ea.event_id = $1
        `;


      // =====================================================
      // STATUS FILTER
      // =====================================================

      if (
        status &&
        [
          "present",
          "not_present",
        ].includes(
          status
        )
      ) {

        values.push(
          status
        );


        whereClause +=
          `
          AND ea.attendance_status =
            $${values.length}
          `;

      }


      // =====================================================
      // SEARCH FILTER
      // =====================================================

      if (
        search &&
        String(
          search
        ).trim()
      ) {

        values.push(
          `%${String(
            search
          ).trim()}%`
        );


        whereClause +=
          `
          AND
          (
            u.full_name ILIKE $${values.length}

            OR u.username ILIKE $${values.length}

            OR u.email ILIKE $${values.length}

            OR u.mobile ILIKE $${values.length}

            OR b.booking_code ILIKE $${values.length}

            OR ea.attendance_code ILIKE $${values.length}
          )
          `;

      }


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

            u.id AS user_id,
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

          LEFT JOIN event_bookings b
            ON b.id = ea.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = ea.event_id

          ${whereClause}

          ORDER BY
            ea.created_at DESC
          `,
          values
        );


      return res.json({

        success: true,

        attendance:
          result.rows,

        total:
          result.rows.length,

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to fetch event attendance",
        error
      );

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


      const row =
        result.rows[0];


      const total =
        Number(
          row.total || 0
        );


      const present =
        Number(
          row.present || 0
        );


      const notPresent =
        Number(
          row.not_present || 0
        );


      const percentage =
        total > 0
          ? Number(
              (
                present /
                total *
                100
              ).toFixed(2)
            )
          : 0;


      return res.json({

        success: true,

        stats: {

          total,

          present,

          notPresent,

          attendancePercentage:
            percentage,

        },

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to fetch attendance statistics",
        error
      );

    }

  };


// =========================================================
// GET BOOKING ATTENDANCE
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

            u.id AS user_id,
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

          LEFT JOIN event_bookings b
            ON b.id = ea.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = ea.event_id

          WHERE ea.booking_id = $1

          LIMIT 1
          `,
          [
            bookingId,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attendance record not found",

        });

      }


      return res.json({

        success: true,

        attendance:
          result.rows[0],

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to fetch booking attendance",
        error
      );

    }

  };


// =========================================================
// MARK PRESENT
// POST /api/attendance/:bookingId/mark-present
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
      } = req.body || {};


      const normalizedBookingId =
        Number(
          bookingId
        );


      if (
        !Number.isInteger(
          normalizedBookingId
        ) ||
        normalizedBookingId <= 0
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


      // =====================================================
      // LOCK BOOKING
      // =====================================================

      const booking =
        await getBooking(
          client,
          normalizedBookingId
        );


      if (!booking) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(404).json({

          success: false,

          message:
            "Booking not found",

        });

      }


      // =====================================================
      // EVENT CHECK
      // =====================================================

      if (
        eventId &&
        Number(eventId) !==
          Number(
            booking.event_id
          )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Booking belongs to another event",

        });

      }


      // =====================================================
      // STATUS CHECK
      // =====================================================

      if (
        ![
          "confirmed",
          "completed",
        ].includes(
          booking.booking_status
        )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Only confirmed bookings can attend the event",

        });

      }


      // =====================================================
      // ENSURE ATTENDANCE
      // =====================================================

      const data =
        await ensureAttendanceRecord(
          client,
          normalizedBookingId
        );


      if (!data) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Unable to create attendance record",

        });

      }


      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        data.attendance
          .attendance_status ===
        "present"
      ) {

        await client.query(
          "COMMIT"
        );


        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked",

          attendance:
            data.attendance,

        });

      }


      // =====================================================
      // MARK PRESENT
      // =====================================================

      const updated =
        await markAttendancePresent(
          client,
          data.attendance.id,
          req.adminId
        );


      await client.query(
        "COMMIT"
      );


      if (!updated) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance was already marked",

        });

      }


      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "Attendance marked successfully",

        attendance:
          updated,

        booking: {

          id:
            booking.id,

          bookingCode:
            booking.booking_code,

          eventId:
            booking.event_id,

          eventName:
            booking.event_name,

          userId:
            booking.user_id,

          fullName:
            booking.full_name,

          email:
            booking.email,

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
          "Rollback error:",
          rollbackError.message
        );

      }


      return sendDatabaseError(
        res,
        "Unable to mark attendance",
        error
      );


    } finally {

      client.release();

    }

  };


// =========================================================
// VERIFY ATTENDANCE CODE
// POST /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXX",
//   "eventId": 5
// }
//
// =========================================================

const verifyAttendanceCode =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      const {
        attendanceCode,
        eventId,
      } = req.body || {};


      if (!attendanceCode) {

        return res.status(400).json({

          success: false,

          message:
            "Attendance code is required",

        });

      }


      const cleanCode =
        String(
          attendanceCode
        )
          .trim()
          .toUpperCase();


      // =====================================================
      // BEGIN
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // FIND ATTENDANCE
      // =====================================================

      const result =
        await client.query(
          `
          SELECT

            ea.id AS attendance_id,
            ea.booking_id,
            ea.event_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at,

            b.booking_code,
            b.booking_status,
            b.amount,

            u.id AS user_id,
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

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = ea.event_id

          WHERE UPPER(
            ea.attendance_code
          ) = $1

          LIMIT 1

          FOR UPDATE
          `,
          [
            cleanCode,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(404).json({

          success: false,

          message:
            "Invalid attendance code",

        });

      }


      const attendance =
        result.rows[0];


      // =====================================================
      // EVENT CHECK
      // =====================================================

      if (
        eventId &&
        Number(eventId) !==
          Number(
            attendance.event_id
          )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Attendance code belongs to another event",

        });

      }


      // =====================================================
      // BOOKING STATUS
      // =====================================================

      if (
        ![
          "confirmed",
          "completed",
        ].includes(
          attendance.booking_status
        )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Booking is not confirmed",

        });

      }


      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        attendance.attendance_status ===
        "present"
      ) {

        await client.query(
          "COMMIT"
        );


        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked",

          attendance,

        });

      }


      // =====================================================
      // MARK PRESENT
      // =====================================================

      const updated =
        await markAttendancePresent(
          client,
          attendance.attendance_id,
          req.adminId
        );


      await client.query(
        "COMMIT"
      );


      if (!updated) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked",

        });

      }


      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "Attendance verified successfully",

        attendance:
          updated,

        attendee: {

          name:
            attendance.full_name,

          username:
            attendance.username,

          email:
            attendance.email,

          mobile:
            attendance.mobile,

          profileImageUrl:
            attendance.profile_image_url,

        },

        event: {

          id:
            attendance.event_id,

          name:
            attendance.event_name,

          date:
            attendance.event_date,

          startTime:
            attendance.start_time,

          endTime:
            attendance.end_time,

          venue:
            attendance.venue,

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
          "Rollback error:",
          rollbackError.message
        );

      }


      return sendDatabaseError(
        res,
        "Unable to verify attendance code",
        error
      );


    } finally {

      client.release();

    }

  };


// =========================================================
// VERIFY EVENT PASS QR
// POST /api/attendance/verify-qr
//
// Supports:
//
// 1. Full Event Pass JSON
//
// {
//   type: "SNICT_EVENT_PASS",
//   bookingId: 20,
//   eventId: 3,
//   passCode: "...",
//   passToken: "..."
// }
//
// 2. Attendance Code
//
// {
//   attendanceCode: "SNICT-ATT-XXXX"
// }
//
// 3. Plain text attendance code
//
// "SNICT-ATT-XXXX"
//
// =========================================================

const verifyQrCode =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      const {
        qrData,
        eventId,
      } = req.body || {};


      if (!qrData) {

        return res.status(400).json({

          success: false,

          message:
            "QR data is required",

        });

      }


      // =====================================================
      // PARSE QR DATA
      // =====================================================

      let data =
        qrData;


      if (
        typeof qrData ===
        "string"
      ) {

        const trimmed =
          qrData.trim();


        // ---------------------------------------------------
        // FIRST TRY JSON
        // ---------------------------------------------------

        try {

          data =
            JSON.parse(
              trimmed
            );

        } catch (
          jsonError
        ) {

          // -------------------------------------------------
          // IF NOT JSON, TREAT AS ATTENDANCE CODE
          // -------------------------------------------------

          data = {

            attendanceCode:
              trimmed,

          };

        }

      }


      // =====================================================
      // IF FRONTEND SENT attendanceCode
      // =====================================================

      if (
        data &&
        data.attendanceCode
      ) {

        const attendanceCode =
          String(
            data.attendanceCode
          )
            .trim()
            .toUpperCase();


        // ---------------------------------------------------
        // PROCESS AS ATTENDANCE CODE
        // ---------------------------------------------------

        await client.query(
          "BEGIN"
        );


        const attendanceResult =
          await client.query(
            `
            SELECT

              ea.id AS attendance_id,
              ea.booking_id,
              ea.event_id,
              ea.attendance_code,
              ea.attendance_status,
              ea.marked_at,

              b.booking_code,
              b.booking_status,
              b.amount,

              u.id AS user_id,
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

            LEFT JOIN users u
              ON u.id = b.user_id

            LEFT JOIN events e
              ON e.id = ea.event_id

            WHERE UPPER(
              ea.attendance_code
            ) = $1

            LIMIT 1

            FOR UPDATE
            `,
            [
              attendanceCode,
            ]
          );


        if (
          attendanceResult.rows.length === 0
        ) {

          await client.query(
            "ROLLBACK"
          );


          return res.status(404).json({

            success: false,

            message:
              "Attendance code not found",

          });

        }


        const attendance =
          attendanceResult.rows[0];


        // ---------------------------------------------------
        // EVENT VALIDATION
        // ---------------------------------------------------

        if (
          eventId &&
          Number(eventId) !==
            Number(
              attendance.event_id
            )
        ) {

          await client.query(
            "ROLLBACK"
          );


          return res.status(400).json({

            success: false,

            message:
              "Attendance code belongs to another event",

          });

        }


        // ---------------------------------------------------
        // BOOKING STATUS
        // ---------------------------------------------------

        if (
          ![
            "confirmed",
            "completed",
          ].includes(
            attendance.booking_status
          )
        ) {

          await client.query(
            "ROLLBACK"
          );


          return res.status(400).json({

            success: false,

            message:
              "Booking is not confirmed",

          });

        }


        // ---------------------------------------------------
        // ALREADY PRESENT
        // ---------------------------------------------------

        if (
          attendance.attendance_status ===
          "present"
        ) {

          await client.query(
            "COMMIT"
          );


          return res.json({

            success: true,

            alreadyPresent:
              true,

            message:
              "Attendance already marked",

            attendance,

          });

        }


        // ---------------------------------------------------
        // MARK PRESENT
        // ---------------------------------------------------

        const updated =
          await markAttendancePresent(
            client,
            attendance.attendance_id,
            req.adminId
          );


        await client.query(
          "COMMIT"
        );


        if (!updated) {

          return res.json({

            success: true,

            alreadyPresent:
              true,

            message:
              "Attendance already marked",

          });

        }


        return res.json({

          success: true,

          alreadyPresent:
            false,

          message:
            "Attendance QR verified successfully",

          attendance:
            updated,

          attendee: {

            name:
              attendance.full_name,

            username:
              attendance.username,

            email:
              attendance.email,

            mobile:
              attendance.mobile,

            profileImageUrl:
              attendance.profile_image_url,

          },

          event: {

            id:
              attendance.event_id,

            name:
              attendance.event_name,

            date:
              attendance.event_date,

            startTime:
              attendance.start_time,

            endTime:
              attendance.end_time,

            venue:
              attendance.venue,

          },

        });

      }


      // =====================================================
      // EVENT PASS QR
      // =====================================================

      const bookingId =
        data.bookingId ||
        data.booking_id;


      const passCode =
        data.passCode ||
        data.pass_code;


      const passToken =
        data.passToken ||
        data.pass_token;


      const qrEventId =
        data.eventId ||
        data.event_id;


      // =====================================================
      // BOOKING ID REQUIRED
      // =====================================================

      if (!bookingId) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid event pass QR",

        });

      }


      // =====================================================
      // QR EVENT VALIDATION
      // =====================================================

      if (
        eventId &&
        qrEventId &&
        Number(eventId) !==
          Number(qrEventId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "QR belongs to another event",

        });

      }


      // =====================================================
      // BEGIN TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // GET PASS
      // =====================================================

      const passResult =
        await client.query(
          `
          SELECT

            ep.id AS pass_id,
            ep.booking_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,

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

            e.title AS event_name,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id = ep.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          WHERE ep.booking_id = $1

          LIMIT 1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
        );


      // =====================================================
      // PASS NOT FOUND
      // =====================================================

      if (
        passResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(404).json({

          success: false,

          message:
            "Event pass not found",

        });

      }


      const pass =
        passResult.rows[0];


      // =====================================================
      // PASS CODE VALIDATION
      // =====================================================

      if (
        passCode &&
        String(
          pass.pass_code
        ).trim() !==
          String(
            passCode
          ).trim()
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(401).json({

          success: false,

          message:
            "Invalid event pass code",

        });

      }


      // =====================================================
      // PASS TOKEN VALIDATION
      // =====================================================

      if (
        passToken &&
        String(
          pass.pass_token
        ).trim() !==
          String(
            passToken
          ).trim()
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(401).json({

          success: false,

          message:
            "Invalid event pass token",

        });

      }


      // =====================================================
      // EVENT VALIDATION
      // =====================================================

      if (
        eventId &&
        Number(eventId) !==
          Number(
            pass.event_id
          )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Pass belongs to another event",

        });

      }


      // =====================================================
      // BOOKING STATUS
      // =====================================================

      if (
        ![
          "confirmed",
          "completed",
        ].includes(
          pass.booking_status
        )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Booking is not confirmed",

        });

      }


      // =====================================================
      // PASS VALIDITY
      // =====================================================

      const now =
        new Date();


      if (
        pass.valid_from &&
        now <
          new Date(
            pass.valid_from
          )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "This event pass is not active yet",

        });

      }


      if (
        pass.valid_until &&
        now >
          new Date(
            pass.valid_until
          )
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "This event pass has expired",

        });

      }


      // =====================================================
      // GET / CREATE ATTENDANCE
      // =====================================================

      const attendanceData =
        await ensureAttendanceRecord(
          client,
          bookingId
        );


      if (!attendanceData) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Unable to create attendance record",

        });

      }


      const attendance =
        attendanceData.attendance;


      // =====================================================
      // ALREADY PRESENT
      // =====================================================

      if (
        attendance.attendance_status ===
        "present"
      ) {

        await client.query(
          "COMMIT"
        );


        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked as present",

          attendance,

          attendee: {

            name:
              pass.full_name,

            username:
              pass.username,

            email:
              pass.email,

            mobile:
              pass.mobile,

            profileImageUrl:
              pass.profile_image_url,

          },

          event: {

            id:
              pass.event_id,

            name:
              pass.event_name,

            date:
              pass.event_date,

            startTime:
              pass.start_time,

            endTime:
              pass.end_time,

            venue:
              pass.venue,

          },

          pass: {

            passCode:
              pass.pass_code,

            bookingCode:
              pass.booking_code,

          },

        });

      }


      // =====================================================
      // MARK PRESENT
      // =====================================================

      const updated =
        await markAttendancePresent(
          client,
          attendance.id,
          req.adminId
        );


      await client.query(
        "COMMIT"
      );


      if (!updated) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked",

        });

      }


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "Event pass verified and attendance marked successfully",

        attendance:
          updated,

        attendee: {

          name:
            pass.full_name,

          username:
            pass.username,

          email:
            pass.email,

          mobile:
            pass.mobile,

          profileImageUrl:
            pass.profile_image_url,

        },

        event: {

          id:
            pass.event_id,

          name:
            pass.event_name,

          date:
            pass.event_date,

          startTime:
            pass.start_time,

          endTime:
            pass.end_time,

          venue:
            pass.venue,

        },

        pass: {

          passCode:
            pass.pass_code,

          bookingCode:
            pass.booking_code,

          validFrom:
            pass.valid_from,

          validUntil:
            pass.valid_until,

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
          rollbackError.message
        );

      }


      return sendDatabaseError(
        res,
        "Unable to verify QR attendance",
        error
      );


    } finally {

      client.release();

    }

  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  getAllAttendance,

  getEventAttendance,

  getEventAttendanceStats,

  getBookingAttendance,

  markPresent,

  verifyAttendanceCode,

  verifyQrCode,

};