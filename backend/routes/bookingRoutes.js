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

// IMPORTANT:
// These files export the middleware function directly.
//
// module.exports = authMiddleware;
// module.exports = adminMiddleware;

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// USER BOOKING ROUTES
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
// GET MY SINGLE BOOKING
// GET /api/bookings/:id
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

router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================
//
// IMPORTANT:
//
// Keep admin routes BEFORE /:id routes.
//
// Admin authentication uses:
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
// EXPORT
// =========================================================

module.exports = router;