const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  // =======================================================
  // PUBLIC EVENT CONTROLLERS
  // =======================================================

  getEvents,
  getEventById,

  // =======================================================
  // EVENT REGISTRATION
  // =======================================================

  registerForEvent,

  // =======================================================
  // ADMIN EVENT CONTROLLERS
  // =======================================================

  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,

  // =======================================================
  // PUBLIC EVENT MEDIA
  // =======================================================

  getPublicEventMedia,

  // =======================================================
  // ADMIN EVENT MEDIA
  // =======================================================

  getEventMedia,
  uploadEventMedia,

  // =======================================================
  // YOUTUBE VIDEO
  // =======================================================

  addYouTubeVideo,

  // =======================================================
  // DELETE MEDIA
  // =======================================================

  deleteEventMedia,

} = require("../controllers/eventController");


// =========================================================
// MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

const authMiddleware =
  require("../middleware/authMiddleware");

const eventUpload =
  require("../middleware/eventUpload");


// =========================================================
// ROUTER
// =========================================================

const router =
  express.Router();


// =========================================================
// PUBLIC EVENTS
// =========================================================
//
// GET /api/events
//
// Authentication:
// NOT REQUIRED
//
// =========================================================

router.get(
  "/",
  getEvents
);


// =========================================================
// PUBLIC EVENT MEDIA
// =========================================================
//
// GET /api/events/:id/media
//
// Authentication:
// NOT REQUIRED
//
// IMPORTANT:
// This route MUST come before:
//
// GET /api/events/:id
//
// =========================================================

router.get(
  "/:id/media",
  getPublicEventMedia
);


// =========================================================
// ADMIN - GET ALL EVENTS
// =========================================================
//
// GET /api/events/admin/all
//
// Authentication:
// ADMIN REQUIRED
//
// IMPORTANT:
// Admin routes are defined before the public
// dynamic /:id route.
//
// =========================================================

router.get(
  "/admin/all",
  adminMiddleware,
  getAllEvents
);


// =========================================================
// ADMIN - CREATE EVENT
// =========================================================
//
// POST /api/events/admin
//
// Content-Type:
// multipart/form-data
//
// Fields:
//
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
// Cover image:
//
// image
//
// Authentication:
// ADMIN REQUIRED
//
// =========================================================

router.post(
  "/admin",
  adminMiddleware,
  eventUpload,
  createEvent
);


// =========================================================
// ADMIN - UPDATE EVENT
// =========================================================
//
// PUT /api/events/admin/:id
//
// Content-Type:
// multipart/form-data
//
// Cover image:
// image
//
// Authentication:
// ADMIN REQUIRED
//
// =========================================================

router.put(
  "/admin/:id",
  adminMiddleware,
  eventUpload,
  updateEvent
);


// =========================================================
// ADMIN - GET EVENT MEDIA
// =========================================================
//
// GET /api/events/admin/:id/media
//
// Returns:
//
// gallery
// videos
// documents
//
// Authentication:
// ADMIN REQUIRED
//
// =========================================================

router.get(
  "/admin/:id/media",
  adminMiddleware,
  getEventMedia
);


// =========================================================
// ADMIN - UPLOAD EVENT MEDIA
// =========================================================
//
// POST /api/events/admin/:id/media
//
// Content-Type:
// multipart/form-data
//
// Supported media:
//
// image
// document
//
// NOT supported:
//
// video file
//
// Videos are now added through YouTube URL.
//
// FormData:
//
// type = image
// OR
// type = document
//
// files = actual files
//
// Authentication:
// ADMIN REQUIRED
//
// =========================================================

router.post(
  "/admin/:id/media",
  adminMiddleware,
  eventUpload.mediaUpload,
  uploadEventMedia
);


// =========================================================
// ADMIN - ADD YOUTUBE VIDEO
// =========================================================
//
// POST /api/events/admin/:id/media/youtube
//
// Content-Type:
// application/json
//
// Authentication:
// ADMIN REQUIRED
//
// Body:
//
// {
//   "title": "Event Highlights",
//   "youtubeUrl": "https://www.youtube.com/watch?v=ABC123",
//   "description": "Event highlights"
// }
//
// Supported YouTube formats:
//
// https://www.youtube.com/watch?v=VIDEO_ID
//
// https://youtu.be/VIDEO_ID
//
// https://www.youtube.com/shorts/VIDEO_ID
//
// https://www.youtube.com/embed/VIDEO_ID
//
// NO VIDEO FILE UPLOAD.
//
// =========================================================

router.post(
  "/admin/:id/media/youtube",
  adminMiddleware,
  addYouTubeVideo
);


// =========================================================
// ADMIN - DELETE EVENT MEDIA
// =========================================================
//
// DELETE /api/events/admin/:id/media/:mediaId
//
// Query:
//
// ?type=image
// ?type=video
// ?type=document
//
// Examples:
//
// DELETE /api/events/admin/5/media/10?type=image
//
// DELETE /api/events/admin/5/media/11?type=video
//
// DELETE /api/events/admin/5/media/12?type=document
//
// Authentication:
// ADMIN REQUIRED
//
// =========================================================

router.delete(
  "/admin/:id/media/:mediaId",
  adminMiddleware,
  deleteEventMedia
);


// =========================================================
// ADMIN - DELETE EVENT
// =========================================================
//
// DELETE /api/events/admin/:id
//
// Authentication:
// ADMIN REQUIRED
//
// IMPORTANT:
// This MUST remain AFTER:
//
// /admin/:id/media
// /admin/:id/media/:mediaId
//
// Otherwise route matching can cause conflicts.
//
// =========================================================

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteEvent
);


// =========================================================
// EVENT REGISTRATION
// =========================================================
//
// POST /api/events/:id/register
//
// Content-Type:
// multipart/form-data
//
// Authentication:
// USER REQUIRED
//
// Required fields:
//
// name
// email
// phone
//
// Optional:
//
// presentation
//
// Allowed presentation files:
//
// PDF
// PPT
// PPTX
//
// The registrationUpload middleware uploads the
// presentation to Cloudinary.
//
// Controller receives:
//
// presentationUrl
// presentationPublicId
//
// and stores them with the event booking.
//
// =========================================================

router.post(
  "/:id/register",
  authMiddleware,
  eventUpload.registrationUpload,
  registerForEvent
);


// =========================================================
// PUBLIC SINGLE EVENT
// =========================================================
//
// GET /api/events/:id
//
// Authentication:
// NOT REQUIRED
//
// IMPORTANT:
// This MUST be the LAST dynamic public route.
//
// =========================================================

router.get(
  "/:id",
  getEventById
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;