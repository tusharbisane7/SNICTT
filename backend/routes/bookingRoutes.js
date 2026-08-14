const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  createBooking,
  getMyBookings,
  getMyBookingById,
  getMyPass,
  getAllBookings,
  getAdminBookingById,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/bookingController");

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// ADMIN BOOKINGS
// IMPORTANT:
// DO NOT USE authMiddleware HERE.
//
// Admin authentication uses:
// snict_admin_token
//
// adminMiddleware should verify the admin token.
// =========================================================

// ---------------------------------------------------------
// GET ALL BOOKINGS
// GET /api/bookings/admin
// ---------------------------------------------------------

router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);

// ---------------------------------------------------------
// GET SINGLE BOOKING
// GET /api/bookings/admin/:id
// ---------------------------------------------------------

router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);

// ---------------------------------------------------------
// UPDATE BOOKING STATUS
// PUT /api/bookings/admin/:id/status
// ---------------------------------------------------------

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);

// ---------------------------------------------------------
// DELETE BOOKING
// DELETE /api/bookings/admin/:id
// ---------------------------------------------------------

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteBooking
);

// =========================================================
// USER BOOKINGS
// =========================================================

// ---------------------------------------------------------
// GET MY BOOKINGS
// GET /api/bookings
// ---------------------------------------------------------

router.get(
  "/",
  authMiddleware,
  getMyBookings
);

// ---------------------------------------------------------
// CREATE BOOKING
// POST /api/bookings/event/:eventId
// ---------------------------------------------------------

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);

// ---------------------------------------------------------
// GET SINGLE USER BOOKING
// GET /api/bookings/:id
// ---------------------------------------------------------

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);

// ---------------------------------------------------------
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
//
// Only the logged-in user who owns the booking
// can access the pass.
// ---------------------------------------------------------

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;