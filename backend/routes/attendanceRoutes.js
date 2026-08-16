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
// ADMIN - GET ALL ATTENDANCE
// GET /api/attendance/admin
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllAttendance
);

// =========================================================
// ADMIN - GET EVENT ATTENDANCE STATS
//
// GET /api/attendance/event/:eventId/stats
//
// IMPORTANT:
// This MUST stay before:
// /event/:eventId
// =========================================================

router.get(
  "/event/:eventId/stats",
  adminMiddleware,
  getEventAttendanceStats
);

// =========================================================
// ADMIN - GET EVENT ATTENDANCE
//
// GET /api/attendance/event/:eventId
//
// Optional query:
//
// ?status=present
// ?status=not_present
// ?search=tushar
// =========================================================

router.get(
  "/event/:eventId",
  adminMiddleware,
  getEventAttendance
);

// =========================================================
// ADMIN - GET BOOKING ATTENDANCE
//
// GET /api/attendance/booking/:bookingId
//
// Example:
//
// GET /api/attendance/booking/23
// =========================================================

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);

// =========================================================
// ADMIN - VERIFY ATTENDANCE CODE
//
// POST /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXXXX",
//   "eventId": 3
// }
//
// The controller will:
//
// 1. Validate attendance code
// 2. Find booking
// 3. Check event
// 4. Check booking status
// 5. Mark attendee PRESENT
//
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);

// =========================================================
// ADMIN - VERIFY QR CODE
//
// POST /api/attendance/verify-qr
//
// Supports Event Pass QR:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "bookingId": 23,
//     "eventId": 3,
//     "passCode": "SNICT-PASS-XXXX",
//     "passToken": "XXXX"
//   },
//   "eventId": 3
// }
//
// Supports Attendance Code QR:
//
// {
//   "qrData": {
//     "attendanceCode": "SNICT-ATT-XXXXXXXXXXXX"
//   },
//   "eventId": 3
// }
//
// Supports plain text QR:
//
// {
//   "qrData": "SNICT-ATT-XXXXXXXXXXXX",
//   "eventId": 3
// }
//
// Flow:
//
// SCAN
//   ↓
// VERIFY QR
//   ↓
// CHECK EVENT
//   ↓
// CHECK BOOKING
//   ↓
// CHECK PASS / ATTENDANCE CODE
//   ↓
// MARK PRESENT
//
// =========================================================

router.post(
  "/verify-qr",
  adminMiddleware,
  verifyQrCode
);

// =========================================================
// ADMIN - MANUALLY MARK PRESENT
//
// POST /api/attendance/:bookingId/mark-present
//
// Body:
//
// {
//   "eventId": 3
// }
//
// Example:
//
// POST /api/attendance/23/mark-present
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