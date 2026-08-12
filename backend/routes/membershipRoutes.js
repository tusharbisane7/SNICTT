const express = require("express");

const {
  // =======================================================
  // USER
  // =======================================================

  getMyMembership,
  applyMembership,
  getMembershipPlans,
  submitPayment,
  renewMembership,
  verifyMembership,

  // =======================================================
  // ADMIN - MEMBERSHIP
  // =======================================================

  getAllMemberships,
  getMembershipById,
  approveMembership,
  rejectMembership,

  // =======================================================
  // ADMIN - MEMBERSHIP PLANS
  // =======================================================

  getMembershipPlansAdmin,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,

  // =======================================================
  // PAYMENT SETTINGS
  // =======================================================

  getPaymentSettings,
  updatePaymentSettings,
} = require("../controllers/membershipController");

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// USER MEMBERSHIP
// =========================================================

// ---------------------------------------------------------
// GET MY MEMBERSHIP
// GET /api/membership/me
// ---------------------------------------------------------

router.get(
  "/me",
  authMiddleware,
  getMyMembership
);

// ---------------------------------------------------------
// GET MEMBERSHIP PLANS
// GET /api/membership/plans
// ---------------------------------------------------------
//
// Public route.
// Signup page can load available membership plans.
// Admin controls the prices and tenure.
// ---------------------------------------------------------

router.get(
  "/plans",
  getMembershipPlans
);

// ---------------------------------------------------------
// APPLY FOR MEMBERSHIP
// POST /api/membership/apply
// ---------------------------------------------------------
//
// Body:
//
// {
//   "planId": 1
// }
// ---------------------------------------------------------

router.post(
  "/apply",
  authMiddleware,
  applyMembership
);

// ---------------------------------------------------------
// SUBMIT PAYMENT / UTR
// POST /api/membership/payment
// ---------------------------------------------------------
//
// Body:
//
// {
//   "membershipId": 1,
//   "utrNumber": "123456789012"
// }
// ---------------------------------------------------------

router.post(
  "/payment",
  authMiddleware,
  submitPayment
);

// ---------------------------------------------------------
// RENEW MEMBERSHIP
// POST /api/membership/renew
// ---------------------------------------------------------
//
// Body:
//
// {
//   "planId": 1
// }
// ---------------------------------------------------------

router.post(
  "/renew",
  authMiddleware,
  renewMembership
);

// =========================================================
// PUBLIC MEMBERSHIP VERIFICATION
// =========================================================

// ---------------------------------------------------------
// VERIFY MEMBERSHIP
// GET /api/membership/verify/:membershipNumber
// ---------------------------------------------------------
//
// PUBLIC
//
// QR code will open this URL.
// Login is NOT required.
// ---------------------------------------------------------

router.get(
  "/verify/:membershipNumber",
  verifyMembership
);

// =========================================================
// PUBLIC PAYMENT SETTINGS
// =========================================================

// ---------------------------------------------------------
// GET PAYMENT SETTINGS
// GET /api/membership/payment-settings
// ---------------------------------------------------------
//
// IMPORTANT:
//
// Signup/payment page needs access to:
//
// - UPI ID
// - Account Name
// - Payment QR
//
// Therefore this endpoint MUST NOT use
// adminMiddleware.
//
// Admin can update these settings using the
// protected endpoint below.
// ---------------------------------------------------------

router.get(
  "/payment-settings",
  getPaymentSettings
);

// =========================================================
// ADMIN - MEMBERSHIP PLANS
// IMPORTANT:
// These routes MUST come before /admin/:id
// =========================================================

// ---------------------------------------------------------
// GET ALL MEMBERSHIP PLANS
// GET /api/membership/admin/plans
// ---------------------------------------------------------

router.get(
  "/admin/plans",
  adminMiddleware,
  getMembershipPlansAdmin
);

// ---------------------------------------------------------
// CREATE MEMBERSHIP PLAN
// POST /api/membership/admin/plans
// ---------------------------------------------------------
//
// Example:
//
// {
//   "name": "1 Year Membership",
//   "durationYears": 1,
//   "price": 500
// }
// ---------------------------------------------------------

router.post(
  "/admin/plans",
  adminMiddleware,
  createMembershipPlan
);

// ---------------------------------------------------------
// UPDATE MEMBERSHIP PLAN
// PUT /api/membership/admin/plans/:id
// ---------------------------------------------------------
//
// Example:
//
// {
//   "name": "1 Year Membership",
//   "durationYears": 1,
//   "price": 600,
//   "isActive": true
// }
// ---------------------------------------------------------

router.put(
  "/admin/plans/:id",
  adminMiddleware,
  updateMembershipPlan
);

// ---------------------------------------------------------
// DISABLE MEMBERSHIP PLAN
// DELETE /api/membership/admin/plans/:id
// ---------------------------------------------------------
//
// This should disable the plan rather than deleting
// existing memberships that already use it.
// ---------------------------------------------------------

router.delete(
  "/admin/plans/:id",
  adminMiddleware,
  deleteMembershipPlan
);

// =========================================================
// ADMIN - PAYMENT SETTINGS
// =========================================================

// ---------------------------------------------------------
// GET PAYMENT SETTINGS
// GET /api/membership/admin/payment-settings
// ---------------------------------------------------------
//
// Admin-only endpoint.
// ---------------------------------------------------------

router.get(
  "/admin/payment-settings",
  adminMiddleware,
  getPaymentSettings
);

// ---------------------------------------------------------
// UPDATE PAYMENT SETTINGS
// PUT /api/membership/admin/payment-settings
// ---------------------------------------------------------
//
// Example:
//
// {
//   "upiId": "example@upi",
//   "accountName": "SNICT",
//   "qrCode": "https://example.com/qr.png"
// }
// ---------------------------------------------------------

router.put(
  "/admin/payment-settings",
  adminMiddleware,
  updatePaymentSettings
);

// =========================================================
// ADMIN - MEMBERSHIP APPLICATIONS
// =========================================================

// ---------------------------------------------------------
// GET ALL MEMBERSHIP APPLICATIONS
// GET /api/membership/admin
// ---------------------------------------------------------
//
// Admin can see:
//
// - User
// - Plan
// - Amount
// - UTR
// - Payment status
// - Membership status
// - Start date
// - Expiry date
// ---------------------------------------------------------

router.get(
  "/admin",
  adminMiddleware,
  getAllMemberships
);

// ---------------------------------------------------------
// GET SINGLE MEMBERSHIP
// GET /api/membership/admin/:id
// ---------------------------------------------------------

router.get(
  "/admin/:id",
  adminMiddleware,
  getMembershipById
);

// ---------------------------------------------------------
// APPROVE MEMBERSHIP
// PUT /api/membership/admin/:id/approve
// ---------------------------------------------------------
//
// Admin approval should:
//
// 1. Verify UTR/payment
// 2. Mark payment approved
// 3. Generate membership number
// 4. Set membership start date
// 5. Calculate expiry date
// 6. Mark membership approved
// 7. Generate membership verification QR
// ---------------------------------------------------------

router.put(
  "/admin/:id/approve",
  adminMiddleware,
  approveMembership
);

// ---------------------------------------------------------
// REJECT MEMBERSHIP
// PUT /api/membership/admin/:id/reject
// ---------------------------------------------------------
//
// Body:
//
// {
//   "reason": "Payment could not be verified"
// }
// ---------------------------------------------------------

router.put(
  "/admin/:id/reject",
  adminMiddleware,
  rejectMembership
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;