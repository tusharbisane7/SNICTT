const express = require("express");

const router = express.Router();

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

// =========================================================
// CONTROLLER
// =========================================================

const {
  getMyPass,
  getAdminPasses,
  getAdminPassByBookingId,
} = require("../controllers/eventPassController");

// =========================================================
// USER EVENT PASS
// =========================================================
//
// Base route:
//
// /api/event-passes
//
// Final route:
//
// GET /api/event-passes/booking/:bookingId
//
// Example:
//
// GET /api/event-passes/booking/23
//
// This is the MAIN USER EVENT PASS endpoint.
//
// =========================================================

router.get(
  "/booking/:bookingId",
  authMiddleware,
  getMyPass
);

// =========================================================
// ADMIN - GET ALL EVENT PASSES
// =========================================================
//
// Final route:
//
// GET /api/event-passes/admin/passes
//
// =========================================================

router.get(
  "/admin/passes",
  adminMiddleware,
  getAdminPasses
);

// =========================================================
// ADMIN - GET EVENT PASS BY BOOKING ID
// =========================================================
//
// Final route:
//
// GET /api/event-passes/admin/booking/:bookingId
//
// Example:
//
// GET /api/event-passes/admin/booking/23
//
// =========================================================

router.get(
  "/admin/booking/:bookingId",
  adminMiddleware,
  getAdminPassByBookingId
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;