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
// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================
// =========================================================
//
// IMPORTANT:
//
// All specific /admin routes MUST come before:
//
// /admin/:id
//
// =========================================================


// =========================================================
// ADMIN - GET ALL BOOKINGS
// GET /api/bookings/admin
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);


// =========================================================
// ADMIN - GET ALL EVENT PASSES
// GET /api/bookings/admin/passes
// =========================================================

router.get(
  "/admin/passes",
  adminMiddleware,
  getAdminPasses
);


// =========================================================
// ADMIN - CONFIRM PAYMENT
// PUT /api/bookings/admin/:id/confirm-payment
//
// Example:
//
// PUT /api/bookings/admin/20/confirm-payment
//
// No request body required.
//
// Flow:
//
// Payment submitted
//        ↓
// Admin confirms payment
//        ↓
// payment_status = verified
//        ↓
// booking_status = confirmed
//        ↓
// Event pass generated / reused
//
// =========================================================

router.put(
  "/admin/:id/confirm-payment",
  adminMiddleware,
  confirmPayment
);


// =========================================================
// ADMIN - GET EVENT PASS
// GET /api/bookings/admin/:id/pass
//
// IMPORTANT:
// This MUST come before:
//
// /admin/:id
//
// =========================================================

router.get(
  "/admin/:id/pass",
  adminMiddleware,
  getAdminPassByBookingId
);


// =========================================================
// ADMIN - GET SINGLE BOOKING
// GET /api/bookings/admin/:id
// =========================================================

router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);


// =========================================================
// ADMIN - UPDATE BOOKING STATUS
// PUT /api/bookings/admin/:id/status
//
// Body:
//
// {
//   "status": "confirmed"
// }
//
// OR
//
// {
//   "status": "completed"
// }
//
// OR
//
// {
//   "status": "cancelled"
// }
//
// OR
//
// {
//   "status": "rejected"
// }
//
// OR
//
// {
//   "status": "payment_pending"
// }
//
// =========================================================

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);


// =========================================================
// ADMIN - DELETE BOOKING
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
//
// This route MUST come BEFORE:
//
// /:id
//
// Otherwise:
//
// GET /api/bookings/20/pass
//
// can be captured incorrectly by:
//
// /:id
//
// =========================================================

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// GET MY SINGLE BOOKING
// GET /api/bookings/:id
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