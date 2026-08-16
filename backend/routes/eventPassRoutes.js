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
//
// GET /api/event-passes/booking/23
//
// User can only access his own booking pass.
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
// GET /api/event-passes/:id
//
// Compatibility route.
//
// Example:
//
// GET /api/event-passes/23
//
// =========================================================

router.get(
  "/:id",
  authMiddleware,
  getMyPass
);


// =========================================================
// ADMIN - GET ALL EVENT PASSES
// =========================================================
//
// GET /api/event-passes/admin
//
// IMPORTANT:
//
// This MUST be before:
//
// /:id
//
// Otherwise "admin" can be treated as an ID.
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAdminPasses
);


// =========================================================
// ADMIN - GET PASS BY BOOKING ID
// =========================================================
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
// ADMIN - GET PASS BY BOOKING ID
// COMPATIBILITY ROUTE
// =========================================================
//
// GET /api/event-passes/admin/:id/pass
//
// Example:
//
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