const express = require("express");

const {
  getCommitteeMembers,
  getAllCommitteeMembers,
  addCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
} = require("../controllers/committeeController");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();

// =========================================================
// PUBLIC
// =========================================================

// Public committee members
router.get(
  "/",
  getCommitteeMembers
);

// =========================================================
// ADMIN ONLY
// =========================================================

// Get all committee members
router.get(
  "/admin",
  adminMiddleware,
  getAllCommitteeMembers
);

// Add committee member
router.post(
  "/",
  adminMiddleware,
  addCommitteeMember
);

// Update committee member
router.put(
  "/:id",
  adminMiddleware,
  updateCommitteeMember
);

// Delete committee member
router.delete(
  "/:id",
  adminMiddleware,
  deleteCommitteeMember
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;