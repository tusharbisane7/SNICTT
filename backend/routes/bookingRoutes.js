const express = require("express");

const {
  createBooking,
  getMyBookings,
  getMyBookingById,
  getAllBookings,
  getAdminBookingById,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/bookingController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router =
  express.Router();


// =========================================================
// ADMIN BOOKINGS
// =========================================================

// Get all bookings
// GET /api/bookings/admin

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllBookings
);


// Get single booking
// GET /api/bookings/admin/:id

router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getAdminBookingById
);


// Update booking
// PUT /api/bookings/admin/:id/status

router.put(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  updateBookingStatus
);


// Delete booking
// DELETE /api/bookings/admin/:id

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteBooking
);


// =========================================================
// USER BOOKINGS
// =========================================================

// Get my bookings
// GET /api/bookings

router.get(
  "/",
  authMiddleware,
  getMyBookings
);


// Create booking
// POST /api/bookings/event/:eventId

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


// Get single booking
// GET /api/bookings/:id

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


module.exports = router;