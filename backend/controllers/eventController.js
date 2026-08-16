const pool =
  require("../config/db");

const cloudinary =
  require("../config/cloudinary");


// =========================================================
// EVENT STATUS
// =========================================================

const getEventStatus = (
  eventDate,
  startTime,
  endTime
) => {

  if (
    !eventDate ||
    !startTime ||
    !endTime
  ) {
    return "upcoming";
  }

  const start =
    new Date(
      `${eventDate}T${startTime}`
    );

  const end =
    new Date(
      `${eventDate}T${endTime}`
    );

  const now =
    new Date();

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return "upcoming";
  }

  if (
    now < start
  ) {
    return "upcoming";
  }

  if (
    now >= start &&
    now <= end
  ) {
    return "ongoing";
  }

  return "past";
};


// =========================================================
// FORMAT EVENT
// =========================================================

const formatEvent = (
  event
) => {

  const bookedSlots =
    Number(
      event.booked_slots || 0
    );

  const maxSlots =
    event.max_slots === null ||
    event.max_slots === undefined
      ? null
      : Number(
          event.max_slots
        );

  return {
    ...event,

    status:
      getEventStatus(
        event.event_date,
        event.start_time,
        event.end_time
      ),

    price:
      Number(
        event.price || 0
      ),

    max_slots:
      maxSlots,

    booked_slots:
      bookedSlots,

    available_slots:
      maxSlots === null
        ? null
        : Math.max(
            0,
            maxSlots -
              bookedSlots
          ),

    gallery:
      Array.isArray(
        event.gallery
      )
        ? event.gallery
        : [],

    videos:
      Array.isArray(
        event.videos
      )
        ? event.videos
        : [],

    documents:
      Array.isArray(
        event.documents
      )
        ? event.documents
        : [],

    gallery_count:
      Array.isArray(
        event.gallery
      )
        ? event.gallery.length
        : 0,

    video_count:
      Array.isArray(
        event.videos
      )
        ? event.videos.length
        : 0,

    document_count:
      Array.isArray(
        event.documents
      )
        ? event.documents.length
        : 0,
  };
};


// =========================================================
// MEDIA SELECT
// =========================================================

const MEDIA_SELECT = `

  COALESCE(
    (
      SELECT
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',
            eg.id,

            'event_id',
            eg.event_id,

            'image_url',
            eg.image_url,

            'public_id',
            eg.public_id,

            'caption',
            eg.caption,

            'display_order',
            eg.display_order,

            'created_at',
            eg.created_at
          )

          ORDER BY
            eg.display_order ASC,
            eg.created_at DESC
        )

      FROM event_gallery eg

      WHERE
        eg.event_id = e.id
    ),

    '[]'::json

  ) AS gallery,


  COALESCE(
    (
      SELECT
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',
            ev.id,

            'event_id',
            ev.event_id,

            'title',
            ev.title,

            'video_url',
            ev.video_url,

            'public_id',
            ev.public_id,

            'thumbnail_url',
            ev.thumbnail_url,

            'description',
            ev.description,

            'display_order',
            ev.display_order,

            'created_at',
            ev.created_at
          )

          ORDER BY
            ev.display_order ASC,
            ev.created_at DESC
        )

      FROM event_videos ev

      WHERE
        ev.event_id = e.id
    ),

    '[]'::json

  ) AS videos,


  COALESCE(
    (
      SELECT
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',
            ed.id,

            'event_id',
            ed.event_id,

            'title',
            ed.title,

            'file_url',
            ed.file_url,

            'public_id',
            ed.public_id,

            'file_name',
            ed.file_name,

            'file_type',
            ed.file_type,

            'file_size',
            ed.file_size,

            'display_order',
            ed.display_order,

            'created_at',
            ed.created_at
          )

          ORDER BY
            ed.display_order ASC,
            ed.created_at DESC
        )

      FROM event_documents ed

      WHERE
        ed.event_id = e.id
    ),

    '[]'::json

  ) AS documents

`;


// =========================================================
// GET PUBLIC EVENTS
// GET /api/events
// =========================================================

const getEvents =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            e.id,
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
            e.price,
            e.max_slots,
            e.image_url,
            e.booking_enabled,
            e.published,
            e.created_at,
            e.updated_at,

            ${MEDIA_SELECT}

          FROM events e

          WHERE
            e.published = TRUE

          ORDER BY
            e.event_date ASC,
            e.start_time ASC
          `
        );

      const events =
        result.rows.map(
          (event) =>
            formatEvent(
              event
            )
        );

      return res.json({
        success: true,
        events,
      });

    } catch (
      error
    ) {

      console.error(
        "Get events error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to fetch events",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// GET SINGLE PUBLIC EVENT
// GET /api/events/:id
// =========================================================

const getEventById =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT
            e.id,
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
            e.price,
            e.max_slots,
            e.image_url,
            e.booking_enabled,
            e.published,
            e.created_at,
            e.updated_at,

            ${MEDIA_SELECT}

          FROM events e

          WHERE
            e.id = $1
            AND e.published = TRUE

          LIMIT 1
          `,
          [id]
        );

      if (
        result.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found",
        });
      }

      return res.json({
        success: true,

        event:
          formatEvent(
            result.rows[0]
          ),
      });

    } catch (
      error
    ) {

      console.error(
        "Get event by ID error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to fetch event",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// REGISTER / BOOK FOR EVENT
//
// POST /api/events/:id/register
//
// Presentation:
// PDF / PPT / PPTX
//
// Presentation is optional.
//
// The upload middleware puts:
//
// req.body.presentationUrl
// req.body.presentationPublicId
//
// and:
//
// req.file.originalname
// req.file.mimetype
// req.file.size
//
// =========================================================

const registerForEvent =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      // =====================================================
      // USER ID
      // =====================================================

      const userId =
        req.userId ||
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        null;


      if (!userId) {

        return res.status(
          401
        ).json({
          success: false,

          message:
            "Authenticated user could not be identified.",
        });
      }


      // =====================================================
      // EVENT
      // =====================================================

      const eventResult =
        await pool.query(
          `
          SELECT
            id,
            title,
            event_type,
            event_date,
            start_time,
            end_time,
            venue,
            event_mode,
            price,
            max_slots,
            booking_enabled,
            published

          FROM events

          WHERE id = $1

          LIMIT 1
          `,
          [id]
        );


      if (
        eventResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found",
        });
      }


      const event =
        eventResult.rows[0];


      // =====================================================
      // PUBLISHED
      // =====================================================

      if (
        !event.published
      ) {

        return res.status(
          400
        ).json({
          success: false,

          message:
            "This event is not available for registration",
        });
      }


      // =====================================================
      // BOOKING ENABLED
      // =====================================================

      if (
        !event.booking_enabled
      ) {

        return res.status(
          400
        ).json({
          success: false,

          message:
            "Registration is currently disabled for this event",
        });
      }


      // =====================================================
      // EVENT STATUS
      // =====================================================

      const status =
        getEventStatus(
          event.event_date,
          event.start_time,
          event.end_time
        );


      if (
        status !==
        "upcoming"
      ) {

        return res.status(
          400
        ).json({
          success: false,

          message:
            "Registration is available only for upcoming events",
        });
      }


      // =====================================================
      // BOOKED SLOTS
      // =====================================================

      const bookingCountResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::INTEGER
              AS booked_slots

          FROM event_bookings

          WHERE
            event_id = $1

            AND booking_status IN (
              'confirmed',
              'completed'
            )
          `,
          [id]
        );


      const bookedSlots =
        Number(
          bookingCountResult
            .rows[0]
            ?.booked_slots ||
          0
        );


      const maxSlots =
        event.max_slots === null ||
        event.max_slots === undefined
          ? null
          : Number(
              event.max_slots
            );


      if (
        maxSlots !== null &&
        bookedSlots >= maxSlots
      ) {

        return res.status(
          409
        ).json({
          success: false,

          message:
            "This event is fully booked",

          available_slots: 0,
        });
      }


      // =====================================================
      // PREVENT DUPLICATE REGISTRATION
      // =====================================================

      const duplicateResult =
        await pool.query(
          `
          SELECT
            id,
            booking_code,
            booking_status,
            amount,

            presentation_url,
            presentation_public_id,
            presentation_name,
            presentation_type,
            presentation_size

          FROM event_bookings

          WHERE
            event_id = $1

            AND user_id = $2

            AND booking_status IN (
              'pending',
              'payment_pending',
              'confirmed',
              'completed'
            )

          ORDER BY
            id DESC

          LIMIT 1
          `,
          [
            id,
            userId
          ]
        );


      if (
        duplicateResult.rows.length >
        0
      ) {

        return res.status(
          409
        ).json({
          success: false,

          message:
            "You already have a registration for this event.",

          booking:
            duplicateResult.rows[0],
        });
      }


      // =====================================================
      // BOOKING CODE
      // =====================================================

      const bookingCode =
        `EVT-${Date.now()}-${Math.floor(
          1000 +
          Math.random() * 9000
        )}`;


      // =====================================================
      // BOOKING AMOUNT
      // =====================================================

      const bookingAmount =
        Number(
          event.price || 0
        );


      // =====================================================
      // PRESENTATION
      //
      // Uploaded by eventUpload.registrationUpload
      // =====================================================

      const presentationUrl =
        req.body?.presentationUrl ||
        req.file?.secure_url ||
        req.file?.path ||
        null;


      const presentationPublicId =
        req.body?.presentationPublicId ||
        req.file?.cloudinary_public_id ||
        req.file?.public_id ||
        null;


      const presentationName =
        req.file?.originalname ||
        null;


      const presentationType =
        req.file?.mimetype ||
        null;


      const presentationSize =
        req.file?.size ||
        req.file?.cloudinary_bytes ||
        null;


      // =====================================================
      // CREATE BOOKING
      // =====================================================

      const bookingResult =
        await pool.query(
          `
          INSERT INTO event_bookings (
            booking_code,
            event_id,
            user_id,
            amount,
            booking_status,

            presentation_url,
            presentation_public_id,
            presentation_name,
            presentation_type,
            presentation_size
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
            $10
          )

          RETURNING
            id,
            booking_code,
            event_id,
            user_id,
            amount,
            booking_status,

            presentation_url,
            presentation_public_id,
            presentation_name,
            presentation_type,
            presentation_size,

            created_at
          `,

          [
            bookingCode,
            id,
            userId,
            bookingAmount,
            "payment_pending",

            presentationUrl,
            presentationPublicId,
            presentationName,
            presentationType,
            presentationSize,
          ]
        );


      const booking =
        bookingResult.rows[0];


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.status(
        201
      ).json({

        success: true,

        message:
          "Event registration created. Continue to payment.",

        booking: {

          id:
            booking.id,

          booking_code:
            booking.booking_code,

          event_id:
            booking.event_id,

          user_id:
            booking.user_id,

          amount:
            Number(
              booking.amount || 0
            ),

          booking_status:
            booking.booking_status,

          presentation_url:
            booking.presentation_url ||
            null,

          presentation_public_id:
            booking.presentation_public_id ||
            null,

          presentation_name:
            booking.presentation_name ||
            null,

          presentation_type:
            booking.presentation_type ||
            null,

          presentation_size:
            booking.presentation_size ||
            null,

          created_at:
            booking.created_at,
        },


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

          price:
            Number(
              event.price || 0
            ),

          max_slots:
            maxSlots,

          booked_slots:
            bookedSlots,

          available_slots:
            maxSlots === null
              ? null
              : Math.max(
                  0,
                  maxSlots -
                    bookedSlots
                ),
        },
      });

    } catch (
      error
    ) {

      console.error(
        "Register for event error:",
        error
      );

      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to register for event",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };


// =========================================================
// ADMIN - GET ALL EVENTS
//
// GET /api/events/admin/all
// =========================================================

const getAllEvents =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            e.id,
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
            e.price,
            e.max_slots,
            e.image_url,
            e.booking_enabled,
            e.published,
            e.created_at,
            e.updated_at,

            COALESCE(
              (
                SELECT
                  COUNT(*)::INTEGER

                FROM event_bookings eb

                WHERE
                  eb.event_id = e.id

                  AND eb.booking_status IN (
                    'confirmed',
                    'completed'
                  )
              ),

              0

            ) AS booked_slots,

            ${MEDIA_SELECT}

          FROM events e

          ORDER BY
            e.event_date DESC,
            e.start_time DESC,
            e.id DESC
          `
        );


      const events =
        result.rows.map(
          (event) =>
            formatEvent(
              event
            )
        );


      return res.json({
        success: true,
        events,
      });

    } catch (
      error
    ) {

      console.error(
        "Get all events error:",
        error
      );

      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to fetch all events",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });
    }
  };
  // =========================================================
// ADMIN - CREATE EVENT
//
// POST /api/events/admin
// =========================================================

const createEvent =
  async (
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
      // REQUIRED FIELDS
      // =====================================================

      if (
        !title ||
        !eventDate ||
        !startTime ||
        !endTime
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Title, event date, start time and end time are required",

        });

      }


      // =====================================================
      // DATE / TIME VALIDATION
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
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid event date or time",

        });

      }


      if (
        end <= start
      ) {

        return res.status(
          400
        ).json({

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
          : Number(
              price
            );


      if (
        Number.isNaN(
          eventPrice
        ) ||
        eventPrice < 0
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Price must be a valid non-negative number",

        });

      }


      // =====================================================
      // MAX SLOTS
      // =====================================================

      let eventMaxSlots =
        null;


      if (
        maxSlots !== undefined &&
        maxSlots !== null &&
        maxSlots !== ""
      ) {

        eventMaxSlots =
          Number(
            maxSlots
          );


        if (
          Number.isNaN(
            eventMaxSlots
          ) ||
          eventMaxSlots <= 0
        ) {

          return res.status(
            400
          ).json({

            success: false,

            message:
              "Maximum slots must be greater than zero",

          });

        }

      }


      // =====================================================
      // COVER IMAGE
      // =====================================================

      const finalImageUrl =
        req.file?.path ||
        req.file?.secure_url ||
        (
          imageUrl
            ? String(
                imageUrl
              ).trim()
            : null
        );


      // =====================================================
      // BOOKING ENABLED
      // =====================================================

      const finalBookingEnabled =
        bookingEnabled === undefined
          ? true
          : (
              bookingEnabled === true ||
              bookingEnabled === "true" ||
              bookingEnabled === "1" ||
              bookingEnabled === 1
            );


      // =====================================================
      // PUBLISHED
      // =====================================================

      const finalPublished =
        published === undefined
          ? true
          : (
              published === true ||
              published === "true" ||
              published === "1" ||
              published === 1
            );


      // =====================================================
      // CREATE EVENT
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
            String(
              title
            ).trim(),

            eventType ||
              "Other",

            description
              ? String(
                  description
                ).trim()
              : null,

            doctorName
              ? String(
                  doctorName
                ).trim()
              : null,

            specialization
              ? String(
                  specialization
                ).trim()
              : null,

            eventDate,

            startTime,

            endTime,

            venue
              ? String(
                  venue
                ).trim()
              : null,

            eventMode ||
              "offline",

            eventPrice,

            eventMaxSlots,

            finalImageUrl,

            finalBookingEnabled,

            finalPublished,
          ]
        );


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.status(
        201
      ).json({

        success: true,

        message:
          "Event created successfully",

        event:
          formatEvent({
            ...result.rows[0],

            booked_slots: 0,

            gallery: [],

            videos: [],

            documents: [],
          }),

      });

    } catch (
      error
    ) {

      console.error(
        "Create event error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to create event",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - UPDATE EVENT
//
// PUT /api/events/admin/:id
// =========================================================

const updateEvent =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


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
      // GET EXISTING EVENT
      // =====================================================

      const existingResult =
        await pool.query(
          `
          SELECT *
          FROM events

          WHERE id = $1

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        existingResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      const existing =
        existingResult.rows[0];


      // =====================================================
      // FINAL VALUES
      // =====================================================

      const finalTitle =
        title !== undefined
          ? String(
              title
            ).trim()
          : existing.title;


      const finalEventType =
        eventType !== undefined
          ? eventType
          : existing.event_type;


      const finalDescription =
        description !== undefined
          ? String(
              description
            ).trim()
          : existing.description;


      const finalDoctorName =
        doctorName !== undefined
          ? String(
              doctorName
            ).trim()
          : existing.doctor_name;


      const finalSpecialization =
        specialization !== undefined
          ? String(
              specialization
            ).trim()
          : existing.specialization;


      const finalEventDate =
        eventDate !== undefined
          ? eventDate
          : existing.event_date;


      const finalStartTime =
        startTime !== undefined
          ? startTime
          : existing.start_time;


      const finalEndTime =
        endTime !== undefined
          ? endTime
          : existing.end_time;


      const finalVenue =
        venue !== undefined
          ? String(
              venue
            ).trim()
          : existing.venue;


      const finalEventMode =
        eventMode !== undefined
          ? eventMode
          : existing.event_mode;


      // =====================================================
      // PRICE
      // =====================================================

      let finalPrice =
        Number(
          existing.price || 0
        );


      if (
        price !== undefined
      ) {

        finalPrice =
          Number(
            price
          );


        if (
          Number.isNaN(
            finalPrice
          ) ||
          finalPrice < 0
        ) {

          return res.status(
            400
          ).json({

            success: false,

            message:
              "Price must be a valid non-negative number",

          });

        }

      }


      // =====================================================
      // MAX SLOTS
      // =====================================================

      let finalMaxSlots =
        existing.max_slots;


      if (
        maxSlots !== undefined
      ) {

        if (
          maxSlots === null ||
          maxSlots === ""
        ) {

          finalMaxSlots =
            null;

        } else {

          finalMaxSlots =
            Number(
              maxSlots
            );


          if (
            Number.isNaN(
              finalMaxSlots
            ) ||
            finalMaxSlots <= 0
          ) {

            return res.status(
              400
            ).json({

              success: false,

              message:
                "Maximum slots must be greater than zero",

            });

          }

        }

      }


      // =====================================================
      // COVER IMAGE
      // =====================================================

      const finalImageUrl =
        req.file?.path ||
        req.file?.secure_url ||
        (
          imageUrl !== undefined
            ? (
                imageUrl
                  ? String(
                      imageUrl
                    ).trim()
                  : null
              )
            : existing.image_url
        );


      // =====================================================
      // BOOKING ENABLED
      // =====================================================

      const finalBookingEnabled =
        bookingEnabled !== undefined
          ? (
              bookingEnabled === true ||
              bookingEnabled === "true" ||
              bookingEnabled === "1" ||
              bookingEnabled === 1
            )
          : Boolean(
              existing.booking_enabled
            );


      // =====================================================
      // PUBLISHED
      // =====================================================

      const finalPublished =
        published !== undefined
          ? (
              published === true ||
              published === "true" ||
              published === "1" ||
              published === 1
            )
          : Boolean(
              existing.published
            );


      // =====================================================
      // DATE / TIME VALIDATION
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
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid event date or time",

        });

      }


      if (
        end <= start
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "End time must be after start time",

        });

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
            finalEventType,
            finalDescription,
            finalDoctorName,
            finalSpecialization,
            finalEventDate,
            finalStartTime,
            finalEndTime,
            finalVenue,
            finalEventMode,
            finalPrice,
            finalMaxSlots,
            finalImageUrl,
            finalBookingEnabled,
            finalPublished,
            id,
          ]
        );


      // =====================================================
      // BOOKED SLOTS
      // =====================================================

      const bookedResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::INTEGER
              AS booked_slots

          FROM event_bookings

          WHERE
            event_id = $1

            AND booking_status IN (
              'confirmed',
              'completed'
            )
          `,
          [
            id
          ]
        );


      const bookedSlots =
        Number(
          bookedResult.rows[0]
            ?.booked_slots ||
          0
        );


      return res.json({

        success: true,

        message:
          "Event updated successfully",

        event:
          formatEvent({
            ...result.rows[0],

            booked_slots:
              bookedSlots,

            gallery: [],

            videos: [],

            documents: [],
          }),

      });

    } catch (
      error
    ) {

      console.error(
        "Update event error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to update event",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - DELETE EVENT
//
// DELETE /api/events/admin/:id
// =========================================================

const deleteEvent =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      // =====================================================
      // CHECK EVENT
      // =====================================================

      const existingResult =
        await pool.query(
          `
          SELECT
            id,
            image_url

          FROM events

          WHERE id = $1

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        existingResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      // =====================================================
      // DELETE BOOKINGS
      // =====================================================

      await pool.query(
        `
        DELETE FROM event_bookings

        WHERE event_id = $1
        `,
        [
          id
        ]
      );


      // =====================================================
      // DELETE GALLERY
      // =====================================================

      await pool.query(
        `
        DELETE FROM event_gallery

        WHERE event_id = $1
        `,
        [
          id
        ]
      );


      // =====================================================
      // DELETE VIDEOS
      // =====================================================

      await pool.query(
        `
        DELETE FROM event_videos

        WHERE event_id = $1
        `,
        [
          id
        ]
      );


      // =====================================================
      // DELETE DOCUMENTS
      // =====================================================

      await pool.query(
        `
        DELETE FROM event_documents

        WHERE event_id = $1
        `,
        [
          id
        ]
      );


      // =====================================================
      // DELETE EVENT
      // =====================================================

      await pool.query(
        `
        DELETE FROM events

        WHERE id = $1
        `,
        [
          id
        ]
      );


      return res.json({

        success: true,

        message:
          "Event deleted successfully",

      });

    } catch (
      error
    ) {

      console.error(
        "Delete event error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to delete event",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// PUBLIC EVENT MEDIA
//
// GET /api/events/:id/media
// =========================================================

const getPublicEventMedia =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      // =====================================================
      // CHECK EVENT
      // =====================================================

      const eventResult =
        await pool.query(
          `
          SELECT
            id,
            title,
            event_date,
            start_time,
            end_time,
            venue,
            event_mode,
            image_url

          FROM events

          WHERE
            id = $1
            AND published = TRUE

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        eventResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      const event =
        eventResult.rows[0];


      // =====================================================
      // GALLERY
      // =====================================================

      const galleryResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            image_url,
            public_id,
            caption,
            display_order,
            created_at

          FROM event_gallery

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      // =====================================================
      // VIDEOS
      // =====================================================

      const videosResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            title,
            video_url,
            public_id,
            thumbnail_url,
            description,
            display_order,
            created_at

          FROM event_videos

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      // =====================================================
      // DOCUMENTS
      // =====================================================

      const documentsResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            title,
            file_url,
            public_id,
            file_name,
            file_type,
            file_size,
            display_order,
            created_at

          FROM event_documents

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      return res.json({

        success: true,

        event,

        gallery:
          galleryResult.rows,

        videos:
          videosResult.rows,

        documents:
          documentsResult.rows,

      });

    } catch (
      error
    ) {

      console.error(
        "Get public event media error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to fetch event media",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - GET EVENT MEDIA
//
// GET /api/events/admin/:id/media
// =========================================================

const getEventMedia =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      // =====================================================
      // CHECK EVENT
      // =====================================================

      const eventResult =
        await pool.query(
          `
          SELECT *
          FROM events

          WHERE id = $1

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        eventResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      // =====================================================
      // GALLERY
      // =====================================================

      const galleryResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            image_url,
            public_id,
            caption,
            display_order,
            created_at

          FROM event_gallery

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      // =====================================================
      // VIDEOS
      // =====================================================

      const videosResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            title,
            video_url,
            public_id,
            thumbnail_url,
            description,
            display_order,
            created_at

          FROM event_videos

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      // =====================================================
      // DOCUMENTS
      // =====================================================

      const documentsResult =
        await pool.query(
          `
          SELECT
            id,
            event_id,
            title,
            file_url,
            public_id,
            file_name,
            file_type,
            file_size,
            display_order,
            created_at

          FROM event_documents

          WHERE event_id = $1

          ORDER BY
            display_order ASC,
            created_at DESC
          `,
          [
            id
          ]
        );


      return res.json({

        success: true,

        event:
          eventResult.rows[0],

        gallery:
          galleryResult.rows,

        videos:
          videosResult.rows,

        documents:
          documentsResult.rows,

      });

    } catch (
      error
    ) {

      console.error(
        "Get event media error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to fetch event media",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };
  // =========================================================
// ADMIN - UPLOAD EVENT MEDIA
//
// POST /api/events/admin/:id/media
//
// Supported:
// - image
// - document
//
// Videos are NOT uploaded as files.
// Use the YouTube URL endpoint instead.
//
// IMPORTANT:
// eventUpload.mediaUpload has already uploaded the files
// to Cloudinary and stores the results in req.eventMedia.
//
// This controller ONLY saves those Cloudinary results
// into PostgreSQL.
// =========================================================

const uploadEventMedia =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      const type =
        String(
          req.body?.type ||
          ""
        )
          .trim()
          .toLowerCase();


      // =====================================================
      // VALIDATE MEDIA TYPE
      // =====================================================

      if (
        type !== "image" &&
        type !== "document"
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid media type. Use image or document. Videos must be added using YouTube URL.",

        });

      }


      // =====================================================
      // CHECK EVENT
      // =====================================================

      const eventResult =
        await pool.query(
          `
          SELECT
            id

          FROM events

          WHERE
            id = $1

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        eventResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      // =====================================================
      // IMPORTANT
      //
      // eventUpload.mediaUpload has already uploaded the
      // files to Cloudinary.
      //
      // Example:
      //
      // req.eventMedia = [
      //   {
      //     secureUrl,
      //     publicId,
      //     resourceType,
      //     originalName,
      //     mimeType,
      //     size
      //   }
      // ]
      //
      // DO NOT upload these files to Cloudinary again.
      // =====================================================

      const media =
        Array.isArray(
          req.eventMedia
        )
          ? req.eventMedia
          : [];


      if (
        media.length ===
        0
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "No uploaded media was found.",

        });

      }


      const uploaded =
        [];


      // =====================================================
      // PROCESS EACH CLOUDINARY RESULT
      // =====================================================

      for (
        const item
        of media
      ) {

        // ===================================================
        // IMAGE
        // ===================================================

        if (
          type === "image"
        ) {

          // -------------------------------------------------
          // GET NEXT DISPLAY ORDER
          // -------------------------------------------------

          const orderResult =
            await pool.query(
              `
              SELECT

                COALESCE(
                  MAX(display_order),
                  -1
                ) + 1
                  AS next_order

              FROM event_gallery

              WHERE
                event_id = $1
              `,
              [
                id
              ]
            );


          const displayOrder =
            Number(
              orderResult.rows[0]
                ?.next_order || 0
            );


          // -------------------------------------------------
          // SAVE IMAGE
          // -------------------------------------------------

          const result =
            await pool.query(
              `
              INSERT INTO event_gallery
              (
                event_id,
                image_url,
                public_id,
                caption,
                display_order
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

                id,

                item.secureUrl ||
                  item.url,

                item.publicId ||
                  null,

                req.body?.caption ||
                  null,

                displayOrder,

              ]
            );


          uploaded.push(
            result.rows[0]
          );


          continue;
        }


        // ===================================================
        // DOCUMENT
        // ===================================================

        if (
          type === "document"
        ) {

          // -------------------------------------------------
          // GET NEXT DISPLAY ORDER
          // -------------------------------------------------

          const orderResult =
            await pool.query(
              `
              SELECT

                COALESCE(
                  MAX(display_order),
                  -1
                ) + 1
                  AS next_order

              FROM event_documents

              WHERE
                event_id = $1
              `,
              [
                id
              ]
            );


          const displayOrder =
            Number(
              orderResult.rows[0]
                ?.next_order || 0
            );


          // -------------------------------------------------
          // SAVE DOCUMENT
          // -------------------------------------------------

          const result =
            await pool.query(
              `
              INSERT INTO event_documents
              (
                event_id,
                title,
                file_url,
                public_id,
                file_name,
                file_type,
                file_size,
                display_order
              )

              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
              )

              RETURNING *
              `,
              [

                id,

                req.body?.title ||
                  item.originalName ||
                  "Event Document",

                item.secureUrl ||
                  item.url,

                item.publicId ||
                  null,

                item.originalName ||
                  "document",

                item.mimeType ||
                  null,

                Number(
                  item.size ||
                  item.bytes ||
                  0
                ),

                displayOrder,

              ]
            );


          uploaded.push(
            result.rows[0]
          );

        }

      }


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.status(
        201
      ).json({

        success: true,

        message:
          "Event media uploaded successfully",

        uploaded,

      });

    } catch (
      error
    ) {

      console.error(
        "========================================"
      );

      console.error(
        "UPLOAD EVENT MEDIA ERROR"
      );

      console.error(
        error
      );

      console.error(
        "========================================"
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to upload event media",

        debug:
          error.message,

      });

    }

  };


// =========================================================
// ADMIN - ADD YOUTUBE VIDEO
//
// POST /api/events/admin/:id/media/youtube
//
// Body:
//
// {
//   "title": "Event Highlights",
//   "youtubeUrl": "https://www.youtube.com/watch?v=ABC123",
//   "description": "Event highlights"
// }
//
// NO FILE UPLOAD.
// =========================================================

const addYouTubeVideo =
  async (
    req,
    res
  ) => {

    try {

      const {
        id
      } = req.params;


      const {
        title,
        youtubeUrl,
        description,
      } = req.body;


      // =====================================================
      // VALIDATE URL
      // =====================================================

      if (
        !youtubeUrl ||
        !String(
          youtubeUrl
        ).trim()
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "YouTube URL is required",

        });

      }


      const url =
        String(
          youtubeUrl
        ).trim();


      // =====================================================
      // EXTRACT YOUTUBE VIDEO ID
      // =====================================================

      let videoId =
        null;


      try {

        const parsedUrl =
          new URL(
            url
          );


        const hostname =
          parsedUrl.hostname
            .toLowerCase()
            .replace(
              /^www\./,
              ""
            );


        // ===================================================
        // youtube.com
        // ===================================================

        if (
          hostname ===
          "youtube.com"
        ) {

          // Standard:
          // youtube.com/watch?v=VIDEO_ID

          if (
            parsedUrl.pathname ===
            "/watch"
          ) {

            videoId =
              parsedUrl.searchParams.get(
                "v"
              );

          }


          // Shorts:
          // youtube.com/shorts/VIDEO_ID

          if (
            !videoId &&
            parsedUrl.pathname.startsWith(
              "/shorts/"
            )
          ) {

            videoId =
              parsedUrl.pathname
                .split(
                  "/shorts/"
                )[1]
                ?.split(
                  "/"
                )[0];

          }


          // Embed:
          // youtube.com/embed/VIDEO_ID

          if (
            !videoId &&
            parsedUrl.pathname.startsWith(
              "/embed/"
            )
          ) {

            videoId =
              parsedUrl.pathname
                .split(
                  "/embed/"
                )[1]
                ?.split(
                  "/"
                )[0];

          }

        }


        // ===================================================
        // youtu.be
        // ===================================================

        if (
          hostname ===
          "youtu.be"
        ) {

          videoId =
            parsedUrl.pathname
              .replace(
                /^\/+/,
                ""
              )
              .split(
                "/"
              )[0];

        }

      } catch (
        error
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid YouTube URL",

        });

      }


      // =====================================================
      // VALIDATE VIDEO ID
      // =====================================================

      if (
        !videoId
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Could not extract YouTube video ID",

        });

      }


      videoId =
        String(
          videoId
        )
          .split(
            "&"
          )[0]
          .split(
            "?"
          )[0]
          .trim();


      if (
        !/^[A-Za-z0-9_-]{6,}$/.test(
          videoId
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid YouTube video ID",

        });

      }


      // =====================================================
      // CHECK EVENT
      // =====================================================

      const eventResult =
        await pool.query(
          `
          SELECT
            id

          FROM events

          WHERE
            id = $1

          LIMIT 1
          `,
          [
            id
          ]
        );


      if (
        eventResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Event not found",

        });

      }


      // =====================================================
      // NORMALIZED YOUTUBE URL
      // =====================================================

      const finalVideoUrl =
        `https://www.youtube.com/watch?v=${videoId}`;


      // =====================================================
      // YOUTUBE THUMBNAIL
      // =====================================================

      const thumbnailUrl =
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;


      // =====================================================
      // NEXT DISPLAY ORDER
      // =====================================================

      const orderResult =
        await pool.query(
          `
          SELECT

            COALESCE(
              MAX(display_order),
              -1
            ) + 1
              AS next_order

          FROM event_videos

          WHERE
            event_id = $1
          `,
          [
            id
          ]
        );


      const displayOrder =
        Number(
          orderResult.rows[0]
            ?.next_order || 0
        );


      // =====================================================
      // INSERT YOUTUBE VIDEO
      // =====================================================

      const result =
        await pool.query(
          `
          INSERT INTO event_videos
          (
            event_id,
            title,
            video_url,
            public_id,
            thumbnail_url,
            description,
            display_order
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )

          RETURNING *
          `,
          [

            id,

            title
              ? String(
                  title
                ).trim()
              : "YouTube Video",

            finalVideoUrl,

            null,

            thumbnailUrl,

            description
              ? String(
                  description
                ).trim()
              : null,

            displayOrder,

          ]
        );


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.status(
        201
      ).json({

        success: true,

        message:
          "YouTube video added successfully",

        video:
          result.rows[0],

      });

    } catch (
      error
    ) {

      console.error(
        "Add YouTube video error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to add YouTube video",

        debug:
          error.message,

      });

    }

  };


// =========================================================
// ADMIN - DELETE EVENT MEDIA
//
// DELETE /api/events/admin/:id/media/:mediaId
//
// Query:
// ?type=image
// ?type=video
// ?type=document
// =========================================================

const deleteEventMedia =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
        mediaId,
      } = req.params;


      const type =
        String(
          req.query?.type ||
          ""
        )
          .trim()
          .toLowerCase();


      // =====================================================
      // VALIDATE TYPE
      // =====================================================

      if (
        type !== "image" &&
        type !== "video" &&
        type !== "document"
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid media type. Use image, video or document.",

        });

      }


      // =====================================================
      // TABLE
      // =====================================================

      let tableName;


      if (
        type === "image"
      ) {

        tableName =
          "event_gallery";

      } else if (
        type === "video"
      ) {

        tableName =
          "event_videos";

      } else {

        tableName =
          "event_documents";

      }


      // =====================================================
      // GET MEDIA
      // =====================================================

      const mediaResult =
        await pool.query(
          `
          SELECT *
          FROM ${tableName}

          WHERE
            id = $1
            AND event_id = $2

          LIMIT 1
          `,
          [
            mediaId,
            id
          ]
        );


      if (
        mediaResult.rows.length ===
        0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Media not found",

        });

      }


      const media =
        mediaResult.rows[0];


      // =====================================================
      // DELETE DATABASE RECORD
      // =====================================================

      await pool.query(
        `
        DELETE FROM ${tableName}

        WHERE
          id = $1
          AND event_id = $2
        `,
        [
          mediaId,
          id
        ]
      );


      // =====================================================
      // CLOUDINARY DELETE
      //
      // YouTube videos do not have public_id.
      // Therefore YouTube entries are only deleted from DB.
      // =====================================================

      if (
        media.public_id
      ) {

        try {

          let resourceType =
            "image";


          if (
            type === "document"
          ) {

            resourceType =
              "raw";

          }


          if (
            type === "video"
          ) {

            resourceType =
              "video";

          }


          await cloudinary.uploader.destroy(
            media.public_id,
            {
              resource_type:
                resourceType,

            }
          );

        } catch (
          cloudinaryError
        ) {

          console.error(
            "Cloudinary delete error:",
            cloudinaryError
          );

        }

      }


      // =====================================================
      // SUCCESS
      // =====================================================

      return res.json({

        success: true,

        message:
          "Event media deleted successfully",

      });

    } catch (
      error
    ) {

      console.error(
        "Delete event media error:",
        error
      );


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Unable to delete event media",

        debug:
          error.message,

      });

    }

  };


// =========================================================
// EXPORT CONTROLLERS
// =========================================================

module.exports = {

  // =======================================================
  // PUBLIC EVENTS
  // =======================================================

  getEvents,
  getEventById,


  // =======================================================
  // REGISTRATION
  // =======================================================

  registerForEvent,


  // =======================================================
  // ADMIN EVENTS
  // =======================================================

  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,


  // =======================================================
  // PUBLIC MEDIA
  // =======================================================

  getPublicEventMedia,


  // =======================================================
  // ADMIN MEDIA
  // =======================================================

  getEventMedia,
  uploadEventMedia,


  // =======================================================
  // YOUTUBE
  // =======================================================

  addYouTubeVideo,


  // =======================================================
  // DELETE MEDIA
  // =======================================================

  deleteEventMedia,

};