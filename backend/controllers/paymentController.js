const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// GENERATE EVENT PASS CODE
// =========================================================

const generatePassCode = () => {
  const random =
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase();

  return `SNICT-PASS-${random}`;
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
// =========================================================

const generateAttendanceCode = () => {
  const random =
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase();

  return `SNICT-ATT-${random}`;
};

// =========================================================
// GET UNIQUE PASS CODE
// =========================================================

const getUniquePassCode = async (
  client
) => {

  let passCode;
  let exists = true;

  while (exists) {

    passCode =
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

    exists =
      result.rows.length > 0;
  }

  return passCode;
};

// =========================================================
// GET UNIQUE ATTENDANCE CODE
// =========================================================

const getUniqueAttendanceCode =
  async (
    client
  ) => {

    let attendanceCode;
    let exists = true;

    while (exists) {

      attendanceCode =
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

      exists =
        result.rows.length > 0;
    }

    return attendanceCode;
  };

// =========================================================
// CREATE / ENSURE ATTENDANCE RECORD
// =========================================================
//
// One attendance record per booking.
//
// Initial status:
// not_present
//
// =========================================================

const ensureAttendanceRecord =
  async (
    client,
    bookingId,
    eventId
  ) => {

    const existing =
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
      existing.rows.length > 0
    ) {
      return existing.rows[0];
    }

    const attendanceCode =
      await getUniqueAttendanceCode(
        client
      );

    const result =
      await client.query(
        `
        INSERT INTO event_attendance
        (
          booking_id,
          event_id,
          attendance_code,
          attendance_status
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'not_present'
        )
        RETURNING *
        `,
        [
          bookingId,
          eventId,
          attendanceCode,
        ]
      );

    return result.rows[0];
  };

// =========================================================
// CREATE / ENSURE EVENT PASS
// =========================================================
//
// Pass is generated ONLY after:
//
// payment_status = verified
// booking_status = confirmed
//
// =========================================================

const ensureEventPass =
  async (
    client,
    bookingId
  ) => {

    // =======================================================
    // CHECK EXISTING PASS
    // =======================================================

    const existingPass =
      await client.query(
        `
        SELECT *
        FROM event_passes
        WHERE booking_id = $1
        LIMIT 1
        `,
        [bookingId]
      );

    if (
      existingPass.rows.length > 0
    ) {

      // Make sure attendance also exists.
      const bookingResult =
        await client.query(
          `
          SELECT
            event_id
          FROM event_bookings
          WHERE id = $1
          LIMIT 1
          `,
          [bookingId]
        );

      if (
        bookingResult.rows.length > 0
      ) {

        await ensureAttendanceRecord(
          client,
          bookingId,
          bookingResult.rows[0]
            .event_id
        );
      }

      return existingPass.rows[0];
    }

    // =======================================================
    // GET BOOKING + EVENT
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

          e.title AS event_name,
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
        [bookingId]
      );

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
    // EVENT DATE
    // =======================================================

    const eventDate =
      booking.event_date
        ?.toString()
        .slice(0, 10);

    // =======================================================
    // EVENT TIME
    // =======================================================

    const startTime =
      booking.start_time
        ?.toString()
        .slice(0, 8) ||
      "00:00:00";

    const endTime =
      booking.end_time
        ?.toString()
        .slice(0, 8) ||
      "23:59:59";

    // =======================================================
    // PASS VALIDITY
    // =======================================================

    const validFrom =
      eventDate
        ? `${eventDate}T${startTime}+05:30`
        : new Date();

    const validUntil =
      eventDate
        ? `${eventDate}T${endTime}+05:30`
        : new Date();

    // =======================================================
    // UNIQUE PASS CODE
    // =======================================================

    const passCode =
      await getUniquePassCode(
        client
      );

    // =======================================================
    // SECURE TOKEN
    // =======================================================

    const passToken =
      generatePassToken();

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
        RETURNING *
        `,
        [
          bookingId,
          passCode,
          passToken,
          validFrom,
          validUntil,
        ]
      );

    // =======================================================
    // CREATE ATTENDANCE RECORD
    // =======================================================

    await ensureAttendanceRecord(
      client,
      bookingId,
      booking.event_id
    );

    return passResult.rows[0];
  };

// =========================================================
// GET COMPLETE PASS DATA
// =========================================================

const getPassData =
  async (
    client,
    bookingId
  ) => {

    const result =
      await client.query(
        `
        SELECT

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,

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
          e.event_mode,

          p.payment_status,
          p.transaction_id,

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

        FROM event_passes ep

        INNER JOIN event_bookings b
          ON b.id = ep.booking_id

        LEFT JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN event_payments p
          ON p.booking_id = b.id

        LEFT JOIN event_attendance ea
          ON ea.booking_id = b.id

        WHERE ep.booking_id = $1

        LIMIT 1
        `,
        [bookingId]
      );

    if (
      result.rows.length === 0
    ) {
      return null;
    }

    const pass =
      result.rows[0];

    // =======================================================
    // QR PAYLOAD
    // =======================================================

    const qrData = {

      type:
        "SNICT_EVENT_PASS",

      passId:
        pass.pass_id,

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

      attendanceCode:
        pass.attendance_code,

      attendanceStatus:
        pass.attendance_status ||
        "not_present",
    };

    return {

      ...pass,

      qr_data:
        qrData,

      qr_payload:
        JSON.stringify(
          qrData
        ),

      attendance:
        {
          id:
            pass.attendance_id,

          code:
            pass.attendance_code,

          status:
            pass.attendance_status ||
            "not_present",

          markedAt:
            pass.attendance_marked_at,

          markedBy:
            pass.attendance_marked_by,
        },
    };
  };

// =========================================================
// SUBMIT UPI PAYMENT
// POST /api/payments/:bookingId
// =========================================================

const submitPayment =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;

      const {
        bookingId,
      } = req.params;

      const {
        transactionId,
        paymentProofUrl,
      } = req.body;

      // =====================================================
      // VALIDATE TRANSACTION ID
      // =====================================================

      const cleanTransactionId =
        String(
          transactionId || ""
        ).trim();

      if (
        !cleanTransactionId
      ) {

        return res.status(400).json({
          success: false,
          message:
            "UPI transaction ID / UTR is required",
        });
      }

      if (
        cleanTransactionId.length <
        6
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid UPI transaction ID / UTR",
        });
      }

      // =====================================================
      // GET USER BOOKING
      // =====================================================

      const bookingResult =
        await pool.query(
          `
          SELECT
            b.id,
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount,
            b.booking_status,

            p.id AS payment_id,
            p.payment_status,
            p.transaction_id

          FROM event_bookings b

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

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

        return res.status(404).json({
          success: false,
          message:
            "Booking not found",
        });
      }

      const booking =
        bookingResult.rows[0];

      // =====================================================
      // CHECK BOOKING STATUS
      // =====================================================

      if (
        booking.booking_status !==
        "payment_pending"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Payment cannot be submitted for this booking",
        });
      }

      // =====================================================
      // CHECK PAYMENT RECORD
      // =====================================================

      if (
        !booking.payment_id
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Payment record not found",
        });
      }

      // =====================================================
      // PREVENT DUPLICATE VERIFIED PAYMENT
      // =====================================================

      if (
        booking.payment_status ===
        "verified"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "This payment has already been verified",
        });
      }

      // =====================================================
      // PREVENT DUPLICATE SUBMISSION
      // =====================================================

      if (
        booking.payment_status ===
        "submitted"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Payment has already been submitted and is waiting for verification",
        });
      }

      // =====================================================
      // UPDATE PAYMENT
      // =====================================================

      const updatedPayment =
        await pool.query(
          `
          UPDATE event_payments

          SET
            transaction_id = $1,
            payment_proof_url = $2,
            payment_status =
              'submitted',
            verified_by = NULL,
            verified_at = NULL

          WHERE booking_id = $3

          RETURNING *
          `,
          [
            cleanTransactionId,
            paymentProofUrl ||
              null,
            bookingId,
          ]
        );

      return res.json({

        success: true,

        message:
          "Payment submitted successfully. Waiting for admin verification.",

        payment:
          updatedPayment.rows[0],
      });

    } catch (error) {

      console.error(
        "Submit payment error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to submit payment",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =========================================================
// ADMIN - GET ALL PAYMENTS
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

            /* =========================
               PAYMENT
            ========================= */

            p.id,
            p.booking_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at
              AS payment_created_at,

            /* =========================
               BOOKING
            ========================= */

            b.booking_code,
            b.user_id,
            b.amount AS booking_amount,
            b.booking_status,
            b.created_at
              AS booking_created_at,
            b.updated_at
              AS booking_updated_at,

            /* =========================
               USER
            ========================= */

            u.full_name,
            u.username,
            u.email,
            u.mobile,

            /* =========================
               EVENT
            ========================= */

            e.id AS event_id,
            e.title AS event_title,
            e.event_type,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.doctor_name,
            e.specialization,

            /* =========================
               ATTENDANCE
            ========================= */

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at
              AS attendance_marked_at

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_attendance ea
            ON ea.booking_id = b.id

          ORDER BY
            p.created_at DESC
          `
        );

      return res.json({

        success: true,

        payments:
          result.rows,
      });

    } catch (error) {

      console.error(
        "Get payments error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch payments",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =========================================================
// ADMIN - GET SINGLE PAYMENT
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

            p.*,

            /* =========================
               BOOKING
            ========================= */

            b.booking_code,
            b.user_id,
            b.amount AS booking_amount,
            b.booking_status,
            b.event_id,

            /* =========================
               USER
            ========================= */

            u.full_name,
            u.username,
            u.email,
            u.mobile,

            /* =========================
               EVENT
            ========================= */

            e.title AS event_title,
            e.event_type,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.doctor_name,
            e.specialization,

            /* =========================
               ATTENDANCE
            ========================= */

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at
              AS attendance_marked_at,
            ea.marked_by
              AS attendance_marked_by

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_attendance ea
            ON ea.booking_id = b.id

          WHERE p.id = $1

          LIMIT 1
          `,
          [id]
        );

      if (
        result.rows.length ===
        0
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

      console.error(
        "Get payment details error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load payment",
      });
    }
  };

// =========================================================
// ADMIN - VERIFY / REJECT PAYMENT
// PUT /api/payments/admin/:id/verify
// =========================================================
//
// CONFIRM:
// payment = verified
// booking = confirmed
// pass = generated
// attendance = created
//
// REJECT:
// payment = rejected
// booking = rejected
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

      const adminId =
        req.adminId;

      const {
        id,
      } = req.params;

      const {
        status,
      } = req.body;

      // ===================================================
      // VALIDATE STATUS
      // ===================================================

      if (
        ![
          "confirmed",
          "rejected",
        ].includes(
          status
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Payment status must be confirmed or rejected",
        });
      }

      // ===================================================
      // START TRANSACTION
      // ===================================================

      await client.query(
        "BEGIN"
      );

      // ===================================================
      // GET PAYMENT + BOOKING
      // ===================================================

      const paymentResult =
        await client.query(
          `
          SELECT

            p.id,
            p.booking_id,
            p.payment_status,
            p.transaction_id,
            p.amount,

            b.booking_status,
            b.event_id,
            b.user_id

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          WHERE p.id = $1

          FOR UPDATE
          `,
          [id]
        );

      if (
        paymentResult.rows.length ===
        0
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

      // ===================================================
      // TRANSACTION REQUIRED
      // ===================================================

      if (
        !payment.transaction_id
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({

          success: false,

          message:
            "Transaction ID has not been submitted",
        });
      }

      // ===================================================
      // ONLY SUBMITTED PAYMENT
      // ===================================================

      if (
        payment.payment_status !==
        "submitted"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({

          success: false,

          message:
            "Only submitted payments can be processed",
        });
      }

      // ===================================================
      // CONFIRM PAYMENT
      // ===================================================

      if (
        status ===
        "confirmed"
      ) {

        // =================================================
        // UPDATE PAYMENT
        // =================================================

        await client.query(
          `
          UPDATE event_payments

          SET
            payment_status =
              'verified',

            verified_by =
              $1,

            verified_at =
              CURRENT_TIMESTAMP

          WHERE id = $2
          `,
          [
            adminId,
            id,
          ]
        );

        // =================================================
        // UPDATE BOOKING
        // =================================================

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

        // =================================================
        // CREATE EVENT PASS
        // =================================================

        const pass =
          await ensureEventPass(
            client,
            payment.booking_id
          );

        // =================================================
        // GET COMPLETE PASS
        // =================================================

        const completePass =
          await getPassData(
            client,
            payment.booking_id
          );

        // =================================================
        // COMMIT
        // =================================================

        await client.query(
          "COMMIT"
        );

        return res.json({

          success: true,

          message:
            "Payment verified, booking confirmed and event pass generated successfully",

          payment: {

            id:
              id,

            booking_id:
              payment.booking_id,

            payment_status:
              "verified",

            booking_status:
              "confirmed",
          },

          pass:
            completePass ||
            pass,

          attendance:
            completePass?.attendance ||
            null,
        });
      }

      // ===================================================
      // REJECT PAYMENT
      // ===================================================

      await client.query(
        `
        UPDATE event_payments

        SET
          payment_status =
            'rejected',

          verified_by =
            $1,

          verified_at =
            CURRENT_TIMESTAMP

        WHERE id = $2
        `,
        [
          adminId,
          id,
        ]
      );

      // ===================================================
      // UPDATE BOOKING
      // ===================================================

      await client.query(
        `
        UPDATE event_bookings

        SET
          booking_status =
            'rejected',

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
        `,
        [
          payment.booking_id,
        ]
      );

      // ===================================================
      // COMMIT
      // ===================================================

      await client.query(
        "COMMIT"
      );

      return res.json({

        success: true,

        message:
          "Payment rejected and booking rejected",

        payment: {

          id:
            id,

          booking_id:
            payment.booking_id,

          payment_status:
            "rejected",

          booking_status:
            "rejected",
        },
      });

    } catch (error) {

      // ===================================================
      // ROLLBACK
      // ===================================================

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

      console.error(
        "Verify payment error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to verify payment",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
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