const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  // =======================================================
  // USER PAYMENT
  // =======================================================

  submitPayment,

  // =======================================================
  // ADMIN PAYMENT VIEW
  // =======================================================

  getAllPayments,
  getPaymentById,

  // =======================================================
  // ADMIN PAYMENT CONFIRM / REJECT
  // =======================================================

  verifyPayment,
} = require("../controllers/paymentController");

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// USER PAYMENT
// =========================================================
//
// POST /api/payments/:bookingId
//
// Example:
//
// POST /api/payments/31
//
// Body:
//
// {
//   "transactionId": "123456789012",
//   "paymentMethod": "upi",
//   "paymentProofUrl": "optional-url"
// }
//
// Authentication:
// USER REQUIRED
//
// Flow:
//
// Event Booking
//      ↓
// Payment Page
//      ↓
// UPI QR
//      ↓
// User enters UTR
//      ↓
// POST /api/payments/:bookingId
//      ↓
// Payment = submitted
//      ↓
// Waiting for Admin
//
// =========================================================

router.post(
  "/:bookingId",
  authMiddleware,
  submitPayment
);

// =========================================================
// ADMIN PAYMENT MANAGEMENT
// =========================================================
//
// Payment Management is responsible for:
//
// ✅ View payments
// ✅ View payment details
// ✅ Confirm payment
// ✅ Reject payment
//
// Booking Management is responsible for:
//
// ✅ Confirm booking
// ✅ Reject/cancel booking
//
// IMPORTANT:
//
// Confirming payment here should NOT automatically
// confirm the booking.
//
// =========================================================

// ---------------------------------------------------------
// GET ALL PAYMENTS
//
// GET /api/payments/admin
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin",
  adminMiddleware,
  getAllPayments
);

// ---------------------------------------------------------
// GET SINGLE PAYMENT
//
// GET /api/payments/admin/:id
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin/:id",
  adminMiddleware,
  getPaymentById
);

// =========================================================
// CONFIRM / REJECT PAYMENT
// =========================================================
//
// PUT /api/payments/admin/:id/verify
//
// ADMIN ONLY
//
// Confirm:
//
// {
//   "status": "confirmed"
// }
//
// Reject:
//
// {
//   "status": "rejected"
// }
//
// IMPORTANT:
//
// This route is used by:
//
// ADMIN → PAYMENT MANAGEMENT
//
// It should update ONLY the payment status.
//
// It should NOT automatically change:
//
// booking_status = confirmed
//
// Booking confirmation is handled separately from:
//
// PUT /api/bookings/admin/:id/status
//
// =========================================================

router.put(
  "/admin/:id/verify",
  adminMiddleware,
  verifyPayment
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;