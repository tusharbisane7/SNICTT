const pool = require("../config/db");
const crypto = require("crypto");

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
// GENERATE EVENT PASS CODE
// =========================================================

const generatePassCode = () => {
  const random = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SNICT-PASS-${random}`;
};

// =========================================================
// GENERATE SECURE PASS TOKEN
// =========================================================

const generatePassToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// =========================================================
// GET UPI CONFIGURATION
// =========================================================

const getUpiConfig = () => {
  return {
    upiId:
      process.env.SNICT_UPI_ID || "",

    payeeName:
      process.env.SNICT_UPI_NAME ||
      "SNICT",
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
    `upi://pay?pa=${encodeURIComponent(
      upiId
    )}` +
    `&pn=${encodeURIComponent(
      payeeName
    )}` +
    `&am=${Number(
      amount || 0
    ).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      bookingCode
    )}`
  );
};

// =========================================================
// CREATE EVENT PASS
// =========================================================

const createEventPass = async (
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
    return existingPass.rows[0];
  }

  // =======================================================
  // GET BOOKING + USER + EVENT + PAYMENT
  // =======================================================

  const result =
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
        u.profile_image_url,

        e.title AS event_name,
        e.event_date,
        e.start_time,
        e.end_time,
        e.venue,

        p.payment_status

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
    result.rows.length === 0
  ) {
    throw new Error(
      "Booking not found while creating event pass"
    );
  }

  const booking =
    result.rows[0];

  // =======================================================
  // ONLY CONFIRMED + VERIFIED
  // =======================================================

  if (
    booking.booking_status !==
      "confirmed" ||
    booking.payment_status !==
      "verified"
  ) {
    return null;
  }

  // =======================================================
  // GENERATE UNIQUE PASS CODE
  // =======================================================

  let passCode;
  let codeExists = true;

  while (codeExists) {

    passCode =
      generatePassCode();

    const check =
      await client.query(
        `
        SELECT id
        FROM event_passes
        WHERE pass_code = $1
        LIMIT 1
        `,
        [passCode]
      );

    codeExists =
      check.rows.length > 0;
  }

  // =======================================================
  // SECURE TOKEN
  // =======================================================

  const passToken =
    generatePassToken();

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
  // VALIDITY
  // =======================================================

  const validFrom =
    `${eventDate}T${startTime}+05:30`;

  const validUntil =
    `${eventDate}T${endTime}+05:30`;

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

  return passResult.rows[0];
};

// =========================================================
// CREATE BOOKING
// POST /api/bookings/event/:eventId
// =========================================================

const createBooking = async (
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
      eventResult.rows.length ===
      0
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
    // EVENT DATE
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
          (
            'cancelled',
            'rejected'
          )

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
          countResult.rows[0]
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

    let codeExists = true;

    while (codeExists) {

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
        check.rows.length ===
        0
      ) {
        codeExists = false;
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
    } =
      getUpiConfig();

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

        pass:
          null,
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

            b.id AS booking_id,

            b.booking_code,

            b.user_id,

            b.event_id,

            b.amount,

            b.booking_status,

            b.created_at,

            b.updated_at,

            -- USER
            u.full_name,

            u.username,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

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

            -- PAYMENT
            p.id AS payment_id,

            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.payment_proof_url,

            p.amount AS payment_amount,

            p.created_at
              AS payment_created_at,

            -- EVENT PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN users u
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

            b.id AS booking_id,

            b.booking_code,

            b.user_id,

            b.event_id,

            b.amount,

            b.booking_status,

            b.created_at,

            b.updated_at,

            -- USER
            u.full_name,

            u.username,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

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

            -- PAYMENT
            p.id AS payment_id,

            p.payment_method,

            p.amount AS payment_amount,

            p.payment_status,

            p.transaction_id,

            p.payment_proof_url,

            p.created_at
              AS payment_created_at,

            -- PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN users u
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

      // ===================================================
      // UPI
      // ===================================================

      const {
        upiId,
        payeeName,
      } =
        getUpiConfig();

      const upiUrl =
        createUpiUrl({

          upiId,

          payeeName,

          amount:
            Number(
              booking.amount ||
              0
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

          has_pass:
            Boolean(
              booking.pass_id
            ),

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
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
//
// UPDATED
//
// IMPORTANT:
// We only verify that the pass belongs to
// the logged-in user.
//
// We DO NOT additionally require:
//
// booking_status = confirmed
// payment_status = verified
//
// because the pass itself is already stored
// in event_passes.
//
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

            ep.id AS pass_id,

            ep.booking_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at,

            -- BOOKING
            b.booking_code,

            b.user_id,

            b.event_id,

            b.amount,

            b.booking_status,

            -- USER
            u.full_name,

            u.username,

            u.email,

            u.mobile,

            u.profile_image_url,

            -- EVENT
            e.id AS event_id,

            e.title AS event_name,

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

            -- PAYMENT
            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.payment_proof_url,

            p.verified_at

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id = ep.booking_id

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id = b.id

          WHERE ep.booking_id = $1

            AND b.user_id = $2

          LIMIT 1
          `,
          [
            id,
            userId,
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
            "Event pass not found.",

        });

      }

      // =====================================================
      // RETURN PASS
      // =====================================================

      return res.json({

        success: true,

        message:
          "Event pass fetched successfully.",

        pass:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "Get event pass error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch event pass.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

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

            b.created_at
              AS booking_created_at,

            b.updated_at
              AS booking_updated_at,

            -- USER
            u.full_name,

            u.username,

            u.username
              AS user_name,

            u.email,

            u.mobile,

            u.profile_image_url,

            -- EVENT
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

            -- PAYMENT
            p.id AS payment_id,

            p.payment_method,

            p.amount
              AS payment_amount,

            p.payment_status,

            p.transaction_id,

            p.payment_proof_url,

            p.created_at
              AS payment_created_at,

            -- PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.valid_from,

            ep.valid_until

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

            b.booking_status
              AS status,

            b.created_at,

            b.updated_at,

            -- USER
            u.full_name,

            u.username,

            u.username
              AS user_name,

            u.email,

            u.mobile,

            u.age,

            u.sex,

            u.address,

            u.blood_group,

            u.profile_image_url,

            -- EVENT
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

            -- PAYMENT
            p.id AS payment_id,

            p.payment_method,

            p.amount
              AS payment_amount,

            p.payment_status,

            p.transaction_id,

            p.payment_proof_url,

            p.created_at
              AS payment_created_at,

            -- PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at

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
//
// Body examples:
//
// {
//   "status": "confirmed"
// }
//
// {
//   "status": "completed"
// }
//
// {
//   "status": "cancelled"
// }
//
// {
//   "status": "rejected"
// }
//
// {
//   "status": "payment_pending"
// }
//
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
      } = req.body || {};

      // =====================================================
      // VALIDATE BOOKING ID
      // =====================================================

      if (
        !id ||
        Number.isNaN(
          Number(id)
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid booking ID",

        });

      }

      // =====================================================
      // ALLOWED BOOKING STATUS
      // =====================================================

      const allowedStatuses = [
        "payment_pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ];

      if (
        !allowedStatuses.includes(
          String(status)
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid booking status",

          allowedStatuses,

        });

      }

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // LOCK BOOKING
      // =====================================================

      const bookingCheck =
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
      // FINAL BOOKING STATUS
      // =====================================================

      const finalBookingStatus =
        String(status);

      // =====================================================
      // PAYMENT STATUS
      //
      // confirmed/completed
      //       => verified
      //
      // rejected
      //       => rejected
      //
      // payment_pending
      //       => pending
      //
      // =====================================================

      let finalPaymentStatus =
        null;

      if (
        finalBookingStatus ===
          "confirmed" ||
        finalBookingStatus ===
          "completed"
      ) {

        finalPaymentStatus =
          "verified";

      } else if (
        finalBookingStatus ===
        "rejected"
      ) {

        finalPaymentStatus =
          "rejected";

      } else if (
        finalBookingStatus ===
        "payment_pending"
      ) {

        finalPaymentStatus =
          "pending";

      }

      // =====================================================
      // UPDATE BOOKING STATUS
      // =====================================================

      await client.query(
        `
        UPDATE event_bookings

        SET

          booking_status =
            $1,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id =
          $2
        `,
        [
          finalBookingStatus,
          id,
        ]
      );

      // =====================================================
      // UPDATE PAYMENT
      // =====================================================

      if (
        finalPaymentStatus
      ) {

        const paymentResult =
          await client.query(
            `
            UPDATE event_payments

            SET

              payment_status =
                $1,

              verified_by =
                CASE
                  WHEN $1 = 'verified'
                  THEN $3
                  ELSE verified_by
                END,

              verified_at =
                CASE
                  WHEN $1 = 'verified'
                  THEN CURRENT_TIMESTAMP
                  ELSE verified_at
                END

            WHERE booking_id =
              $2

            RETURNING *
            `,
            [
              finalPaymentStatus,
              id,
              req.adminId || null,
            ]
          );

        // ===================================================
        // PAYMENT RECORD NOT FOUND
        // ===================================================

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
      // EVENT PASS
      //
      // ONLY CONFIRMED/COMPLETED + VERIFIED
      // =====================================================

      let eventPass =
        null;

      const currentStatus =
        await client.query(
          `
          SELECT

            b.booking_status,

            p.payment_status

          FROM event_bookings b

          LEFT JOIN event_payments p
            ON p.booking_id =
               b.id

          WHERE b.id =
            $1

          LIMIT 1
          `,
          [id]
        );

      if (
        currentStatus.rows.length >
        0
      ) {

        const current =
          currentStatus.rows[0];

        if (
          (
            current.booking_status ===
              "confirmed" ||

            current.booking_status ===
              "completed"
          ) &&

          current.payment_status ===
            "verified"
        ) {

          eventPass =
            await createEventPass(
              client,
              id
            );

        }

      }

      // =====================================================
      // GET UPDATED BOOKING
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

            b.booking_status
              AS status,

            b.created_at,

            b.updated_at,

            -- USER
            u.full_name,

            u.username,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            e.image_url,

            -- PAYMENT
            p.id AS payment_id,

            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.payment_proof_url,

            p.amount
              AS payment_amount,

            p.verified_by,

            p.verified_at,

            -- PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id =
               b.user_id

          LEFT JOIN events e
            ON e.id =
               b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id =
               b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id =
               b.id

          WHERE b.id =
            $1

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

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        message:
          "Booking updated successfully",

        booking:
          updated.rows[0],

        pass:
          eventPass,

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
// ADMIN - CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
//
// FLOW:
//
// Payment submitted
//       ↓
// Admin confirms payment
//       ↓
// event_payments = verified
//       ↓
// event_bookings = confirmed
//       ↓
// Event pass generated/reused
//
// =========================================================

const confirmPayment =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const bookingId =
        Number(
          req.params.id
        );

      // =====================================================
      // VALIDATE ID
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
      // BEGIN TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // LOCK BOOKING
      // =====================================================

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

          WHERE id =
            $1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
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

      // =====================================================
      // GET PAYMENT
      // =====================================================

      const paymentResult =
        await client.query(
          `
          SELECT *

          FROM event_payments

          WHERE booking_id =
            $1

          ORDER BY id DESC

          LIMIT 1

          FOR UPDATE
          `,
          [
            bookingId,
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

      const payment =
        paymentResult.rows[0];

      // =====================================================
      // CHECK ALREADY VERIFIED
      // =====================================================

      if (
        payment.payment_status ===
          "verified" &&

        booking.booking_status ===
          "confirmed"
      ) {

        // -----------------------------------------------
        // PASS SHOULD ALREADY EXIST
        // -----------------------------------------------

        const existingPass =
          await client.query(
            `
            SELECT *

            FROM event_passes

            WHERE booking_id =
              $1

            LIMIT 1
            `,
            [
              bookingId,
            ]
          );

        let existingPassData =
          existingPass.rows[0] ||
          null;

        // -----------------------------------------------
        // IF PASS MISSING, GENERATE IT
        // -----------------------------------------------

        if (
          !existingPassData
        ) {

          existingPassData =
            await createEventPass(
              client,
              bookingId
            );

        }

        await client.query(
          "COMMIT"
        );

        return res.json({

          success: true,

          message:
            "Payment was already confirmed",

          alreadyConfirmed:
            true,

          booking: booking,

          pass:
            existingPassData,

        });

      }

      // =====================================================
      // VERIFY PAYMENT
      // =====================================================

      const verifiedPayment =
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

          WHERE booking_id =
            $2

          RETURNING *
          `,
          [
            req.adminId ||
              null,

            bookingId,
          ]
        );

      if (
        verifiedPayment.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          success: false,

          message:
            "Unable to verify payment",

        });

      }

      // =====================================================
      // CONFIRM BOOKING
      // =====================================================

      const confirmedBooking =
        await client.query(
          `
          UPDATE event_bookings

          SET

            booking_status =
              'confirmed',

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id =
            $1

          RETURNING *
          `,
          [
            bookingId,
          ]
        );

      if (
        confirmedBooking.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          success: false,

          message:
            "Unable to confirm booking",

        });

      }

      // =====================================================
      // CREATE / REUSE EVENT PASS
      // =====================================================

      const eventPass =
        await createEventPass(
          client,
          bookingId
        );

      // =====================================================
      // GET COMPLETE UPDATED RECORD
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

            b.booking_status
              AS status,

            b.created_at,

            b.updated_at,

            -- USER
            u.full_name,

            u.username,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            e.image_url,

            -- PAYMENT
            p.id AS payment_id,

            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.payment_proof_url,

            p.amount
              AS payment_amount,

            p.verified_by,

            p.verified_at,

            -- PASS
            ep.id AS pass_id,

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,

            ep.valid_until,

            ep.created_at
              AS pass_created_at

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id =
               b.user_id

          LEFT JOIN events e
            ON e.id =
               b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id =
               b.id

          LEFT JOIN event_passes ep
            ON ep.booking_id =
               b.id

          WHERE b.id =
            $1

          LIMIT 1
          `,
          [
            bookingId,
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

      return res.status(200).json({

        success: true,

        message:
          "Payment confirmed successfully",

        booking:
          updated.rows[0],

        pass:
          eventPass,

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
          "Rollback error:",
          rollbackError
        );

      }

      console.error(
        "Confirm payment error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to confirm payment",

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
// ADMIN - GET ALL PASSES
// GET /api/bookings/admin/passes
// =========================================================

const getAdminPasses =
  async (
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

            ep.created_at
              AS pass_created_at,

            -- BOOKING
            b.booking_code,

            b.user_id,

            b.event_id,

            b.amount,

            b.booking_status,

            -- USER
            u.full_name,

            u.username,

            u.email,

            u.mobile,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            -- PAYMENT
            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.amount
              AS payment_amount,

            p.verified_at

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id =
               ep.booking_id

          LEFT JOIN users u
            ON u.id =
               b.user_id

          LEFT JOIN events e
            ON e.id =
               b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id =
               b.id

          ORDER BY
            ep.created_at DESC
          `
        );

      return res.json({

        success: true,

        passes:
          result.rows,

      });

    } catch (error) {

      console.error(
        "Get admin passes error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch event passes",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

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

      const bookingId =
        Number(
          req.params.id
        );

      // =====================================================
      // VALIDATE ID
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

            ep.created_at
              AS pass_created_at,

            -- BOOKING
            b.booking_code,

            b.user_id,

            b.event_id,

            b.amount,

            b.booking_status,

            -- USER
            u.full_name,

            u.username,

            u.email,

            u.mobile,

            u.profile_image_url,

            -- EVENT
            e.title AS event_title,

            e.title AS event_name,

            e.event_type,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,

            e.image_url,

            -- PAYMENT
            p.payment_status,

            p.transaction_id,

            p.payment_method,

            p.payment_proof_url,

            p.amount
              AS payment_amount,

            p.verified_by,

            p.verified_at

          FROM event_passes ep

          INNER JOIN event_bookings b
            ON b.id =
               ep.booking_id

          LEFT JOIN users u
            ON u.id =
               b.user_id

          LEFT JOIN events e
            ON e.id =
               b.event_id

          LEFT JOIN event_payments p
            ON p.booking_id =
               b.id

          WHERE ep.booking_id =
            $1

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

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        message:
          "Event pass fetched successfully",

        pass:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "Get admin pass error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch event pass",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

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

      const bookingId =
        Number(
          req.params.id
        );

      // =====================================================
      // VALIDATE ID
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
      // BEGIN TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // CHECK BOOKING
      // =====================================================

      const bookingResult =
        await client.query(
          `
          SELECT
            id,
            booking_code

          FROM event_bookings

          WHERE id = $1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
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

      // =====================================================
      // DELETE BOOKING
      //
      // event_passes/payment records should be removed
      // through foreign-key cascade where configured.
      // =====================================================

      const deleteResult =
        await client.query(
          `
          DELETE FROM event_bookings

          WHERE id = $1

          RETURNING *
          `,
          [
            bookingId,
          ]
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
          "Booking deleted successfully",

        booking:
          deleteResult.rows[0],

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
// EXPORT CONTROLLERS
// =========================================================

module.exports = {

  // -------------------------------------------------------
  // USER
  // -------------------------------------------------------

  createBooking,

  getMyBookings,

  getMyBookingById,

  getMyPass,

  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------

  getAllBookings,

  getAdminBookingById,

  updateBookingStatus,

  confirmPayment,

  getAdminPasses,

  getAdminPassByBookingId,

  deleteBooking,

};