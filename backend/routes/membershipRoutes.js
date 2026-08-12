const express = require("express");


// =========================================================
// CONTROLLERS
// =========================================================

const {
  // =======================================================
  // USER
  // =======================================================

  getMyMembership,
  getMembershipPlans,
  applyMembership,
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
  // ADMIN - PAYMENT VERIFICATION
  // =======================================================

  markPaymentReceived,
  markPaymentNotReceived,

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

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


// =========================================================
// QR UPLOAD MIDDLEWARE
// =========================================================
//
// IMPORTANT:
//
// qrUpload.js already handles:
//
// upload.single("qrCode")
//
// Therefore DO NOT use:
//
// qrUpload.single("qrCode")
//
// here.
//
// Correct:
//
// qrUpload
//
// Flow:
//
// Desktop QR
//     ↓
// qrUpload
//     ↓
// Multer memoryStorage
//     ↓
// Cloudinary
//     ↓
// req.file.path
//     ↓
// membershipController
//
// =========================================================

const qrUpload =
  require("../middleware/qrUpload");


// =========================================================
// ROUTER
// =========================================================

const router =
  express.Router();


// =========================================================
// USER MEMBERSHIP
// =========================================================


// =========================================================
// GET MY MEMBERSHIP
// GET /api/membership/me
// =========================================================

router.get(
  "/me",
  authMiddleware,
  getMyMembership
);


// =========================================================
// GET MEMBERSHIP PLANS
// GET /api/membership/plans
// =========================================================
//
// Public route.
//
// Used by:
//
// - Signup
// - Membership page
// - Payment page
//
// =========================================================

router.get(
  "/plans",
  getMembershipPlans
);


// =========================================================
// APPLY FOR MEMBERSHIP
// POST /api/membership/apply
// =========================================================
//
// Authentication required.
//
// Example body:
//
// {
//   "planId": 1
// }
//
// =========================================================

router.post(
  "/apply",
  authMiddleware,
  applyMembership
);


// =========================================================
// SUBMIT PAYMENT / UTR
// POST /api/membership/payment
// =========================================================
//
// Authentication required.
//
// Example body:
//
// {
//   "membershipId": 1,
//   "utrNumber": "123456789012"
// }
//
// =========================================================

router.post(
  "/payment",
  authMiddleware,
  submitPayment
);


// =========================================================
// RENEW MEMBERSHIP
// POST /api/membership/renew
// =========================================================
//
// Authentication required.
//
// Example:
//
// {
//   "planId": 1
// }
//
// =========================================================

router.post(
  "/renew",
  authMiddleware,
  renewMembership
);


// =========================================================
// PUBLIC MEMBERSHIP VERIFICATION
// =========================================================


// =========================================================
// VERIFY MEMBERSHIP
// GET /api/membership/verify/:membershipNumber
// =========================================================
//
// Public route.
//
// Login is NOT required.
//
// Membership verification QR can open this URL.
//
// =========================================================

router.get(
  "/verify/:membershipNumber",
  verifyMembership
);


// =========================================================
// PUBLIC PAYMENT SETTINGS
// =========================================================


// =========================================================
// GET PAYMENT SETTINGS
// GET /api/membership/payment-settings
// =========================================================
//
// Public.
//
// Used by membership payment page.
//
// Returns:
//
// - UPI ID
// - Account Name
// - QR Code Cloudinary URL
//
// =========================================================

router.get(
  "/payment-settings",
  getPaymentSettings
);


// =========================================================
// ADMIN - MEMBERSHIP PLANS
// =========================================================
//
// IMPORTANT:
//
// These routes must remain BEFORE:
//
// /admin/:id
//
// Otherwise "plans" could be treated as an ID.
//
// =========================================================


// =========================================================
// GET ALL MEMBERSHIP PLANS
// GET /api/membership/admin/plans
// =========================================================

router.get(
  "/admin/plans",
  adminMiddleware,
  getMembershipPlansAdmin
);


// =========================================================
// CREATE MEMBERSHIP PLAN
// POST /api/membership/admin/plans
// =========================================================
//
// Example:
//
// {
//   "name": "1 Year Membership",
//   "durationYears": 1,
//   "price": 500
// }
//
// =========================================================

router.post(
  "/admin/plans",
  adminMiddleware,
  createMembershipPlan
);


// =========================================================
// UPDATE MEMBERSHIP PLAN
// PUT /api/membership/admin/plans/:id
// =========================================================
//
// Example:
//
// {
//   "name": "1 Year Membership",
//   "durationYears": 1,
//   "price": 600,
//   "isActive": true
// }
//
// =========================================================

router.put(
  "/admin/plans/:id",
  adminMiddleware,
  updateMembershipPlan
);


// =========================================================
// DISABLE MEMBERSHIP PLAN
// DELETE /api/membership/admin/plans/:id
// =========================================================
//
// Soft delete.
//
// Existing memberships are NOT deleted.
//
// =========================================================

router.delete(
  "/admin/plans/:id",
  adminMiddleware,
  deleteMembershipPlan
);


// =========================================================
// ADMIN - PAYMENT SETTINGS
// =========================================================


// =========================================================
// GET PAYMENT SETTINGS
// GET /api/membership/admin/payment-settings
// =========================================================
//
// Admin only.
//
// =========================================================

router.get(
  "/admin/payment-settings",
  adminMiddleware,
  getPaymentSettings
);


// =========================================================
// UPDATE PAYMENT SETTINGS
// PUT /api/membership/admin/payment-settings
// =========================================================
//
// IMPORTANT:
//
// Content-Type:
//
// multipart/form-data
//
// Fields:
//
// accountName
// upiId
// qrCode
//
// QR upload flow:
//
// Desktop
//    ↓
// qrUpload
//    ↓
// multer.memoryStorage()
//    ↓
// req.file.buffer
//    ↓
// Cloudinary upload_stream()
//    ↓
// req.file.path
//    ↓
// membershipController
//    ↓
// database qr_code
//
// IMPORTANT:
//
// DO NOT use:
//
// qrUpload.single("qrCode")
//
// because qrUpload.js already contains:
//
// upload.single("qrCode")
//
// =========================================================

router.put(
  "/admin/payment-settings",
  adminMiddleware,
  qrUpload,
  updatePaymentSettings
);


// =========================================================
// ADMIN - MEMBERSHIP APPLICATIONS
// =========================================================


// =========================================================
// GET ALL MEMBERSHIPS
// GET /api/membership/admin
// =========================================================
//
// Admin can see:
//
// - User
// - User information
// - Membership plan
// - Amount
// - UTR number
// - Payment status
// - Membership status
// - Start date
// - Expiry date
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllMemberships
);


// =========================================================
// GET SINGLE MEMBERSHIP
// GET /api/membership/admin/:id
// =========================================================

router.get(
  "/admin/:id",
  adminMiddleware,
  getMembershipById
);


// =========================================================
// ADMIN - PAYMENT VERIFICATION
// =========================================================


// =========================================================
// MARK PAYMENT RECEIVED
// PUT /api/membership/admin/:id/payment-received
// =========================================================
//
// Admin checks the UTR/payment and confirms:
//
// PAYMENT RECEIVED
//
// This changes:
//
// payment_status
//      ↓
// received
//
// IMPORTANT:
//
// Membership is NOT automatically approved.
//
// Admin must separately approve membership.
//
// =========================================================

router.put(
  "/admin/:id/payment-received",
  adminMiddleware,
  markPaymentReceived
);


// =========================================================
// MARK PAYMENT NOT RECEIVED
// PUT /api/membership/admin/:id/payment-not-received
// =========================================================
//
// Changes:
//
// payment_status
//      ↓
// not_received
//
// Membership remains pending.
//
// =========================================================

router.put(
  "/admin/:id/payment-not-received",
  adminMiddleware,
  markPaymentNotReceived
);


// =========================================================
// ADMIN - APPROVE MEMBERSHIP
// =========================================================


// =========================================================
// APPROVE MEMBERSHIP
// PUT /api/membership/admin/:id/approve
// =========================================================
//
// Requirements:
//
// 1. Membership status must be pending
// 2. UTR number must exist
// 3. Payment must be received
//
// Then:
//
// - Generate membership number
// - Set membership start date
// - Calculate expiry date
// - Generate verification QR
// - Set membership status approved
//
// =========================================================

router.put(
  "/admin/:id/approve",
  adminMiddleware,
  approveMembership
);


// =========================================================
// ADMIN - REJECT MEMBERSHIP
// =========================================================


// =========================================================
// REJECT MEMBERSHIP
// PUT /api/membership/admin/:id/reject
// =========================================================
//
// Example body:
//
// {
//   "reason": "Payment could not be verified"
// }
//
// =========================================================

router.put(
  "/admin/:id/reject",
  adminMiddleware,
  rejectMembership
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;