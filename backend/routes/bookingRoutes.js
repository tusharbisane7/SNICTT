const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  createBooking,
  submitPayment,

  getMyBookings,
  getMyBookingById,
  getMyPass,

  getAllBookings,
  getAdminBookingById,

  updateBookingStatus,
  confirmPayment,

  getAdminPasses,
  getAdminPassByBookingId,

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
// ADMIN ROUTES
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
// GET ALL EVENT PASSES
// GET /api/bookings/admin/passes
// ---------------------------------------------------------

router.get(
  "/admin/passes",
  adminMiddleware,
  getAdminPasses
);

// ---------------------------------------------------------
// CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
//
// Example:
// PUT /api/bookings/admin/20/confirm-payment
//
// No body required.
//
// Flow:
//
// payment submitted
//        ↓
// payment verified
//        ↓
// booking confirmed
//        ↓
// existing pass reused OR new pass generated
// ---------------------------------------------------------

router.put(
  "/admin/:id/confirm-payment",
  adminMiddleware,
  confirmPayment
);

// ---------------------------------------------------------
// GET ADMIN PASS
// GET /api/bookings/admin/:id/pass
//
// IMPORTANT:
// Must come BEFORE /admin/:id
// ---------------------------------------------------------

router.get(
  "/admin/:id/pass",
  adminMiddleware,
  getAdminPassByBookingId
);

// ---------------------------------------------------------
// GET SINGLE ADMIN BOOKING
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
// USER ROUTES
// =========================================================

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
// GET MY BOOKINGS
// GET /api/bookings
// ---------------------------------------------------------

router.get(
  "/",
  authMiddleware,
  getMyBookings
);

// ---------------------------------------------------------
// SUBMIT PAYMENT
// POST /api/bookings/:id/payment
// ---------------------------------------------------------

router.post(
  "/:id/payment",
  authMiddleware,
  submitPayment
);

// ---------------------------------------------------------
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
//
// IMPORTANT:
// Must come BEFORE /:id
// ---------------------------------------------------------

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
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
// EXPORT
// =========================================================

module.exports = router;