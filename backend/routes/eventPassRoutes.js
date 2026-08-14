const express = require("express");

const router = express.Router();

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

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
// GET /api/event-passes/booking/:bookingId
//
// Example:
// GET /api/event-passes/booking/23
//
// This is the primary Event Pass endpoint.
//
// =========================================================

router.get(
  "/booking/:bookingId",
  authMiddleware,
  getMyPass
);

// =========================================================
// USER EVENT PASS
// =========================================================
//
// GET /api/event-passes/:id/pass
//
// Example:
// GET /api/event-passes/23/pass
//
// Compatibility route.
//
// =========================================================

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);

// =========================================================
// USER EVENT PASS - BOOKING COMPATIBILITY
// =========================================================
//
// GET /api/event-passes/booking/:bookingId/pass
//
// Example:
// GET /api/event-passes/booking/23/pass
//
// Compatibility endpoint.
//
// =========================================================

router.get(
  "/booking/:bookingId/pass",
  authMiddleware,
  getMyPass
);

// =========================================================
// ADMIN - GET ALL EVENT PASSES
// =========================================================
//
// GET /api/event-passes/admin/passes
//
// IMPORTANT:
// This route MUST come before dynamic admin routes.
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
// GET /api/event-passes/admin/booking/:bookingId
//
// Example:
// GET /api/event-passes/admin/booking/23
//
// =========================================================

router.get(
  "/admin/booking/:bookingId",
  adminMiddleware,
  getAdminPassByBookingId
);

// =========================================================
// ADMIN - COMPATIBILITY ROUTE
// =========================================================
//
// GET /api/event-passes/admin/:id/pass
//
// Example:
// GET /api/event-passes/admin/23/pass
//
// =========================================================

router.get(
  "/admin/:id/pass",
  adminMiddleware,
  getAdminPassByBookingId
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;