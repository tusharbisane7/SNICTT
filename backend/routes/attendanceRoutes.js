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
// GET /api/attendance/event/:eventId/stats
// =========================================================

router.get(
  "/event/:eventId/stats",
  adminMiddleware,
  getEventAttendanceStats
);

// =========================================================
// ADMIN - GET EVENT ATTENDANCE
// GET /api/attendance/event/:eventId
//
// Optional:
// ?search=tushar
// ?status=present
// ?status=not_present
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

router.get(
  "/booking/:bookingId",
  adminMiddleware,
  getBookingAttendance
);

// =========================================================
// ADMIN - VERIFY ATTENDANCE CODE
// POST /api/attendance/verify-code
//
// Body:
//
// {
//   "attendanceCode": "SNICT-ATT-XXXXXXXXXX",
//   "eventId": 5
// }
// =========================================================

router.post(
  "/verify-code",
  adminMiddleware,
  verifyAttendanceCode
);

// =========================================================
// ADMIN - VERIFY EVENT PASS QR
// POST /api/attendance/verify-qr
//
// Body:
//
// {
//   "qrData": {
//     "type": "SNICT_EVENT_PASS",
//     "bookingId": 20,
//     "eventId": 5,
//     "passCode": "SNICT-PASS-XXXX",
//     "passToken": "XXXX"
//   },
//   "eventId": 5
// }
//
// OR:
//
// {
//   "qrData": {
//     "attendanceCode": "SNICT-ATT-XXXXXXXX"
//   },
//   "eventId": 5
// }
// =========================================================

router.post(
  "/verify-qr",
  adminMiddleware,
  verifyQrCode
);

// =========================================================
// ADMIN - MARK PRESENT MANUALLY
// POST /api/attendance/:bookingId/mark-present
//
// Body:
//
// {
//   "eventId": 5
// }
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