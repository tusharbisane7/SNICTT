const express = require("express");


// =========================================================
// CONTROLLERS
// =========================================================

const {
  getEvents,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");


// =========================================================
// MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

const eventUpload =
  require("../middleware/eventUpload");


// =========================================================
// ROUTER
// =========================================================

const router = express.Router();


// =========================================================
// PUBLIC
// =========================================================

// GET /api/events
router.get(
  "/",
  getEvents
);


// =========================================================
// ADMIN
// IMPORTANT:
// Admin routes MUST come before /:id
// =========================================================

// GET /api/events/admin/all
router.get(
  "/admin/all",
  adminMiddleware,
  getAllEvents
);


// POST /api/events/admin
router.post(
  "/admin",
  adminMiddleware,
  eventUpload,
  createEvent
);


// PUT /api/events/admin/:id
router.put(
  "/admin/:id",
  adminMiddleware,
  eventUpload,
  updateEvent
);


// DELETE /api/events/admin/:id
router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteEvent
);


// =========================================================
// PUBLIC SINGLE EVENT
// IMPORTANT:
// This MUST come after all /admin routes.
// =========================================================

// GET /api/events/:id
router.get(
  "/:id",
  getEventById
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;