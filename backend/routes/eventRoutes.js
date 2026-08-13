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
// ADMIN MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// EVENT UPLOAD MIDDLEWARE
// =========================================================

const eventUpload =
  require("../middleware/eventUpload");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// ---------------------------------------------------------
// GET PUBLISHED EVENTS
// GET /api/events
// ---------------------------------------------------------

router.get(
  "/",
  getEvents
);

// ---------------------------------------------------------
// GET SINGLE EVENT
// GET /api/events/:id
// ---------------------------------------------------------

router.get(
  "/:id",
  getEventById
);

// =========================================================
// ADMIN ROUTES
// =========================================================

// ---------------------------------------------------------
// GET ALL EVENTS
// GET /api/events/admin/all
// ---------------------------------------------------------

router.get(
  "/admin/all",
  adminMiddleware,
  getAllEvents
);

// ---------------------------------------------------------
// CREATE EVENT
// POST /api/events/admin
// ---------------------------------------------------------

router.post(
  "/admin",
  adminMiddleware,
  eventUpload,
  createEvent
);

// ---------------------------------------------------------
// UPDATE EVENT
// PUT /api/events/admin/:id
// ---------------------------------------------------------

router.put(
  "/admin/:id",
  adminMiddleware,
  eventUpload,
  updateEvent
);

// ---------------------------------------------------------
// DELETE EVENT
// DELETE /api/events/admin/:id
// ---------------------------------------------------------

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteEvent
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;