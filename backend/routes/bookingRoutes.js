const express = require("express");

const router = express.Router();


// =========================================================
// CONTROLLER
// =========================================================

const {
  createBooking,
  getMyBookings,
  getMyBookingById,

  getAllBookings,
  getAdminBookingById,

  updateBookingStatus,
  confirmPayment,

  deleteBooking,
} = require("../controllers/bookingController");


// =========================================================
// MIDDLEWARE
// =========================================================

// User authentication
const authMiddleware =
  require("../middleware/authMiddleware");

// Admin authentication
const adminMiddleware =
  require("../middleware/adminMiddleware");


// =========================================================
// USER BOOKING ROUTES
// =========================================================


// ---------------------------------------------------------
// CREATE EVENT BOOKING
// POST /api/bookings/event/:eventId
// ---------------------------------------------------------

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


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
// GET MY SINGLE BOOKING
// GET /api/bookings/:id
// ---------------------------------------------------------

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


// =========================================================
// ADMIN BOOKING ROUTES
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
// UPDATE BOOKING / PAYMENT STATUS
// PUT /api/bookings/admin/:id/status
// ---------------------------------------------------------

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);


// ---------------------------------------------------------
// CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
// ---------------------------------------------------------

router.put(
  "/admin/:id/confirm-payment",
  adminMiddleware,
  confirmPayment
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
// EXPORT
// =========================================================

module.exports = router;