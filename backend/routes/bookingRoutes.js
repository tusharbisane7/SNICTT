const express = require("express");

const router = express.Router();

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

// Change these paths according to your actual middleware files.
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// =========================================================
// USER BOOKING ROUTES
// =========================================================

/*
  CREATE EVENT BOOKING

  POST
  /api/bookings/event/:eventId

  Example:
  POST /api/bookings/event/12
*/
router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


/*
  GET ALL MY BOOKINGS

  GET
  /api/bookings
*/
router.get(
  "/",
  authMiddleware,
  getMyBookings
);


/*
  GET SINGLE MY BOOKING

  GET
  /api/bookings/:id
*/
router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


/*
  GET MY EVENT PASS

  GET
  /api/bookings/:id/pass

  Returns:
  - pass
  - pass token
  - QR payload
  - attendance code
  - attendance status
*/
router.get(
  "/:id/pass",
  authMiddleware,
  getMyPass
);


// =========================================================
// ADMIN BOOKING ROUTES
// =========================================================

/*
  GET ALL BOOKINGS

  GET
  /api/bookings/admin
*/
router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);


/*
  GET SINGLE BOOKING

  GET
  /api/bookings/admin/:id
*/
router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);


/*
  UPDATE BOOKING / PAYMENT STATUS

  PUT
  /api/bookings/admin/:id/status

  Body examples:

  {
    "bookingStatus": "confirmed"
  }

  OR

  {
    "paymentStatus": "verified"
  }

  OR

  {
    "bookingStatus": "confirmed",
    "paymentStatus": "verified"
  }
*/
router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);


/*
  DELETE BOOKING

  DELETE
  /api/bookings/admin/:id
*/
router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteBooking
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;