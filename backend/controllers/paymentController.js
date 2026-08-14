const pool = require("../config/db");


// =========================================================
// SUBMIT UPI PAYMENT
// POST /api/payments/:bookingId
// =========================================================

const submitPayment = async (
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
    // REJECTED PAYMENT
    // Allow user to submit again
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

            e.specialization

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

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

            /* BOOKING */

            b.booking_code,

            b.user_id,

            b.amount AS booking_amount,

            b.booking_status,

            b.event_id,


            /* USER */

            u.full_name,

            u.username,

            u.email,

            u.mobile,


            /* EVENT */

            e.title AS event_title,

            e.event_type,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            e.doctor_name,

            e.specialization

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

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
      // CONFIRM
      // ===================================================

      if (
        status ===
        "confirmed"
      ) {

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


      } else {

        // =================================================
        // REJECT
        // =================================================

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
      }


      // ===================================================
      // COMMIT
      // ===================================================

      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          status ===
          "confirmed"

            ? "Payment verified and booking confirmed"

            : "Payment rejected and booking rejected",
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