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
// GET /api/bookings/:id/pass
//
// Example:
//
// GET /api/bookings/21/pass
//
// User can only access his own booking pass.
//
// Authentication required.
//
// =========================================================

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// USER EVENT PASS - COMPATIBILITY ROUTE
// =========================================================
//
// GET /api/bookings/event-pass/booking/:bookingId
//
// Example:
//
// GET /api/bookings/event-pass/booking/21
//
// This route is provided so frontend code using
// the event-pass/booking/:bookingId structure also works.
//
// Authentication required.
//
// =========================================================

router.get(
  "/event-pass/booking/:bookingId",
  authMiddleware,
  getMyPass
);


// =========================================================
// USER EVENT PASS - ALTERNATIVE ROUTE
// =========================================================
//
// GET /api/bookings/booking/:bookingId/pass
//
// Example:
//
// GET /api/bookings/booking/21/pass
//
// Optional compatibility endpoint.
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
// GET /api/bookings/admin/passes
//
// Example:
//
// GET /api/bookings/admin/passes
//
// Returns all generated event passes.
//
// Admin authentication required.
//
// =========================================================

router.get(
  "/admin/passes",
  adminMiddleware,
  getAdminPasses
);


// =========================================================
// ADMIN - GET PASS BY BOOKING ID
// =========================================================
//
// GET /api/bookings/admin/:id/pass
//
// Example:
//
// GET /api/bookings/admin/21/pass
//
// Returns event pass details for a particular booking.
//
// Admin authentication required.
//
// =========================================================

router.get(
  "/admin/:id/pass",
  adminMiddleware,
  getAdminPassByBookingId
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;