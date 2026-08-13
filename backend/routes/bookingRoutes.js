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

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================

// =========================================================
// GET ALL BOOKINGS
// GET /api/bookings/admin
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);

// =========================================================
// GET SINGLE ADMIN BOOKING
// GET /api/bookings/admin/:id
// =========================================================

router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);

// =========================================================
// UPDATE BOOKING STATUS
// PUT /api/bookings/admin/:id/status
//
// Body examples:
//
// {
//   "status": "confirmed"
// }
//
// OR
//
// {
//   "bookingStatus": "confirmed",
//   "paymentStatus": "verified"
// }
// =========================================================

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);

// =========================================================
// DELETE BOOKING
// DELETE /api/bookings/admin/:id
// =========================================================

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteBooking
);

// =========================================================
// USER BOOKING ROUTES
// =========================================================

// =========================================================
// GET MY BOOKINGS
// GET /api/bookings
// =========================================================

router.get(
  "/",
  authMiddleware,
  getMyBookings
);

// =========================================================
// CREATE BOOKING
// POST /api/bookings/event/:eventId
// =========================================================

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);

// =========================================================
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
//
// IMPORTANT:
// This MUST come BEFORE "/:id"
// because Express matches routes from top to bottom.
// =========================================================

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);

// =========================================================
// GET MY SINGLE BOOKING
// GET /api/bookings/:id
//
// Keep this AFTER "/:id/pass".
// =========================================================

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;