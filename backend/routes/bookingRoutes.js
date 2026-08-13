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
// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================
// =========================================================
//
// IMPORTANT:
//
// ALL specific /admin routes MUST come
// BEFORE /admin/:id
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
// PUT /api/bookings/admin/18/confirm-payment
//
// No body required.
//
// Flow:
//
// payment submitted
//       ↓
// payment verified
//       ↓
// booking confirmed
//       ↓
// event pass generated
//
// =========================================================

router.put(
  "/admin/:id/confirm-payment",
  adminMiddleware,
  confirmPayment
);


// =========================================================
// ADMIN - GET PASS FOR BOOKING
// GET /api/bookings/admin/:id/pass
//
// Example:
//
// GET /api/bookings/admin/18/pass
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
// OR:
//
// {
//   "status": "completed"
// }
//
// OR:
//
// {
//   "status": "cancelled"
// }
//
// OR:
//
// {
//   "status": "rejected"
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
// CREATE BOOKING
// POST /api/bookings/event/:eventId
// =========================================================

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


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
// SUBMIT PAYMENT
// POST /api/bookings/:id/payment
//
// Body:
//
// {
//   "transactionId": "XXXXXXXX",
//   "paymentProofUrl": "https://...",
//   "paymentMethod": "upi"
// }
//
// =========================================================

router.post(
  "/:id/payment",
  authMiddleware,
  submitPayment
);


// =========================================================
// GET MY EVENT PASS
// GET /api/bookings/:id/pass
//
// IMPORTANT:
// Must come before /:id
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