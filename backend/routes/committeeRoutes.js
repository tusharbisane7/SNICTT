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

// Get all active committee members
// GET /api/committees

router.get(
  "/",
  getCommitteeMembers
);


// Get members by committee
// GET /api/committees/placement
// GET /api/committees/academic
// GET /api/committees/compliance
// GET /api/committees/working

router.get(
  "/:committeeName",
  getCommitteeByName
);


// =========================================================
// ADMIN ROUTES
// =========================================================

// Get all committee members
// GET /api/committees/admin

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllCommitteeMembers
);


// Get single committee member
// GET /api/committees/admin/member/:id

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
// File field:
// photo
//
// IMPORTANT:
// committeeUpload already contains
// upload.single("photo")
//
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
// File field:
// photo
//
// New photo selected:
// old photo will be replaced.
//
// No new photo:
// old photo will remain.
//
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
// =========================================================

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteCommitteeMember
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;