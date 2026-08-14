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

        RETURNING *
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
    // CREATE PAYMENT
    // -------------------------------------------------------

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
          amount,
        ]
      );


    await client.query(
      "COMMIT"
    );


    // -------------------------------------------------------
    // UPI
    // -------------------------------------------------------

    const {
      upiId,
      payeeName,
    } = getUpiConfig();


    const upiUrl =
      createUpiUrl({
        upiId,
        payeeName,
        amount,
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

        event_title:
          event.title,

        event_name:
          event.title,

        event_type:
          event.event_type,

        description:
          event.description,

        doctor_name:
          event.doctor_name,

        specialization:
          event.specialization,

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

        price:
          event.price,

        max_slots:
          event.max_slots,

        image_url:
          event.image_url,

        payment_id:
          paymentResult.rows[0]?.id,

        payment_status:
          paymentResult.rows[0]?.payment_status,

        payment_method:
          paymentResult.rows[0]?.payment_method,

        upi_url:
          upiUrl,

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
        "Create booking rollback error:",
        rollbackError
      );
    }


    console.error(
      "Create booking error:",
      error
    );


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
          b.id AS booking_id,
          b.booking_code,
          b.user_id,
          b.event_id,
          b.amount,
          b.booking_status,
          b.created_at,
          b.updated_at,

          u.full_name,
          u.username,
          u.profile_image_url,

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

          p.id AS payment_id,
          p.payment_status,
          p.transaction_id,
          p.payment_method,
          p.payment_proof_url,
          p.amount AS payment_amount,
          p.created_at AS payment_created_at,

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at

        FROM event_bookings b

        INNER JOIN events e
          ON e.id = b.event_id

        LEFT JOIN users u
          ON u.id = b.user_id

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

    });


  } catch (error) {

    return sendDatabaseError(
      res,
      "Unable to fetch booking history",
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

            u.full_name,
            u.username,
            u.profile_image_url,

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

            p.id AS payment_id,
            p.payment_method,
            p.amount AS payment_amount,
            p.payment_status,
            p.transaction_id,
            p.payment_proof_url,
            p.created_at AS payment_created_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at AS pass_created_at

          FROM event_bookings b

          INNER JOIN events e
            ON e.id = b.event_id

          LEFT JOIN users u
            ON u.id = b.user_id

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


      const booking =
        result.rows[0];


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
            booking.amount,
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

          has_attendance:
            false,

          attendance_status:
            "not_present",

        },

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


    const result =
      await pool.query(
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
          b.amount,
          b.booking_status,

          u.id AS user_id,
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
          AND b.booking_status = 'confirmed'
          AND p.payment_status = 'verified'

        ORDER BY
          ep.id DESC

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
          "Valid event pass not found.",
      });
    }


    const pass =
      result.rows[0];


    // -------------------------------------------------------
    // QR PAYLOAD
    // -------------------------------------------------------

    const qrData = {

      type:
        "SNICT_EVENT_PASS",

      version:
        1,

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

    };


    return res.json({

      success: true,

      pass: {

        ...pass,

        qr_data:
          qrData,

        qr_payload:
          JSON.stringify(
            qrData
          ),

        has_attendance:
          false,

        attendance_required:
          true,

        attendance_status:
          "not_present",

      },

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

            -- BOOKING

            b.id,
            b.id AS booking_id,
            b.booking_code,
            b.user_id,
            b.event_id,
            b.amount,
            b.booking_status,
            b.booking_status AS status,
            b.created_at AS booking_created_at,
            b.updated_at AS booking_updated_at,

            -- USER

            u.id AS member_id,
            u.full_name,
            u.username,
            u.username AS user_name,
            u.email,
            u.mobile,
            u.profile_image_url,
            u.age,
            u.sex,
            u.address,
            u.blood_group,

            -- EVENT

            e.id AS event_db_id,
            e.title AS event_title,
            e.title AS event_name,
            e.event_type,
            e.description AS event_description,
            e.doctor_name,
            e.specialization,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.price AS event_price,
            e.max_slots,
            e.image_url,
            e.booking_enabled,
            e.published,

            -- PAYMENT

            p.id AS payment_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at AS payment_created_at,

            -- PASS

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at AS pass_created_at

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
            ON e.id = b.event_id

          LEFT JOIN LATERAL (
            SELECT
              id,
              payment_method,
              transaction_id,
              amount,
              payment_status,
              payment_proof_url,
              verified_by,
              verified_at,
              created_at

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

          ORDER BY
            b.created_at DESC
          `
        );


      return res.status(200).json({

        success: true,

        bookings:
          result.rows,

        total:
          result.rows.length,

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to load admin bookings",
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

            u.id AS member_id,
            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.age,
            u.sex,
            u.address,
            u.blood_group,
            u.profile_image_url,

            e.id AS event_db_id,
            e.title AS event_title,
            e.title AS event_name,
            e.event_type,
            e.description AS event_description,
            e.doctor_name,
            e.specialization,
            e.event_date,
            e.start_time,
            e.end_time,
            e.venue,
            e.event_mode,
            e.price AS event_price,
            e.max_slots,
            e.image_url,
            e.booking_enabled,
            e.published,

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
            ep.created_at AS pass_created_at

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
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


      return res.status(200).json({

        success: true,

        booking:
          result.rows[0],

      });


    } catch (error) {

      return sendDatabaseError(
        res,
        "Unable to load booking",
        error
      );

    }

  };
  // =========================================================
// ADMIN - UPDATE BOOKING / PAYMENT STATUS
// PUT /api/bookings/admin/:id/status
// =========================================================
//
// IMPORTANT FIX:
//
// event_payments.verified_by = INTEGER
//
// Therefore DO NOT save:
//
// req.adminId
//
// if req.adminId is UUID.
//
// We only update payment_status and verified_at.
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


      let {
        status,
        bookingStatus,
        paymentStatus,
      } = req.body;


      let finalBookingStatus =
        bookingStatus ||
        status ||
        null;


      let finalPaymentStatus =
        paymentStatus ||
        null;


      // -------------------------------------------------------
      // AUTOMATIC STATUS SYNC
      // -------------------------------------------------------

      if (
        finalBookingStatus ===
          "confirmed" &&
        !finalPaymentStatus
      ) {

        finalPaymentStatus =
          "verified";
      }


      if (
        finalPaymentStatus ===
          "verified" &&
        !finalBookingStatus
      ) {

        finalBookingStatus =
          "confirmed";
      }


      // -------------------------------------------------------
      // ALLOWED STATUS
      // -------------------------------------------------------

      const allowedBookingStatuses = [
        "payment_pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ];


      const allowedPaymentStatuses = [
        "pending",
        "submitted",
        "verified",
        "rejected",
        "refunded",
      ];


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
            "No status provided",
        });
      }


      await client.query(
        "BEGIN"
      );


      // -------------------------------------------------------
      // CHECK BOOKING
      // -------------------------------------------------------

      const bookingCheck =
        await client.query(
          `
          SELECT
            id,
            event_id,
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


      // -------------------------------------------------------
      // UPDATE BOOKING
      // -------------------------------------------------------

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


      // -------------------------------------------------------
      // UPDATE PAYMENT
      // -------------------------------------------------------

      if (
        finalPaymentStatus
      ) {

        const paymentResult =
          await client.query(
            `
            UPDATE event_payments

            SET
              payment_status = $1,

              verified_at =
                CASE
                  WHEN $1 = 'verified'
                  THEN CURRENT_TIMESTAMP
                  ELSE verified_at
                END

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


      // -------------------------------------------------------
      // GET FINAL STATUS
      // -------------------------------------------------------

      const currentStatus =
        await client.query(
          `
          SELECT

            b.booking_status,
            b.event_id,

            p.payment_status

          FROM event_bookings b

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
          [id]
        );


      let eventPass =
        null;


      // -------------------------------------------------------
      // CREATE PASS
      // -------------------------------------------------------

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


      // -------------------------------------------------------
      // GET UPDATED BOOKING
      // -------------------------------------------------------

      const updated =
        await client.query(
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

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.profile_image_url,

            e.title AS event_title,
            e.title AS event_name,
            e.event_type,
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
            p.verified_by,
            p.verified_at,

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until

          FROM event_bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN events e
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

        attendance:
          null,

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
        "Unable to update booking",
        error
      );


    } finally {

      client.release();

    }

  };


// =========================================================
// ADMIN - DELETE BOOKING
// DELETE /api/bookings/admin/:id
// =========================================================
//
// IMPORTANT:
//
// event_attendance.booking_id = INTEGER
// event_bookings.id           = INTEGER
//
// Therefore attendance is deleted using booking_id.
//
// DO NOT use event_attendance.event_id here.
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


      await client.query(
        "BEGIN"
      );


      // -------------------------------------------------------
      // CHECK BOOKING
      // -------------------------------------------------------

      const booking =
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
        booking.rows.length ===
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


      // -------------------------------------------------------
      // DELETE ATTENDANCE
      // -------------------------------------------------------

      await client.query(
        `
        DELETE FROM event_attendance

        WHERE booking_id = $1
        `,
        [id]
      );


      // -------------------------------------------------------
      // DELETE PASS
      // -------------------------------------------------------

      await client.query(
        `
        DELETE FROM event_passes

        WHERE booking_id = $1
        `,
        [id]
      );


      // -------------------------------------------------------
      // DELETE PAYMENT
      // -------------------------------------------------------

      await client.query(
        `
        DELETE FROM event_payments

        WHERE booking_id = $1
        `,
        [id]
      );


      // -------------------------------------------------------
      // DELETE BOOKING
      // -------------------------------------------------------

      const deleted =
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
          deleted.rows[0],

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
// ADMIN - CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
// =========================================================
//
// Confirms the latest payment for a booking.
//
// FLOW:
//
// 1. Check booking exists
// 2. Get latest payment
// 3. Verify payment
// 4. Confirm booking
// 5. Create event pass
// 6. Return updated booking + payment + pass
//
// IMPORTANT:
//
// - event_payments.verified_by is INTEGER.
// - event_attendance is NOT created here.
// - Attendance is handled by attendanceController.js.
// - Existing pass is reused.
// - Duplicate passes are not created.
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


    const bookingId =
      Number(id);


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


    // -------------------------------------------------------
    // ADMIN ID
    // -------------------------------------------------------

    const rawAdminId =
      req.adminId ??
      req.userId ??
      null;


    const adminId =
      rawAdminId !== null &&
      rawAdminId !== undefined &&
      rawAdminId !== ""
        ? Number(rawAdminId)
        : null;


    await client.query(
      "BEGIN"
    );


    // -------------------------------------------------------
    // CHECK BOOKING
    // -------------------------------------------------------

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

          e.title AS event_title,
          e.event_date,
          e.start_time,
          e.end_time,
          e.venue,
          e.event_mode

        FROM event_bookings b

        LEFT JOIN events e
          ON e.id = b.event_id

        WHERE b.id = $1

        FOR UPDATE
        `,
        [bookingId]
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


    // -------------------------------------------------------
    // GET LATEST PAYMENT
    // -------------------------------------------------------

    const paymentResult =
      await client.query(
        `
        SELECT *

        FROM event_payments

        WHERE booking_id = $1

        ORDER BY id DESC

        LIMIT 1

        FOR UPDATE
        `,
        [bookingId]
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


    // -------------------------------------------------------
    // PAYMENT ALREADY VERIFIED
    // -------------------------------------------------------

    if (
      payment.payment_status ===
        "verified" &&
      booking.booking_status ===
        "confirmed"
    ) {

      const existingPass =
        await createEventPass(
          client,
          bookingId
        );


      const finalResult =
        await client.query(
          `
          SELECT

            b.id AS booking_id,
            b.booking_code,
            b.event_id,
            b.user_id,
            b.amount AS booking_amount,
            b.booking_status,

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
          [bookingId]
        );


      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Payment is already confirmed",

        booking:
          finalResult.rows[0],

        payment:
          finalResult.rows[0],

        pass:
          existingPass,

      });
    }


    // -------------------------------------------------------
    // DO NOT CONFIRM REJECTED / REFUNDED PAYMENT
    // -------------------------------------------------------

    if (
      payment.payment_status ===
        "rejected" ||
      payment.payment_status ===
        "refunded"
    ) {

      await client.query(
        "ROLLBACK"
      );


      return res.status(400).json({

        success: false,

        message:
          `Cannot confirm a ${payment.payment_status} payment`,

      });
    }


    // -------------------------------------------------------
    // TRANSACTION ID CHECK
    // -------------------------------------------------------

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
          "Cannot confirm payment without transaction ID",

      });
    }


    // -------------------------------------------------------
    // UPDATE PAYMENT
    // -------------------------------------------------------
    //
    // verified_by is only written
    // when it is a valid INTEGER.
    //
    // This avoids:
    //
    // UUID -> INTEGER
    // errors.
    //

    let updatedPayment;


    if (
      Number.isInteger(
        adminId
      ) &&
      adminId > 0
    ) {

      const result =
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
            adminId,
            payment.id,
          ]
        );


      updatedPayment =
        result.rows[0];

    } else {

      const result =
        await client.query(
          `
          UPDATE event_payments

          SET

            payment_status =
              'verified',

            verified_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *
          `,
          [payment.id]
        );


      updatedPayment =
        result.rows[0];

    }


    // -------------------------------------------------------
    // CONFIRM BOOKING
    // -------------------------------------------------------

    const updatedBookingResult =
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
        [bookingId]
      );


    const updatedBooking =
      updatedBookingResult.rows[0];


    // -------------------------------------------------------
    // CREATE / GET EVENT PASS
    // -------------------------------------------------------

    const eventPass =
      await createEventPass(
        client,
        bookingId
      );


    // -------------------------------------------------------
    // FINAL DATA
    // -------------------------------------------------------

    const finalResult =
      await client.query(
        `
        SELECT

          b.id AS booking_id,
          b.booking_code,
          b.user_id,
          b.event_id,
          b.amount AS booking_amount,
          b.booking_status,
          b.created_at AS booking_created_at,
          b.updated_at AS booking_updated_at,

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

        LEFT JOIN users u
          ON u.id = b.user_id

        LEFT JOIN events e
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
        [bookingId]
      );


    await client.query(
      "COMMIT"
    );


    return res.status(200).json({

      success: true,

      message:
        "Payment confirmed successfully",

      booking:
        finalResult.rows[0],

      payment:
        updatedPayment,

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
        "Confirm payment rollback error:",
        rollbackError.message
      );
    }


    console.error(
      "CONFIRM PAYMENT ERROR"
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

  confirmPayment,

  deleteBooking,

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

  confirmPayment,

  deleteBooking,

};
