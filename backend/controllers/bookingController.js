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
//
// IMPORTANT:
//
// - Existing pass is returned.
// - Payment MUST be verified.
// - Booking can be confirmed OR completed.
// - Pass is generated automatically when missing.
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
    Number(bookingId);

  if (
    !Number.isInteger(
      normalizedBookingId
    ) ||
    normalizedBookingId <= 0
  ) {

    throw new Error(
      "Invalid booking ID while creating pass"
    );

  }


  // =======================================================
  // RETURN EXISTING PASS
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
        normalizedBookingId
      ]
    );


  if (
    existingPassResult.rows.length > 0
  ) {

    console.log(
      `Existing event pass found for booking ${normalizedBookingId}`
    );

    return existingPassResult.rows[0];

  }


  // =======================================================
  // GET BOOKING + EVENT + LATEST PAYMENT
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
      [
        normalizedBookingId
      ]
    );


  if (
    bookingResult.rows.length === 0
  ) {

    throw new Error(
      "Booking not found while creating pass"
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
  // BOOKING MUST BE CONFIRMED / COMPLETED
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
        [
          generated
        ]
      );


    if (
      check.rows.length === 0
    ) {

      passCode =
        generated;

      break;

    }

  }


  if (!passCode) {

    throw new Error(
      "Unable to generate unique pass code"
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

    const generated =
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
          generated
        ]
      );


    if (
      check.rows.length === 0
    ) {

      passToken =
        generated;

      break;

    }

  }


  if (!passToken) {

    throw new Error(
      "Unable to generate unique pass token"
    );

  }


  // =======================================================
  // EVENT DATE / TIME
  // =======================================================

  const eventDate =
    booking.event_date
      ?.toString()
      .slice(0, 10);


  if (!eventDate) {

    throw new Error(
      "Event date is missing while creating pass"
    );

  }


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


  // =======================================================
  // CREATE PASS
  //
  // IMPORTANT:
  //
  // event_passes.booking_id has UNIQUE constraint.
  //
  // ON CONFLICT prevents duplicate pass crash.
  //
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

      RETURNING *
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
  // PASS CREATED SUCCESSFULLY
  // =======================================================

  if (
    passResult.rows.length > 0
  ) {

    return passResult.rows[0];

  }


  // =======================================================
  // ANOTHER REQUEST CREATED PASS
  //
  // Fetch existing pass instead of failing.
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
        normalizedBookingId
      ]
    );


  if (
    finalPassResult.rows.length === 0
  ) {

    throw new Error(
      "Event pass could not be created"
    );

  }


  return finalPassResult.rows[0];

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


    // =======================================================
    // EVENT ID CHECK
    // =======================================================

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


    // =======================================================
    // GET EVENT
    // =======================================================

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
        [
          eventId
        ]
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


    // =======================================================
    // EVENT END CHECK
    // =======================================================

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


    // =======================================================
    // DUPLICATE BOOKING CHECK
    // =======================================================

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


    // =======================================================
    // SLOT CHECK
    // =======================================================

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
          [
            eventId
          ]
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


    // =======================================================
    // UNIQUE BOOKING CODE
    // =======================================================

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
          [
            generated
          ]
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


    // =======================================================
    // BOOKING AMOUNT
    // =======================================================

    const amount =
      Number(
        event.price || 0
      );


    // =======================================================
    // CREATE BOOKING
    // =======================================================

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


    // =======================================================
    // UPI CONFIG
    // =======================================================

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


    // =======================================================
    // COMMIT
    // =======================================================

    await client.query(
      "COMMIT"
    );


    // =======================================================
    // RESPONSE
    // =======================================================

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
      bookingId,
    } = req.params;


    const {
      transactionId,
      transaction_id,
      paymentProofUrl,
      payment_proof_url,
      paymentMethod,
      payment_method,
    } =
      req.body || {};


    const finalTransactionId =
      transactionId ||
      transaction_id ||
      "";


    const finalProofUrl =
      paymentProofUrl ||
      payment_proof_url ||
      "";


    const finalPaymentMethod =
      paymentMethod ||
      payment_method ||
      "upi";


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


    // =======================================================
    // BOOKING ID CHECK
    // =======================================================

    if (!bookingId) {

      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required",
      });

    }


    // =======================================================
    // TRANSACTION ID CHECK
    // =======================================================

    if (
      !String(
        finalTransactionId
      ).trim()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Transaction ID is required",
      });

    }


    await client.query(
      "BEGIN"
    );


    // =======================================================
    // GET BOOKING
    // =======================================================

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


    // =======================================================
    // GET EXISTING PAYMENT
    // =======================================================

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
          bookingId
        ]
      );


    let payment;


    // =======================================================
    // UPDATE EXISTING PAYMENT
    // =======================================================

    if (
      existingPayment.rows.length > 0
    ) {

      const existing =
        existingPayment.rows[0];


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
            finalPaymentMethod,

            String(
              finalTransactionId
            ).trim(),

            booking.amount,

            finalProofUrl ||
              null,

            existing.id,
          ]
        );


      payment =
        paymentResult.rows[0];

    } else {

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

            finalPaymentMethod,

            String(
              finalTransactionId
            ).trim(),

            booking.amount,

            finalProofUrl ||
              null,
          ]
        );


      payment =
        paymentResult.rows[0];

    }


    // =======================================================
    // KEEP BOOKING PAYMENT PENDING
    // =======================================================

    const updatedBooking =
      await client.query(
        `
        UPDATE event_bookings

        SET

          booking_status =
            'payment_pending',

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING *
        `,
        [
          bookingId
        ]
      );


    await client.query(
      "COMMIT"
    );


    return res.status(200).json({

      success: true,

      message:
        "Payment submitted successfully",

      booking:
        updatedBooking.rows[0],

      payment:
        payment,

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


    // =======================================================
    // GET BOOKINGS
    // =======================================================

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
          e.price AS event_price,
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
          ep.valid_until,

          ea.id AS attendance_id,
          ea.event_id AS attendance_event_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

        FROM event_bookings b

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_passes

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) ep ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_attendance

          WHERE booking_id = b.id

          ORDER BY created_at DESC

          LIMIT 1
        ) ea ON TRUE

        WHERE b.user_id = $1

        ORDER BY
          b.created_at DESC
        `,
        [
          userId,
        ]
      );


    // =======================================================
    // RESPONSE
    // =======================================================

    return res.json({

      success: true,

      bookings:
        result.rows,

      total:
        result.rows.length,

    });


  } catch (error) {

    console.error(
      "Get my bookings error:",
      error
    );


    return sendDatabaseError(
      res,
      "Unable to fetch bookings",
      error
    );

  }

};


// =========================================================
// GET MY SINGLE BOOKING
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


      // =====================================================
      // AUTH CHECK
      // =====================================================

      if (!userId) {

        return res.status(401).json({
          success: false,
          message:
            "User authentication required",
        });

      }


      // =====================================================
      // GET BOOKING
      // =====================================================

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
            e.price AS event_price,
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
            ep.valid_until,

            ea.id AS attendance_id,
            ea.event_id AS attendance_event_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

          FROM event_bookings b

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_payments

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) p ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_passes

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) ep ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_attendance

            WHERE booking_id = b.id

            ORDER BY created_at DESC

            LIMIT 1
          ) ea ON TRUE

          WHERE b.id = $1

            AND b.user_id = $2

          LIMIT 1
          `,
          [
            id,
            userId,
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
            "Booking not found",
        });

      }


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        booking:
          result.rows[0],

      });


    } catch (error) {

      console.error(
        "Get my booking error:",
        error
      );


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
//
// FLOW:
//
// payment verified
//       ↓
// booking confirmed/completed
//       ↓
// existing pass?
//       ↓
// YES → return existing pass
// NO  → create pass
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


    await client.query(
      "BEGIN"
    );


    // =======================================================
    // GET BOOKING + PAYMENT + PASS + ATTENDANCE
    // =======================================================

    const bookingResult =
      await client.query(
        `
        SELECT

          b.id AS booking_id,
          b.booking_code,
          b.amount,
          b.booking_status,
          b.user_id,

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
          p.payment_status,
          p.transaction_id,
          p.amount AS payment_amount,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,

          ea.id AS attendance_id,
          ea.event_id AS attendance_event_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

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
            amount

          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            id,
            pass_code,
            pass_token,
            valid_from,
            valid_until,
            created_at

          FROM event_passes

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) ep ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by

          FROM event_attendance

          WHERE booking_id = b.id

          ORDER BY created_at DESC

          LIMIT 1
        ) ea ON TRUE

        WHERE b.id = $1

          AND b.user_id = $2

        LIMIT 1
        `,
        [
          id,
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
    // PAYMENT MUST BE VERIFIED
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
    // BOOKING MUST BE CONFIRMED
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
    // EXISTING PASS
    // =======================================================

    if (
      booking.pass_id
    ) {

      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Event pass loaded successfully",

        pass: {

          id:
            booking.pass_id,

          booking_id:
            booking.booking_id,

          booking_code:
            booking.booking_code,

          pass_code:
            booking.pass_code,

          pass_token:
            booking.pass_token,

          valid_from:
            booking.valid_from,

          valid_until:
            booking.valid_until,

          pass_created_at:
            booking.pass_created_at,

          full_name:
            booking.full_name,

          username:
            booking.username,

          email:
            booking.email,

          mobile:
            booking.mobile,

          event_id:
            booking.event_id,

          event_title:
            booking.event_title,

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

          amount:
            booking.amount,

          payment_amount:
            booking.payment_amount,

          payment_status:
            booking.payment_status,

          transaction_id:
            booking.transaction_id,

          booking_status:
            booking.booking_status,

          attendance_id:
            booking.attendance_id,

          attendance_event_id:
            booking.attendance_event_id,

          attendance_code:
            booking.attendance_code,

          attendance_status:
            booking.attendance_status,

          attendance_marked_at:
            booking.attendance_marked_at,

          attendance_marked_by:
            booking.attendance_marked_by,

          status:
            "valid",

        },

      });

    }


    // =======================================================
    // PASS DOES NOT EXIST
    // CREATE PASS
    // =======================================================

    const pass =
      await createEventPass(
        client,
        booking.booking_id
      );


    // =======================================================
    // PASS CREATION FAILED
    // =======================================================

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


    // =======================================================
    // COMMIT
    // =======================================================

    await client.query(
      "COMMIT"
    );


    // =======================================================
    // RESPONSE
    // =======================================================

    return res.json({

      success: true,

      message:
        "Event pass generated successfully",

      pass: {

        id:
          pass.id,

        booking_id:
          pass.booking_id,

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
          pass.created_at,

        full_name:
          booking.full_name,

        username:
          booking.username,

        email:
          booking.email,

        mobile:
          booking.mobile,

        event_id:
          booking.event_id,

        event_title:
          booking.event_title,

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

        amount:
          booking.amount,

        payment_amount:
          booking.payment_amount,

        payment_status:
          booking.payment_status,

        transaction_id:
          booking.transaction_id,

        booking_status:
          booking.booking_status,

        attendance_id:
          booking.attendance_id,

        attendance_event_id:
          booking.attendance_event_id,

        attendance_code:
          booking.attendance_code,

        attendance_status:
          booking.attendance_status,

        attendance_marked_at:
          booking.attendance_marked_at,

        attendance_marked_by:
          booking.attendance_marked_by,

        status:
          "valid",

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


    console.error(
      "Get event pass error:",
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
// ADMIN - GET ALL BOOKINGS
// GET /api/bookings/admin
// =========================================================

const getAllBookings = async (
  req,
  res
) => {

  try {

    // =======================================================
    // GET BOOKINGS
    // =======================================================

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
          e.image_url,

          p.id AS payment_id,
          p.payment_method,
          p.transaction_id,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_by,
          p.verified_at,
          p.created_at AS payment_created_at,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,

          ea.id AS attendance_id,
          ea.event_id AS attendance_event_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

        FROM event_bookings b

        INNER JOIN users u
          ON u.id = b.user_id

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_passes

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) ep ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            *
          FROM event_attendance

          WHERE booking_id = b.id

          ORDER BY created_at DESC

          LIMIT 1
        ) ea ON TRUE

        ORDER BY
          b.created_at DESC
        `
      );


    // =======================================================
    // RESPONSE
    // =======================================================

    return res.json({

      success: true,

      bookings:
        result.rows,

      total:
        result.rows.length,

    });


  } catch (error) {

    console.error(
      "Get all bookings error:",
      error
    );


    return sendDatabaseError(
      res,
      "Unable to fetch bookings",
      error
    );

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


      // =====================================================
      // GET BOOKING
      // =====================================================

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
            e.image_url,

            p.id AS payment_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at AS payment_created_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at AS pass_created_at,

            ea.id AS attendance_id,
            ea.event_id AS attendance_event_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

          FROM event_bookings b

          INNER JOIN users u
            ON u.id = b.user_id

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_payments

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) p ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_passes

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) ep ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              *
            FROM event_attendance

            WHERE booking_id = b.id

            ORDER BY created_at DESC

            LIMIT 1
          ) ea ON TRUE

          WHERE b.id = $1

          LIMIT 1
          `,
          [
            id,
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
            "Booking not found",
        });

      }


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        booking:
          result.rows[0],

      });


    } catch (error) {

      console.error(
        "Get admin booking error:",
        error
      );


      return sendDatabaseError(
        res,
        "Unable to fetch booking",
        error
      );

    }

  };


// =========================================================
// ADMIN - CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
// =========================================================
//
// IMPORTANT:
//
// This is the main payment confirmation flow.
//
// submitted
//     ↓
// verified
//     ↓
// booking confirmed
//     ↓
// event pass created/reused
//
// =========================================================

const confirmPayment = async (
  req,
  res
) => {

  const client =
    await pool.connect();


  try {

    const {
      id,
    } = req.params;


    const adminId =
      req.adminId;


    const bookingId =
      Number(id);


    const normalizedAdminId =
      Number(adminId);


    // =======================================================
    // VALIDATE BOOKING ID
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


    // =======================================================
    // VALIDATE ADMIN
    // =======================================================

    if (
      !Number.isInteger(
        normalizedAdminId
      ) ||
      normalizedAdminId <= 0
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid admin authentication",
      });

    }


    await client.query(
      "BEGIN"
    );


    // =======================================================
    // LOCK BOOKING
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
        [
          bookingId,
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
    // GET LATEST PAYMENT
    // =======================================================

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
        [
          bookingId,
        ]
      );


    // =======================================================
    // PAYMENT NOT FOUND
    // =======================================================

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


    // =======================================================
    // TRANSACTION ID REQUIRED
    // =======================================================

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


    // =======================================================
    // PAYMENT STATUS CHECK
    // =======================================================

    if (
      ![
        "submitted",
        "verified",
      ].includes(
        payment.payment_status
      )
    ) {

      await client.query(
        "ROLLBACK"
      );


      return res.status(400).json({

        success: false,

        message:
          `Payment cannot be confirmed. Current status: ${payment.payment_status}`,

        payment_status:
          payment.payment_status,

      });

    }


    // =======================================================
    // VERIFY PAYMENT
    // =======================================================

    let verifiedPayment =
      payment;


    if (
      payment.payment_status !==
      "verified"
    ) {

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


      verifiedPayment =
        paymentUpdate.rows[0];

    }


    // =======================================================
    // CONFIRM BOOKING
    // =======================================================

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
        [
          bookingId,
        ]
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


    // =======================================================
    // GET / CREATE EVENT PASS
    // =======================================================

    const pass =
      await createEventPass(
        client,
        bookingId
      );


    // =======================================================
    // PASS REQUIRED
    // =======================================================

    if (!pass) {

      throw new Error(
        "Unable to create event pass after payment confirmation"
      );

    }


    // =======================================================
    // COMMIT
    // =======================================================

    await client.query(
      "COMMIT"
    );


    console.log(
      `Payment confirmed successfully for booking ${bookingId}`
    );


    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(200).json({

      success: true,

      message:
        "Payment confirmed successfully",

      booking:
        confirmedBooking,

      payment:
        verifiedPayment,

      pass:

        {

          id:
            pass.id,

          booking_id:
            pass.booking_id,

          pass_code:
            pass.pass_code,

          pass_token:
            pass.pass_token,

          valid_from:
            pass.valid_from,

          valid_until:
            pass.valid_until,

          created_at:
            pass.created_at,

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
        "Confirm payment rollback error:",
        rollbackError.message
      );

    }


    console.error(
      "======================================"
    );

    console.error(
      "CONFIRM PAYMENT ERROR"
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
      "Constraint:",
      error.constraint
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
      "======================================"
    );


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
// ADMIN - UPDATE BOOKING STATUS
// PUT /api/bookings/admin/:id/status
// =========================================================
//
// Supported:
//
// confirmed
// completed
// cancelled
// rejected
// payment_pending
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
      } =
        req.body || {};


      const bookingId =
        Number(id);


      // =====================================================
      // VALIDATE
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
      // NORMALIZE STATUS
      // =====================================================

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

          allowedStatuses,

        });

      }


      await client.query(
        "BEGIN"
      );


      // =====================================================
      // GET BOOKING
      // =====================================================

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

          FOR UPDATE
          `,
          [
            bookingId,
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


      // =====================================================
      // UPDATE BOOKING
      // =====================================================

      const updateResult =
        await client.query(
          `
          UPDATE event_bookings

          SET

            booking_status =
              $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING *
          `,
          [
            normalizedStatus,
            bookingId,
          ]
        );


      if (
        updateResult.rows.length === 0
      ) {

        throw new Error(
          "Booking status update failed"
        );

      }


      const updatedBooking =
        updateResult.rows[0];


      // =====================================================
      // IF CONFIRMED / COMPLETED
      //
      // Try to generate/reuse pass when payment
      // is already verified.
      // =====================================================

      let pass = null;


      if (
        [
          "confirmed",
          "completed",
        ].includes(
          normalizedStatus
        )
      ) {

        const paymentCheck =
          await client.query(
            `
            SELECT
              payment_status

            FROM event_payments

            WHERE booking_id = $1

            ORDER BY id DESC

            LIMIT 1
            `,
            [
              bookingId,
            ]
          );


        if (
          paymentCheck.rows.length > 0 &&
          paymentCheck.rows[0]
            .payment_status ===
            "verified"
        ) {

          pass =
            await createEventPass(
              client,
              bookingId
            );

        }

      }


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
          "Booking status updated successfully",

        booking:
          updatedBooking,

        pass:
          pass || null,

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


      console.error(
        "Update booking status error:",
        error
      );


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
// ADMIN - GET ALL PASSES
// GET /api/bookings/admin/passes
// =========================================================

const getAdminPasses = async (
  req,
  res
) => {

  try {

    // =======================================================
    // GET ALL EVENT PASSES
    // =======================================================

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
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode,

          p.id AS payment_id,
          p.transaction_id,
          p.payment_method,
          p.amount AS payment_amount,
          p.payment_status,
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
          SELECT
            *
          FROM event_payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            *
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
    // RESPONSE
    // =======================================================

    return res.json({

      success: true,

      passes:
        result.rows,

      total:
        result.rows.length,

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
            SELECT
              *
            FROM event_payments

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) p ON TRUE

          LEFT JOIN LATERAL (
            SELECT
              *
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
        result.rows.length === 0
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

        pass:
          result.rows[0],

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
// ADMIN - DELETE BOOKING
// DELETE /api/bookings/admin/:id
// =========================================================
//
// Because event_passes and event_attendance have
// foreign keys with ON DELETE CASCADE,
// deleting the booking also removes related records.
//
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


      const bookingId =
        Number(id);


      // =====================================================
      // VALIDATE
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
            booking_code,
            booking_status,
            amount

          FROM event_bookings

          WHERE id = $1

          FOR UPDATE
          `,
          [
            bookingId,
          ]
        );


      // =====================================================
      // NOT FOUND
      // =====================================================

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


      // =====================================================
      // DELETE BOOKING
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


      if (
        deleteResult.rows.length === 0
      ) {

        throw new Error(
          "Booking deletion failed"
        );

      }


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
          "Booking deleted successfully",

        booking:
          booking,

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


      console.error(
        "Delete booking error:",
        error
      );


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
// FINAL EXPORTS
// =========================================================
//
// IMPORTANT:
//
// ONLY ONE module.exports BLOCK.
// Do NOT add another module.exports below this.
//
// =========================================================

module.exports = {

  // =======================================================
  // USER BOOKING
  // =======================================================

  createBooking,
  submitPayment,

  getMyBookings,
  getMyBookingById,
  getMyPass,


  // =======================================================
  // ADMIN BOOKING
  // =======================================================

  getAllBookings,
  getAdminBookingById,

  updateBookingStatus,
  confirmPayment,


  // =======================================================
  // ADMIN PASSES
  // =======================================================

  getAdminPasses,
  getAdminPassByBookingId,


  // =======================================================
  // DELETE
  // =======================================================

  deleteBooking,

};