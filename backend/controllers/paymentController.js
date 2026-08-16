const pool = require("../config/db");


// =========================================================
// USER - SUBMIT UPI PAYMENT
// POST /api/payments/:bookingId
// =========================================================
//
// IMPORTANT:
//
// This function supports BOTH cases:
//
// 1. Payment record already exists
//    -> UPDATE it
//
// 2. Payment record does NOT exist
//    -> CREATE it
//
// This fixes the recurring:
//
// 404 Payment record not found
//
// problem for old bookings that don't have an
// event_payments row.
//
// =========================================================

const submitPayment = async (
  req,
  res
) => {

  const client =
    await pool.connect();


  try {

    // =======================================================
    // USER
    // =======================================================

    const userId =
      req.userId;


    const bookingId =
      req.params.bookingId;


    // =======================================================
    // REQUEST BODY
    // =======================================================

    const {
      transactionId,
      paymentProofUrl,
      paymentMethod,
    } = req.body;


    // =======================================================
    // VALIDATE BOOKING ID
    // =======================================================

    const cleanBookingId =
      String(
        bookingId || ""
      ).trim();


    if (
      !cleanBookingId
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Booking ID is required",

      });

    }


    // =======================================================
    // VALIDATE TRANSACTION ID
    // =======================================================

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
      cleanTransactionId.length < 6
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Please enter a valid UPI transaction ID / UTR",

      });

    }


    // =======================================================
    // PAYMENT METHOD
    // =======================================================

    const cleanPaymentMethod =
      String(
        paymentMethod ||
        "upi"
      )
        .trim()
        .toLowerCase();


    const allowedPaymentMethods = [
      "upi",
      "online",
      "bank_transfer",
      "cash",
    ];


    const finalPaymentMethod =
      allowedPaymentMethods.includes(
        cleanPaymentMethod
      )
        ? cleanPaymentMethod
        : "upi";


    // =======================================================
    // PAYMENT PROOF
    // =======================================================

    const cleanProof =
      paymentProofUrl
        ? String(
            paymentProofUrl
          ).trim()
        : null;


    // =======================================================
    // START DATABASE TRANSACTION
    // =======================================================

    await client.query(
      "BEGIN"
    );


    // =======================================================
    // GET USER BOOKING
    // =======================================================

    const bookingResult =
      await client.query(
        `
        SELECT

          b.id,

          b.booking_code,

          b.event_id,

          b.user_id,

          b.amount,

          b.booking_status

        FROM event_bookings b

        WHERE b.id = $1

          AND b.user_id = $2

        LIMIT 1

        FOR UPDATE
        `,
        [
          cleanBookingId,
          userId,
        ]
      );


    // =======================================================
    // BOOKING NOT FOUND
    // =======================================================

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


    // =======================================================
    // CHECK BOOKING STATUS
    // =======================================================
    //
    // User can submit payment when:
    //
    // payment_pending
    // rejected
    //
    // =======================================================

    const allowedBookingStatuses = [
      "payment_pending",
      "rejected",
    ];


    if (
      !allowedBookingStatuses.includes(
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

        booking_status:
          booking.booking_status,

      });

    }


    // =======================================================
    // FIND EXISTING PAYMENT
    // =======================================================

    const existingPaymentResult =
      await client.query(
        `
        SELECT

          id,

          booking_id,

          payment_method,

          transaction_id,

          amount,

          payment_status,

          payment_proof_url,

          verified_by,

          verified_at

        FROM event_payments

        WHERE booking_id = $1

        ORDER BY id DESC

        LIMIT 1

        FOR UPDATE
        `,
        [
          cleanBookingId,
        ]
      );


    let payment;


    // =======================================================
    // EXISTING PAYMENT
    // =======================================================

    if (
      existingPaymentResult.rows.length > 0
    ) {

      const existingPayment =
        existingPaymentResult.rows[0];


      // =====================================================
      // ALREADY VERIFIED
      // =====================================================

      if (
        existingPayment.payment_status ===
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


      // =====================================================
      // ALREADY SUBMITTED
      // =====================================================

      if (
        existingPayment.payment_status ===
        "submitted"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(409).json({

          success: false,

          message:
            "Payment has already been submitted and is waiting for admin verification",

          payment:
            existingPayment,

        });

      }


      // =====================================================
      // UPDATE EXISTING PAYMENT
      // =====================================================
      //
      // IMPORTANT:
      //
      // event_payments DOES NOT have updated_at.
      //
      // Therefore updated_at is intentionally NOT used.
      //
      // =====================================================

      const updatePaymentResult =
        await client.query(
          `
          UPDATE event_payments

          SET

            payment_method = $1,

            transaction_id = $2,

            amount = $3,

            payment_status = 'submitted',

            payment_proof_url = $4,

            verified_by = NULL,

            verified_at = NULL

          WHERE id = $5

          RETURNING *
          `,
          [
            finalPaymentMethod,

            cleanTransactionId,

            Number(
              booking.amount || 0
            ),

            cleanProof,

            existingPayment.id,
          ]
        );


      payment =
        updatePaymentResult.rows[0];

    }


    // =======================================================
    // NO PAYMENT RECORD
    // =======================================================
    //
    // If an old booking doesn't have an event_payments
    // record, create it automatically.
    //
    // =======================================================

    else {

      const createPaymentResult =
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
            cleanBookingId,

            finalPaymentMethod,

            cleanTransactionId,

            Number(
              booking.amount || 0
            ),

            cleanProof,
          ]
        );


      payment =
        createPaymentResult.rows[0];

    }


    // =======================================================
    // SAFETY CHECK
    // =======================================================

    if (!payment) {

      throw new Error(
        "Unable to create or update payment record"
      );

    }


    // =======================================================
    // KEEP BOOKING PAYMENT PENDING
    // =======================================================
    //
    // IMPORTANT:
    //
    // event_bookings DOES have updated_at according to
    // your existing controller structure, so this is okay.
    //
    // =======================================================

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
        cleanBookingId,
      ]
    );


    // =======================================================
    // COMMIT
    // =======================================================

    await client.query(
      "COMMIT"
    );


    // =======================================================
    // SUCCESS
    // =======================================================

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
          "payment_pending",

        payment_status:
          "submitted",

      },

    });


  } catch (error) {

    // =======================================================
    // ROLLBACK
    // =======================================================

    try {

      await client.query(
        "ROLLBACK"
      );

    } catch (
      rollbackError
    ) {

      console.error(
        "Payment rollback error:",
        rollbackError
      );

    }


    // =======================================================
    // ERROR LOG
    // =======================================================

    console.error(
      "Submit payment error:",
      {
        message:
          error.message,

        code:
          error.code,

        detail:
          error.detail,

        constraint:
          error.constraint,

        table:
          error.table,

        column:
          error.column,

      }
    );


    // =======================================================
    // ERROR RESPONSE
    // =======================================================

    return res.status(500).json({

      success: false,

      message:
        "Unable to submit payment",

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

      // =====================================================
      // PAYMENT ID
      // =====================================================

      const paymentId =
        String(
          req.params.id || ""
        ).trim();


      // =====================================================
      // VALIDATE PAYMENT ID
      // =====================================================

      if (!paymentId) {

        return res.status(400).json({

          success: false,

          message:
            "Payment ID is required",

        });

      }


      // =====================================================
      // GET PAYMENT
      // =====================================================
      //
      // IMPORTANT:
      //
      // event_payments DOES NOT have updated_at.
      //
      // Therefore we DO NOT select:
      //
      // p.updated_at
      //
      // =====================================================

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

            u.profile_image_url,


            /* =========================
               EVENT
            ========================= */

            e.id AS event_id,

            e.title AS event_title,

            e.event_type,

            e.description,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            e.doctor_name,

            e.specialization,

            e.image_url


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
          [
            paymentId,
          ]
        );


      // =====================================================
      // NOT FOUND
      // =====================================================

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Payment not found",

        });

      }


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.json({

        success: true,

        payment:
          result.rows[0],

      });


    } catch (error) {

      console.error(
        "Get payment by ID error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch payment",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - VERIFY / REJECT PAYMENT
// PUT /api/payments/admin/:id/verify
// =========================================================
//
// IMPORTANT:
//
// Payment Management handles:
//
// 1. Confirm Payment
// 2. Reject Payment
//
// This function ONLY changes the payment.
//
// It DOES NOT confirm the booking.
//
// Booking confirmation is handled separately from:
//
// PUT /api/bookings/admin/:id/status
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

      // =====================================================
      // PAYMENT ID
      // =====================================================

      const paymentId =
        String(
          req.params.id || ""
        ).trim();


      // =====================================================
      // STATUS
      // =====================================================

      const {
        status,
      } = req.body;


      // =====================================================
      // ADMIN ID
      // =====================================================

      const adminId =
        req.admin?.id ||
        req.adminId ||
        req.user?.id ||
        null;


      // =====================================================
      // VALIDATE PAYMENT ID
      // =====================================================

      if (!paymentId) {

        return res.status(400).json({

          success: false,

          message:
            "Payment ID is required",

        });

      }


      // =====================================================
      // NORMALIZE STATUS
      // =====================================================

      const normalizedStatus =
        String(
          status || ""
        )
          .trim()
          .toLowerCase();


      // =====================================================
      // ALLOWED STATUS
      // =====================================================

      if (
        ![
          "confirmed",
          "verified",
          "rejected",
        ].includes(
          normalizedStatus
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid payment status. Use confirmed or rejected.",

        });

      }


      // =====================================================
      // DATABASE STATUS
      // =====================================================

      const finalPaymentStatus =
        normalizedStatus ===
        "confirmed" ||
        normalizedStatus ===
        "verified"
          ? "verified"
          : "rejected";


      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // GET PAYMENT
      // =====================================================

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

            p.verified_by,

            p.verified_at,

            p.created_at,

            b.booking_code,

            b.user_id,

            b.event_id,

            b.booking_status

          FROM event_payments p

          INNER JOIN event_bookings b
            ON b.id = p.booking_id

          WHERE p.id = $1

          LIMIT 1

          FOR UPDATE
          `,
          [
            paymentId,
          ]
        );


      // =====================================================
      // PAYMENT NOT FOUND
      // =====================================================

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


      // =====================================================
      // ALREADY VERIFIED
      // =====================================================

      if (
        payment.payment_status ===
        "verified" &&
        finalPaymentStatus ===
        "verified"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Payment is already confirmed",

          payment,

        });

      }


      // =====================================================
      // ALREADY REJECTED
      // =====================================================

      if (
        payment.payment_status ===
        "rejected" &&
        finalPaymentStatus ===
        "rejected"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Payment is already rejected",

          payment,

        });

      }


      // =====================================================
      // UPDATE PAYMENT
      // =====================================================
      //
      // IMPORTANT:
      //
      // NO updated_at HERE.
      //
      // Your event_payments table does not have
      // updated_at.
      //
      // =====================================================

      const updateResult =
        await client.query(
          `
          UPDATE event_payments

          SET

            payment_status = $1,

            verified_by = $2,

            verified_at =
              CURRENT_TIMESTAMP

          WHERE id = $3

          RETURNING *
          `,
          [
            finalPaymentStatus,

            adminId,

            paymentId,
          ]
        );


      const updatedPayment =
        updateResult.rows[0];


      // =====================================================
      // IMPORTANT:
      //
      // DO NOT UPDATE event_bookings HERE.
      //
      // Payment Management:
      //
      // payment_status = verified/rejected
      //
      // Booking Management:
      //
      // booking_status = confirmed
      //
      // These are intentionally separate.
      // =====================================================


      await client.query(
        "COMMIT"
      );


      // =====================================================
      // SUCCESS RESPONSE
      // =====================================================

      return res.status(200).json({

        success: true,

        message:
          finalPaymentStatus ===
          "verified"
            ? "Payment confirmed successfully"
            : "Payment rejected successfully",

        payment:
          updatedPayment,

        booking: {

          id:
            payment.booking_id,

          booking_code:
            payment.booking_code,

          booking_status:
            payment.booking_status,

        },

      });


    } catch (error) {

      // =====================================================
      // ROLLBACK
      // =====================================================

      try {

        await client.query(
          "ROLLBACK"
        );

      } catch (
        rollbackError
      ) {

        console.error(
          "Payment verification rollback error:",
          rollbackError
        );

      }


      // =====================================================
      // ERROR LOG
      // =====================================================

      console.error(
        "Verify payment error:",
        {
          message:
            error.message,

          code:
            error.code,

          detail:
            error.detail,

          constraint:
            error.constraint,

          table:
            error.table,

          column:
            error.column,

        }
      );


      // =====================================================
      // ERROR RESPONSE
      // =====================================================

      return res.status(500).json({

        success: false,

        message:
          "Unable to verify payment",

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
// ADMIN - DELETE PAYMENT
// =========================================================
//
// OPTIONAL INTERNAL FUNCTION.
//
// Not exposed through paymentRoutes unless you explicitly
// add a delete route.
//
// =========================================================

const deletePayment =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      // =====================================================
      // PAYMENT ID
      // =====================================================

      const paymentId =
        String(
          req.params.id || ""
        ).trim();


      if (!paymentId) {

        return res.status(400).json({

          success: false,

          message:
            "Payment ID is required",

        });

      }


      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // CHECK PAYMENT
      // =====================================================

      const paymentResult =
        await client.query(
          `
          SELECT *

          FROM event_payments

          WHERE id = $1

          LIMIT 1

          FOR UPDATE
          `,
          [
            paymentId,
          ]
        );


      // =====================================================
      // NOT FOUND
      // =====================================================

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


      // =====================================================
      // DELETE PAYMENT
      // =====================================================

      await client.query(
        `
        DELETE FROM event_payments

        WHERE id = $1
        `,
        [
          paymentId,
        ]
      );


      // =====================================================
      // COMMIT
      // =====================================================

      await client.query(
        "COMMIT"
      );


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.json({

        success: true,

        message:
          "Payment deleted successfully",

        payment,

      });


    } catch (error) {

      // =====================================================
      // ROLLBACK
      // =====================================================

      try {

        await client.query(
          "ROLLBACK"
        );

      } catch (
        rollbackError
      ) {

        console.error(
          "Delete payment rollback error:",
          rollbackError
        );

      }


      // =====================================================
      // ERROR
      // =====================================================

      console.error(
        "Delete payment error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to delete payment",

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
// EXPORTS
// =========================================================
//
// USER
// - submitPayment
//
// ADMIN
// - getAllPayments
// - getPaymentById
// - verifyPayment
//
// OPTIONAL
// - deletePayment
//
// =========================================================

module.exports = {

  // =======================================================
  // USER PAYMENT
  // =======================================================

  submitPayment,


  // =======================================================
  // ADMIN PAYMENT VIEW
  // =======================================================

  getAllPayments,

  getPaymentById,


  // =======================================================
  // ADMIN PAYMENT CONFIRM / REJECT
  // =======================================================

  verifyPayment,


  // =======================================================
  // OPTIONAL DELETE
  // =======================================================

  deletePayment,

};