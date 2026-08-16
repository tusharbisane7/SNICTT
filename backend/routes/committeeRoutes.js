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

const authMiddleware =
  require("../middleware/authMiddleware");

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
// Returns all active members grouped/ordered by committee.
// ---------------------------------------------------------

router.get(
  "/",
  getCommitteeMembers
);


// =========================================================
// ADMIN ROUTES
// IMPORTANT:
//
// These routes MUST remain before:
//
// /:committeeName
//
// Otherwise "admin" can be interpreted as a
// committee name.
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
  authMiddleware,
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
  authMiddleware,
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
// multipart/form-data
//
// Image field:
// photo
//
// ADMIN ONLY
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
// =========================================================
//
// PUT /api/committees/admin/:id
//
// Content-Type:
// multipart/form-data
//
// Image field:
// photo
//
// Image is optional.
//
// ADMIN ONLY
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
// =========================================================
//
// DELETE /api/committees/admin/:id
//
// ADMIN ONLY
// =========================================================

router.delete(
  "/admin/:id",
  authMiddleware,
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
// Recommended API slugs:
//
// GET /api/committees/commercial-course-director-faculty
// GET /api/committees/office-bearers
// GET /api/committees/organizing-committee
// GET /api/committees/scientific-committee
//
// The controller also supports old slugs for
// backward compatibility:
//
// /placement
// /working
// /academic
// /compliance
//
// This route MUST remain after all /admin routes.
// =========================================================

router.get(
  "/:committeeName",
  getCommitteeByName
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;