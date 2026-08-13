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
// All attendance routes require admin authentication.
//
// Admin authentication:
// snict_admin_token
//
// adminMiddleware:
// verifies the admin JWT and sets:
//
// req.adminId
//
// =========================================================


// =========================================================
// 1. VERIFY QR CODE
// =========================================================
//
// POST
// /api/attendance/verify-qr
//
// Body:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "passToken": "PASS_TOKEN"
//   },
//   "eventId": 123
// }
//
// Also supports:
//
// {
//   "qrData": "PASS_TOKEN",
//   "eventId": 123
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
// POST
// /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXX",
//   "eventId": 123
// }
//
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);


// =========================================================
// 3. MARK PRESENT MANUALLY
// =========================================================
//
// POST
// /api/attendance/:bookingId/mark-present
//
// Body:
//
// {
//   "eventId": 123
// }
//
// This can be used by admin when:
//
// - QR cannot be scanned
// - Attendance needs to be marked manually
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
// GET
// /api/attendance/event/:eventId
//
// Optional query:
//
// ?search=tushar
//
// ?status=present
//
// ?status=not_present
//
// Examples:
//
// /api/attendance/event/12
//
// /api/attendance/event/12?status=present
//
// /api/attendance/event/12?search=tushar
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
// GET
// /api/attendance/event/:eventId/stats
//
// Response:
//
// {
//   "success": true,
//   "eventId": 12,
//   "stats": {
//     "total": 100,
//     "present": 72,
//     "notPresent": 28,
//     "attendancePercentage": 72
//   }
// }
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
// GET
// /api/attendance/booking/:bookingId
//
// Used when admin wants to see attendance
// information for one booking.
//
// =========================================================

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;