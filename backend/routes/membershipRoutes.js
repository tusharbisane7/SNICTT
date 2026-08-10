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
// USER
// =========================================================

router.get(
  "/me",
  authMiddleware,
  getMyMembership
);

router.post(
  "/apply",
  authMiddleware,
  applyMembership
);

// =========================================================
// ADMIN
// =========================================================

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllMemberships
);

router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getMembershipById
);

router.put(
  "/admin/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveMembership
);

router.put(
  "/admin/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectMembership
);

module.exports = router;