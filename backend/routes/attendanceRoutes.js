const express = require("express");


// =========================================================
// CONTROLLERS
// =========================================================

const {
  getAllAttendance,
  getEventAttendance,
  getEventAttendanceStats,
  getBookingAttendance,
  verifyQrCode,
  verifyAttendanceCode,
  markPresent,
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
// Admin authentication:
//
// snict_admin_token
//
// =========================================================


// =========================================================
// 1. GET ALL ATTENDANCE
// =========================================================
//
// GET
// /api/attendance/admin
//
// Returns:
//
// - attendee information
// - booking information
// - event information
// - attendance status
// - attendance code
// - marked time
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllAttendance
);


// =========================================================
// 2. GET EVENT ATTENDANCE
// =========================================================
//
// GET
// /api/attendance/event/:eventId
//
// Optional:
//
// ?search=tushar
//
// ?status=present
//
// ?status=not_present
//
// =========================================================

router.get(
  "/event/:eventId",
  adminMiddleware,
  getEventAttendance
);


// =========================================================
// 3. GET EVENT ATTENDANCE STATS
// =========================================================
//
// GET
// /api/attendance/event/:eventId/stats
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
// 4. GET BOOKING ATTENDANCE
// =========================================================
//
// GET
// /api/attendance/booking/:bookingId
//
// Returns attendance record for one booking.
//
// =========================================================

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);


// =========================================================
// 5. VERIFY QR CODE
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
//     "bookingId": 16,
//     "eventId": 5,
//     "passCode": "SNICT-PASS-XXXX",
//     "passToken": "XXXXXXXX"
//   },
//   "eventId": 5
// }
//
// QR scan:
//
// QR
// ↓
// Verify pass
// ↓
// Find booking
// ↓
// Find/create attendance
// ↓
// Mark present
//
// =========================================================

router.post(
  "/verify-qr",
  adminMiddleware,
  verifyQrCode
);


// =========================================================
// 6. VERIFY MANUAL ATTENDANCE CODE
// =========================================================
//
// POST
// /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXX",
//   "eventId": 5
// }
//
// Used when QR cannot be scanned.
//
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);


// =========================================================
// 7. MANUALLY MARK PRESENT
// =========================================================
//
// POST
// /api/attendance/:bookingId/mark-present
//
// Body:
//
// {
//   "eventId": 5
// }
//
// Used by admin for manual attendance.
//
// =========================================================

router.post(
  "/:bookingId/mark-present",
  adminMiddleware,
  markPresent
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;