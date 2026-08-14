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
// Pass is generated ONLY when:
// booking_status = confirmed
// payment_status = verified
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
    existingPass.rows.length >
    0
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
      check.rows.length >
      0;

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
      existing.rows.length >
      0
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
            COUNT(*)::INTEGER AS total

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

            ep.pass_code,

            ep.pass_token,

            ep.valid_from,
            ep.valid_until,

            ep.created_at
              AS pass_created_at,


            b.id AS booking_id,

            b.booking_code,

            b.amount,

            b.booking_status,


            u.full_name,

            u.username,

            u.profile_image_url,


            e.id AS event_id,

            e.title AS event_name,

            e.event_date,

            e.start_time,

            e.end_time,

            e.venue,

            e.event_mode,


            p.payment_status,

            p.transaction_id

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
            "Valid event pass not found.",

        });

      }


      return res.json({

        success: true,

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
      // NORMALIZE
      // =====================================================

      let finalBookingStatus =
        bookingStatus ||
        status ||
        null;


      let finalPaymentStatus =
        paymentStatus ||
        null;


      // =====================================================
      // AUTOMATIC PAYMENT STATUS
      // =====================================================
      // If admin confirms booking without explicitly
      // providing payment status, payment becomes verified.
      // =====================================================

      if (
        finalBookingStatus ===
        "confirmed" &&
        !finalPaymentStatus
      ) {

        finalPaymentStatus =
          "verified";

      }


      // =====================================================
      // AUTOMATIC BOOKING STATUS
      // =====================================================
      // If payment is verified, booking becomes confirmed.
      // =====================================================

      if (
        finalPaymentStatus ===
        "verified" &&
        !finalBookingStatus
      ) {

        finalBookingStatus =
          "confirmed";

      }


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
      // VALIDATION
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
      // AUTOMATIC EVENT PASS
      // =====================================================
      // Confirmed booking + verified payment
      // = generate pass
      // =====================================================

      let eventPass = null;


      const currentStatus =
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
        currentStatus.rows.length >
        0
      ) {

        const current =
          currentStatus.rows[0];


        if (

          current.booking_status ===
            "confirmed" &&

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


            u.full_name,

            u.username,

            u.profile_image_url,


            e.title AS event_title,

            e.title AS event_name,

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

            p.payment_proof_url,

            p.amount AS payment_amount,


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
      // DELETE PASS
      // =====================================================

      await client.query(
        `
        DELETE FROM event_passes

        WHERE booking_id = $1
        `,
        [id]
      );


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