const express = require("express");

const {
  // =========================================================
  // USER
  // =========================================================

  getMyMembership,
  getMembershipPlans,
  applyMembership,
  submitPayment,
  renewMembership,
  verifyMembership,

  // =========================================================
  // ADMIN - MEMBERSHIP
  // =========================================================

  getAllMemberships,
  getMembershipById,
  approveMembership,
  rejectMembership,

  // PAYMENT VERIFICATION
  markPaymentReceived,
  markPaymentNotReceived,

  // =========================================================
  // ADMIN - MEMBERSHIP PLANS
  // =========================================================

  getMembershipPlansAdmin,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,

  // =========================================================
  // PAYMENT SETTINGS
  // =========================================================

  getPaymentSettings,
  updatePaymentSettings,

} = require("../controllers/membershipController");


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

const router =
  express.Router();


// =========================================================
// USER MEMBERSHIP
// =========================================================

// GET MY MEMBERSHIP
// GET /api/membership/me

router.get(
  "/me",
  authMiddleware,
  getMyMembership
);


// GET MEMBERSHIP PLANS
// GET /api/membership/plans

router.get(
  "/plans",
  getMembershipPlans
);


// APPLY MEMBERSHIP
// POST /api/membership/apply

router.post(
  "/apply",
  authMiddleware,
  applyMembership
);


// SUBMIT PAYMENT / UTR
// POST /api/membership/payment

router.post(
  "/payment",
  authMiddleware,
  submitPayment
);


// RENEW MEMBERSHIP
// POST /api/membership/renew

router.post(
  "/renew",
  authMiddleware,
  renewMembership
);


// =========================================================
// PUBLIC MEMBERSHIP VERIFICATION
// =========================================================

// GET
// /api/membership/verify/:membershipNumber

router.get(
  "/verify/:membershipNumber",
  verifyMembership
);


// =========================================================
// PUBLIC PAYMENT SETTINGS
// =========================================================

// GET
// /api/membership/payment-settings

router.get(
  "/payment-settings",
  getPaymentSettings
);


// =========================================================
// ADMIN - MEMBERSHIP PLANS
//
// IMPORTANT:
// Keep these routes BEFORE /admin/:id
// =========================================================


// GET ALL PLANS
// GET /api/membership/admin/plans

router.get(
  "/admin/plans",
  adminMiddleware,
  getMembershipPlansAdmin
);


// CREATE PLAN
// POST /api/membership/admin/plans

router.post(
  "/admin/plans",
  adminMiddleware,
  createMembershipPlan
);


// UPDATE PLAN
// PUT /api/membership/admin/plans/:id

router.put(
  "/admin/plans/:id",
  adminMiddleware,
  updateMembershipPlan
);


// DISABLE PLAN
// DELETE /api/membership/admin/plans/:id

router.delete(
  "/admin/plans/:id",
  adminMiddleware,
  deleteMembershipPlan
);


// =========================================================
// ADMIN - PAYMENT SETTINGS
// =========================================================


// GET PAYMENT SETTINGS
// GET /api/membership/admin/payment-settings

router.get(
  "/admin/payment-settings",
  adminMiddleware,
  getPaymentSettings
);


// UPDATE PAYMENT SETTINGS
// PUT /api/membership/admin/payment-settings

router.put(
  "/admin/payment-settings",
  adminMiddleware,
  updatePaymentSettings
);


// =========================================================
// ADMIN - MEMBERSHIP APPLICATIONS
// =========================================================


// GET ALL MEMBERSHIPS
// GET /api/membership/admin

router.get(
  "/admin",
  adminMiddleware,
  getAllMemberships
);


// GET SINGLE MEMBERSHIP
// GET /api/membership/admin/:id

router.get(
  "/admin/:id",
  adminMiddleware,
  getMembershipById
);


// =========================================================
// ADMIN - PAYMENT VERIFICATION
// =========================================================


// PAYMENT RECEIVED
// PUT /api/membership/admin/:id/payment-received

router.put(
  "/admin/:id/payment-received",
  adminMiddleware,
  markPaymentReceived
);


// PAYMENT NOT RECEIVED
// PUT /api/membership/admin/:id/payment-not-received

router.put(
  "/admin/:id/payment-not-received",
  adminMiddleware,
  markPaymentNotReceived
);


// =========================================================
// ADMIN - APPROVE MEMBERSHIP
// =========================================================


// PUT
// /api/membership/admin/:id/approve

router.put(
  "/admin/:id/approve",
  adminMiddleware,
  approveMembership
);


// =========================================================
// ADMIN - REJECT MEMBERSHIP
// =========================================================


// PUT
// /api/membership/admin/:id/reject

router.put(
  "/admin/:id/reject",
  adminMiddleware,
  rejectMembership
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;