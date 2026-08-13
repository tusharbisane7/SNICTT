const pool = require("../config/db");
const crypto = require("crypto");

/*
=========================================================
ATTENDANCE CONTROLLER
=========================================================

Attendance is completely separate from bookingController.

Features:

1. Get all attendance
2. Get attendance by event
3. Get attendance by booking
4. Verify QR
5. Verify manual attendance code
6. Mark present
7. Get attendance statistics

IMPORTANT

Expected database structure:

event_attendance
----------------
id                 UUID / PRIMARY KEY
booking_id         INTEGER
event_id           INTEGER
attendance_code    VARCHAR
attendance_status  VARCHAR
marked_at          TIMESTAMP
marked_by          INTEGER
created_at         TIMESTAMP
updated_at         TIMESTAMP

event_bookings.id  INTEGER
events.id          INTEGER

=========================================================
*/


/* =========================================================
   HELPERS
========================================================= */


/*
---------------------------------------------------------
GENERATE ATTENDANCE CODE
---------------------------------------------------------
*/

const generateAttendanceCode = () => {

  const randomPart =
    crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase();

  return `SNICT-ATT-${randomPart}`;
};


/*
---------------------------------------------------------
DATABASE ERROR
---------------------------------------------------------
*/

const sendDatabaseError = (
  res,
  message,
  error
) => {

  console.error(
    "===================================="
  );

  console.error(
    message
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
    "===================================="
  );


  return res.status(500).json({

    success: false,

    message,

    debug:
      process.env.NODE_ENV !==
      "production"
        ? {
            error:
              error.message,

            code:
              error.code,

            detail:
              error.detail,

            hint:
              error.hint,
          }
        : undefined,
  });
};


/*
---------------------------------------------------------
GET /api/attendance/booking/:bookingId
---------------------------------------------------------

Internal helper.

Creates attendance record if it does
not already exist.
---------------------------------------------------------
*/

const ensureAttendanceRecord =
  async (
    client,
    bookingId
  ) => {

    /*
    -------------------------------------------------------
    GET BOOKING
    -------------------------------------------------------
    */

    const bookingResult =
      await client.query(
        `
        SELECT

          b.id,
          b.booking_code,
          b.user_id,
          b.event_id,
          b.booking_status,

          u.full_name,
          u.username,
          u.email,
          u.mobile,

          e.title AS event_name,
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue

        FROM event_bookings b

        LEFT JOIN users u
          ON u.id = b.user_id

        LEFT JOIN events e
          ON e.id = b.event_id

        WHERE b.id = $1

        LIMIT 1
        `,
        [bookingId]
      );


    if (
      bookingResult.rows.length ===
      0
    ) {

      return null;
    }


    const booking =
      bookingResult.rows[0];


    /*
    -------------------------------------------------------
    CHECK EXISTING ATTENDANCE
    -------------------------------------------------------
    */

    const existingResult =
      await client.query(
        `
        SELECT *

        FROM event_attendance

        WHERE booking_id = $1

        LIMIT 1
        `,
        [bookingId]
      );


    if (
      existingResult.rows.length >
      0
    ) {

      return {

        attendance:
          existingResult.rows[0],

        booking,
      };
    }


    /*
    -------------------------------------------------------
    GENERATE UNIQUE ATTENDANCE CODE
    -------------------------------------------------------
    */

    let attendanceCode =
      null;


    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {

      const generated =
        generateAttendanceCode();


      const check =
        await client.query(
          `
          SELECT id

          FROM event_attendance

          WHERE attendance_code = $1

          LIMIT 1
          `,
          [generated]
        );


      if (
        check.rows.length ===
        0
      ) {

        attendanceCode =
          generated;

        break;
      }
    }


    if (!attendanceCode) {

      throw new Error(
        "Unable to generate unique attendance code"
      );
    }


    /*
    -------------------------------------------------------
    CREATE ATTENDANCE
    -------------------------------------------------------
    */

    const attendanceResult =
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
        attendanceResult.rows[0],

      booking,
    };
  };


/* =========================================================
   GET ALL ATTENDANCE
   GET /api/attendance/admin
========================================================= */

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


            /* BOOKING */

            b.booking_code,

            b.amount,

            b.booking_status,


            /* USER */

            u.id AS user_id,

            u.full_name,

            u.username,

            u.email,

            u.mobile,

            u.profile_image_url,


            /* EVENT */

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


/* =========================================================
   GET ATTENDANCE BY EVENT
   GET /api/attendance/event/:eventId
========================================================= */

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


      /*
      -------------------------------------------------------
      STATUS FILTER
      -------------------------------------------------------
      */

      if (
        status &&
        [
          "present",
          "not_present",
        ].includes(status)
      ) {

        values.push(status);

        whereClause +=
          `
          AND ea.attendance_status = $${values.length}
          `;
      }


      /*
      -------------------------------------------------------
      SEARCH
      -------------------------------------------------------
      */

      if (search) {

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


/* =========================================================
   GET ATTENDANCE BY BOOKING
   GET /api/attendance/booking/:bookingId
========================================================= */

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


          ORDER BY
            ea.created_at DESC


          LIMIT 1
          `,
          [bookingId]
        );


      if (
        result.rows.length ===
        0
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


/* =========================================================
   GET ATTENDANCE STATISTICS
   GET /api/attendance/event/:eventId/stats
========================================================= */

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
          [eventId]
        );


      const stats =
        result.rows[0];


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

        stats: {

          total,

          present,

          notPresent,

          attendancePercentage,
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


/* =========================================================
   MARK PRESENT
   POST /api/attendance/:bookingId/mark-present
========================================================= */

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


      if (!bookingId) {

        return res.status(400).json({

          success: false,

          message:
            "Booking ID is required",
        });
      }


      await client.query(
        "BEGIN"
      );


      /*
      -------------------------------------------------------
      GET BOOKING
      -------------------------------------------------------
      */

      const bookingResult =
        await client.query(
          `
          SELECT

            b.id,

            b.booking_code,

            b.user_id,

            b.event_id,

            b.booking_status,

            u.full_name,

            u.username,

            u.email,

            u.mobile,

            e.title AS event_name,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue


          FROM event_bookings b


          LEFT JOIN users u
            ON u.id = b.user_id


          LEFT JOIN events e
            ON e.id = b.event_id


          WHERE b.id = $1

          LIMIT 1
          `,
          [bookingId]
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


      /*
      -------------------------------------------------------
      OPTIONAL EVENT VALIDATION
      -------------------------------------------------------
      */

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
            "Booking does not belong to this event",
        });
      }


      /*
      -------------------------------------------------------
      BOOKING MUST BE CONFIRMED
      -------------------------------------------------------
      */

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
            "Attendance can only be marked for a confirmed booking",
        });
      }


      /*
      -------------------------------------------------------
      CHECK ATTENDANCE
      -------------------------------------------------------
      */

      let attendanceResult =
        await client.query(
          `
          SELECT *

          FROM event_attendance

          WHERE booking_id = $1

          LIMIT 1
          `,
          [bookingId]
        );


      /*
      -------------------------------------------------------
      CREATE IF MISSING
      -------------------------------------------------------
      */

      if (
        attendanceResult.rows.length ===
        0
      ) {

        const created =
          await ensureAttendanceRecord(
            client,
            bookingId
          );


        if (!created) {

          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({

            success: false,

            message:
              "Unable to create attendance record",
          });
        }


        attendanceResult =
          {
            rows: [
              created.attendance,
            ],
          };
      }


      const attendance =
        attendanceResult.rows[0];


      /*
      -------------------------------------------------------
      ALREADY PRESENT
      -------------------------------------------------------
      */

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
        });
      }


      /*
      -------------------------------------------------------
      MARK PRESENT
      -------------------------------------------------------
      */

      const updated =
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

          RETURNING *
          `,
          [
            req.adminId,
            attendance.id,
          ]
        );


      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Attendance marked as present",

        alreadyPresent:
          false,

        attendance:
          updated.rows[0],

        booking: {

          id:
            booking.id,

          bookingCode:
            booking.booking_code,

          userId:
            booking.user_id,

          fullName:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          eventId:
            booking.event_id,

          eventName:
            booking.event_name,
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
          rollbackError
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


/* =========================================================
   VERIFY ATTENDANCE CODE
   POST /api/attendance/verify-code

   Body:

   {
     "attendanceCode":
       "SNICT-ATT-XXXXXXXXXX",

     "eventId": 5
   }
========================================================= */

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
      } = req.body;


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


      /*
      -------------------------------------------------------
      FIND ATTENDANCE
      -------------------------------------------------------
      */

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


          LEFT JOIN event_bookings b
            ON b.id = ea.booking_id


          LEFT JOIN users u
            ON u.id = b.user_id


          LEFT JOIN events e
            ON e.id = ea.event_id


          WHERE UPPER(
            ea.attendance_code
          ) = $1


          LIMIT 1
          `,
          [cleanCode]
        );


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Invalid attendance code",
        });
      }


      const attendance =
        result.rows[0];


      /*
      -------------------------------------------------------
      EVENT VALIDATION
      -------------------------------------------------------
      */

      if (
        eventId &&
        Number(eventId) !==
          Number(
            attendance.event_id
          )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "This attendance code belongs to another event",
        });
      }


      /*
      -------------------------------------------------------
      BOOKING VALIDATION
      -------------------------------------------------------
      */

      if (
        ![
          "confirmed",
          "completed",
        ].includes(
          attendance.booking_status
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "This booking is not confirmed",
        });
      }


      /*
      -------------------------------------------------------
      ALREADY PRESENT
      -------------------------------------------------------
      */

      if (
        attendance.attendance_status ===
        "present"
      ) {

        return res.json({

          success: true,

          alreadyPresent:
            true,

          message:
            "Attendance already marked as present",

          attendance,
        });
      }


      /*
      -------------------------------------------------------
      MARK PRESENT
      -------------------------------------------------------
      */

      const updated =
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

          RETURNING *
          `,
          [
            req.adminId,
            attendance.attendance_id,
          ]
        );


      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "Attendance verified and marked present",

        attendance:
          updated.rows[0],

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

      return sendDatabaseError(
        res,
        "Unable to verify attendance code",
        error
      );


    } finally {

      client.release();
    }
  };


/* =========================================================
   VERIFY QR CODE
   POST /api/attendance/verify-qr

   Body:

   {
     "qrData": {
       "type": "SNICT_EVENT_PASS",
       "bookingId": 16,
       "eventId": 5,
       "passCode": "...",
       "passToken": "..."
     },

     "eventId": 5
   }
========================================================= */

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
      } = req.body;


      if (!qrData) {

        return res.status(400).json({

          success: false,

          message:
            "QR data is required",
        });
      }


      /*
      -------------------------------------------------------
      PARSE QR DATA
      -------------------------------------------------------
      */

      let data =
        qrData;


      if (
        typeof qrData ===
        "string"
      ) {

        try {

          data =
            JSON.parse(
              qrData
            );

        } catch (
          parseError
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Invalid QR data",
          });
        }
      }


      if (
        data.type &&
        data.type !==
          "SNICT_EVENT_PASS"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid SNICT event QR",
        });
      }


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


      if (!bookingId) {

        return res.status(400).json({

          success: false,

          message:
            "Booking information is missing from QR",
        });
      }


      /*
      -------------------------------------------------------
      EVENT VALIDATION
      -------------------------------------------------------
      */

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


      /*
      -------------------------------------------------------
      GET PASS
      -------------------------------------------------------
      */

      const passResult =
        await client.query(
          `
          SELECT

            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,


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
          `,
          [bookingId]
        );


      if (
        passResult.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Event pass not found",
        });
      }


      const pass =
        passResult.rows[0];


      /*
      -------------------------------------------------------
      PASS CODE VALIDATION
      -------------------------------------------------------
      */

      if (
        passCode &&
        pass.pass_code !==
          passCode
      ) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid event pass",
        });
      }


      /*
      -------------------------------------------------------
      PASS TOKEN VALIDATION
      -------------------------------------------------------
      */

      if (
        passToken &&
        pass.pass_token !==
          passToken
      ) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid event pass token",
        });
      }


      /*
      -------------------------------------------------------
      EVENT VALIDATION
      -------------------------------------------------------
      */

      if (
        eventId &&
        Number(eventId) !==
          Number(
            pass.event_id
          )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "This pass belongs to another event",
        });
      }


      /*
      -------------------------------------------------------
      BOOKING STATUS
      -------------------------------------------------------
      */

      if (
        ![
          "confirmed",
          "completed",
        ].includes(
          pass.booking_status
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "This booking is not confirmed",
        });
      }


      /*
      -------------------------------------------------------
      GET / CREATE ATTENDANCE
      -------------------------------------------------------
      */

      const attendanceData =
        await ensureAttendanceRecord(
          client,
          bookingId
        );


      if (!attendanceData) {

        return res.status(404).json({

          success: false,

          message:
            "Attendance record could not be created",
        });
      }


      const attendance =
        attendanceData.attendance;


      /*
      -------------------------------------------------------
      ALREADY PRESENT
      -------------------------------------------------------
      */

      if (
        attendance.attendance_status ===
        "present"
      ) {

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
        });
      }


      /*
      -------------------------------------------------------
      MARK PRESENT
      -------------------------------------------------------
      */

      const updated =
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

          RETURNING *
          `,
          [
            req.adminId,
            attendance.id,
          ]
        );


      return res.json({

        success: true,

        alreadyPresent:
          false,

        message:
          "QR verified and attendance marked present",

        attendance:
          updated.rows[0],

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


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to verify QR attendance",
        error
      );


    } finally {

      client.release();
    }
  };


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  getAllAttendance,

  getEventAttendance,

  getEventAttendanceStats,

  getBookingAttendance,

  verifyQrCode,

  verifyAttendanceCode,

  markPresent,

};