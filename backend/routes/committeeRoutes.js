const express = require("express");

// =========================================================
// CONTROLLERS
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

const adminMiddleware =
  require("../middleware/adminMiddleware");

const committeeUpload =
  require("../middleware/committeeUpload");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// ---------------------------------------------------------
// GET ALL ACTIVE COMMITTEE MEMBERS
//
// GET /api/committees
//
// Public
// ---------------------------------------------------------

router.get(
  "/",
  getCommitteeMembers
);

// =========================================================
// ADMIN ROUTES
//
// IMPORTANT:
//
// Admin authentication uses the admin token.
// Therefore DO NOT use authMiddleware here.
//
// adminMiddleware is responsible for validating:
//
// snict_admin_token
//
// These routes must remain before:
//
// /:committeeName
// =========================================================

// ---------------------------------------------------------
// GET ALL COMMITTEE MEMBERS
//
// GET /api/committees/admin
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin",
  adminMiddleware,
  getAllCommitteeMembers
);

// ---------------------------------------------------------
// GET SINGLE COMMITTEE MEMBER
//
// GET /api/committees/admin/member/:id
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin/member/:id",
  adminMiddleware,
  getCommitteeMemberById
);

// =========================================================
// ADD COMMITTEE MEMBER
// =========================================================
//
// POST /api/committees/admin
//
// Content-Type:
//
// multipart/form-data
//
// Image field:
//
// photo
//
// ADMIN ONLY
// =========================================================

router.post(
  "/admin",
  adminMiddleware,
  committeeUpload,
  addCommitteeMember
);

// =========================================================
// UPDATE COMMITTEE MEMBER
// =========================================================
//
// PUT /api/committees/admin/:id
//
// Content-Type:
//
// multipart/form-data
//
// Image field:
//
// photo
//
// Image is optional.
//
// ADMIN ONLY
// =========================================================

router.put(
  "/admin/:id",
  adminMiddleware,
  committeeUpload,
  updateCommitteeMember
);

// =========================================================
// DELETE COMMITTEE MEMBER
// =========================================================
//
// DELETE /api/committees/admin/:id
//
// ADMIN ONLY
// =========================================================

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteCommitteeMember
);

// =========================================================
// PUBLIC COMMITTEE BY NAME
// =========================================================
//
// NEW COMMITTEE STRUCTURE:
//
// 1. COMMERCIAL COURSE DIRECTOR FACULTY
// 2. OFFICE BEARERS
// 3. ORGANIZING COMMITTEE
// 4. SCIENTIFIC COMMITTEE
//
// PUBLIC API:
//
// GET /api/committees/commercial-course-director-faculty
// GET /api/committees/office-bearers
// GET /api/committees/organizing-committee
// GET /api/committees/scientific-committee
//
// Backward-compatible:
//
// GET /api/committees/placement
// GET /api/committees/working
// GET /api/committees/academic
// GET /api/committees/compliance
//
// MUST remain after all /admin routes.
// =========================================================

router.get(
  "/:committeeName",
  getCommitteeByName
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;