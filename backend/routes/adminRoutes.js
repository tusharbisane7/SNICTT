const express = require("express");


// =========================================================
// ADMIN CONTROLLER
// =========================================================

const {
  adminLogin,
  adminLogout,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require("../controllers/adminController");


// =========================================================
// USER MANAGEMENT CONTROLLER
// =========================================================

const {
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberStats,
} = require("../controllers/userManagementController");


// =========================================================
// ADMIN MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");


// =========================================================
// ROUTER
// =========================================================

const router =
  express.Router();


// =========================================================
// PUBLIC ADMIN ROUTES
// =========================================================


// ---------------------------------------------------------
// ADMIN LOGIN
// POST /api/admin/login
// ---------------------------------------------------------

router.post(
  "/login",
  adminLogin
);


// =========================================================
// PROTECTED ADMIN ROUTES
// =========================================================


// ---------------------------------------------------------
// GET ADMIN PROFILE
// GET /api/admin/profile
// ---------------------------------------------------------

router.get(
  "/profile",
  adminMiddleware,
  getAdminProfile
);


// ---------------------------------------------------------
// UPDATE ADMIN PROFILE
// PUT /api/admin/profile
// ---------------------------------------------------------

router.put(
  "/profile",
  adminMiddleware,
  updateAdminProfile
);


// ---------------------------------------------------------
// CHANGE ADMIN PASSWORD
// PUT /api/admin/change-password
// ---------------------------------------------------------

router.put(
  "/change-password",
  adminMiddleware,
  changeAdminPassword
);


// ---------------------------------------------------------
// ADMIN LOGOUT
// POST /api/admin/logout
// ---------------------------------------------------------

router.post(
  "/logout",
  adminMiddleware,
  adminLogout
);


// =========================================================
// MEMBER / USER MANAGEMENT
// =========================================================


// ---------------------------------------------------------
// GET MEMBER STATISTICS
// GET /api/admin/members/stats
// ---------------------------------------------------------

router.get(
  "/members/stats",
  adminMiddleware,
  getMemberStats
);


// ---------------------------------------------------------
// GET ALL MEMBERS
// GET /api/admin/members
// ---------------------------------------------------------

router.get(
  "/members",
  adminMiddleware,
  getAllMembers
);


// ---------------------------------------------------------
// GET SINGLE MEMBER
// GET /api/admin/members/:id
// ---------------------------------------------------------

router.get(
  "/members/:id",
  adminMiddleware,
  getMemberById
);


// ---------------------------------------------------------
// UPDATE MEMBER
// PUT /api/admin/members/:id
// ---------------------------------------------------------

router.put(
  "/members/:id",
  adminMiddleware,
  updateMember
);


// ---------------------------------------------------------
// DELETE MEMBER
// DELETE /api/admin/members/:id
// ---------------------------------------------------------

router.delete(
  "/members/:id",
  adminMiddleware,
  deleteMember
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;