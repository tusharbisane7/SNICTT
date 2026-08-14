const express = require("express");


// =========================================================
// CONTROLLER
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
//
// Returns all attendance records.
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllAttendance
);


// =========================================================
// ADMIN - GET EVENT ATTENDANCE STATS
// GET /api/attendance/event/:eventId/stats
// =========================================================
//
// IMPORTANT:
// This MUST come before:
//
// /event/:eventId
//
// =========================================================

router.get(
  "/event/:eventId/stats",
  adminMiddleware,
  getEventAttendanceStats
);


// =========================================================
// ADMIN - GET EVENT ATTENDANCE
// GET /api/attendance/event/:eventId
// =========================================================
//
// Optional query:
//
// ?search=tushar
//
// ?status=present
//
// ?status=not_present
//
// Example:
//
// GET /api/attendance/event/3
//
// GET /api/attendance/event/3?status=present
//
// GET /api/attendance/event/3?search=tushar
//
// =========================================================

router.get(
  "/event/:eventId",
  adminMiddleware,
  getEventAttendance
);


// =========================================================
// ADMIN - GET ATTENDANCE BY BOOKING
// GET /api/attendance/booking/:bookingId
// =========================================================
//
// Example:
//
// GET /api/attendance/booking/21
//
// =========================================================

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);


// =========================================================
// ADMIN - VERIFY ATTENDANCE CODE
// POST /api/attendance/verify-code
// =========================================================
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXXXX",
//   "eventId": 3
// }
//
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);


// =========================================================
// ADMIN - VERIFY QR CODE
// POST /api/attendance/verify-qr
// =========================================================
//
// Supports Event Pass QR:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "bookingId": 21,
//     "eventId": 3,
//     "passCode": "SNICT-PASS-XXXX",
//     "passToken": "XXXX"
//   },
//   "eventId": 3
// }
//
//
//
// Also supports Attendance Code QR:
//
// {
//   "qrData": {
//     "attendanceCode": "SNICT-ATT-XXXXXXXXXXXX"
//   },
//   "eventId": 3
// }
//
//
//
// Or plain attendance-code QR:
//
// {
//   "qrData": "SNICT-ATT-XXXXXXXXXXXX",
//   "eventId": 3
// }
//
// =========================================================

router.post(
  "/verify-qr",
  adminMiddleware,
  verifyQrCode
);


// =========================================================
// ADMIN - MANUALLY MARK PRESENT
// POST /api/attendance/:bookingId/mark-present
// =========================================================
//
// Body:
//
// {
//   "eventId": 3
// }
//
// Example:
//
// POST /api/attendance/21/mark-present
//
// =========================================================

router.post(
  "/:bookingId/mark-present",
  adminMiddleware,
  markPresent
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;