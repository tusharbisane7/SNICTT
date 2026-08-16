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
// IMPORTANT:
// This MUST be before /:id
//
// Authentication:
// NOT REQUIRED
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
// Cover image:
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
// Fields:
//
// files
// type
//
// type:
//
// image
// video
// document
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
// IMPORTANT:
// Keep this after all /admin/:id/media routes.
//
// Authentication:
// ADMIN REQUIRED
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
// Optional file:
//
// presentation
//
// Allowed:
//
// PDF
// PPT
// PPTX
//
// Flow:
//
// Event Details
//      ↓
// Event Registration
//      ↓
// User Details Preview
//      ↓
// Optional Presentation Upload
//      ↓
// Create Pending Booking
//      ↓
// Event Payment
//      ↓
// Confirm Booking
//
// IMPORTANT:
//
// This MUST be before:
//
// /:id
//
// Otherwise:
//
// /events/6/register
//
// could reach:
//
// /events/:id
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
//
// This MUST be the LAST public dynamic
// event route.
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