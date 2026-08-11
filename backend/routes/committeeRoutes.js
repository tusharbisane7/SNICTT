const express = require("express");

const router = express.Router();

// =========================================================
// CONTROLLER
// =========================================================

const {
  getCommitteeMembers,
  getCommitteeByName,
  getAllCommitteeMembers,
  getCommitteeMemberById,
  addCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
} = require("../controllers/committeeController");

// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const committeeUpload =
  require("../middleware/committeeUpload");

// =========================================================
// PUBLIC ROUTES
// =========================================================

// ---------------------------------------------------------
// Get all active committee members
// GET /api/committees
// ---------------------------------------------------------

router.get(
  "/",
  getCommitteeMembers
);

// =========================================================
// ADMIN ROUTES
// IMPORTANT:
// Admin routes MUST come BEFORE /:committeeName
// =========================================================

// ---------------------------------------------------------
// Get all committee members
// GET /api/committees/admin
// ---------------------------------------------------------

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllCommitteeMembers
);

// ---------------------------------------------------------
// Get single committee member
// GET /api/committees/admin/member/:id
// ---------------------------------------------------------

router.get(
  "/admin/member/:id",
  authMiddleware,
  adminMiddleware,
  getCommitteeMemberById
);

// ---------------------------------------------------------
// Add committee member
// POST /api/committees/admin
//
// Content-Type:
// multipart/form-data
//
// File field:
// photo
// ---------------------------------------------------------

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  committeeUpload,
  addCommitteeMember
);

// ---------------------------------------------------------
// Update committee member
// PUT /api/committees/admin/:id
//
// Content-Type:
// multipart/form-data
//
// File field:
// photo
// ---------------------------------------------------------

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  committeeUpload,
  updateCommitteeMember
);

// ---------------------------------------------------------
// Delete committee member
// DELETE /api/committees/admin/:id
// ---------------------------------------------------------

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteCommitteeMember
);

// =========================================================
// PUBLIC COMMITTEE ROUTE
// =========================================================

// ---------------------------------------------------------
// Get members by committee
//
// GET /api/committees/placement
// GET /api/committees/academic
// GET /api/committees/compliance
// GET /api/committees/working
//
// IMPORTANT:
// Keep this route AFTER all /admin routes.
// ---------------------------------------------------------

router.get(
  "/:committeeName",
  getCommitteeByName
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;