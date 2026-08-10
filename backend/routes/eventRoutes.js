const express = require("express");

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
// PUBLIC EVENTS
// =========================================================

// Get upcoming and past events
router.get(
  "/",
  getEvents
);


// Get single event
router.get(
  "/:id",
  getEventById
);


// =========================================================
// ADMIN EVENTS
// =========================================================

// Get all events for admin
router.get(
  "/admin/all",
  adminMiddleware,
  getAllEvents
);


// Create event
router.post(
  "/admin",
  adminMiddleware,
  createEvent
);


// Update event
router.put(
  "/admin/:id",
  adminMiddleware,
  updateEvent
);


// Delete event
router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteEvent
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;