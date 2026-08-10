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

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();


// =========================================================
// PUBLIC
// =========================================================

// GET ALL ACTIVE COMMITTEE MEMBERS
// GET /api/committees

router.get(
  "/",
  getCommitteeMembers
);


// =========================================================
// ADMIN
// =========================================================

// GET ALL MEMBERS INCLUDING INACTIVE
// GET /api/committees/admin

router.get(
  "/admin",
  adminMiddleware,
  getAllCommitteeMembers
);


// GET SINGLE MEMBER
// GET /api/committees/admin/member/:id

router.get(
  "/admin/member/:id",
  adminMiddleware,
  getCommitteeMemberById
);


// ADD MEMBER
// POST /api/committees/admin

router.post(
  "/admin",
  adminMiddleware,
  addCommitteeMember
);


// UPDATE MEMBER
// PUT /api/committees/admin/:id

router.put(
  "/admin/:id",
  adminMiddleware,
  updateCommitteeMember
);


// DELETE MEMBER
// DELETE /api/committees/admin/:id

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteCommitteeMember
);


// =========================================================
// PUBLIC INDIVIDUAL COMMITTEE
// =========================================================

// Placement
// GET /api/committees/placement

// Academic
// GET /api/committees/academic

// Compliance
// GET /api/committees/compliance

// Working
// GET /api/committees/working

router.get(
  "/:committeeName",
  getCommitteeByName
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;