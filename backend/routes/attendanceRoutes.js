const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  verifyQrCode,
  verifyAttendanceCode,
  markPresent,
  getEventAttendance,
  getEventAttendanceStats,
  getBookingAttendance,
} = require("../controllers/attendanceController");

// =========================================================
// MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// ADMIN ATTENDANCE ROUTES
// =========================================================
//
// All attendance routes are protected by
// adminMiddleware.
//
// Admin authentication uses:
// snict_admin_token
//
// =========================================================


// =========================================================
// 1. VERIFY QR CODE
// =========================================================
//
// POST /api/attendance/verify-qr
//
// Body:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "bookingId": "...",
//     "eventId": "...",
//     "passToken": "...",
//     "attendanceCode": "..."
//   },
//   "eventId": "..."
// }
//
// =========================================================

router.post(
  "/verify-qr",
  adminMiddleware,
  verifyQrCode
);


// =========================================================
// 2. VERIFY MANUAL ATTENDANCE CODE
// =========================================================
//
// POST /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXX",
//   "eventId": "..."
// }
//
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);


// =========================================================
// 3. MARK ATTENDANCE PRESENT
// =========================================================
//
// POST /api/attendance/:bookingId/mark-present
//
// Body:
//
// {
//   "eventId": "..."
// }
//
// =========================================================

router.post(
  "/:bookingId/mark-present",
  adminMiddleware,
  markPresent
);


// =========================================================
// 4. GET EVENT ATTENDANCE
// =========================================================
//
// GET /api/attendance/event/:eventId
//
// Optional query:
//
// ?search=tushar
// ?status=present
// ?status=not_present
//
// =========================================================

router.get(
  "/event/:eventId",
  adminMiddleware,
  getEventAttendance
);


// =========================================================
// 5. GET EVENT ATTENDANCE STATISTICS
// =========================================================
//
// GET /api/attendance/event/:eventId/stats
//
// Returns:
//
// total
// present
// notPresent
// attendancePercentage
//
// =========================================================

router.get(
  "/event/:eventId/stats",
  adminMiddleware,
  getEventAttendanceStats
);


// =========================================================
// 6. GET SINGLE BOOKING ATTENDANCE
// =========================================================
//
// GET /api/attendance/booking/:bookingId
//
// =========================================================

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;