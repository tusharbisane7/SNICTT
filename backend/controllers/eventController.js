const pool = require("../config/db");

// =========================================================
// HELPER - EVENT STATUS
// =========================================================

const getEventStatus = (
  eventDate,
  startTime,
  endTime
) => {
  if (!eventDate || !startTime || !endTime) {
    return "upcoming";
  }

  const start = new Date(
    `${eventDate}T${startTime}`
  );

  const end = new Date(
    `${eventDate}T${endTime}`
  );

  const now = new Date();

  if (now < start) {
    return "upcoming";
  }

  if (now >= start && now <= end) {
    return "ongoing";
  }

  return "past";
};


// =========================================================
// HELPER - FORMAT EVENT
// =========================================================

const formatEvent = (event) => {
  const bookedSlots =
    Number(event.booked_slots || 0);

  const maxSlots =
    event.max_slots === null ||
    event.max_slots === undefined
      ? null
      : Number(event.max_slots);

  return {
    ...event,

    status: getEventStatus(
      event.event_date,
      event.start_time,
      event.end_time
    ),

    price: Number(event.price || 0),

    max_slots: maxSlots,

    booked_slots: bookedSlots,

    available_slots:
      maxSlots === null
        ? null
        : Math.max(
            0,
            maxSlots - bookedSlots
          ),
  };
};


// =========================================================
// GET PUBLIC EVENTS
// GET /api/events
// =========================================================

const getEvents = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(`
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
          published,
          created_at,
          updated_at
        FROM events
        WHERE published = TRUE
        ORDER BY
          event_date ASC,
          start_time ASC
      `);

    const events =
      result.rows.map(
        (event) =>
          formatEvent(event)
      );

    return res.json({
      success: true,
      events,
    });

  } catch (error) {
    console.error(
      "Get events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch events",
    });
  }
};


// =========================================================
// GET SINGLE PUBLIC EVENT
// GET /api/events/:id
// =========================================================

const getEventById = async (
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
          published,
          created_at,
          updated_at
        FROM events
        WHERE id = $1
          AND published = TRUE
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
          "Event not found",
      });
    }

    return res.json({
      success: true,

      event: formatEvent(
        result.rows[0]
      ),
    });

  } catch (error) {
    console.error(
      "Get event by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch event",
    });
  }
};


// =========================================================
// ADMIN - GET ALL EVENTS
// GET /api/events/admin/all
// =========================================================

const getAllEvents = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(`
        SELECT
          e.*,

          COALESCE(
            (
              SELECT COUNT(*)
              FROM event_bookings b
              WHERE
                b.event_id = e.id
                AND b.booking_status IN
                (
                  'confirmed',
                  'completed'
                )
            ),
            0
          )::INTEGER AS booked_slots

        FROM events e

        ORDER BY
          e.event_date DESC,
          e.start_time DESC
      `);

    const events =
      result.rows.map(
        (event) =>
          formatEvent(event)
      );

    return res.json({
      success: true,
      events,
    });

  } catch (error) {
    console.error(
      "Admin get events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch admin events",
    });
  }
};


// =========================================================
// ADMIN - CREATE EVENT
// POST /api/events/admin
// =========================================================

const createEvent = async (
  req,
  res
) => {
  try {
    const {
      title,
      eventType,
      description,
      doctorName,
      specialization,
      eventDate,
      startTime,
      endTime,
      venue,
      eventMode,
      price,
      maxSlots,
      imageUrl,
      bookingEnabled,
      published,
    } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !title ||
      !eventDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, date, start time and end time are required",
      });
    }


    // =====================================================
    // TIME VALIDATION
    // =====================================================

    const start =
      new Date(
        `${eventDate}T${startTime}`
      );

    const end =
      new Date(
        `${eventDate}T${endTime}`
      );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid event date or time",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be after start time",
      });
    }


    // =====================================================
    // PRICE
    // =====================================================

    const eventPrice =
      price === undefined ||
      price === null ||
      price === ""
        ? 0
        : Number(price);

    if (
      Number.isNaN(eventPrice) ||
      eventPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event price must be a valid positive number",
      });
    }


    // =====================================================
    // MAX SLOTS
    // =====================================================

    let eventMaxSlots = null;

    if (
      maxSlots !== undefined &&
      maxSlots !== null &&
      maxSlots !== ""
    ) {
      eventMaxSlots =
        Number(maxSlots);

      if (
        Number.isNaN(
          eventMaxSlots
        ) ||
        eventMaxSlots <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum slots must be greater than zero",
        });
      }
    }


    // =====================================================
    // INSERT
    // =====================================================

    const result =
      await pool.query(
        `
        INSERT INTO events (
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
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15
        )

        RETURNING *
        `,
        [
          title.trim(),

          eventType ||
            "Other",

          description?.trim() ||
            null,

          doctorName?.trim() ||
            null,

          specialization?.trim() ||
            null,

          eventDate,

          startTime,

          endTime,

          venue?.trim() ||
            null,

          eventMode ||
            "offline",

          eventPrice,

          eventMaxSlots,

          imageUrl?.trim() ||
            null,

          bookingEnabled !== false,

          published !== false,
        ]
      );


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,

      message:
        "Event created successfully",

      event: formatEvent(
        result.rows[0]
      ),
    });

  } catch (error) {
    console.error(
      "Create event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create event",
    });
  }
};


// =========================================================
// ADMIN - UPDATE EVENT
// PUT /api/events/admin/:id
// =========================================================

const updateEvent = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      title,
      eventType,
      description,
      doctorName,
      specialization,
      eventDate,
      startTime,
      endTime,
      venue,
      eventMode,
      price,
      maxSlots,
      imageUrl,
      bookingEnabled,
      published,
    } = req.body;


    // =====================================================
    // CHECK EVENT
    // =====================================================

    const existing =
      await pool.query(
        `
        SELECT *
        FROM events
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

    if (
      existing.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Event not found",
      });
    }


    const current =
      existing.rows[0];


    // =====================================================
    // FINAL VALUES
    // =====================================================

    const finalTitle =
      title !== undefined
        ? title.trim()
        : current.title;

    const finalEventDate =
      eventDate ||
      current.event_date;

    const finalStartTime =
      startTime ||
      current.start_time;

    const finalEndTime =
      endTime ||
      current.end_time;


    if (!finalTitle) {
      return res.status(400).json({
        success: false,
        message:
          "Event title is required",
      });
    }


    // =====================================================
    // TIME VALIDATION
    // =====================================================

    const start =
      new Date(
        `${finalEventDate}T${finalStartTime}`
      );

    const end =
      new Date(
        `${finalEventDate}T${finalEndTime}`
      );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid event date or time",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be after start time",
      });
    }


    // =====================================================
    // PRICE
    // =====================================================

    const finalPrice =
      price !== undefined &&
      price !== null &&
      price !== ""
        ? Number(price)
        : Number(current.price || 0);

    if (
      Number.isNaN(finalPrice) ||
      finalPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid event price",
      });
    }


    // =====================================================
    // MAX SLOTS
    // =====================================================

    let finalMaxSlots = null;

    if (
      maxSlots !== undefined &&
      maxSlots !== null &&
      maxSlots !== ""
    ) {
      finalMaxSlots =
        Number(maxSlots);

      if (
        Number.isNaN(
          finalMaxSlots
        ) ||
        finalMaxSlots <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum slots must be greater than zero",
        });
      }
    } else if (
      maxSlots === null ||
      maxSlots === ""
    ) {
      finalMaxSlots = null;
    } else {
      finalMaxSlots =
        current.max_slots;
    }


    // =====================================================
    // UPDATE
    // =====================================================

    const result =
      await pool.query(
        `
        UPDATE events

        SET
          title = $1,
          event_type = $2,
          description = $3,
          doctor_name = $4,
          specialization = $5,
          event_date = $6,
          start_time = $7,
          end_time = $8,
          venue = $9,
          event_mode = $10,
          price = $11,
          max_slots = $12,
          image_url = $13,
          booking_enabled = $14,
          published = $15,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $16

        RETURNING *
        `,
        [
          finalTitle,

          eventType !== undefined
            ? eventType
            : current.event_type,

          description !== undefined
            ? description?.trim() ||
              null
            : current.description,

          doctorName !== undefined
            ? doctorName?.trim() ||
              null
            : current.doctor_name,

          specialization !== undefined
            ? specialization?.trim() ||
              null
            : current.specialization,

          finalEventDate,

          finalStartTime,

          finalEndTime,

          venue !== undefined
            ? venue?.trim() ||
              null
            : current.venue,

          eventMode !== undefined
            ? eventMode
            : current.event_mode,

          finalPrice,

          finalMaxSlots,

          imageUrl !== undefined
            ? imageUrl?.trim() ||
              null
            : current.image_url,

          bookingEnabled !== undefined
            ? Boolean(
                bookingEnabled
              )
            : current.booking_enabled,

          published !== undefined
            ? Boolean(published)
            : current.published,

          id,
        ]
      );


    return res.json({
      success: true,

      message:
        "Event updated successfully",

      event: formatEvent(
        result.rows[0]
      ),
    });

  } catch (error) {
    console.error(
      "Update event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update event",
    });
  }
};


// =========================================================
// ADMIN - DELETE EVENT
// DELETE /api/events/admin/:id
// =========================================================

const deleteEvent = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;


    // =====================================================
    // CHECK EVENT
    // =====================================================

    const existing =
      await pool.query(
        `
        SELECT id
        FROM events
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

    if (
      existing.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Event not found",
      });
    }


    // =====================================================
    // DELETE
    // =====================================================

    await pool.query(
      `
      DELETE FROM events
      WHERE id = $1
      `,
      [id]
    );


    return res.json({
      success: true,

      message:
        "Event deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete event error:",
      error
    );


    // Foreign key / booking dependency
    if (
      error.code === "23503"
    ) {
      return res.status(409).json({
        success: false,

        message:
          "This event cannot be deleted because bookings are associated with it. Disable booking or unpublish the event instead.",
      });
    }


    return res.status(500).json({
      success: false,

      message:
        "Unable to delete event",
    });
  }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getEvents,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};