const express = require("express");

const {
  submitPayment,
  getAllPayments,
  getPaymentById,
  verifyPayment,
} = require("../controllers/paymentController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();

// =========================================================
// USER PAYMENT
// =========================================================

// POST /api/payments/:bookingId
// User submits UPI payment

router.post(
  "/:bookingId",
  authMiddleware,
  submitPayment
);

// =========================================================
// ADMIN PAYMENT MANAGEMENT
// =========================================================

// IMPORTANT:
// Admin uses separate authentication:
// snict_admin_token
//
// Therefore admin routes use ONLY adminMiddleware.
// Do NOT add authMiddleware here.

// =========================================================
// GET ALL PAYMENTS
// GET /api/payments/admin
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllPayments
);

// =========================================================
// GET SINGLE PAYMENT
// GET /api/payments/admin/:id
// =========================================================

router.get(
  "/admin/:id",
  adminMiddleware,
  getPaymentById
);

// =========================================================
// VERIFY / REJECT PAYMENT
// PUT /api/payments/admin/:id/verify
//
// Body:
// {
//   "status": "confirmed"
// }
//
// OR
//
// {
//   "status": "rejected"
// }
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