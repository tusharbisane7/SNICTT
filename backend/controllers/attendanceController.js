const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// HELPERS
// =========================================================

const generateAttendanceCode = () => {
  const randomPart = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SNICT-ATT-${randomPart}`;
};


// =========================================================
// FIND BOOKING + USER + EVENT + PASS
// =========================================================
//
// This query intentionally uses INTEGER relationships:
//
// event_bookings.id       -> INTEGER
// event_bookings.event_id -> INTEGER
// event_bookings.user_id  -> INTEGER
//
// =========================================================

const getBookingDetails = async (
  bookingId
) => {

  const result =
    await pool.query(
      `
      SELECT

        b.id AS booking_id,
        b.booking_code,
        b.event_id,
        b.user_id,
        b.amount AS booking_amount,
        b.booking_status,
        b.created_at AS booking_created_at,

        u.full_name,
        u.username,
        u.email,
        u.mobile,
        u.profile_image_url,
        u.age,
        u.sex,
        u.blood_group,
        u.designation,

        e.title AS event_title,
        e.event_type,
        e.description AS event_description,
        e.doctor_name,
        e.specialization,
        e.event_date,
        e.start_time,
        e.end_time,
        e.venue,
        e.event_mode,
        e.price AS event_price,

        ep.id AS pass_id,
        ep.pass_code,
        ep.pass_token,
        ep.valid_from,
        ep.valid_until,

        payment.payment_status,
        payment.payment_method,
        payment.transaction_id,
        payment.amount AS payment_amount

      FROM event_bookings b

      INNER JOIN users u
        ON u.id = b.user_id

      INNER JOIN events e
        ON e.id = b.event_id

      LEFT JOIN event_passes ep
        ON ep.booking_id = b.id

      LEFT JOIN LATERAL (
        SELECT
          p.payment_status,
          p.payment_method,
          p.transaction_id,
          p.amount

        FROM event_payments p

        WHERE p.booking_id = b.id

        ORDER BY
          p.created_at DESC

        LIMIT 1
      ) payment
        ON TRUE

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
// GET /api/attendance/booking/:bookingId
// ADMIN
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

      if (
        !bookingId ||
        !/^\d+$/.test(
          String(bookingId)
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID",
        });
      }

      const booking =
        await getBookingDetails(
          Number(bookingId)
        );

      if (!booking) {

        return res.status(404).json({
          success: false,
          message:
            "Booking not found",
        });
      }

      const attendanceResult =
        await pool.query(
          `
          SELECT
            id,
            booking_id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by,
            created_at,
            updated_at

          FROM event_attendance

          WHERE booking_id = $1

          LIMIT 1
          `,
          [
            Number(bookingId),
          ]
        );

      const attendance =
        attendanceResult.rows[0] ||
        null;

      return res.json({

        success: true,

        booking: {
          id:
            booking.booking_id,

          bookingCode:
            booking.booking_code,

          bookingStatus:
            booking.booking_status,

          amount:
            Number(
              booking.booking_amount || 0
            ),
        },

        user: {
          id:
            booking.user_id,

          fullName:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          profileImageUrl:
            booking.profile_image_url,

          age:
            booking.age,

          sex:
            booking.sex,

          bloodGroup:
            booking.blood_group,

          designation:
            booking.designation,
        },

        event: {
          id:
            booking.event_id,

          title:
            booking.event_title,

          eventType:
            booking.event_type,

          description:
            booking.event_description,

          doctorName:
            booking.doctor_name,

          specialization:
            booking.specialization,

          eventDate:
            booking.event_date,

          startTime:
            booking.start_time,

          endTime:
            booking.end_time,

          venue:
            booking.venue,

          eventMode:
            booking.event_mode,

          price:
            Number(
              booking.event_price || 0
            ),
        },

        pass: {
          id:
            booking.pass_id,

          passCode:
            booking.pass_code,

          validFrom:
            booking.valid_from,

          validUntil:
            booking.valid_until,
        },

        payment: {
          status:
            booking.payment_status ||
            null,

          method:
            booking.payment_method ||
            null,

          transactionId:
            booking.transaction_id ||
            null,

          amount:
            booking.payment_amount !==
            null
              ? Number(
                  booking.payment_amount
                )
              : null,
        },

        attendance,

      });

    } catch (error) {

      console.error(
        "Get booking attendance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch booking attendance",
      });
    }
  };


// =========================================================
// INTERNAL - MARK ATTENDANCE
// =========================================================

const markBookingPresent =
  async ({
    booking,
    adminId,
  }) => {

    // =====================================================
    // BOOKING STATUS
    // =====================================================

    if (
      booking.booking_status !==
      "confirmed"
    ) {

      return {
        success: false,

        status: 400,

        message:
          "Booking is not confirmed",
      };
    }


    // =====================================================
    // PAYMENT STATUS
    // =====================================================

    if (
      booking.payment_status !==
      "verified"
    ) {

      return {
        success: false,

        status: 400,

        message:
          "Payment has not been verified",
      };
    }


    // =====================================================
    // PASS REQUIRED
    // =====================================================

    if (
      !booking.pass_id
    ) {

      return {
        success: false,

        status: 400,

        message:
          "Event pass has not been generated",
      };
    }


    // =====================================================
    // CHECK PASS VALIDITY
    // =====================================================

    const now =
      new Date();

    if (
      booking.valid_from &&
      now <
        new Date(
          booking.valid_from
        )
    ) {

      return {
        success: false,

        status: 400,

        message:
          "Event pass is not valid yet",
      };
    }

    if (
      booking.valid_until &&
      now >
        new Date(
          booking.valid_until
        )
    ) {

      return {
        success: false,

        status: 400,

        message:
          "Event pass has expired",
      };
    }


    // =====================================================
    // CHECK EXISTING ATTENDANCE
    // =====================================================

    const existingResult =
      await pool.query(
        `
        SELECT
          id,
          booking_id,
          event_id,
          attendance_code,
          attendance_status,
          marked_at,
          marked_by

        FROM event_attendance

        WHERE booking_id = $1

        LIMIT 1
        `,
        [
          booking.booking_id,
        ]
      );

    if (
      existingResult.rows.length >
      0
    ) {

      const existing =
        existingResult.rows[0];

      if (
        existing.attendance_status ===
        "present"
      ) {

        return {
          success: false,

          status: 409,

          alreadyPresent: true,

          message:
            "Attendance has already been marked",

          attendance:
            existing,
        };
      }
    }


    // =====================================================
    // ATTENDANCE CODE
    // =====================================================

    let attendanceCode =
      existingResult.rows[0]
        ?.attendance_code ||
      null;

    if (
      !attendanceCode
    ) {

      attendanceCode =
        generateAttendanceCode();
    }


    // =====================================================
    // INSERT / UPDATE
    // =====================================================

    let result;

    if (
      existingResult.rows.length >
      0
    ) {

      result =
        await pool.query(
          `
          UPDATE event_attendance

          SET
            attendance_status = 'present',

            marked_at =
              CURRENT_TIMESTAMP,

            marked_by = $1,

            updated_at =
              CURRENT_TIMESTAMP,

            attendance_code = $2

          WHERE booking_id = $3

          RETURNING *
          `,
          [
            adminId,

            attendanceCode,

            booking.booking_id,
          ]
        );

    } else {

      result =
        await pool.query(
          `
          INSERT INTO event_attendance
          (
            booking_id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by,
            created_at,
            updated_at
          )

          VALUES
          (
            $1,
            $2,
            $3,
            'present',
            CURRENT_TIMESTAMP,
            $4,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )

          RETURNING *
          `,
          [
            booking.booking_id,

            booking.event_id,

            attendanceCode,

            adminId,
          ]
        );
    }


    return {
      success: true,

      status: 200,

      message:
        "Attendance marked successfully",

      attendance:
        result.rows[0],
    };
  };


// =========================================================
// 1. VERIFY QR CODE
// POST /api/attendance/verify-qr
// =========================================================
//
// Body:
//
// {
//   "qrData": {
//      "type": "SNICT_EVENT_PASS",
//      "passToken": "..."
//   },
//   "eventId": 123
// }
//
// =========================================================

const verifyQrCode =
  async (
    req,
    res
  ) => {

    try {

      const {
        qrData,
        eventId,
      } = req.body;


      // =====================================================
      // VALIDATE QR DATA
      // =====================================================

      if (!qrData) {

        return res.status(400).json({
          success: false,
          message:
            "QR data is required",
        });
      }


      let parsedQr =
        qrData;


      // =====================================================
      // SUPPORT STRING QR DATA
      // =====================================================

      if (
        typeof qrData ===
        "string"
      ) {

        try {

          parsedQr =
            JSON.parse(
              qrData
            );

        } catch (
          parseError
        ) {

          // If QR contains raw pass token
          parsedQr = {
            passToken:
              qrData.trim(),
          };
        }
      }


      const passToken =
        String(
          parsedQr?.passToken ||
            parsedQr?.token ||
            ""
        ).trim();


      if (!passToken) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid QR code: pass token missing",
        });
      }


      // =====================================================
      // FIND PASS
      // =====================================================

      const passResult =
        await pool.query(
          `
          SELECT
            booking_id

          FROM event_passes

          WHERE pass_token = $1

          LIMIT 1
          `,
          [
            passToken,
          ]
        );


      if (
        passResult.rows.length ===
        0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Invalid or unknown event pass",
        });
      }


      const bookingId =
        passResult.rows[0]
          .booking_id;


      // =====================================================
      // GET COMPLETE BOOKING
      // =====================================================

      const booking =
        await getBookingDetails(
          bookingId
        );


      if (!booking) {

        return res.status(404).json({
          success: false,
          message:
            "Booking associated with this pass was not found",
        });
      }


      // =====================================================
      // EVENT VALIDATION
      // =====================================================

      if (
        eventId !==
          undefined &&
        eventId !==
          null &&
        String(
          booking.event_id
        ) !==
          String(eventId)
      ) {

        return res.status(400).json({
          success: false,
          message:
            "This pass belongs to another event",
        });
      }


      // =====================================================
      // TOKEN VALIDATION
      // =====================================================

      if (
        booking.pass_token !==
        passToken
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid event pass token",
        });
      }


      // =====================================================
      // MARK PRESENT
      // =====================================================

      const attendance =
        await markBookingPresent({
          booking,
          adminId:
            req.adminId,
        });


      if (
        !attendance.success
      ) {

        return res.status(
          attendance.status
        ).json({
          success: false,

          message:
            attendance.message,

          alreadyPresent:
            attendance.alreadyPresent ||
            false,

          attendance:
            attendance.attendance ||
            null,
        });
      }


      return res.json({

        success: true,

        message:
          "QR verified and attendance marked successfully",

        booking: {
          id:
            booking.booking_id,

          bookingCode:
            booking.booking_code,

          status:
            booking.booking_status,
        },

        user: {
          id:
            booking.user_id,

          fullName:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          profileImageUrl:
            booking.profile_image_url,
        },

        event: {
          id:
            booking.event_id,

          title:
            booking.event_title,

          eventDate:
            booking.event_date,

          startTime:
            booking.start_time,

          endTime:
            booking.end_time,

          venue:
            booking.venue,
        },

        attendance:
          attendance.attendance,

      });

    } catch (error) {

      console.error(
        "Verify QR error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify QR code",
      });
    }
  };


// =========================================================
// 2. VERIFY ATTENDANCE CODE
// POST /api/attendance/verify-code
// =========================================================
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXX",
//   "eventId": 123
// }
//
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


      if (
        !attendanceCode
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Attendance code is required",
        });
      }


      const normalizedCode =
        String(
          attendanceCode
        )
          .trim()
          .toUpperCase();


      // =====================================================
      // FIND ATTENDANCE
      // =====================================================

      const attendanceResult =
        await pool.query(
          `
          SELECT
            booking_id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by

          FROM event_attendance

          WHERE UPPER(
            attendance_code
          ) = $1

          LIMIT 1
          `,
          [
            normalizedCode,
          ]
        );


      if (
        attendanceResult.rows.length ===
        0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Invalid attendance code",
        });
      }


      const attendanceRecord =
        attendanceResult.rows[0];


      // =====================================================
      // EVENT VALIDATION
      // =====================================================

      if (
        eventId !==
          undefined &&
        eventId !==
          null &&
        String(
          attendanceRecord.event_id
        ) !==
          String(eventId)
      ) {

        return res.status(400).json({
          success: false,
          message:
            "This attendance code belongs to another event",
        });
      }


      // =====================================================
      // GET BOOKING
      // =====================================================

      const booking =
        await getBookingDetails(
          attendanceRecord.booking_id
        );


      if (!booking) {

        return res.status(404).json({
          success: false,
          message:
            "Booking not found",
        });
      }


      // =====================================================
      // MARK PRESENT
      // =====================================================

      const attendance =
        await markBookingPresent({
          booking,
          adminId:
            req.adminId,
        });


      if (
        !attendance.success
      ) {

        return res.status(
          attendance.status
        ).json({

          success: false,

          message:
            attendance.message,

          alreadyPresent:
            attendance.alreadyPresent ||
            false,

          attendance:
            attendance.attendance ||
            null,
        });
      }


      return res.json({

        success: true,

        message:
          "Attendance code verified and attendance marked successfully",

        booking: {
          id:
            booking.booking_id,

          bookingCode:
            booking.booking_code,

          status:
            booking.booking_status,
        },

        user: {
          id:
            booking.user_id,

          fullName:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          profileImageUrl:
            booking.profile_image_url,
        },

        event: {
          id:
            booking.event_id,

          title:
            booking.event_title,

          eventDate:
            booking.event_date,

          startTime:
            booking.start_time,

          endTime:
            booking.end_time,

          venue:
            booking.venue,
        },

        attendance:
          attendance.attendance,
      });

    } catch (error) {

      console.error(
        "Verify attendance code error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify attendance code",
      });
    }
  };


// =========================================================
// 3. MARK PRESENT MANUALLY
// POST /api/attendance/:bookingId/mark-present
// =========================================================
//
// Body:
//
// {
//   "eventId": 123
// }
//
// =========================================================

const markPresent =
  async (
    req,
    res
  ) => {

    try {

      const {
        bookingId,
      } = req.params;

      const {
        eventId,
      } = req.body;


      if (
        !bookingId ||
        !/^\d+$/.test(
          String(bookingId)
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID",
        });
      }


      const booking =
        await getBookingDetails(
          Number(bookingId)
        );


      if (!booking) {

        return res.status(404).json({
          success: false,
          message:
            "Booking not found",
        });
      }


      // =====================================================
      // EVENT VALIDATION
      // =====================================================

      if (
        eventId !==
          undefined &&
        eventId !==
          null &&
        String(
          booking.event_id
        ) !==
          String(eventId)
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Booking belongs to another event",
        });
      }


      const attendance =
        await markBookingPresent({
          booking,
          adminId:
            req.adminId,
        });


      if (
        !attendance.success
      ) {

        return res.status(
          attendance.status
        ).json({

          success: false,

          message:
            attendance.message,

          alreadyPresent:
            attendance.alreadyPresent ||
            false,

          attendance:
            attendance.attendance ||
            null,
        });
      }


      return res.json({

        success: true,

        message:
          "Attendance marked successfully",

        booking: {
          id:
            booking.booking_id,

          bookingCode:
            booking.booking_code,

          status:
            booking.booking_status,
        },

        user: {
          id:
            booking.user_id,

          fullName:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          profileImageUrl:
            booking.profile_image_url,
        },

        event: {
          id:
            booking.event_id,

          title:
            booking.event_title,

          eventDate:
            booking.event_date,

          startTime:
            booking.start_time,

          endTime:
            booking.end_time,

          venue:
            booking.venue,
        },

        attendance:
          attendance.attendance,
      });

    } catch (error) {

      console.error(
        "Mark present error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to mark attendance",
      });
    }
  };


// =========================================================
// 4. GET EVENT ATTENDANCE
// GET /api/attendance/event/:eventId
// =========================================================
//
// Optional:
//
// ?search=tushar
// ?status=present
// ?status=not_present
//
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


      if (
        !eventId ||
        !/^\d+$/.test(
          String(eventId)
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid event ID",
        });
      }


      const numericEventId =
        Number(eventId);


      // =====================================================
      // STATUS VALIDATION
      // =====================================================

      let attendanceStatus =
        null;

      if (
        status &&
        [
          "present",
          "not_present",
        ].includes(
          String(status)
            .toLowerCase()
        )
      ) {

        attendanceStatus =
          String(status)
            .toLowerCase();
      }


      const result =
        await pool.query(
          `
          SELECT

            ea.id,
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
            b.amount AS booking_amount,

            u.id AS user_id,
            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,
            u.age,
            u.sex,
            u.blood_group,
            u.designation

          FROM event_attendance ea

          INNER JOIN event_bookings b
            ON b.id = ea.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          WHERE ea.event_id = $1

          AND (
            $2::TEXT IS NULL

            OR
            ea.attendance_status =
              $2
          )

          AND (
            $3::TEXT IS NULL

            OR
            LOWER(
              u.full_name
            ) LIKE LOWER(
              '%' || $3 || '%'
            )

            OR
            LOWER(
              u.username
            ) LIKE LOWER(
              '%' || $3 || '%'
            )

            OR
            LOWER(
              u.email
            ) LIKE LOWER(
              '%' || $3 || '%'
            )

            OR
            LOWER(
              u.mobile
            ) LIKE LOWER(
              '%' || $3 || '%'
            )

            OR
            LOWER(
              b.booking_code
            ) LIKE LOWER(
              '%' || $3 || '%'
            )

            OR
            LOWER(
              ea.attendance_code
            ) LIKE LOWER(
              '%' || $3 || '%'
            )
          )

          ORDER BY
            CASE
              WHEN ea.attendance_status =
                'present'
              THEN 0
              ELSE 1
            END,

            ea.marked_at DESC NULLS LAST,

            ea.created_at DESC
          `,
          [
            numericEventId,

            attendanceStatus,

            search
              ? String(search).trim()
              : null,
          ]
        );


      return res.json({

        success: true,

        eventId:
          numericEventId,

        total:
          result.rows.length,

        attendance:
          result.rows.map(
            (row) => ({
              id:
                row.id,

              bookingId:
                row.booking_id,

              eventId:
                row.event_id,

              attendanceCode:
                row.attendance_code,

              attendanceStatus:
                row.attendance_status,

              markedAt:
                row.marked_at,

              markedBy:
                row.marked_by,

              createdAt:
                row.created_at,

              updatedAt:
                row.updated_at,

              booking: {
                id:
                  row.booking_id,

                bookingCode:
                  row.booking_code,

                status:
                  row.booking_status,

                amount:
                  Number(
                    row.booking_amount ||
                      0
                  ),
              },

              user: {
                id:
                  row.user_id,

                fullName:
                  row.full_name,

                username:
                  row.username,

                email:
                  row.email,

                mobile:
                  row.mobile,

                profileImageUrl:
                  row.profile_image_url,

                age:
                  row.age,

                sex:
                  row.sex,

                bloodGroup:
                  row.blood_group,

                designation:
                  row.designation,
              },
            })
          ),
      });

    } catch (error) {

      console.error(
        "Get event attendance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch event attendance",
      });
    }
  };


// =========================================================
// 5. GET EVENT ATTENDANCE STATS
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


      if (
        !eventId ||
        !/^\d+$/.test(
          String(eventId)
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid event ID",
        });
      }


      const numericEventId =
        Number(eventId);


      // =====================================================
      // TOTAL CONFIRMED BOOKINGS
      // =====================================================

      const bookingResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::INTEGER AS total

          FROM event_bookings

          WHERE event_id = $1

          AND booking_status =
            'confirmed'
          `,
          [
            numericEventId,
          ]
        );


      // =====================================================
      // ATTENDANCE COUNTS
      // =====================================================

      const attendanceResult =
        await pool.query(
          `
          SELECT

            COUNT(*)::INTEGER AS attendance_records,

            COUNT(
              CASE
                WHEN attendance_status =
                  'present'
                THEN 1
              END
            )::INTEGER AS present

          FROM event_attendance

          WHERE event_id = $1
          `,
          [
            numericEventId,
          ]
        );


      const total =
        Number(
          bookingResult.rows[0]
            .total || 0
        );

      const present =
        Number(
          attendanceResult.rows[0]
            .present || 0
        );

      const notPresent =
        Math.max(
          total - present,
          0
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

        eventId:
          numericEventId,

        stats: {

          total,

          present,

          notPresent,

          attendancePercentage,

          attendanceRecords:
            Number(
              attendanceResult
                .rows[0]
                .attendance_records ||
                0
            ),
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
          "Unable to fetch attendance statistics",
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