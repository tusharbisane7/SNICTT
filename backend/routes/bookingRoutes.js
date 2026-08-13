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
// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================
// =========================================================
//
// IMPORTANT:
//
// Admin authentication is handled by:
//
// snict_admin_token
//
// Therefore:
// DO NOT use authMiddleware on admin routes.
//
// adminMiddleware verifies:
//
// snict_admin_token
//
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
// Example body:
//
// {
//   "status": "confirmed"
// }
//
// Possible statuses can include:
//
// payment_pending
// confirmed
// completed
// cancelled
// rejected
//
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
// =========================================================
// USER BOOKING ROUTES
// =========================================================
// =========================================================
//
// User authentication is handled by:
//
// snict_token
//
// Therefore:
// Use authMiddleware.
//
// =========================================================


// =========================================================
// GET MY BOOKINGS
// GET /api/bookings
// =========================================================
//
// Returns only bookings belonging to the logged-in user.
//
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
//
// User must be logged in.
//
// Booking flow:
//
// User
//   ↓
// Create booking
//   ↓
// payment_pending
//   ↓
// Submit payment
//   ↓
// Admin verifies payment
//   ↓
// Booking confirmed
//   ↓
// Event pass generated
//   ↓
// Attendance record generated
//
// =========================================================

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


// =========================================================
// GET MY SINGLE BOOKING
// GET /api/bookings/:id
// =========================================================
//
// User can access ONLY their own booking.
//
// =========================================================

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


// =========================================================
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
// =========================================================
//
// User can access the pass only if:
//
// 1. User is logged in
// 2. Booking belongs to user
// 3. Payment is verified
// 4. Booking is confirmed
// 5. Event pass exists
//
// Pass contains:
//
// - Event information
// - User information
// - Pass code
// - Pass token
// - QR data
// - Attendance code
// - Attendance status
// - Validity
//
// =========================================================

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;