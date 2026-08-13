const pool = require("../config/db");
const crypto = require("crypto");

/* =========================================================
   BOOKING CONTROLLER
   SNICT
   ---------------------------------------------------------
   Features:
   - Create event booking
   - Create UPI payment
   - Get user bookings
   - Get single booking
   - Generate event pass
   - Generate attendance code
   - Generate secure QR payload
   - Get admin bookings
   - Update booking/payment status
   - Delete booking
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const generateBookingCode = () => {
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `SNICT-BKG-${random}`;
};


const generatePassCode = () => {
  return `SNICT-PASS-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


const generatePassToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


/*
  IMPORTANT

  This code is displayed below the QR on the
  user's event pass.

  Admin can use this code if QR scanning
  is unavailable.
*/
const generateAttendanceCode = () => {
  return `SNICT-ATT-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


/* =========================================================
   UPI CONFIG
   ========================================================= */

const getUpiConfig = () => {
  return {
    upiId:
      process.env.SNICT_UPI_ID || "",

    payeeName:
      process.env.SNICT_UPI_NAME ||
      "SNICT",
  };
};


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


/* =========================================================
   DATABASE ERROR
   ========================================================= */

const sendDatabaseError = (
  res,
  message,
  error
) => {
  console.error(
    "========================================"
  );

  console.error(message);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("Detail:", error.detail);
  console.error("Hint:", error.hint);
  console.error("Table:", error.table);
  console.error("Column:", error.column);
  console.error(
    "Constraint:",
    error.constraint
  );

  console.error(
    "========================================"
  );

  return res.status(500).json({
    success: false,

    message,

    debug:
      process.env.NODE_ENV ===
      "development"
        ? {
            message:
              error.message ||
              null,

            code:
              error.code ||
              null,

            detail:
              error.detail ||
              null,

            hint:
              error.hint ||
              null,

            table:
              error.table ||
              null,

            column:
              error.column ||
              null,

            constraint:
              error.constraint ||
              null,
          }
        : undefined,
  });
};


/* =========================================================
   UNIQUE ATTENDANCE CODE
   ========================================================= */

const getUniqueAttendanceCode =
  async (client) => {
    for (let i = 0; i < 20; i++) {
      const code =
        generateAttendanceCode();

      const result =
        await client.query(
          `
          SELECT id
          FROM event_attendance
          WHERE attendance_code = $1
          LIMIT 1
          `,
          [code]
        );

      if (
        result.rows.length === 0
      ) {
        return code;
      }
    }

    throw new Error(
      "Unable to generate unique attendance code"
    );
  };


/* =========================================================
   ENSURE ATTENDANCE RECORD
   ========================================================= */

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

    /*
      Already exists.

      IMPORTANT:
      Do not regenerate attendance code.
      This keeps the code stable even if
      admin updates the booking again.
    */
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


/* =========================================================
   CREATE EVENT PASS
   ========================================================= */

const createEventPass =
  async (
    client,
    bookingId
  ) => {

    /*
      -------------------------------------------------------
      CHECK EXISTING PASS
      -------------------------------------------------------
    */

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
      const bookingResult =
        await client.query(
          `
          SELECT
            event_id,
            booking_status
          FROM event_bookings
          WHERE id = $1
          LIMIT 1
          `,
          [bookingId]
        );


      if (
        bookingResult.rows.length >
          0 &&
        bookingResult.rows[0]
          .booking_status ===
          "confirmed"
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


    /*
      -------------------------------------------------------
      GET BOOKING
      -------------------------------------------------------
    */

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
          SELECT payment_status
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


    /*
      -------------------------------------------------------
      ONLY CONFIRMED + VERIFIED BOOKINGS
      -------------------------------------------------------
    */

    if (
      booking.booking_status !==
        "confirmed" ||
      booking.payment_status !==
        "verified"
    ) {
      return null;
    }


    /*
      -------------------------------------------------------
      GENERATE UNIQUE PASS CODE
      -------------------------------------------------------
    */

    let passCode = null;


    for (let i = 0; i < 20; i++) {
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


    /*
      -------------------------------------------------------
      SECURE PASS TOKEN
      -------------------------------------------------------
    */

    const passToken =
      generatePassToken();


    /*
      -------------------------------------------------------
      EVENT DATE / TIME
      -------------------------------------------------------
    */

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


    /*
      -------------------------------------------------------
      INDIA TIMEZONE
      -------------------------------------------------------
    */

    const validFrom =
      `${eventDate}T${startTime}+05:30`;


    const validUntil =
      `${eventDate}T${endTime}+05:30`;


    /*
      -------------------------------------------------------
      CREATE PASS
      -------------------------------------------------------
    */

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


    /*
      -------------------------------------------------------
      CREATE ATTENDANCE RECORD

      QR + manual code both depend on this.
      -------------------------------------------------------
    */

    await ensureAttendanceRecord(
      client,
      bookingId,
      booking.event_id
    );


    return passResult.rows[0];
  };


/* =========================================================
   CREATE BOOKING
   POST /api/bookings/event/:eventId
   ========================================================= */

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


      /*
        -----------------------------------------------------
        EVENT
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        EVENT END CHECK
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        DUPLICATE BOOKING
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        SLOT CHECK
        -----------------------------------------------------
      */

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
                ('confirmed', 'completed')
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


      /*
        -----------------------------------------------------
        UNIQUE BOOKING CODE
        -----------------------------------------------------
      */

      let bookingCode = null;


      for (let i = 0; i < 20; i++) {

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


      /*
        -----------------------------------------------------
        AMOUNT
        -----------------------------------------------------
      */

      const amount =
        Number(
          event.price || 0
        );


      /*
        -----------------------------------------------------
        CREATE BOOKING
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        CREATE PAYMENT
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        UPI
        -----------------------------------------------------
      */

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

          pass: null,

          attendance: null,
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


      return sendDatabaseError(
        res,
        "Unable to create booking",
        error
      );


    } finally {

      client.release();

    }
  };


/* =========================================================
   GET MY BOOKINGS
   GET /api/bookings
   ========================================================= */

const getMyBookings =
  async (
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
            ep.created_at AS pass_created_at,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

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

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ea ON TRUE

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


/* =========================================================
   GET MY SINGLE BOOKING
   GET /api/bookings/:id
   ========================================================= */

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
            ep.created_at AS pass_created_at,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

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

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY id DESC
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
      } = getUpiConfig();


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
            Boolean(
              booking.attendance_id
            ),

          attendance_status:
            booking.attendance_status ||
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


/* =========================================================
   GET MY EVENT PASS
   GET /api/bookings/:id/pass
   ========================================================= */

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
            p.transaction_id,

            ea.id AS attendance_id,
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
            ORDER BY id DESC
            LIMIT 1
          ) ea ON TRUE

          WHERE ep.booking_id = $1
            AND b.user_id = $2
            AND b.booking_status = 'confirmed'
            AND p.payment_status = 'verified'

          ORDER BY ep.id DESC

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


      /*
        -----------------------------------------------------
        QR DATA
        -----------------------------------------------------

        DO NOT put sensitive user information here.

        The admin backend validates:
        - booking ID
        - event ID
        - pass token
        - attendance code
        - payment
        - booking status
        - pass validity
      */

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

        attendanceCode:
          pass.attendance_code,

        attendanceStatus:
          pass.attendance_status ||
          "not_present",
      };


      return res.json({

        success: true,

        pass: {

          ...pass,

          /*
            Object form for frontend
          */
          qr_data:
            qrData,

          /*
            String form for QR generator
          */
          qr_payload:
            JSON.stringify(
              qrData
            ),

          has_attendance:
            Boolean(
              pass.attendance_id
            ),

          attendance_required:
            true,

          attendance_status:
            pass.attendance_status ||
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


/* =========================================================
   ADMIN - GET ALL BOOKINGS
   GET /api/bookings/admin
   ========================================================= */

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
            b.created_at AS booking_created_at,
            b.updated_at AS booking_updated_at,

            /*
              USER
            */

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

            /*
              EVENT
            */

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

            /*
              PAYMENT
            */

            p.id AS payment_id,
            p.payment_method,
            p.transaction_id,
            p.amount AS payment_amount,
            p.payment_status,
            p.payment_proof_url,
            p.verified_by,
            p.verified_at,
            p.created_at AS payment_created_at,

            /*
              PASS
            */

            ep.id AS pass_id,
            ep.pass_code,
            ep.pass_token,
            ep.valid_from,
            ep.valid_until,
            ep.created_at AS pass_created_at,

            /*
              ATTENDANCE
            */

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by,
            ea.created_at AS attendance_created_at,
            ea.updated_at AS attendance_updated_at

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

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ea ON TRUE

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


/* =========================================================
   ADMIN - GET SINGLE BOOKING
   GET /api/bookings/admin/:id
   ========================================================= */

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
            u.username AS user_name,
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
            ep.created_at AS pass_created_at,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by,
            ea.created_at AS attendance_created_at,
            ea.updated_at AS attendance_updated_at

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

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ea ON TRUE

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
        "Unable to load booking",
        error
      );

    }
  };


/* =========================================================
   ADMIN - UPDATE BOOKING STATUS
   PUT /api/bookings/admin/:id/status
   ========================================================= */

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


      let finalBookingStatus =
        bookingStatus ||
        status ||
        null;


      let finalPaymentStatus =
        paymentStatus ||
        null;


      /*
        CONFIRMED BOOKING
        automatically means payment verified
      */

      if (
        finalBookingStatus ===
          "confirmed" &&
        !finalPaymentStatus
      ) {
        finalPaymentStatus =
          "verified";
      }


      /*
        VERIFIED PAYMENT
        automatically means booking confirmed
      */

      if (
        finalPaymentStatus ===
          "verified" &&
        !finalBookingStatus
      ) {
        finalBookingStatus =
          "confirmed";
      }


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


      /*
        -----------------------------------------------------
        CHECK BOOKING
        -----------------------------------------------------
      */

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
        bookingCheck.rows.length === 0
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


      /*
        -----------------------------------------------------
        UPDATE BOOKING
        -----------------------------------------------------
      */

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


      /*
        -----------------------------------------------------
        UPDATE PAYMENT
        -----------------------------------------------------
      */

      if (
        finalPaymentStatus
      ) {

        const paymentResult =
          await client.query(
            `
            UPDATE event_payments

            SET

              payment_status = $1,

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

            WHERE booking_id = $2

            RETURNING *
            `,
            [
              finalPaymentStatus,
              id,
              req.adminId ||
                req.admin?.id ||
                null,
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


      /*
        -----------------------------------------------------
        GET FINAL STATUS
        -----------------------------------------------------
      */

      const currentStatus =
        await client.query(
          `
          SELECT

            b.booking_status,
            b.event_id,

            p.payment_status

          FROM event_bookings b

          LEFT JOIN LATERAL (
            SELECT payment_status
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


      /*
        -----------------------------------------------------
        CREATE EVENT PASS
        -----------------------------------------------------

        This happens only when:

        booking_status = confirmed
        payment_status = verified
      */

      let eventPass = null;


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


      /*
        -----------------------------------------------------
        GET UPDATED BOOKING
        -----------------------------------------------------
      */

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
            ep.valid_until,

            ea.id AS attendance_id,
            ea.attendance_code,
            ea.attendance_status,
            ea.marked_at AS attendance_marked_at,
            ea.marked_by AS attendance_marked_by

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

          LEFT JOIN LATERAL (
            SELECT *
            FROM event_attendance
            WHERE booking_id = b.id
            ORDER BY id DESC
            LIMIT 1
          ) ea ON TRUE

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


      return sendDatabaseError(
        res,
        "Unable to update booking",
        error
      );


    } finally {

      client.release();

    }
  };


/* =========================================================
   ADMIN - DELETE BOOKING
   DELETE /api/bookings/admin/:id
   ========================================================= */

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


      /*
        -----------------------------------------------------
        CHECK BOOKING
        -----------------------------------------------------
      */

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
        booking.rows.length === 0
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


      /*
        -----------------------------------------------------
        DELETE ATTENDANCE
        -----------------------------------------------------
      */

      await client.query(
        `
        DELETE FROM event_attendance
        WHERE booking_id = $1
        `,
        [id]
      );


      /*
        -----------------------------------------------------
        DELETE PASS
        -----------------------------------------------------
      */

      await client.query(
        `
        DELETE FROM event_passes
        WHERE booking_id = $1
        `,
        [id]
      );


      /*
        -----------------------------------------------------
        DELETE PAYMENTS
        -----------------------------------------------------
      */

      await client.query(
        `
        DELETE FROM event_payments
        WHERE booking_id = $1
        `,
        [id]
      );


      /*
        -----------------------------------------------------
        DELETE BOOKING
        -----------------------------------------------------
      */

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
          rollbackError
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


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {

  createBooking,

  getMyBookings,

  getMyBookingById,

  getMyPass,

  getAllBookings,

  getAdminBookingById,

  updateBookingStatus,

  deleteBooking,
};const pool = require("../config/db");
const crypto = require("crypto");

/*
=========================================================
BOOKING CONTROLLER
SNICT
=========================================================

FEATURES
- Create event booking
- Create UPI payment
- Get user bookings
- Get single booking
- Generate event pass
- Generate secure QR payload
- Generate attendance code
- Admin booking management
- Payment status management
- Attendance integration
- Delete booking

IMPORTANT
Attendance is optional at booking creation time.

Flow:

USER BOOKS
   ↓
payment_pending
   ↓
USER SUBMITS UTR
   ↓
payment submitted
   ↓
ADMIN VERIFIES PAYMENT
   ↓
booking confirmed
   ↓
EVENT PASS CREATED
   ↓
ATTENDANCE RECORD CREATED
   ↓
QR + ATTENDANCE CODE AVAILABLE
   ↓
ADMIN SCANS QR / ENTERS CODE
   ↓
PRESENT
=========================================================
*/


/* =========================================================
   HELPERS
========================================================= */

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
  return crypto.randomBytes(32).toString("hex");
};


const generateAttendanceCode = () => {
  return `SNICT-ATT-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
};


/* =========================================================
   DATABASE ERROR
========================================================= */

const sendDatabaseError = (
  res,
  message,
  error
) => {
  console.error("====================================");
  console.error(message);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("Detail:", error.detail);
  console.error("Hint:", error.hint);
  console.error("Table:", error.table);
  console.error("Column:", error.column);
  console.error("Constraint:", error.constraint);
  console.error("====================================");

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


/* =========================================================
   UPI CONFIG
========================================================= */

const getUpiConfig = () => {
  return {
    upiId:
      process.env.SNICT_UPI_ID || "",

    payeeName:
      process.env.SNICT_UPI_NAME || "SNICT",
  };
};


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


/* =========================================================
   UNIQUE ATTENDANCE CODE
========================================================= */

const getUniqueAttendanceCode = async (client) => {
  for (let i = 0; i < 20; i++) {
    const code = generateAttendanceCode();

    const result = await client.query(
      `
      SELECT id
      FROM event_attendance
      WHERE attendance_code = $1
      LIMIT 1
      `,
      [code]
    );

    if (result.rows.length === 0) {
      return code;
    }
  }

  throw new Error(
    "Unable to generate unique attendance code"
  );
};


/* =========================================================
   ENSURE ATTENDANCE RECORD
========================================================= */

const ensureAttendanceRecord = async (
  client,
  bookingId,
  eventId
) => {
  const existing = await client.query(
    `
    SELECT *
    FROM event_attendance
    WHERE booking_id = $1
    LIMIT 1
    `,
    [bookingId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const attendanceCode =
    await getUniqueAttendanceCode(client);

  const result = await client.query(
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


/* =========================================================
   CREATE EVENT PASS
========================================================= */

const createEventPass = async (
  client,
  bookingId
) => {

  /*
  ---------------------------------------------------------
  EXISTING PASS
  ---------------------------------------------------------
  */

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

  if (existingPass.rows.length > 0) {

    const bookingResult =
      await client.query(
        `
        SELECT
          event_id,
          booking_status
        FROM event_bookings
        WHERE id = $1
        LIMIT 1
        `,
        [bookingId]
      );

    if (
      bookingResult.rows.length > 0 &&
      bookingResult.rows[0].booking_status ===
        "confirmed"
    ) {
      await ensureAttendanceRecord(
        client,
        bookingId,
        bookingResult.rows[0].event_id
      );
    }

    return existingPass.rows[0];
  }


  /*
  ---------------------------------------------------------
  GET BOOKING
  ---------------------------------------------------------
  */

  const result = await client.query(
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
      SELECT payment_status
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


  if (result.rows.length === 0) {
    throw new Error(
      "Booking not found while creating pass"
    );
  }


  const booking = result.rows[0];


  /*
  ---------------------------------------------------------
  ONLY CONFIRMED + VERIFIED
  ---------------------------------------------------------
  */

  if (
    booking.booking_status !== "confirmed" ||
    booking.payment_status !== "verified"
  ) {
    return null;
  }


  /*
  ---------------------------------------------------------
  GENERATE PASS CODE
  ---------------------------------------------------------
  */

  let passCode = null;

  for (let i = 0; i < 20; i++) {

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

    if (check.rows.length === 0) {
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


  /*
  ---------------------------------------------------------
  EVENT DATE / TIME
  ---------------------------------------------------------
  */

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


  /*
  ---------------------------------------------------------
  CREATE PASS
  ---------------------------------------------------------
  */

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


  /*
  ---------------------------------------------------------
  CREATE ATTENDANCE
  ---------------------------------------------------------
  */

  await ensureAttendanceRecord(
    client,
    bookingId,
    booking.event_id
  );


  return passResult.rows[0];
};


/* =========================================================
   CREATE BOOKING
   POST /api/bookings/event/:eventId
========================================================= */

const createBooking = async (
  req,
  res
) => {

  const client =
    await pool.connect();

  try {

    const userId =
      req.userId;

    const { eventId } =
      req.params;


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


    await client.query("BEGIN");


    /*
    ---------------------------------------------------------
    EVENT
    ---------------------------------------------------------
    */

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


    if (eventResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Event not found or booking is closed",
      });
    }


    const event =
      eventResult.rows[0];


    /*
    ---------------------------------------------------------
    EVENT END CHECK
    ---------------------------------------------------------
    */

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

        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "This event has already ended",
        });
      }
    }


    /*
    ---------------------------------------------------------
    DUPLICATE BOOKING
    ---------------------------------------------------------
    */

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


    if (existing.rows.length > 0) {

      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "You already have a booking for this event",
        booking:
          existing.rows[0],
      });
    }


    /*
    ---------------------------------------------------------
    SLOT CHECK
    ---------------------------------------------------------
    */

    if (event.max_slots !== null) {

      const countResult =
        await client.query(
          `
          SELECT
            COUNT(*)::INTEGER AS total
          FROM event_bookings
          WHERE event_id = $1
            AND booking_status IN
              ('confirmed', 'completed')
          `,
          [eventId]
        );


      const booked =
        Number(
          countResult.rows[0]?.total || 0
        );


      if (
        booked >=
        Number(event.max_slots)
      ) {

        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "No booking slots are available",
        });
      }
    }


    /*
    ---------------------------------------------------------
    UNIQUE BOOKING CODE
    ---------------------------------------------------------
    */

    let bookingCode = null;

    for (let i = 0; i < 20; i++) {

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

      if (check.rows.length === 0) {
        bookingCode = generated;
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


    /*
    ---------------------------------------------------------
    CREATE BOOKING
    ---------------------------------------------------------
    */

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


    /*
    ---------------------------------------------------------
    CREATE PAYMENT
    ---------------------------------------------------------
    */

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


    await client.query("COMMIT");


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

        pass: null,

        attendance: null,
      },

      payment:
        paymentResult.rows[0],
    });


  } catch (error) {

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
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


/* =========================================================
   GET MY BOOKINGS
   GET /api/bookings
========================================================= */

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
          ep.created_at AS pass_created_at,

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

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

        LEFT JOIN LATERAL (
          SELECT
            id,
            booking_id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ea ON TRUE

        WHERE b.user_id = $1

        ORDER BY b.created_at DESC
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


/* =========================================================
   GET MY SINGLE BOOKING
   GET /api/bookings/:id
========================================================= */

const getMyBookingById = async (
  req,
  res
) => {

  try {

    const userId =
      req.userId;

    const { id } =
      req.params;


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
          ep.created_at AS pass_created_at,

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

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

        LEFT JOIN LATERAL (
          SELECT
            id,
            booking_id,
            event_id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
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


    if (result.rows.length === 0) {

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
          Boolean(booking.pass_id),

        has_attendance:
          Boolean(
            booking.attendance_id
          ),

        attendance_status:
          booking.attendance_status ||
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


/* =========================================================
   GET MY EVENT PASS
   GET /api/bookings/:id/pass
========================================================= */

const getMyPass = async (
  req,
  res
) => {

  try {

    const userId =
      req.userId;

    const { id } =
      req.params;


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
          p.transaction_id,

          ea.id AS attendance_id,
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
            payment_status,
            transaction_id
          FROM event_payments
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) p ON TRUE

        LEFT JOIN LATERAL (
          SELECT
            id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ea ON TRUE

        WHERE ep.booking_id = $1
          AND b.user_id = $2
          AND b.booking_status = 'confirmed'
          AND p.payment_status = 'verified'

        ORDER BY ep.id DESC

        LIMIT 1
        `,
        [
          id,
          userId,
        ]
      );


    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          "Valid event pass not found.",
      });
    }


    const pass =
      result.rows[0];


    /*
    ---------------------------------------------------------
    QR PAYLOAD
    ---------------------------------------------------------
    */

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

      attendanceCode:
        pass.attendance_code,

      attendanceStatus:
        pass.attendance_status ||
        "not_present",
    };


    return res.json({

      success: true,

      pass: {

        ...pass,

        qr_data:
          qrData,

        qr_payload:
          JSON.stringify(qrData),

        has_attendance:
          Boolean(
            pass.attendance_id
          ),

        attendance_required:
          true,

        attendance_status:
          pass.attendance_status ||
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


/* =========================================================
   ADMIN - GET ALL BOOKINGS
   GET /api/bookings/admin
========================================================= */

const getAllBookings = async (
  req,
  res
) => {

  try {

    /*
    IMPORTANT

    Do NOT use SELECT * from attendance here.

    Only select the attendance fields that are
    actually required by BookingManagement.

    This prevents optional attendance columns from
    breaking the entire admin booking API.
    */

    const result =
      await pool.query(
        `
        SELECT

          /* BOOKING */

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


          /* USER */

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


          /* EVENT */

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


          /* PAYMENT */

          p.id AS payment_id,
          p.payment_method,
          p.transaction_id,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_by,
          p.verified_at,
          p.created_at AS payment_created_at,


          /* PASS */

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,


          /* ATTENDANCE */

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by


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


        LEFT JOIN LATERAL (
          SELECT
            id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ea ON TRUE


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


/* =========================================================
   ADMIN - GET SINGLE BOOKING
   GET /api/bookings/admin/:id
========================================================= */

const getAdminBookingById = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


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


          /* USER */

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


          /* EVENT */

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


          /* PAYMENT */

          p.id AS payment_id,
          p.payment_method,
          p.transaction_id,
          p.amount AS payment_amount,
          p.payment_status,
          p.payment_proof_url,
          p.verified_by,
          p.verified_at,
          p.created_at AS payment_created_at,


          /* PASS */

          ep.id AS pass_id,
          ep.pass_code,
          ep.pass_token,
          ep.valid_from,
          ep.valid_until,
          ep.created_at AS pass_created_at,


          /* ATTENDANCE */

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by


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


        LEFT JOIN LATERAL (
          SELECT
            id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ea ON TRUE


        WHERE b.id = $1

        LIMIT 1
        `,
        [id]
      );


    if (result.rows.length === 0) {

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
      "Unable to load booking",
      error
    );
  }
};


/* =========================================================
   ADMIN - UPDATE BOOKING / PAYMENT STATUS
   PUT /api/bookings/admin/:id/status
========================================================= */

const updateBookingStatus = async (
  req,
  res
) => {

  const client =
    await pool.connect();

  try {

    const { id } =
      req.params;


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


    /*
    ---------------------------------------------------------
    AUTOMATIC STATUS SYNC
    ---------------------------------------------------------
    */

    if (
      finalBookingStatus === "confirmed" &&
      !finalPaymentStatus
    ) {
      finalPaymentStatus =
        "verified";
    }


    if (
      finalPaymentStatus === "verified" &&
      !finalBookingStatus
    ) {
      finalBookingStatus =
        "confirmed";
    }


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


    await client.query("BEGIN");


    /*
    ---------------------------------------------------------
    CHECK BOOKING
    ---------------------------------------------------------
    */

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


    if (bookingCheck.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }


    /*
    ---------------------------------------------------------
    UPDATE BOOKING
    ---------------------------------------------------------
    */

    if (finalBookingStatus) {

      await client.query(
        `
        UPDATE event_bookings
        SET
          booking_status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          finalBookingStatus,
          id,
        ]
      );
    }


    /*
    ---------------------------------------------------------
    UPDATE PAYMENT
    ---------------------------------------------------------
    */

    if (finalPaymentStatus) {

      const paymentResult =
        await client.query(
          `
          UPDATE event_payments

          SET
            payment_status = $1,

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

          WHERE booking_id = $2

          RETURNING *
          `,
          [
            finalPaymentStatus,
            id,
            req.adminId ||
              req.admin?.id ||
              null,
          ]
        );


      if (
        paymentResult.rows.length === 0
      ) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message:
            "Payment record not found",
        });
      }
    }


    /*
    ---------------------------------------------------------
    GET FINAL STATUS
    ---------------------------------------------------------
    */

    const currentStatus =
      await client.query(
        `
        SELECT

          b.booking_status,
          b.event_id,

          p.payment_status

        FROM event_bookings b

        LEFT JOIN LATERAL (
          SELECT payment_status
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


    /*
    ---------------------------------------------------------
    CREATE PASS + ATTENDANCE
    ---------------------------------------------------------
    */

    let eventPass = null;
    let attendance = null;


    if (
      currentStatus.rows.length > 0
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


        /*
        Get attendance record after pass creation.
        */

        const attendanceResult =
          await client.query(
            `
            SELECT
              id,
              booking_id,
              event_id,
              attendance_code,
              attendance_status,
              marked_at,
              marked_by
            FROM event_attendance
            WHERE booking_id = $1
            ORDER BY id DESC
            LIMIT 1
            `,
            [id]
          );


        attendance =
          attendanceResult.rows[0] ||
          null;
      }
    }


    /*
    ---------------------------------------------------------
    UPDATED BOOKING
    ---------------------------------------------------------
    */

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
          ep.valid_until,

          ea.id AS attendance_id,
          ea.attendance_code,
          ea.attendance_status,
          ea.marked_at AS attendance_marked_at,
          ea.marked_by AS attendance_marked_by

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

        LEFT JOIN LATERAL (
          SELECT
            id,
            attendance_code,
            attendance_status,
            marked_at,
            marked_by
          FROM event_attendance
          WHERE booking_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) ea ON TRUE

        WHERE b.id = $1

        LIMIT 1
        `,
        [id]
      );


    await client.query("COMMIT");


    return res.json({

      success: true,

      message:
        "Booking updated successfully",

      booking:
        updated.rows[0],

      pass:
        eventPass,

      attendance:
        attendance,
    });


  } catch (error) {

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
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


/* =========================================================
   ADMIN - DELETE BOOKING
   DELETE /api/bookings/admin/:id
========================================================= */

const deleteBooking = async (
  req,
  res
) => {

  const client =
    await pool.connect();

  try {

    const { id } =
      req.params;


    await client.query("BEGIN");


    /*
    ---------------------------------------------------------
    CHECK BOOKING
    ---------------------------------------------------------
    */

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


    if (booking.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }


    /*
    ---------------------------------------------------------
    DELETE ATTENDANCE
    ---------------------------------------------------------
    */

    await client.query(
      `
      DELETE FROM event_attendance
      WHERE booking_id = $1
      `,
      [id]
    );


    /*
    ---------------------------------------------------------
    DELETE PASS
    ---------------------------------------------------------
    */

    await client.query(
      `
      DELETE FROM event_passes
      WHERE booking_id = $1
      `,
      [id]
    );


    /*
    ---------------------------------------------------------
    DELETE PAYMENT
    ---------------------------------------------------------
    */

    await client.query(
      `
      DELETE FROM event_payments
      WHERE booking_id = $1
      `,
      [id]
    );


    /*
    ---------------------------------------------------------
    DELETE BOOKING
    ---------------------------------------------------------
    */

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


    await client.query("COMMIT");


    return res.json({

      success: true,

      message:
        "Booking deleted successfully",

      booking:
        deleted.rows[0],
    });


  } catch (error) {

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
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


/* =========================================================
   EXPORT
========================================================= */

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