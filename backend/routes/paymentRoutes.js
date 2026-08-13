const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  submitPayment,
  getAllPayments,
  getPaymentById,
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
// USER - SUBMIT PAYMENT
// =========================================================
//
// POST /api/payments/:bookingId
//
// Body:
//
// {
//   "transactionId": "XXXXXXXXXXXX",
//   "paymentProofUrl": "https://..."
// }
//
// Authentication:
// snict_token
//
// =========================================================

router.post(
  "/:bookingId",
  authMiddleware,
  submitPayment
);

// =========================================================
// ADMIN - GET ALL PAYMENTS
// =========================================================
//
// GET /api/payments/admin
//
// Authentication:
// snict_admin_token
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllPayments
);

// =========================================================
// ADMIN - GET SINGLE PAYMENT
// =========================================================
//
// GET /api/payments/admin/:id
//
// =========================================================

router.get(
  "/admin/:id",
  adminMiddleware,
  getPaymentById
);

// =========================================================
// ADMIN - VERIFY / REJECT PAYMENT
// =========================================================
//
// PUT /api/payments/admin/:id/verify
//
// Body:
//
// {
//   "status": "verified"
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