const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// EVENT PASS CONTROLLER
// SNICT
// =========================================================
//
// RESPONSIBILITIES
//
// - Generate event pass
// - Reuse existing event pass
// - Get user's event pass
// - Get all admin event passes
// - Get admin pass by booking ID
// - Generate secure pass code
// - Generate secure pass token
// - Generate QR payload
//
// IMPORTANT
//
// Booking logic stays in:
// controllers/bookingController.js
//
// Attendance logic stays in:
// controllers/attendanceController.js
//
// =========================================================


// =========================================================
// HELPERS
// =========================================================


// ---------------------------------------------------------
// GENERATE UNIQUE PASS CODE
// Example:
// SNICT-PASS-A1B2C3D4E5
// ---------------------------------------------------------

const generatePassCode = () => {
  return `SNICT-PASS-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


// ---------------------------------------------------------
// GENERATE SECURE PASS TOKEN
// ---------------------------------------------------------

const generatePassToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
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
    "Table:",
    error.table
  );

  console.error(
    "Column:",
    error.column
  );

  console.error(
    "Constraint:",
    error.constraint
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
              error.message,

            code:
              error.code,

            detail:
              error.detail,

            hint:
              error.hint,

            table:
              error.table,

            column:
              error.column,

            constraint:
              error.constraint,
          }
        : undefined,

  });
};


// =========================================================
// CREATE EVENT PASS
// =========================================================
//
// This function is used by:
// bookingController.confirmPayment()
//
// Flow:
//
// payment verified
//       ↓
// booking confirmed
//       ↓
// createEventPass()
//       ↓
// existing pass?
//       ↓
// YES → return existing pass
// NO  → generate new pass
//
// =========================================================

const createEventPass = async (
  client,
  bookingId
) => {

  // =======================================================
  // VALIDATE BOOKING ID
  // =======================================================

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

    throw new Error(
      "Invalid booking ID while creating event pass"
    );
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
      [
        normalizedBookingId,
      ]
    );


  // =======================================================
  // EXISTING PASS FOUND
  // =======================================================

  if (
    existingPassResult.rows.length >
    0
  ) {

    console.log(
      `Existing event pass found for booking ${normalizedBookingId}`
    );


    return existingPassResult.rows[0];
  }


  // =======================================================
  // GET BOOKING + USER + EVENT + PAYMENT
  // =======================================================

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
        normalizedBookingId,
      ]
    );


  // =======================================================
  // BOOKING NOT FOUND
  // =======================================================

  if (
    bookingResult.rows.length ===
    0
  ) {

    throw new Error(
      "Booking not found while creating event pass"
    );
  }


  const booking =
    bookingResult.rows[0];


  // =======================================================
  // PAYMENT MUST BE VERIFIED
  // =======================================================

  if (
    booking.payment_status !==
    "verified"
  ) {

    return null;
  }


  // =======================================================
  // BOOKING MUST BE CONFIRMED
  // OR COMPLETED
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
  // GENERATE UNIQUE PASS CODE
  // =======================================================

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
      check.rows.length ===
      0
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


  // =======================================================
  // GENERATE UNIQUE PASS TOKEN
  // =======================================================

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
      check.rows.length ===
      0
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


  // =======================================================
  // EVENT DATE
  // =======================================================

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


  // =======================================================
  // EVENT START TIME
  // =======================================================

  const startTime =
    booking.start_time
      ?.toString()
      .slice(
        0,
        8
      ) ||
    "00:00:00";


  // =======================================================
  // EVENT END TIME
  // =======================================================

  const endTime =
    booking.end_time
      ?.toString()
      .slice(
        0,
        8
      ) ||
    "23:59:59";


  // =======================================================
  // VALIDITY
  //
  // India timezone:
  // Asia/Kolkata = +05:30
  // =======================================================

  const validFrom =
    `${eventDate}T${startTime}+05:30`;


  const validUntil =
    `${eventDate}T${endTime}+05:30`;


  // =======================================================
  // INSERT EVENT PASS
  //
  // event_passes.booking_id is UNIQUE.
  //
  // If another request creates the pass first,
  // ON CONFLICT prevents the request from crashing.
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


  // =======================================================
  // PASS CREATED
  // =======================================================

  if (
    passResult.rows.length >
    0
  ) {

    return passResult.rows[0];
  }


  // =======================================================
  // ANOTHER REQUEST CREATED THE PASS
  // =======================================================

  const finalPassResult =
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
    finalPassResult.rows.length ===
    0
  ) {

    throw new Error(
      "Event pass could not be created"
    );
  }


  return finalPassResult.rows[0];
};


// =========================================================
// BUILD QR DATA
// =========================================================
//
// This object is directly usable by frontend QR library.
//
// =========================================================

const buildQrData = (
  pass
) => {

  return {

    type:
      "SNICT_EVENT_PASS",

    version:
      1,

    passId:
      pass.pass_id ??
      pass.id,

    passCode:
      pass.pass_code,

    passToken:
      pass.pass_token,

    bookingId:
      pass.booking_id,

    bookingCode:
      pass.booking_code,

    userId:
      pass.user_id,

    userName:
      pass.full_name,

    eventId:
      pass.event_id,

    eventName:
      pass.event_title ??
      pass.event_name,

    eventDate:
      pass.event_date,

    startTime:
      pass.start_time,

    endTime:
      pass.end_time,

    venue:
      pass.venue,

    eventMode:
      pass.event_mode,

    validFrom:
      pass.valid_from,

    validUntil:
      pass.valid_until,

  };
};


// =========================================================
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
// =========================================================
//
// USER CAN ONLY VIEW HIS OWN PASS.
//
// Requirements:
//
// payment_status = verified
//
// AND
//
// booking_status = confirmed/completed
//
// If pass does not exist:
// createEventPass() is called.
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


    const {
      id,
    } = req.params;


    // =======================================================
    // AUTH CHECK
    // =======================================================

    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "User authentication required",

      });
    }


    const bookingId =
      Number(id);


    // =======================================================
    // BOOKING ID VALIDATION
    // =======================================================

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


    // =======================================================
    // GET BOOKING
    //
    // IMPORTANT:
    //
    // User ownership is checked here.
    // =======================================================

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


    // =======================================================
    // BOOKING NOT FOUND
    // =======================================================

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


    // =======================================================
    // PAYMENT CHECK
    // =======================================================

    if (
      booking.payment_status !==
      "verified"
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


    // =======================================================
    // BOOKING STATUS CHECK
    // =======================================================

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
          "Booking is not confirmed yet.",

        booking_status:
          booking.booking_status,

      });
    }


    // =======================================================
    // GET EXISTING PASS
    // =======================================================

    const existingPassResult =
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


    // =======================================================
    // EXISTING PASS
    // =======================================================

    if (
      existingPassResult.rows.length >
      0
    ) {

      pass =
        existingPassResult.rows[0];

    } else {

      // =====================================================
      // CREATE PASS
      // =====================================================

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


    // =======================================================
    // GET ATTENDANCE
    //
    // Attendance is handled separately, but pass response
    // can expose the current attendance code/status.
    // =======================================================

    let attendance = null;


    try {

      const attendanceResult =
        await client.query(
          `
          SELECT

            id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by,
            created_at

          FROM event_attendance

          WHERE booking_id = $1

          ORDER BY created_at DESC

          LIMIT 1
          `,
          [
            bookingId,
          ]
        );


      if (
        attendanceResult.rows.length >
        0
      ) {

        attendance =
          attendanceResult.rows[0];
      }

    } catch (
      attendanceError
    ) {

      // -----------------------------------------------------
      // IMPORTANT:
      //
      // Event pass must NOT fail only because attendance
      // information is unavailable.
      // -----------------------------------------------------

      console.warn(
        "Attendance lookup skipped:",
        attendanceError.message
      );

      attendance =
        null;
    }


    // =======================================================
    // BUILD FINAL PASS OBJECT
    // =======================================================

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

      attendance_id:
        attendance?.id ??
        null,

      attendance_event_id:
        attendance?.event_id ??
        null,

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


    // =======================================================
    // QR DATA
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


    // =======================================================
    // COMMIT
    // =======================================================

    await client.query(
      "COMMIT"
    );


    // =======================================================
    // RESPONSE
    // =======================================================

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


    console.error(
      "Get my event pass error:",
      error
    );


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
// GET /api/bookings/admin/passes
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


    // =======================================================
    // ADD QR DATA TO EACH PASS
    // =======================================================

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

    console.error(
      "Get admin passes error:",
      error
    );


    return sendDatabaseError(
      res,
      "Unable to fetch event passes",
      error
    );

  }

};


// =========================================================
// ADMIN - GET PASS BY BOOKING ID
// GET /api/bookings/admin/:id/pass
// =========================================================

const getAdminPassByBookingId =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;


      const bookingId =
        Number(id);


      // =====================================================
      // VALIDATE BOOKING ID
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
      // GET PASS
      // =====================================================

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

          WHERE ep.booking_id = $1

          LIMIT 1
          `,
          [
            bookingId,
          ]
        );


      // =====================================================
      // PASS NOT FOUND
      // =====================================================

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


      // =====================================================
      // QR DATA
      // =====================================================

      const qrData =
        buildQrData(
          pass
        );


      // =====================================================
      // RESPONSE
      // =====================================================

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

          attendance_status:
            pass.attendance_status ||
            "not_present",

          status:
            "valid",

        },

      });


    } catch (error) {

      console.error(
        "Get admin pass error:",
        error
      );


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
//
// IMPORTANT:
//
// This file exports createEventPass because
// bookingController.confirmPayment() needs to call it.
//
// =========================================================

module.exports = {

  // -------------------------------------------------------
  // PASS CREATION
  // -------------------------------------------------------

  createEventPass,


  // -------------------------------------------------------
  // USER
  // -------------------------------------------------------

  getMyPass,


  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------

  getAdminPasses,

  getAdminPassByBookingId,

};