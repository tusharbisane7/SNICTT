const crypto = require("crypto");
const pool = require("../config/db");

// =========================================================
// GENERATE BOOKING CODE
// =========================================================

const generateBookingCode = () => {
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `SNICT-BKG-${random}`;
};

// =========================================================
// GET UPI CONFIGURATION
// =========================================================

const getUpiConfig = () => {
  return {
    upiId:
      process.env.SNICT_UPI_ID || "",

    payeeName:
      process.env.SNICT_UPI_NAME || "SNICT",
  };
};

// =========================================================
// CREATE UPI URL
// =========================================================

const createUpiUrl = ({
  upiId,
  payeeName,
  amount,
  bookingCode,
}) => {
  if (!upiId) {
    return "";
  }

  return (
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(payeeName)}` +
    `&am=${Number(amount || 0).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(bookingCode)}`
  );
};

// =========================================================
// EVENT PASS HELPERS
// =========================================================

const createPassCode = () => {
  const year = new Date().getFullYear();

  const suffix = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SNICT-PASS-${year}-${suffix}`;
};

const createPassToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

const createEventDateTime = (
  eventDate,
  eventTime,
  fallback
) => {
  if (!eventDate) {
    return null;
  }

  const date =
    String(eventDate).slice(0, 10);

  let time =
    eventTime || fallback;

  if (!time) {
    return null;
  }

  time =
    String(time).slice(0, 8);

  if (
    /^\d{1,2}:\d{2}$/.test(time)
  ) {
    time = `${time}:00`;
  }

  const result =
    new Date(
      `${date}T${time}+05:30`
    );

  return Number.isNaN(
    result.getTime()
  )
    ? null
    : result;
};

// =========================================================
// CREATE / GET EVENT PASS
// A pass is created only when the booking is confirmed AND
// the payment is verified.
// =========================================================

const createEventPassIfEligible =
  async (
    client,
    bookingId
  ) => {

    const bookingResult =
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
          u.profile_image_url,

          e.title AS event_title,
          e.event_date,
          e.start_time,
          e.end_time,

          p.payment_status,
          p.transaction_id,
          p.amount AS payment_amount

        FROM event_bookings b

        INNER JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN event_payments p
          ON p.booking_id = b.id

        WHERE b.id = $1

        LIMIT 1
        `,
        [bookingId]
      );

    if (
      bookingResult.rows.length === 0
    ) {
      return null;
    }

    const booking =
      bookingResult.rows[0];

    // =====================================================
    // CHECK ELIGIBILITY
    // =====================================================

    if (
      booking.booking_status !==
        "confirmed" ||
      booking.payment_status !==
        "verified"
    ) {
      return null;
    }

    // =====================================================
    // DO NOT CREATE DUPLICATE PASS
    // =====================================================

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

        LIMIT 1
        `,
        [bookingId]
      );

    if (
      existing.rows.length > 0
    ) {
      return existing.rows[0];
    }

    // =====================================================
    // PASS VALIDITY
    // =====================================================

    const validFrom =
      createEventDateTime(
        booking.event_date,
        booking.start_time,
        "00:00:00"
      );

    const validUntil =
      createEventDateTime(
        booking.event_date,
        booking.end_time,
        "23:59:59"
      );

    // =====================================================
    // CREATE PASS
    // =====================================================

    for (
      let attempt = 0;
      attempt < 5;
      attempt += 1
    ) {

      const passCode =
        createPassCode();

      const passToken =
        createPassToken();

      try {

        const inserted =
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

        return inserted.rows[0];

      } catch (error) {

        // PostgreSQL unique violation
        if (
          error.code !==
          "23505"
        ) {
          throw error;
        }
      }
    }

    throw new Error(
      "Unable to generate a unique event pass"
    );
  };

// =========================================================
// CREATE BOOKING
// POST /api/bookings/event/:eventId
// =========================================================

const createBooking =
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
        eventId,
      } = req.params;

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // GET EVENT
      // =====================================================

      const eventResult =
        await client.query(
          `
          SELECT *
          FROM events

          WHERE id = $1
            AND published = TRUE
            AND booking_enabled = TRUE

          FOR UPDATE
          `,
          [eventId]
        );

      if (
        eventResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          success: false,

          message:
            "Event not found or booking is closed",
        });
      }

      const event =
        eventResult.rows[0];

      // =====================================================
      // EVENT DATE / TIME
      // =====================================================

      const eventDate =
        event.event_date
          ?.toString()
          .slice(0, 10);

      const endTime =
        event.end_time
          ?.toString()
          .slice(0, 8) ||
        "23:59:59";

      const eventEnd =
        new Date(
          `${eventDate}T${endTime}+05:30`
        );

      const now =
        new Date();

      if (
        !Number.isNaN(
          eventEnd.getTime()
        ) &&
        now >= eventEnd
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({

          success: false,

          message:
            "This event has already ended",
        });
      }

      // =====================================================
      // DUPLICATE BOOKING
      // =====================================================

      const existing =
        await client.query(
          `
          SELECT
            id,
            booking_code,
            booking_status

          FROM event_bookings

          WHERE event_id = $1
            AND user_id = $2
            AND booking_status NOT IN
              ('cancelled', 'rejected')

          LIMIT 1
          `,
          [
            eventId,
            userId,
          ]
        );

      if (
        existing.rows.length > 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({

          success: false,

          message:
            "You already have a booking for this event",

          booking:
            existing.rows[0],
        });
      }

      // =====================================================
      // CHECK AVAILABLE SLOTS
      // =====================================================

      if (
        event.max_slots !== null
      ) {

        const countResult =
          await client.query(
            `
            SELECT
              COUNT(*)::INTEGER
              AS total

            FROM event_bookings

            WHERE event_id = $1

              AND booking_status IN
                (
                  'confirmed',
                  'completed'
                )
            `,
            [eventId]
          );

        const booked =
          Number(
            countResult
              .rows[0]
              ?.total || 0
          );

        if (
          booked >=
          Number(
            event.max_slots
          )
        ) {

          await client.query(
            "ROLLBACK"
          );

          return res.status(409).json({

            success: false,

            message:
              "No booking slots are available",
          });
        }
      }

      // =====================================================
      // UNIQUE BOOKING CODE
      // =====================================================

      let bookingCode =
        generateBookingCode();

      let codeExists =
        true;

      while (
        codeExists
      ) {

        const check =
          await client.query(
            `
            SELECT id
            FROM event_bookings

            WHERE booking_code = $1

            LIMIT 1
            `,
            [bookingCode]
          );

        if (
          check.rows.length === 0
        ) {

          codeExists =
            false;

        } else {

          bookingCode =
            generateBookingCode();
        }
      }

      // =====================================================
      // EVENT PRICE
      // =====================================================

      const eventAmount =
        Number(
          event.price || 0
        );

      // =====================================================
      // CREATE BOOKING
      // =====================================================

      const bookingResult =
        await client.query(
          `
          INSERT INTO event_bookings
          (
            booking_code,
            event_id,
            user_id,
            amount,
            booking_status
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            'payment_pending'
          )

          RETURNING *
          `,
          [
            bookingCode,
            eventId,
            userId,
            eventAmount,
          ]
        );

      const booking =
        bookingResult.rows[0];

      // =====================================================
      // CREATE PAYMENT
      // =====================================================

      const paymentResult =
        await client.query(
          `
          INSERT INTO event_payments
          (
            booking_id,
            payment_method,
            amount,
            payment_status
          )

          VALUES
          (
            $1,
            'upi',
            $2,
            'pending'
          )

          RETURNING *
          `,
          [
            booking.id,
            eventAmount,
          ]
        );

      await client.query(
        "COMMIT"
      );

      // =====================================================
      // UPI
      // =====================================================

      const {
        upiId,
        payeeName,
      } = getUpiConfig();

      const upiUrl =
        createUpiUrl({
          upiId,
          payeeName,
          amount:
            eventAmount,
          bookingCode,
        });

      return res.status(201).json({

        success: true,

        message:
          "Booking created. Payment is pending.",

        booking: {

          ...booking,

          title:
            event.title,

          event_id:
            booking.event_id,

          event_title:
            event.title,

          amount:
            eventAmount,

          booking_status:
            "payment_pending",

          payment_status:
            "pending",

          upi_id:
            upiId,

          upi_qr_url:
            upiUrl,

          payment_qr_url:
            upiUrl,

          payee_name:
            payeeName,
        },

        payment:
          paymentResult.rows[0],
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
        "Create booking error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to create booking",

        debug:
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
// GET USER BOOKINGS
// GET /api/bookings
// =========================================================

const getMyBookings =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;

      const result =
        await pool.query(
          `
          SELECT

            b.id,
            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,
            b.booking_status,
            b.created_at,
            b.updated_at,

            e.title,
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
            e.max_slots,

            p.id AS payment_id,
            p.payment_status,
            p.transaction_id,
            p.payment_method,
            p.payment_proof_url,
            p.amount AS payment_amount,
            p.created_at
              AS payment_created_at,

            u.profile_image_url,

            ep.id AS pass_id,
            ep.pass_code,
            ep.valid_from
              AS pass_valid_from,
            ep.valid_until
              AS pass_valid_until,
            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          INNER JOIN events e
            ON e.id = b.event_id

          INNER JOIN users u
            ON u.id = b.user_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          WHERE b.user_id = $1

          ORDER BY
            b.created_at DESC
          `,
          [userId]
        );

      return res.json({

        success: true,

        bookings:
          result.rows,
      });

    } catch (error) {

      console.error(
        "Get my bookings error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch booking history",
      });
    }
  };

// =========================================================
// GET SINGLE USER BOOKING
// GET /api/bookings/:id
// =========================================================

const getMyBookingById =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;

      const {
        id,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT

            b.id,
            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,
            b.booking_status,
            b.created_at,
            b.updated_at,

            e.title,
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
            e.max_slots,

            p.id AS payment_id,
            p.payment_method,
            p.amount AS payment_amount,
            p.payment_status,
            p.transaction_id,
            p.payment_proof_url,
            p.created_at
              AS payment_created_at,

            u.profile_image_url,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from
              AS pass_valid_from,
            ep.valid_until
              AS pass_valid_until,
            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          INNER JOIN events e
            ON e.id = b.event_id

          INNER JOIN users u
            ON u.id = b.user_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          WHERE b.id = $1
            AND b.user_id = $2

          LIMIT 1
          `,
          [
            id,
            userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Booking not found",
        });
      }

      const booking =
        result.rows[0];

      const {
        upiId,
        payeeName,
      } = getUpiConfig();

      const upiUrl =
        createUpiUrl({
          upiId,
          payeeName,
          amount:
            Number(
              booking.amount || 0
            ),
          bookingCode:
            booking.booking_code,
        });

      return res.json({

        success: true,

        booking: {

          ...booking,

          payment_status:
            booking.payment_status ||
            "pending",

          upi_id:
            upiId,

          upi_qr_url:
            upiUrl,

          payment_qr_url:
            upiUrl,

          payee_name:
            payeeName,
        },
      });

    } catch (error) {

      console.error(
        "Get booking error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch booking",
      });
    }
  };

// =========================================================
// ADMIN - GET ALL BOOKINGS
// GET /api/bookings/admin
// =========================================================

const getAllBookings =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            b.id,
            b.id AS booking_id,

            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,

            b.booking_status,
            b.booking_status AS status,

            b.created_at,
            b.created_at
              AS booking_created_at,

            b.updated_at,
            b.updated_at
              AS booking_updated_at,

            u.full_name,
            u.username,
            u.username AS user_name,
            u.email,
            u.mobile,

            e.title AS event_title,
            e.title AS event_name,
            e.event_type,
            e.description
              AS event_description,
            e.doctor_name,
            e.specialization,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.max_slots,

            p.id AS payment_id,
            p.payment_method,
            p.amount
              AS payment_amount,
            p.payment_status,
            p.transaction_id,
            p.payment_proof_url,
            p.created_at
              AS payment_created_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.valid_from
              AS pass_valid_from,
            ep.valid_until
              AS pass_valid_until

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          ORDER BY
            b.created_at DESC
          `
        );

      return res.json({

        success: true,

        bookings:
          result.rows,
      });

    } catch (error) {

      console.error(
        "Admin get bookings error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load admin bookings",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =========================================================
// ADMIN - GET SINGLE BOOKING
// GET /api/bookings/admin/:id
// =========================================================

const getAdminBookingById =
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

            b.id,
            b.id AS booking_id,

            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,

            b.booking_status,
            b.booking_status AS status,

            b.created_at,
            b.updated_at,

            u.full_name,
            u.username,
            u.username AS user_name,
            u.email,
            u.mobile,
            u.age,
            u.sex,
            u.address,
            u.blood_group,

            e.title AS event_title,
            e.title AS event_name,
            e.event_type,
            e.description
              AS event_description,
            e.doctor_name,
            e.specialization,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.max_slots,

            p.id AS payment_id,
            p.payment_method,
            p.amount
              AS payment_amount,
            p.payment_status,
            p.transaction_id,
            p.payment_proof_url,
            p.created_at
              AS payment_created_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.valid_from
              AS pass_valid_from,
            ep.valid_until
              AS pass_valid_until

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id = b.id

          WHERE b.id = $1

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
            "Booking not found",
        });
      }

      return res.json({

        success: true,

        booking:
          result.rows[0],
      });

    } catch (error) {

      console.error(
        "Admin booking details error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load booking",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =========================================================
// ADMIN - UPDATE BOOKING STATUS
// PUT /api/bookings/admin/:id/status
// =========================================================

const updateBookingStatus =
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

      const {
        status,
        bookingStatus,
        paymentStatus,
      } = req.body;

      // =====================================================
      // NORMALIZE STATUS
      // =====================================================

      const finalBookingStatus =
        bookingStatus ||
        status ||
        null;

      const finalPaymentStatus =
        paymentStatus ||
        null;

      // =====================================================
      // ALLOWED BOOKING STATUSES
      // =====================================================

      const allowedBookingStatuses = [
        "payment_pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ];

      // =====================================================
      // ALLOWED PAYMENT STATUSES
      // =====================================================

      const allowedPaymentStatuses = [
        "pending",
        "submitted",
        "verified",
        "rejected",
        "refunded",
      ];

      // =====================================================
      // VALIDATE BOOKING STATUS
      // =====================================================

      if (
        finalBookingStatus &&
        !allowedBookingStatuses.includes(
          finalBookingStatus
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            `Invalid booking status: ${finalBookingStatus}`,
        });
      }

      // =====================================================
      // VALIDATE PAYMENT STATUS
      // =====================================================

      if (
        finalPaymentStatus &&
        !allowedPaymentStatuses.includes(
          finalPaymentStatus
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            `Invalid payment status: ${finalPaymentStatus}`,
        });
      }

      // =====================================================
      // NOTHING PROVIDED
      // =====================================================

      if (
        !finalBookingStatus &&
        !finalPaymentStatus
      ) {

        return res.status(400).json({

          success: false,

          message:
            "No booking or payment status provided",
        });
      }

      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // CHECK BOOKING
      // =====================================================

      const bookingCheck =
        await client.query(
          `
          SELECT
            id,
            booking_status

          FROM event_bookings

          WHERE id = $1

          FOR UPDATE
          `,
          [id]
        );

      if (
        bookingCheck.rows.length ===
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

      // =====================================================
      // UPDATE BOOKING STATUS
      // =====================================================

      if (
        finalBookingStatus
      ) {

        await client.query(
          `
          UPDATE event_bookings

          SET
            booking_status = $1,
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2
          `,
          [
            finalBookingStatus,
            id,
          ]
        );
      }

      // =====================================================
      // UPDATE PAYMENT STATUS
      // =====================================================

      if (
        finalPaymentStatus
      ) {

        const paymentResult =
          await client.query(
            `
            UPDATE event_payments

            SET
              payment_status = $1

            WHERE booking_id = $2

            RETURNING *
            `,
            [
              finalPaymentStatus,
              id,
            ]
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
              "Payment record not found",
          });
        }
      }

      // =====================================================
      // GENERATE EVENT PASS WHEN
      // PAYMENT IS VERIFIED AND
      // BOOKING IS CONFIRMED
      // =====================================================

      const currentStatusResult =
        await client.query(
          `
          SELECT

            b.booking_status,
            p.payment_status

          FROM event_bookings b

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          WHERE b.id = $1

          LIMIT 1
          `,
          [id]
        );

      if (
        currentStatusResult.rows.length >
        0
      ) {

        await createEventPassIfEligible(
          client,
          id
        );
      }

      // =====================================================
      // GET UPDATED BOOKING
      // =====================================================
      //
      // IMPORTANT:
      // event_bookings has "id",
      // not "booking_id".
      //
      // =====================================================

      const updated =
        await client.query(
          `
          SELECT

            b.id,
            b.id AS booking_id,

            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,

            b.booking_status,
            b.booking_status AS status,

            b.created_at,
            b.updated_at,

            p.id AS payment_id,
            p.payment_status,
            p.transaction_id,
            p.payment_method,
            p.payment_proof_url,
            p.amount AS payment_amount,
            p.created_at
              AS payment_created_at

          FROM event_bookings b

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          WHERE b.id = $1

          LIMIT 1
          `,
          [id]
        );

      // =====================================================
      // COMMIT
      // =====================================================

      await client.query(
        "COMMIT"
      );

      return res.json({

        success: true,

        message:
          "Booking updated successfully",

        booking:
          updated.rows[0],
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
        "Update booking status error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to update booking",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

        detail:
          process.env.NODE_ENV ===
          "development"
            ? error.detail
            : undefined,
      });

    } finally {

      client.release();
    }
  };

// =========================================================
// ADMIN - DELETE BOOKING
// DELETE /api/bookings/admin/:id
// =========================================================

const deleteBooking =
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

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // CHECK BOOKING
      // =====================================================

      const check =
        await client.query(
          `
          SELECT
            id,
            booking_code

          FROM event_bookings

          WHERE id = $1

          FOR UPDATE
          `,
          [id]
        );

      if (
        check.rows.length ===
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

      // =====================================================
      // DELETE PAYMENT
      // =====================================================

      await client.query(
        `
        DELETE FROM event_payments

        WHERE booking_id = $1
        `,
        [id]
      );

      // =====================================================
      // DELETE BOOKING
      // =====================================================

      const result =
        await client.query(
          `
          DELETE FROM event_bookings

          WHERE id = $1

          RETURNING
            id,
            booking_code
          `,
          [id]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({

        success: true,

        message:
          "Booking deleted successfully",

        booking:
          result.rows[0],
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
        "Delete booking error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to delete booking",

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
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
// =========================================================

const getMyPass =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;

      const {
        id,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT

            ep.id,
            ep.booking_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at
              AS pass_created_at,

            b.booking_code,
            b.event_id,
            b.amount,
            b.booking_status,

            u.full_name,
            u.username,
            u.profile_image_url,

            e.title AS event_name,
            e.event_date,
            e.start_time,
            e.end_time,

            p.payment_status,
            p.transaction_id,
            p.amount
              AS payment_amount

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id = ep.booking_id

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          WHERE ep.booking_id = $1
            AND b.user_id = $2
            AND b.booking_status =
              'confirmed'
            AND p.payment_status =
              'verified'

          LIMIT 1
          `,
          [
            id,
            userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Event pass is not available. Please make sure your payment is verified and booking is confirmed.",
        });
      }

      const pass =
        result.rows[0];

      return res.json({

        success: true,

        pass: {

          ...pass,

          status:
            "valid",
        },
      });

    } catch (error) {

      console.error(
        "Get event pass error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load event pass",
      });
    }
  };

// =========================================================
// EXPORT
// =========================================================

module.exports = {

  createBooking,

  getMyBookings,

  getMyBookingById,

  getMyPass,

  getAllBookings,

  getAdminBookingById,

  updateBookingStatus,

  deleteBooking,
};