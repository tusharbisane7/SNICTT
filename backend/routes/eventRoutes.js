const express = require("express");

const {
  getEvents,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const eventUpload =
  require("../middleware/eventUpload");

const router = express.Router();

// =========================================================
// PUBLIC
// =========================================================

router.get(
  "/",
  getEvents
);

router.get(
  "/:id",
  getEventById
);

// =========================================================
// ADMIN
// =========================================================

router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllEvents
);

// =========================================================
// CREATE EVENT
// =========================================================

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  eventUpload,
  createEvent
);

// =========================================================
// UPDATE EVENT
// =========================================================

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  eventUpload,
  updateEvent
);

// =========================================================
// DELETE EVENT
// =========================================================

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteEvent
);

module.exports = router;