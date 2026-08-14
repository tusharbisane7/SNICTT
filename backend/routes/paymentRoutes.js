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

// Submit UPI payment
// POST /api/payments/:bookingId

router.post(
  "/:bookingId",
  authMiddleware,
  submitPayment
);


// =========================================================
// ADMIN PAYMENT MANAGEMENT
// =========================================================

// IMPORTANT:
// Admin routes use adminMiddleware.
// Do NOT use authMiddleware here if your admin login
// has a separate admin session/cookie.


// Get all payments
// GET /api/payments/admin

router.get(
  "/admin",
  adminMiddleware,
  getAllPayments
);


// Get single payment
// GET /api/payments/admin/:id

router.get(
  "/admin/:id",
  adminMiddleware,
  getPaymentById
);


// Verify / reject payment
// PUT /api/payments/admin/:id/verify

router.put(
  "/admin/:id/verify",
  adminMiddleware,
  verifyPayment
);


module.exports = router;