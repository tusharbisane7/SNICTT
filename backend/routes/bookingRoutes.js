const express = require("express");


// =========================================================
// CONTROLLERS
// =========================================================

const {
  // =======================================================
  // USER BOOKINGS
  // =======================================================

  createBooking,
  getMyBookings,
  getMyBookingById,
  getMyPass,


  // =======================================================
  // ADMIN BOOKINGS
  // =======================================================

  getAllBookings,
  getAdminBookingById,
  updateBookingStatus,


  // =======================================================
  // ADMIN DELETE
  // =======================================================

  deleteBooking,

} = require(
  "../controllers/bookingController"
);


// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );


const adminMiddleware =
  require(
    "../middleware/adminMiddleware"
  );


// =========================================================
// ROUTER
// =========================================================

const router =
  express.Router();


// =========================================================
// ADMIN BOOKINGS
// =========================================================
//
// IMPORTANT:
//
// Admin routes use:
//
// snict_admin_token
//
// Therefore:
//
// DO NOT use authMiddleware here.
//
// adminMiddleware handles admin authentication.
// =========================================================


// ---------------------------------------------------------
// GET ALL BOOKINGS
//
// GET /api/bookings/admin
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);


// ---------------------------------------------------------
// GET SINGLE BOOKING
//
// GET /api/bookings/admin/:id
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);


// ---------------------------------------------------------
// UPDATE BOOKING STATUS
//
// PUT /api/bookings/admin/:id/status
//
// Example:
//
// {
//   "status": "confirmed"
// }
//
// IMPORTANT:
//
// This endpoint is ONLY responsible for
// booking status.
//
// Payment must already be verified from:
//
// PUT /api/payments/admin/:id/verify
//
// Flow:
//
// PAYMENT MANAGEMENT
//        ↓
// payment = verified
//        ↓
// BOOKING MANAGEMENT
//        ↓
// booking = confirmed
//        ↓
// Event Pass generated
// ---------------------------------------------------------

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);


// ---------------------------------------------------------
// DELETE BOOKING
//
// DELETE /api/bookings/admin/:id
//
// ADMIN ONLY
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
//
// GET /api/bookings
//
// USER ONLY
// ---------------------------------------------------------

router.get(
  "/",
  authMiddleware,
  getMyBookings
);


// ---------------------------------------------------------
// CREATE BOOKING
//
// POST /api/bookings/event/:eventId
//
// USER ONLY
// ---------------------------------------------------------

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


// ---------------------------------------------------------
// GET SINGLE USER BOOKING
//
// GET /api/bookings/:id
//
// USER ONLY
//
// The controller verifies that the booking
// belongs to the logged-in user.
// ---------------------------------------------------------

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


// ---------------------------------------------------------
// GET MY EVENT PASS
//
// GET /api/bookings/:id/pass
//
// USER ONLY
//
// The controller verifies:
//
// booking.user_id = logged-in user
//
// AND:
//
// booking_status = confirmed
//
// AND:
//
// payment_status = verified
// ---------------------------------------------------------

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;