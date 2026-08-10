const express = require("express");

const {
  getMyMembership,
  applyMembership,
  getAllMemberships,
  getMembershipById,
  approveMembership,
  rejectMembership,
} = require("../controllers/membershipController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =========================================================
// USER MEMBERSHIP
// =========================================================

// GET /api/membership/me
router.get(
  "/me",
  authMiddleware,
  getMyMembership
);

// POST /api/membership/apply
router.post(
  "/apply",
  authMiddleware,
  applyMembership
);

// =========================================================
// ADMIN MEMBERSHIP
// IMPORTANT:
// Admin routes use ONLY adminMiddleware.
// =========================================================

// GET /api/membership/admin
router.get(
  "/admin",
  adminMiddleware,
  getAllMemberships
);

// GET /api/membership/admin/:id
router.get(
  "/admin/:id",
  adminMiddleware,
  getMembershipById
);

// PUT /api/membership/admin/:id/approve
router.put(
  "/admin/:id/approve",
  adminMiddleware,
  approveMembership
);

// PUT /api/membership/admin/:id/reject
router.put(
  "/admin/:id/reject",
  adminMiddleware,
  rejectMembership
);

module.exports = router;