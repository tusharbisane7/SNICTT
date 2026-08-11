const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getEvents,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();


// =========================================================
// EVENT IMAGE UPLOAD
// =========================================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/events"
);


// Create uploads/events folder
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


// =========================================================
// MULTER STORAGE
// =========================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {

    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const uniqueName =
      `event-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(
      null,
      uniqueName
    );
  },

});


// =========================================================
// IMAGE FILTER
// =========================================================

const fileFilter = (
  req,
  file,
  cb
) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );

  }

};


// =========================================================
// MULTER UPLOAD
// =========================================================

const uploadEventImage =
  multer({

    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },

  });


// =========================================================
// HELPER
// CREATE PUBLIC IMAGE URL
// =========================================================

const setEventImageUrl = (
  req,
  res,
  next
) => {

  try {

    if (req.file) {

      const backendUrl =
        process.env.BACKEND_URL ||
        `${req.protocol}://${req.get(
          "host"
        )}`;

      req.body.imageUrl =
        `${backendUrl}/uploads/events/${req.file.filename}`;

    }

    next();

  } catch (error) {

    console.error(
      "Event image URL error:",
      error
    );

    next(error);

  }

};


// =========================================================
// PUBLIC EVENTS
// =========================================================


// Get upcoming and past events
// GET /api/events

router.get(
  "/",
  getEvents
);


// Get single event
// GET /api/events/:id

router.get(
  "/:id",
  getEventById
);


// =========================================================
// ADMIN EVENTS
// =========================================================


// Get all events
// GET /api/events/admin/all

router.get(
  "/admin/all",
  adminMiddleware,
  getAllEvents
);


// =========================================================
// CREATE EVENT
// =========================================================
//
// POST /api/events/admin
//
// Content-Type:
// multipart/form-data
//
// Image field:
// image
//
// Other fields:
// title
// eventType
// description
// doctorName
// specialization
// eventDate
// startTime
// endTime
// venue
// eventMode
// price
// maxSlots
// bookingEnabled
// published
//
// =========================================================

router.post(
  "/admin",
  adminMiddleware,
  uploadEventImage.single("image"),
  setEventImageUrl,
  createEvent
);


// =========================================================
// UPDATE EVENT
// =========================================================
//
// PUT /api/events/admin/:id
//
// Image field:
// image
//
// If no new image is selected,
// existing image remains unchanged.
//
// =========================================================

router.put(
  "/admin/:id",
  adminMiddleware,
  uploadEventImage.single("image"),
  setEventImageUrl,
  updateEvent
);


// =========================================================
// DELETE EVENT
// =========================================================
//
// DELETE /api/events/admin/:id

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteEvent
);


// =========================================================
// MULTER ERROR HANDLER
// =========================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Event image must be 5 MB or smaller",
        });

      }

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }


    if (
      error &&
      error.message &&
      error.message.includes(
        "Only JPG"
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }


    next(error);

  }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;