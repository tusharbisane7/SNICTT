const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// PAYMENT CONTROLLER
// =========================================================
//
// USER
//
// submitPayment()
//
// ADMIN
//
// getAllPayments()
// getPaymentById()
// verifyPayment()
//
// PAYMENT FLOW
//
// 1. User creates booking
// 2. User submits UTR / transaction ID
// 3. Payment status = submitted
// 4. Admin verifies payment
// 5. Payment status = verified
// 6. Booking status = confirmed
// 7. Event pass is generated
// 8. Attendance record is created
// 9. QR can be scanned by admin
//
// =========================================================


// =========================================================
// HELPERS
// =========================================================


// ---------------------------------------------------------
// GENERATE PASS CODE
// ---------------------------------------------------------

const generatePassCode = () => {

  return `SNICT-PASS-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


// ---------------------------------------------------------
// GENERATE PASS TOKEN
// ---------------------------------------------------------

const generatePassToken = () => {

  return crypto
    .randomBytes(32)
    .toString("hex");
};


// ---------------------------------------------------------
// GENERATE ATTENDANCE CODE
// ---------------------------------------------------------

const generateAttendanceCode = () => {

  return `SNICT-ATT-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


// ---------------------------------------------------------
// DATABASE ERROR LOGGER
// ---------------------------------------------------------

const logDatabaseError = (
  title,
  error
) => {

  console.error(
    "========================================"
  );

  console.error(
    title
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
    "========================================"
  );
};


// =========================================================
// ENSURE EVENT PASS
// =========================================================
//
// Creates one pass for one booking.
//
// event_bookings.event_id = INTEGER
// events.id                = INTEGER
//
// =========================================================

const ensureEventPass = async (
  client,
  bookingId
) => {

  // -------------------------------------------------------
  // CHECK EXISTING PASS
  // -------------------------------------------------------

  const existingResult =
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

      LIMIT 1
      `,
      [
        bookingId,
      ]
    );


  if (
    existingResult.rows.length > 0
  ) {

    return existingResult.rows[0];
  }


  // -------------------------------------------------------
  // GET BOOKING + EVENT
  // -------------------------------------------------------

  const bookingResult =
    await client.query(
      `
      SELECT

        b.id AS booking_id,
        b.booking_code,
        b.event_id,
        b.user_id,
        b.amount,
        b.booking_status,

        e.id AS event_id,
        e.title AS event_title,
        e.event_date,
        e.start_time,
        e.end_time,
        e.venue,
        e.event_mode

      FROM event_bookings b

      INNER JOIN events e
        ON e.id = b.event_id

      WHERE b.id = $1

      LIMIT 1
      `,
      [
        bookingId,
      ]
    );


  if (
    bookingResult.rows.length === 0
  ) {

    throw new Error(
      "Booking not found while creating event pass"
    );
  }


  const booking =
    bookingResult.rows[0];


  // -------------------------------------------------------
  // ONLY CONFIRMED BOOKING GETS PASS
  // -------------------------------------------------------

  if (
    booking.booking_status !==
    "confirmed"
  ) {

    return null;
  }


  // -------------------------------------------------------
  // GENERATE UNIQUE PASS CODE
  // -------------------------------------------------------

  let passCode = null;

  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {

    const candidate =
      generatePassCode();


    const checkResult =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_code = $1

        LIMIT 1
        `,
        [
          candidate,
        ]
      );


    if (
      checkResult.rows.length === 0
    ) {

      passCode =
        candidate;

      break;
    }
  }


  if (!passCode) {

    throw new Error(
      "Unable to generate unique pass code"
    );
  }


  // -------------------------------------------------------
  // GENERATE UNIQUE PASS TOKEN
  // -------------------------------------------------------

  let passToken = null;

  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {

    const candidate =
      generatePassToken();


    const checkResult =
      await client.query(
        `
        SELECT id

        FROM event_passes

        WHERE pass_token = $1

        LIMIT 1
        `,
        [
          candidate,
        ]
      );


    if (
      checkResult.rows.length === 0
    ) {

      passToken =
        candidate;

      break;
    }
  }


  if (!passToken) {

    throw new Error(
      "Unable to generate unique pass token"
    );
  }


  // -------------------------------------------------------
  // EVENT DATE
  // -------------------------------------------------------

  const eventDate =
    event.event_date
      ?.toString()
      .slice(0, 10);


  if (!eventDate) {

    throw new Error(
      "Event date is missing"
    );
  }


  // -------------------------------------------------------
  // EVENT START TIME
  // -------------------------------------------------------

  const startTime =
    event.start_time
      ?.toString()
      .slice(0, 8) ||
    "00:00:00";


  // -------------------------------------------------------
  // EVENT END TIME
  // -------------------------------------------------------

  const endTime =
    event.end_time
      ?.toString()
      .slice(0, 8) ||
    "23:59:59";


  // -------------------------------------------------------
  // INDIA TIMEZONE
  // -------------------------------------------------------

  const validFrom =
    `${eventDate}T${startTime}+05:30`;


  const validUntil =
    `${eventDate}T${endTime}+05:30`;


  // -------------------------------------------------------
  // CREATE PASS
  // -------------------------------------------------------

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
        bookingId,
        passCode,
        passToken,
        validFrom,
        validUntil,
      ]
    );


  return passResult.rows[0];
};


// =========================================================
// ENSURE ATTENDANCE RECORD
// =========================================================
//
// IMPORTANT
//
// event_attendance.event_id = INTEGER
//
// So booking.event_id is inserted directly.
//
// marked_by remains NULL.
//
// Attendance is marked present only when admin scans
// the QR or enters attendance code.
//
// =========================================================

const ensureAttendanceRecord =
  async (
    client,
    bookingId
  ) => {

    // -------------------------------------------------------
    // CHECK EXISTING ATTENDANCE
    // -------------------------------------------------------

    const existingResult =
      await client.query(
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
          bookingId,
        ]
      );


    if (
      existingResult.rows.length > 0
    ) {

      return existingResult.rows[0];
    }


    // -------------------------------------------------------
    // GET BOOKING
    // -------------------------------------------------------

    const bookingResult =
      await client.query(
        `
        SELECT
          b.id,
          b.event_id,
          b.user_id,
          b.booking_status

        FROM event_bookings b

        WHERE b.id = $1

        LIMIT 1
        `,
        [
          bookingId,
        ]
      );


    if (
      bookingResult.rows.length === 0
    ) {

      throw new Error(
        "Booking not found while creating attendance"
      );
    }


    const booking =
      bookingResult.rows[0];


    if (
      !booking.event_id
    ) {

      throw new Error(
        "Booking event_id is missing"
      );
    }


    // -------------------------------------------------------
    // GENERATE UNIQUE ATTENDANCE CODE
    // -------------------------------------------------------

    let attendanceCode = null;

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {

      const candidate =
        generateAttendanceCode();


      const checkResult =
        await client.query(
          `
          SELECT id

          FROM event_attendance

          WHERE attendance_code = $1

          LIMIT 1
          `,
          [
            candidate,
          ]
        );


      if (
        checkResult.rows.length === 0
      ) {

        attendanceCode =
          candidate;

        break;
      }
    }


    if (!attendanceCode) {

      throw new Error(
        "Unable to generate unique attendance code"
      );
    }


    // -------------------------------------------------------
    // CREATE ATTENDANCE
    // -------------------------------------------------------

    const attendanceResult =
      await client.query(
        `
        INSERT INTO event_attendance
        (
          booking_id,
          event_id,
          attendance_code,
          attendance_status,
          marked_at,
          marked_by
        )

        VALUES
        (
          $1,
          $2,
          $3,
          'not_present',
          NULL,
          NULL
        )

        RETURNING
          id,
          booking_id,
          event_id,
          attendance_code,
          attendance_status,
          marked_at,
          marked_by,
          created_at,
          updated_at
        `,
        [
          booking.id,
          booking.event_id,
          attendanceCode,
        ]
      );


    return attendanceResult.rows[0];
  };


// =========================================================
// SUBMIT PAYMENT
// POST /api/payments/:bookingId
// =========================================================
//
// Body:
//
// {
//   "transactionId": "XXXXXXXX",
//   "paymentProofUrl": "https://..."
// }
//
// =========================================================

const submitPayment =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const userId =
        req.userId;


      const {
        bookingId,
      } = req.params;


      const {
        transactionId,
        paymentProofUrl,
        payment_method,
        paymentMethod,
      } = req.body;


      // -----------------------------------------------------
      // AUTH
      // -----------------------------------------------------

      if (!userId) {

        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }


      // -----------------------------------------------------
      // TRANSACTION ID
      // -----------------------------------------------------

      const cleanTransactionId =
        String(
          transactionId || ""
        ).trim();


      if (!cleanTransactionId) {

        return res.status(400).json({
          success: false,
          message:
            "Transaction ID / UTR number is required",
        });
      }


      // -----------------------------------------------------
      // BOOKING
      // -----------------------------------------------------

      await client.query(
        "BEGIN"
      );


      const bookingResult =
        await client.query(
          `
          SELECT
            id,
            booking_code,
            user_id,
            event_id,
            amount,
            booking_status

          FROM event_bookings

          WHERE id = $1
            AND user_id = $2

          FOR UPDATE
          `,
          [
            bookingId,
            userId,
          ]
        );


      if (
        bookingResult.rows.length === 0
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


      // -----------------------------------------------------
      // BLOCK CANCELLED / REJECTED
      // -----------------------------------------------------

      if (
        [
          "cancelled",
          "rejected",
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
            "Payment cannot be submitted for this booking",
        });
      }


      // -----------------------------------------------------
      // PAYMENT METHOD
      // -----------------------------------------------------

      const cleanPaymentMethod =
        String(
          payment_method ||
          paymentMethod ||
          "upi"
        ).trim();


      // -----------------------------------------------------
      // PAYMENT PROOF
      // -----------------------------------------------------

      const cleanProof =
        paymentProofUrl
          ? String(
              paymentProofUrl
            ).trim()
          : null;


      // -----------------------------------------------------
      // CHECK EXISTING PAYMENT
      // -----------------------------------------------------

      const existingPayment =
        await client.query(
          `
          SELECT
            id,
            payment_status

          FROM event_payments

          WHERE booking_id = $1

          ORDER BY id DESC

          LIMIT 1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
        );


      let payment;


      if (
        existingPayment.rows.length >
        0
      ) {

        const existing =
          existingPayment.rows[0];


        // ---------------------------------------------------
        // DON'T ALLOW NEW SUBMISSION AFTER VERIFIED
        // ---------------------------------------------------

        if (
          existing.payment_status ===
          "verified"
        ) {

          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              "Payment has already been verified",
          });
        }


        // ---------------------------------------------------
        // UPDATE PAYMENT
        // ---------------------------------------------------

        const paymentResult =
          await client.query(
            `
            UPDATE event_payments

            SET

              payment_method = $1,

              transaction_id = $2,

              amount = $3,

              payment_status = 'submitted',

              payment_proof_url = $4

            WHERE id = $5

            RETURNING *
            `,
            [
              cleanPaymentMethod,
              cleanTransactionId,
              booking.amount,
              cleanProof,
              existing.id,
            ]
          );


        payment =
          paymentResult.rows[0];

      } else {

        // ---------------------------------------------------
        // CREATE PAYMENT
        // ---------------------------------------------------

        const paymentResult =
          await client.query(
            `
            INSERT INTO event_payments
            (
              booking_id,
              payment_method,
              transaction_id,
              amount,
              payment_status,
              payment_proof_url
            )

            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              'submitted',
              $5
            )

            RETURNING *
            `,
            [
              bookingId,
              cleanPaymentMethod,
              cleanTransactionId,
              booking.amount,
              cleanProof,
            ]
          );


        payment =
          paymentResult.rows[0];
      }


      // -----------------------------------------------------
      // KEEP BOOKING PAYMENT PENDING
      // -----------------------------------------------------

      await client.query(
        `
        UPDATE event_bookings

        SET
          booking_status =
            CASE
              WHEN booking_status =
                'payment_pending'
              THEN 'payment_pending'

              ELSE booking_status
            END,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
        `,
        [
          bookingId,
        ]
      );


      await client.query(
        "COMMIT"
      );


      return res.status(200).json({

        success: true,

        message:
          "Payment submitted successfully. Please wait for admin verification.",

        payment,

        booking: {

          id:
            booking.id,

          booking_code:
            booking.booking_code,

          booking_status:
            booking.booking_status,

          payment_status:
            "submitted",
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


      logDatabaseError(
        "Submit payment error",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to submit payment",

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

                constraint:
                  error.constraint,
              }
            : undefined,
      });
    } finally {

      client.release();
    }
  };


// =========================================================
// GET ALL PAYMENTS
// GET /api/payments/admin
// =========================================================

const getAllPayments =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            p.id,
            p.booking_id,
            p.payment_method,
            p.transaction_id,
            p.amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at,

            b.booking_code,
            b.booking_status,
            b.event_id,
            b.user_id,

            u.full_name,
            u.username,
            u.email,
            u.mobile,

            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,

            ep.id AS pass_id,
            ep.pass_code,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT
              id,
              pass_code

            FROM event_passes

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) ep ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              id,
              attendance_code,
              attendance_status,
              marked_at

            FROM event_attendance

            WHERE booking_id = b.id

            ORDER BY created_at DESC

            LIMIT 1
          ) ea ON TRUE

          ORDER BY
            p.created_at DESC
          `
        );


      return res.json({

        success: true,

        payments:
          result.rows,

        total:
          result.rows.length,
      });


    } catch (error) {

      logDatabaseError(
        "Get all payments error",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch payments",

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
              }
            : undefined,
      });
    }
  };


// =========================================================
// GET PAYMENT BY ID
// GET /api/payments/admin/:id
// =========================================================

const getPaymentById =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;


      const result =
        await pool.query(
          `
          SELECT

            p.id,
            p.booking_id,
            p.payment_method,
            p.transaction_id,
            p.amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at,

            b.booking_code,
            b.booking_status,
            b.event_id,
            b.user_id,

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,

            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,

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

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_passes
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ep ON TRUE

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY created_at DESC
            LIMIT 1
          ) ea ON TRUE

          WHERE p.id = $1

          LIMIT 1
          `,
          [
            id,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Payment not found",
        });
      }


      return res.json({

        success: true,

        payment:
          result.rows[0],
      });


    } catch (error) {

      logDatabaseError(
        "Get payment by ID error",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch payment",

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
              }
            : undefined,
      });
    }
  };


// =========================================================
// VERIFY / REJECT PAYMENT
// PUT /api/payments/admin/:id/verify
// =========================================================
//
// Body:
//
// {
//   "status": "verified"
// }
//
// OR
//
// {
//   "status": "rejected"
// }
//
// =========================================================

const verifyPayment =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const {
        id,
      } = req.params;


      const requestedStatus =
        String(
          req.body?.status ||
          ""
        )
          .trim()
          .toLowerCase();


      const adminId =
        req.adminId;


      // -----------------------------------------------------
      // ADMIN ID
      // -----------------------------------------------------

      if (
        adminId === undefined ||
        adminId === null
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Admin authentication required",
        });
      }


      // -----------------------------------------------------
      // STATUS
      // -----------------------------------------------------

      if (
        ![
          "verified",
          "rejected",
        ].includes(
          requestedStatus
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Status must be either verified or rejected",
        });
      }


      await client.query(
        "BEGIN"
      );


      // -----------------------------------------------------
      // GET PAYMENT
      // -----------------------------------------------------

      const paymentResult =
        await client.query(
          `
          SELECT

            p.id,
            p.booking_id,
            p.payment_method,
            p.transaction_id,
            p.amount,
            p.payment_status,
            p.payment_proof_url,

            b.booking_code,
            b.event_id,
            b.user_id,
            b.booking_status,

            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          INNER JOIN events e
            ON e.id = b.event_id

          WHERE p.id = $1

          FOR UPDATE OF p, b

          LIMIT 1
          `,
          [
            id,
          ]
        );


      if (
        paymentResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          success: false,

          message:
            "Payment not found",
        });
      }


      const payment =
        paymentResult.rows[0];


      // -----------------------------------------------------
      // ALREADY VERIFIED
      // -----------------------------------------------------

      if (
        payment.payment_status ===
        "verified" &&
        requestedStatus ===
        "verified"
      ) {

        const existingPass =
          await ensureEventPass(
            client,
            payment.booking_id
          );


        const existingAttendance =
          await ensureAttendanceRecord(
            client,
            payment.booking_id
          );


        await client.query(
          "COMMIT"
        );


        return res.json({

          success: true,

          message:
            "Payment is already verified",

          payment: {

            ...payment,

            payment_status:
              "verified",
          },

          pass:
            existingPass,

          attendance:
            existingAttendance,
        });
      }


      // -----------------------------------------------------
      // UPDATE PAYMENT
      // -----------------------------------------------------
      //
      // verified_by = INTEGER
      // admins.id    = INTEGER
      //
      // Therefore req.adminId is saved directly.
      //
      // -----------------------------------------------------

      const updatedPaymentResult =
        await client.query(
          `
          UPDATE event_payments

          SET

            payment_status = $1,

            verified_by = $2,

            verified_at =
              CURRENT_TIMESTAMP

          WHERE id = $3

          RETURNING
            *
          `,
          [
            requestedStatus,
            adminId,
            id,
          ]
        );


      const updatedPayment =
        updatedPaymentResult.rows[0];


      let eventPass =
        null;


      let attendance =
        null;


      // =====================================================
      // VERIFIED
      // =====================================================

      if (
        requestedStatus ===
        "verified"
      ) {

        // ---------------------------------------------------
        // CONFIRM BOOKING
        // ---------------------------------------------------

        await client.query(
          `
          UPDATE event_bookings

          SET

            booking_status =
              'confirmed',

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
          `,
          [
            payment.booking_id,
          ]
        );


        // ---------------------------------------------------
        // CREATE EVENT PASS
        // ---------------------------------------------------

        eventPass =
          await ensureEventPass(
            client,
            payment.booking_id
          );


        // ---------------------------------------------------
        // CREATE ATTENDANCE RECORD
        // ---------------------------------------------------

        attendance =
          await ensureAttendanceRecord(
            client,
            payment.booking_id
          );

      } else {

        // ===================================================
        // REJECTED
        // ===================================================

        await client.query(
          `
          UPDATE event_bookings

          SET

            booking_status =
              'payment_pending',

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
          `,
          [
            payment.booking_id,
          ]
        );
      }


      // -----------------------------------------------------
      // GET FINAL DATA
      // -----------------------------------------------------

      const finalResult =
        await client.query(
          `
          SELECT

            p.id AS payment_id,
            p.booking_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,

            b.id AS booking_id,
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount AS booking_amount,
            b.booking_status,

            u.full_name,
            u.username,
            u.email,
            u.mobile,

            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,

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

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_passes
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ep ON TRUE

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY created_at DESC
            LIMIT 1
          ) ea ON TRUE

          WHERE p.id = $1

          LIMIT 1
          `,
          [
            id,
          ]
        );


      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          requestedStatus ===
          "verified"

            ? "Payment verified and booking confirmed successfully"

            : "Payment rejected successfully",

        payment:
          finalResult.rows[0],

        pass:
          eventPass,

        attendance:
          attendance,
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


      logDatabaseError(
        "VERIFY PAYMENT ERROR",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to process payment verification",

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

                table:
                  error.table,

                column:
                  error.column,

                constraint:
                  error.constraint,
              }
            : undefined,
      });
    } finally {

      client.release();
    }
  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  submitPayment,

  getAllPayments,

  getPaymentById,

  verifyPayment,

};