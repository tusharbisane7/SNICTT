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
  // ADMIN - WHATSAPP
  // =======================================================

  resendApprovalWhatsApp,


  // =======================================================
  // ADMIN - MEMBERSHIP PLANS
  // =======================================================

  getAdminMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,


  // =======================================================
  // PAYMENT SETTINGS
  // =======================================================

  getPaymentSettings,
  getPublicPaymentSettings,
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
// multer.memoryStorage()
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
//
// GET /api/membership/me
//
// Authentication:
// USER REQUIRED
//
// =========================================================

router.get(
  "/me",
  authMiddleware,
  getMyMembership
);


// =========================================================
// GET MEMBERSHIP PLANS
//
// GET /api/membership/plans
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
//
// POST /api/membership/apply
//
// Authentication:
// USER REQUIRED
//
// Body:
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
//
// POST /api/membership/payment
//
// Authentication:
// USER REQUIRED
//
// Body:
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
//
// POST /api/membership/renew
//
// Authentication:
// USER REQUIRED
//
// Body:
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
//
// IMPORTANT:
//
// This route MUST remain before:
//
// /admin/:id
//
// It is a different static path and should be
// publicly accessible.
//
// =========================================================


// =========================================================
// VERIFY MEMBERSHIP
//
// GET /api/membership/verify/:membershipNumber
//
// Public route.
//
// Login is NOT required.
//
// Used by membership QR.
//
// =========================================================

router.get(
  "/verify/:membershipNumber",
  verifyMembership
);


// =========================================================
// PUBLIC PAYMENT SETTINGS
// =========================================================
//
// GET /api/membership/payment-settings
//
// Public.
//
// Returns:
//
// - UPI ID
// - Account Name
// - QR Code
//
// Used by membership payment page.
//
// =========================================================

router.get(
  "/payment-settings",
  getPublicPaymentSettings
);


// =========================================================
// ADMIN - MEMBERSHIP PLANS
// =========================================================
//
// IMPORTANT:
//
// These routes MUST remain before:
//
// /admin/:id
//
// Otherwise:
//
// /admin/plans
//
// could potentially be treated as:
//
// /admin/:id
//
// =========================================================


// =========================================================
// GET ALL MEMBERSHIP PLANS
//
// GET /api/membership/admin/plans
//
// ADMIN ONLY
//
// =========================================================

router.get(
  "/admin/plans",
  adminMiddleware,
  getAdminMembershipPlans
);


// =========================================================
// CREATE MEMBERSHIP PLAN
//
// POST /api/membership/admin/plans
//
// ADMIN ONLY
//
// Body:
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
//
// PUT /api/membership/admin/plans/:id
//
// ADMIN ONLY
//
// Body:
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
//
// DELETE /api/membership/admin/plans/:id
//
// ADMIN ONLY
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
//
// GET /api/membership/admin/payment-settings
//
// ADMIN ONLY
//
// =========================================================

router.get(
  "/admin/payment-settings",
  adminMiddleware,
  getPaymentSettings
);


// =========================================================
// UPDATE PAYMENT SETTINGS
//
// PUT /api/membership/admin/payment-settings
//
// ADMIN ONLY
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
// QR upload:
//
// Desktop
//    ↓
// qrUpload
//    ↓
// multer.memoryStorage()
//    ↓
// Cloudinary
//    ↓
// req.file.path
//    ↓
// membershipController
//
// IMPORTANT:
//
// Do NOT use:
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
//
// GET /api/membership/admin
//
// ADMIN ONLY
//
// Returns:
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
// - WhatsApp status
//
// =========================================================

router.get(
  "/admin",
  adminMiddleware,
  getAllMemberships
);


// =========================================================
// GET SINGLE MEMBERSHIP
//
// GET /api/membership/admin/:id
//
// ADMIN ONLY
//
// IMPORTANT:
//
// Keep this AFTER:
//
// /admin/plans
// /admin/payment-settings
//
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
//
// PUT /api/membership/admin/:id/payment-received
//
// ADMIN ONLY
//
// Flow:
//
// Payment submitted
//       ↓
// Admin checks UTR
//       ↓
// Payment received
//       ↓
// Admin approves membership separately
//
// =========================================================

router.put(
  "/admin/:id/payment-received",
  adminMiddleware,
  markPaymentReceived
);


// =========================================================
// MARK PAYMENT NOT RECEIVED
//
// PUT /api/membership/admin/:id/payment-not-received
//
// ADMIN ONLY
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
//
// PUT /api/membership/admin/:id/approve
//
// ADMIN ONLY
//
// Requirements:
//
// 1. Membership status = pending
// 2. UTR number exists
// 3. Payment status = received
//
// Then:
//
// - Generate membership number
// - Generate verification token
// - Generate QR
// - Set start date
// - Set expiry date
// - Set membership status = approved
// - Send WhatsApp approval notification
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
//
// PUT /api/membership/admin/:id/reject
//
// ADMIN ONLY
//
// Body:
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
// ADMIN - RESEND WHATSAPP
// =========================================================
//
// POST /api/membership/admin/:id/whatsapp
//
// ADMIN ONLY
//
// Used when:
//
// - Membership is already approved
// - WhatsApp was not delivered
// - Admin wants to send the approval message again
//
// =========================================================

router.post(
  "/admin/:id/whatsapp",
  adminMiddleware,
  
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;