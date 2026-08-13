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

// Normal user authentication
const authMiddleware =
  require("../middleware/authMiddleware");

// Admin authentication
const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

/*
=========================================================
IMPORTANT ROUTE ORDER

Specific routes such as:

/admin
/admin/:id
/event/:eventId

must be declared before:

/:id

Otherwise Express can treat "admin" as an ID.
=========================================================
*/


// =========================================================
// USER BOOKING ROUTES
// =========================================================

/*
---------------------------------------------------------
1. CREATE EVENT BOOKING

POST /api/bookings/event/:eventId

Authentication:
Normal user

Example:

POST /api/bookings/event/5

Creates:

event_booking
+
event_payment

Initial status:

booking_status = payment_pending
payment_status = pending
---------------------------------------------------------
*/

router.post(
  "/event/:eventId",
  authMiddleware,
  createBooking
);


// =========================================================
// USER BOOKING HISTORY
// =========================================================

/*
---------------------------------------------------------
2. GET MY BOOKINGS

GET /api/bookings

Returns:

- Booking
- Event
- Payment
- Pass
- Attendance

---------------------------------------------------------
*/

router.get(
  "/",
  authMiddleware,
  getMyBookings
);


// =========================================================
// USER SINGLE BOOKING
// =========================================================

/*
---------------------------------------------------------
3. GET MY SINGLE BOOKING

GET /api/bookings/:id

Example:

GET /api/bookings/16

---------------------------------------------------------
*/

router.get(
  "/:id",
  authMiddleware,
  getMyBookingById
);


// =========================================================
// USER EVENT PASS
// =========================================================

/*
---------------------------------------------------------
4. GET EVENT PASS

GET /api/bookings/:id/pass

Returns:

- Pass
- QR payload
- Attendance code
- Attendance status

Only available when:

booking_status = confirmed

AND

payment_status = verified
---------------------------------------------------------
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
IMPORTANT:

All /admin routes are placed BEFORE /:id
to prevent route conflicts.
*/


// =========================================================
// 5. GET ALL BOOKINGS
// =========================================================

/*
GET /api/bookings/admin

Authentication:
Admin

Returns:

- User details
- Event details
- Booking details
- Payment details
- Pass details
- Attendance details
*/

router.get(
  "/admin",
  adminMiddleware,
  getAllBookings
);


// =========================================================
// 6. GET SINGLE ADMIN BOOKING
// =========================================================

/*
GET /api/bookings/admin/:id

Example:

GET /api/bookings/admin/16

Returns complete booking information
for admin dashboard.
*/

router.get(
  "/admin/:id",
  adminMiddleware,
  getAdminBookingById
);


// =========================================================
// 7. UPDATE BOOKING / PAYMENT STATUS
// =========================================================

/*
PUT /api/bookings/admin/:id/status

Body examples:

{
  "status": "confirmed"
}

OR

{
  "bookingStatus": "confirmed",
  "paymentStatus": "verified"
}

When:

bookingStatus = confirmed
AND
paymentStatus = verified

The backend automatically creates:

1. Event Pass
2. Pass Token
3. Attendance Record
4. Attendance Code

---------------------------------------------------------
*/

router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateBookingStatus
);


// =========================================================
// 8. DELETE BOOKING
// =========================================================

/*
DELETE /api/bookings/admin/:id

Deletes:

- Attendance
- Event Pass
- Payment
- Booking

---------------------------------------------------------
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