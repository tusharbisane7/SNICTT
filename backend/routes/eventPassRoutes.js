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
// Authentication required.
//
// =========================================================

router.get(
  "/:id/pass",
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