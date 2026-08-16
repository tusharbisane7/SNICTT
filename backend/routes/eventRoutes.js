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

  // NEW:
  // YouTube URL based video
  addYouTubeVideo,

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
// This MUST be before /:id
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
// Admin routes must come before /:id
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
// Cover image field:
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
// Cover image field:
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
// ADMIN - UPLOAD IMAGES / DOCUMENTS
// =========================================================
//
// POST /api/events/admin/:id/media
//
// Content-Type:
// multipart/form-data
//
// type:
// image
// document
//
// files:
// actual files
//
// IMPORTANT:
//
// Videos are NO LONGER uploaded here.
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
// NO FILE UPLOAD.
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
// Keep this AFTER all /admin/:id/media routes.
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
// Fields:
//
// name
// email
// phone
//
// Optional:
//
// presentation
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