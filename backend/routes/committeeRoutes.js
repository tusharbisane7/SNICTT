const express = require("express");

const {
  getCommitteeMembers,
  getCommitteeByName,
  getAllCommitteeMembers,
  getCommitteeMemberById,
  addCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
} = require("../controllers/committeeController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const committeeUpload =
  require("../middleware/committeeUpload");

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// GET /api/committees
router.get(
  "/",
  getCommitteeMembers
);

// =========================================================
// ADMIN ROUTES
// IMPORTANT:
// These must come before /:committeeName
// =========================================================

// GET /api/committees/admin
router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllCommitteeMembers
);

// GET /api/committees/admin/member/:id
router.get(
  "/admin/member/:id",
  authMiddleware,
  adminMiddleware,
  getCommitteeMemberById
);

// =========================================================
// ADD COMMITTEE MEMBER
//
// POST /api/committees/admin
//
// Content-Type:
// multipart/form-data
//
// Image field:
// photo
// =========================================================

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  committeeUpload,
  addCommitteeMember
);

// =========================================================
// UPDATE COMMITTEE MEMBER
//
// PUT /api/committees/admin/:id
//
// Image field:
// photo
//
// Image optional.
// =========================================================

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  committeeUpload,
  updateCommitteeMember
);

// =========================================================
// DELETE COMMITTEE MEMBER
//
// DELETE /api/committees/admin/:id
// =========================================================

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteCommitteeMember
);

// =========================================================
// PUBLIC COMMITTEE BY NAME
//
// Examples:
//
// GET /api/committees/placement
// GET /api/committees/academic
// GET /api/committees/compliance
// GET /api/committees/working
//
// MUST remain after admin routes.
// =========================================================

router.get(
  "/:committeeName",
  getCommitteeByName
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;