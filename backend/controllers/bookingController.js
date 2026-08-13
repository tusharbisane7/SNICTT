const pool = require("../config/db");
const crypto = require("crypto");

// =========================================================
// BOOKING CONTROLLER
// SNICT
// =========================================================
//
// FEATURES
//
// - Create event booking
// - Create UPI payment
// - Get user bookings
// - Get single booking
// - Generate event pass
// - Generate secure QR payload
// - Admin booking management
// - Payment status management
// - Delete booking
//
// IMPORTANT
//
// Attendance is handled separately by:
// controllers/attendanceController.js
//
// DO NOT JOIN event_attendance here.
//
// Database structure:
//
// event_bookings.event_id = INTEGER
// events.id              = INTEGER
// event_attendance.event_id = UUID
//
// Therefore attendance is connected using:
//
// event_attendance.booking_id
// event_bookings.id
//
// =========================================================


// =========================================================
// HELPERS
// =========================================================

const generateBookingCode = () => {
  return `SNICT-BKG-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
};


const generatePassCode = () => {
  return `SNICT-PASS-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


const generatePassToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};


// =========================================================
// DATABASE ERROR
// =========================================================

const sendDatabaseError = (
  res,
  message,
  error
) => {

  console.error(
    "===================================="
  );

  console.error(message);

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
      process.env.NODE_ENV !== "production"
        ? {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            table: error.table,
            column: error.column,
            constraint: error.constraint,
          }
        : undefined,
  });
};


// =========================================================
// UPI CONFIG
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

  // -------------------------------------------------------
  // CHECK EXISTING PASS
  // -------------------------------------------------------

  const existingPass =
    await client.query(
      `
      SELECT *
      FROM event_passes
      WHERE booking_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [bookingId]
    );

  if (
    existingPass.rows.length > 0
  ) {
    return existingPass.rows[0];
  }


  // -------------------------------------------------------
  // GET BOOKING
  // -------------------------------------------------------

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
        e.event_mode,

        p.payment_status

      FROM event_bookings b

      INNER JOIN users u
        ON u.id = b.user_id

      INNER JOIN events e
        ON e.id = b.event_id

      LEFT JOIN LATERAL (
        SELECT
          payment_status
        FROM event_payments
        WHERE booking_id = b.id
        ORDER BY id DESC
        LIMIT 1
      ) p ON TRUE

      WHERE b.id = $1

      LIMIT 1
      `,
      [bookingId]
    );


  if (
    result.rows.length === 0
  ) {

    throw new Error(
      "Booking not found while creating pass"
    );
  }


  const booking =
    result.rows[0];


  // -------------------------------------------------------
  // ONLY CONFIRMED + VERIFIED
  // -------------------------------------------------------

  if (
    booking.booking_status !==
      "confirmed" ||
    booking.payment_status !==
      "verified"
  ) {

    return null;
  }


  // -------------------------------------------------------
  // UNIQUE PASS CODE
  // -------------------------------------------------------

  let passCode = null;

  for (
    let i = 0;
    i < 20;
    i++
  ) {

    const generated =
      generatePassCode();

    const check =
      await client.query(
        `
        SELECT id
        FROM event_passes
        WHERE pass_code = $1
        LIMIT 1
        `,
        [generated]
      );

    if (
      check.rows.length === 0
    ) {

      passCode = generated;

      break;
    }
  }


  if (!passCode) {

    throw new Error(
      "Unable to generate unique pass code"
    );
  }


  const passToken =
    generatePassToken();


  // -------------------------------------------------------
  // EVENT DATE / TIME
  // -------------------------------------------------------

  const eventDate =
    booking.event_date
      ?.toString()
      .slice(0, 10);

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


    if (!userId) {

      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }


    if (!eventId) {

      return res.status(400).json({
        success: false,
        message:
          "Event ID is required",
      });
    }


    await client.query(
      "BEGIN"
    );


    // -------------------------------------------------------
    // GET EVENT
    // -------------------------------------------------------

    const eventResult =
      await client.query(
        `
        SELECT
          id,
          title,
          event_type,
          description,
          doctor_name,
          specialization,
          event_date,
          start_time,
          end_time,
          venue,
          event_mode,
          price,
          max_slots,
          image_url,
          booking_enabled,
          published

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


    // -------------------------------------------------------
    // EVENT END CHECK
    // -------------------------------------------------------

    if (
      event.event_date &&
      event.end_time
    ) {

      const eventDate =
        event.event_date
          .toString()
          .slice(0, 10);

      const endTime =
        event.end_time
          .toString()
          .slice(0, 8);

      const eventEnd =
        new Date(
          `${eventDate}T${endTime}+05:30`
        );


      if (
        !Number.isNaN(
          eventEnd.getTime()
        ) &&
        new Date() >= eventEnd
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
    }


    // -------------------------------------------------------
    // DUPLICATE BOOKING CHECK
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // SLOT CHECK
    // -------------------------------------------------------

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
        Number(event.max_slots)
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


    // -------------------------------------------------------
    // UNIQUE BOOKING CODE
    // -------------------------------------------------------

    let bookingCode = null;

    for (
      let i = 0;
      i < 20;
      i++
    ) {

      const generated =
        generateBookingCode();

      const check =
        await client.query(
          `
          SELECT id
          FROM event_bookings
          WHERE booking_code = $1
          LIMIT 1
          `,
          [generated]
        );

      if (
        check.rows.length === 0
      ) {

        bookingCode =
          generated;

        break;
      }
    }


    if (!bookingCode) {

      throw new Error(
        "Unable to generate unique booking code"
      );
    }


    // -------------------------------------------------------
    // BOOKING AMOUNT
    // -------------------------------------------------------

    const amount =
      Number(event.price || 0);


    // -------------------------------------------------------
    // CREATE BOOKING
    // -------------------------------------------------------

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

        RETURNING
          id,
          booking_code,
          event_id,
          user_id,
          amount,
          booking_status,
          created_at
        `,
        [
          bookingCode,
          eventId,
          userId,
          amount,
        ]
      );


    const booking =
      bookingResult.rows[0];


    // -------------------------------------------------------
    // UPI CONFIG
    // -------------------------------------------------------

    const upiConfig =
      getUpiConfig();


    const upiUrl =
      createUpiUrl({
        upiId:
          upiConfig.upiId,

        payeeName:
          upiConfig.payeeName,

        amount:
          booking.amount,

        bookingCode:
          booking.booking_code,
      });


    // -------------------------------------------------------
    // COMMIT
    // -------------------------------------------------------

    await client.query(
      "COMMIT"
    );


    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(201).json({

      success: true,

      message:
        "Booking created successfully",

      booking: {
        ...booking,

        event: {
          id:
            event.id,

          title:
            event.title,

          event_date:
            event.event_date,

          start_time:
            event.start_time,

          end_time:
            event.end_time,

          venue:
            event.venue,

          event_mode:
            event.event_mode,
        },

        payment: {
          amount:
            booking.amount,

          payment_status:
            "pending",

          payment_method:
            "upi",

          upi_id:
            upiConfig.upiId,

          payee_name:
            upiConfig.payeeName,

          upi_url:
            upiUrl,
        },
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


    return sendDatabaseError(
      res,
      "Unable to create booking",
      error
    );

  } finally {

    client.release();
  }
};


// =========================================================
// SUBMIT PAYMENT
// POST /api/bookings/:bookingId/payment
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

const submitPayment = async (
  req,
  res
) => {

  const client =
    await pool.connect();

  try {

    const userId =
      req.userId;

    const {
      id: bookingId,
    } = req.params;


    const {
      transactionId,
      paymentProofUrl,
      paymentMethod,
      payment_method,
    } = req.body;


    if (!userId) {

      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }


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


    await client.query(
      "BEGIN"
    );


    // -------------------------------------------------------
    // GET BOOKING
    // -------------------------------------------------------

    const bookingResult =
      await client.query(
        `
        SELECT
          id,
          booking_code,
          event_id,
          user_id,
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


    // -------------------------------------------------------
    // BLOCK CANCELLED / REJECTED
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // PAYMENT METHOD
    // -------------------------------------------------------

    const method =
      String(
        paymentMethod ||
        payment_method ||
        "upi"
      ).trim();


    // -------------------------------------------------------
    // PAYMENT PROOF
    // -------------------------------------------------------

    const proofUrl =
      paymentProofUrl
        ? String(
            paymentProofUrl
          ).trim()
        : null;


    // -------------------------------------------------------
    // CHECK EXISTING PAYMENT
    // -------------------------------------------------------

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
        [bookingId]
      );


    let payment;


    if (
      existingPayment.rows.length > 0
    ) {

      const existing =
        existingPayment.rows[0];


      // -----------------------------------------------------
      // ALREADY VERIFIED
      // -----------------------------------------------------

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


      // -----------------------------------------------------
      // UPDATE EXISTING PAYMENT
      // -----------------------------------------------------

      const updateResult =
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
            method,
            cleanTransactionId,
            booking.amount,
            proofUrl,
            existing.id,
          ]
        );


      payment =
        updateResult.rows[0];

    } else {

      // -----------------------------------------------------
      // CREATE PAYMENT
      // -----------------------------------------------------

      const insertResult =
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
            method,
            cleanTransactionId,
            booking.amount,
            proofUrl,
          ]
        );


      payment =
        insertResult.rows[0];
    }


    // -------------------------------------------------------
    // KEEP BOOKING PAYMENT PENDING
    // -------------------------------------------------------

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
      [bookingId]
    );


    // -------------------------------------------------------
    // COMMIT
    // -------------------------------------------------------

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

        event_id:
          booking.event_id,

        amount:
          booking.amount,

        booking_status:
          "payment_pending",

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


    return sendDatabaseError(
      res,
      "Unable to submit payment",
      error
    );

  } finally {

    client.release();
  }
};


// =========================================================
// GET MY BOOKINGS
// GET /api/bookings
// =========================================================

const getMyBookings = async (
  req,
  res
) => {

  try {

    const userId =
      req.userId;


    if (!userId) {

      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }


    const result =
      await pool.query(
        `
        SELECT

          b.id,
          b.booking_code,
          b.event_id,
          b.user_id,
          b.amount,
          b.booking_status,
          b.created_at,
          b.updated_at,

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
          p.payment_method,
          p.transaction_id,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_at,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until

        FROM event_bookings b

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
          FROM event_passes
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ep ON TRUE

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

      total:
        result.rows.length,
    });

  } catch (error) {

    return sendDatabaseError(
      res,
      "Unable to fetch your bookings",
      error
    );
  }
};


// =========================================================
// GET MY BOOKING BY ID
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


      if (!userId) {

        return res.status(401).json({
          success: false,
          message:
            "User authentication required",
        });
      }


      const result =
        await pool.query(
          `
          SELECT

            b.id,
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount,
            b.booking_status,
            b.created_at,
            b.updated_at,

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
            e.price,
            e.image_url,

            p.id AS payment_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until

          FROM event_bookings b

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
            FROM event_passes
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ep ON TRUE

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
        result.rows.length === 0
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

      return sendDatabaseError(
        res,
        "Unable to fetch booking",
        error
      );
    }
  };


// =========================================================
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
// =========================================================

const getMyPass = async (
  req,
  res
) => {

  try {

    const userId =
      req.userId;

    const {
      id,
    } = req.params;


    if (!userId) {

      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }


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
          ep.created_at,

          b.booking_code,
          b.amount,
          b.booking_status,

          u.full_name,
          u.username,
          u.email,
          u.mobile,

          e.id AS event_id,
          e.title AS event_title,
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

        LEFT JOIN LATERAL (
          SELECT
            payment_status,
            transaction_id
          FROM event_payments
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) p ON TRUE

        WHERE ep.booking_id = $1
          AND b.user_id = $2

        LIMIT 1
        `,
        [
          id,
          userId,
        ]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Event pass not found",
      });
    }


    return res.json({

      success: true,

      pass:
        result.rows[0],
    });

  } catch (error) {

    return sendDatabaseError(
      res,
      "Unable to fetch event pass",
      error
    );
  }
};


// =========================================================
// GET ALL BOOKINGS - ADMIN
// GET /api/bookings/admin
// =========================================================

const getAllBookings = async (
  req,
  res
) => {

  try {

    const result =
      await pool.query(
        `
        SELECT

          b.id,
          b.booking_code,
          b.event_id,
          b.user_id,
          b.amount,
          b.booking_status,
          b.created_at,
          b.updated_at,

          u.full_name,
          u.username,
          u.email,
          u.mobile,
          u.profile_image_url,

          e.title AS event_title,
          e.event_type,
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode,
          e.price,

          p.id AS payment_id,
          p.payment_method,
          p.transaction_id,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_by,
          p.verified_at,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until

        FROM event_bookings b

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
          FROM event_passes
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ep ON TRUE

        ORDER BY
          b.created_at DESC
        `
      );


    return res.json({

      success: true,

      bookings:
        result.rows,

      total:
        result.rows.length,
    });

  } catch (error) {

    return sendDatabaseError(
      res,
      "Unable to fetch all bookings",
      error
    );
  }
};


// =========================================================
// GET ADMIN BOOKING BY ID
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
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount,
            b.booking_status,
            b.created_at,
            b.updated_at,

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
            e.price,
            e.max_slots,

            p.id AS payment_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until

          FROM event_bookings b

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
            FROM event_passes
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ep ON TRUE

          WHERE b.id = $1

          LIMIT 1
          `,
          [id]
        );


    if (
      result.rows.length === 0
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

    return sendDatabaseError(
      res,
      "Unable to fetch booking",
      error
    );
  }
};


// =========================================================
// UPDATE BOOKING STATUS - ADMIN
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
      } = req.body;


      const normalizedStatus =
        String(
          status || ""
        )
          .trim()
          .toLowerCase();


      const allowedStatuses = [
        "payment_pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ];


      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid booking status",
        });
      }


      await client.query(
        "BEGIN"
      );


      const bookingResult =
        await client.query(
          `
          SELECT
            *
          FROM event_bookings
          WHERE id = $1
          FOR UPDATE
          `,
          [id]
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
      // CONFIRM BOOKING
      // -----------------------------------------------------

      if (
        normalizedStatus ===
        "confirmed"
      ) {

        const paymentResult =
          await client.query(
            `
            SELECT
              id,
              payment_status,
              transaction_id,
              amount
            FROM event_payments
            WHERE booking_id = $1
            ORDER BY id DESC
            LIMIT 1
            FOR UPDATE
            `,
            [id]
          );


      if (
        paymentResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment record not found for this booking",
        });
      }


      const payment =
        paymentResult.rows[0];


      if (
        payment.payment_status !==
        "verified"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment must be verified before confirming booking",
          payment_status:
            payment.payment_status,
        });
      }


      // -----------------------------------------------------
      // UPDATE BOOKING
      // -----------------------------------------------------

      const updateResult =
        await client.query(
          `
          UPDATE event_bookings

          SET
            booking_status =
              'confirmed',

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *
          `,
          [id]
        );


      const updatedBooking =
        updateResult.rows[0];


      // -----------------------------------------------------
      // CREATE PASS
      // -----------------------------------------------------

      const pass =
        await createEventPass(
          client,
          id
        );


      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Booking confirmed successfully",

        booking:
          updatedBooking,

        payment:
          payment,

        pass:
          pass,
      });
      }
            // -----------------------------------------------------
      // PAYMENT PENDING / COMPLETED / CANCELLED / REJECTED
      // -----------------------------------------------------

      const updateResult =
        await client.query(
          `
          UPDATE event_bookings

          SET
            booking_status = $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING *
          `,
          [
            normalizedStatus,
            id,
          ]
        );


      const updatedBooking =
        updateResult.rows[0];


      // -----------------------------------------------------
      // IF COMPLETED
      // -----------------------------------------------------
      //
      // A completed booking should already have:
      //
      // payment_status = verified
      //
      // and normally already have a pass.
      //
      // We still ensure the pass exists.
      //
      // -----------------------------------------------------

      let pass = null;


      if (
        normalizedStatus ===
        "completed"
      ) {

        const paymentResult =
          await client.query(
            `
            SELECT
              id,
              payment_status,
              transaction_id,
              amount

            FROM event_payments

            WHERE booking_id = $1

            ORDER BY id DESC

            LIMIT 1

            FOR UPDATE
            `,
            [id]
          );


        if (
          paymentResult.rows.length > 0 &&
          paymentResult.rows[0]
            .payment_status ===
            "verified"
        ) {

          pass =
            await createEventPass(
              client,
              id
            );
        }
      }


      // -----------------------------------------------------
      // COMMIT
      // -----------------------------------------------------

      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Booking status updated successfully",

        booking:
          updatedBooking,

        pass:
          pass,
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


      return sendDatabaseError(
        res,
        "Unable to update booking status",
        error
      );

    } finally {

      client.release();
    }
  };


// =========================================================
// CONFIRM PAYMENT - ADMIN
// =========================================================
//
// PUT /api/bookings/admin/:id/confirm-payment
//
// IMPORTANT:
//
// This is a dedicated Confirm Payment endpoint.
//
// It does NOT require the frontend to send a status.
//
// Flow:
//
// booking
//   ↓
// latest payment
//   ↓
// payment must be submitted
//   ↓
// payment_status = verified
//   ↓
// booking_status = confirmed
//   ↓
// event pass created
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

      const {
        id,
      } = req.params;


      // -----------------------------------------------------
      // ADMIN ID
      // -----------------------------------------------------

      const adminId =
        req.adminId;


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
      // NORMALIZE ADMIN ID
      // -----------------------------------------------------

      const normalizedAdminId =
        Number(adminId);


      if (
        !Number.isInteger(
          normalizedAdminId
        ) ||
        normalizedAdminId <= 0
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid admin ID",
        });
      }


      // -----------------------------------------------------
      // START TRANSACTION
      // -----------------------------------------------------

      await client.query(
        "BEGIN"
      );


      // -----------------------------------------------------
      // GET BOOKING
      // -----------------------------------------------------

      const bookingResult =
        await client.query(
          `
          SELECT

            b.id,
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount,
            b.booking_status,

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

          FOR UPDATE
          `,
          [id]
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
      // GET LATEST PAYMENT
      // -----------------------------------------------------

      const paymentResult =
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
            verified_at,
            created_at

          FROM event_payments

          WHERE booking_id = $1

          ORDER BY id DESC

          LIMIT 1

          FOR UPDATE
          `,
          [id]
        );


      if (
        paymentResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment record not found for this booking",
        });
      }


      const payment =
        paymentResult.rows[0];


      // -----------------------------------------------------
      // TRANSACTION / UTR REQUIRED
      // -----------------------------------------------------

      if (
        !payment.transaction_id ||
        !String(
          payment.transaction_id
        ).trim()
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "Transaction ID / UTR is missing",
        });
      }


      // -----------------------------------------------------
      // ALREADY VERIFIED
      // -----------------------------------------------------

      if (
        payment.payment_status ===
        "verified"
      ) {

        // ---------------------------------------------------
        // ENSURE BOOKING CONFIRMED
        // ---------------------------------------------------

        if (
          booking.booking_status !==
          "confirmed"
        ) {

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
            [id]
          );
        }


        // ---------------------------------------------------
        // ENSURE PASS
        // ---------------------------------------------------

        const existingPass =
          await createEventPass(
            client,
            id
          );


        await client.query(
          "COMMIT"
        );


        return res.json({

          success: true,

          message:
            "Payment is already confirmed",

          booking: {
            ...booking,

            booking_status:
              "confirmed",
          },

          payment: {
            ...payment,

            payment_status:
              "verified",
          },

          pass:
            existingPass,
        });
      }


      // -----------------------------------------------------
      // ONLY SUBMITTED PAYMENT CAN BE CONFIRMED
      // -----------------------------------------------------

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
            `Only submitted payments can be confirmed. Current payment status: ${payment.payment_status}`,

          payment_status:
            payment.payment_status,
        });
      }


      // -----------------------------------------------------
      // VERIFY PAYMENT
      // -----------------------------------------------------

      const paymentUpdate =
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

          RETURNING *
          `,
          [
            normalizedAdminId,
            payment.id,
          ]
        );


      if (
        paymentUpdate.rows.length === 0
      ) {

        throw new Error(
          "Payment verification failed"
        );
      }


      const verifiedPayment =
        paymentUpdate.rows[0];


      // -----------------------------------------------------
      // CONFIRM BOOKING
      // -----------------------------------------------------

      const bookingUpdate =
        await client.query(
          `
          UPDATE event_bookings

          SET

            booking_status =
              'confirmed',

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *
          `,
          [id]
        );


      if (
        bookingUpdate.rows.length === 0
      ) {

        throw new Error(
          "Booking confirmation failed"
        );
      }


      const confirmedBooking =
        bookingUpdate.rows[0];


      // -----------------------------------------------------
      // CREATE / GET EVENT PASS
      // -----------------------------------------------------

      const pass =
        await createEventPass(
          client,
          id
        );


      if (!pass) {

        throw new Error(
          "Event pass could not be created"
        );
      }


      // -----------------------------------------------------
      // COMMIT
      // -----------------------------------------------------

      await client.query(
        "COMMIT"
      );


      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      return res.status(200).json({

        success: true,

        message:
          "Payment confirmed successfully. Booking confirmed and event pass generated.",

        booking:
          confirmedBooking,

        payment:
          verifiedPayment,

        pass:
          pass,
      });


    } catch (error) {

      // -----------------------------------------------------
      // ROLLBACK
      // -----------------------------------------------------

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


      return sendDatabaseError(
        res,
        "Unable to confirm payment",
        error
      );

    } finally {

      client.release();
    }
  };


// =========================================================
// DELETE BOOKING - ADMIN
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


      // -----------------------------------------------------
      // CHECK BOOKING
      // -----------------------------------------------------

      const bookingResult =
        await client.query(
          `
          SELECT
            id,
            booking_code,
            booking_status
          FROM event_bookings
          WHERE id = $1
          FOR UPDATE
          `,
          [id]
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


      // -----------------------------------------------------
      // DELETE ATTENDANCE
      // -----------------------------------------------------
      //
      // event_attendance.booking_id
      // is INTEGER and references booking.
      //
      // Delete it first if present.
      //
      // -----------------------------------------------------

      await client.query(
        `
        DELETE FROM event_attendance
        WHERE booking_id = $1
        `,
        [id]
      );


      // -----------------------------------------------------
      // DELETE PASS
      // -----------------------------------------------------

      await client.query(
        `
        DELETE FROM event_passes
        WHERE booking_id = $1
        `,
        [id]
      );


      // -----------------------------------------------------
      // DELETE PAYMENT
      // -----------------------------------------------------

      await client.query(
        `
        DELETE FROM event_payments
        WHERE booking_id = $1
        `,
        [id]
      );


      // -----------------------------------------------------
      // DELETE BOOKING
      // -----------------------------------------------------

      const deleteResult =
        await client.query(
          `
          DELETE FROM event_bookings

          WHERE id = $1

          RETURNING *
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
          rollbackError.message
        );
      }


      return sendDatabaseError(
        res,
        "Unable to delete booking",
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
//
// IMPORTANT:
// This route MUST be registered before:
//
// GET /api/bookings/admin/:id
//
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
            ep.created_at AS pass_created_at,

            b.booking_code,
            b.amount AS booking_amount,
            b.booking_status,

            u.id AS user_id,
            u.full_name,
            u.username,
            u.email,
            u.mobile,

            e.id AS event_id,
            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,

            p.id AS payment_id,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.verified_at,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at

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


      return res.json({

        success: true,

        passes:
          result.rows,

        total:
          result.rows.length,
      });


    } catch (error) {

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
            b.amount AS booking_amount,
            b.booking_status,

            u.id AS user_id,
            u.full_name,
            u.username,
            u.email,
            u.mobile,

            e.id AS event_id,
            e.title AS event_title,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,

            p.id AS payment_id,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.verified_at,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at

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
          [id]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Event pass not found for this booking",
        });
      }


      return res.json({

        success: true,

        pass:
          result.rows[0],
      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to fetch booking pass",
        error
      );
    }
  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  createBooking,

  submitPayment,

  getMyBookings,

  getMyBookingById,

  getMyPass,

  getAllBookings,

  getAdminBookingById,

  updateBookingStatus,

  confirmPayment,

  getAdminPasses,

  getAdminPassByBookingId,

  deleteBooking,

};
module.exports = {
  createBooking,
  submitPayment,
  getMyBookings,
  getMyBookingById,
  getMyPass,

  getAllBookings,
  getAdminBookingById,

  updateBookingStatus,
  confirmPayment,

  getAdminPasses,
  getAdminPassByBookingId,

  deleteBooking,
};
