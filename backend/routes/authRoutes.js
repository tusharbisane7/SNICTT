const express = require("express");

const {
  registerUser,
  checkUsername,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  getMembers,
  deleteProfilePhoto,
  logoutUser,
} = require("../controllers/authController");

const authMiddleware =
  require("../middleware/authMiddleware");

const uploadProfile =
  require("../middleware/uploadProfile");

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// =========================================================
// CHECK USERNAME
// GET /api/auth/check-username?username=test
// =========================================================

router.get(
  "/check-username",
  checkUsername
);

// =========================================================
// GET ALL REGISTERED MEMBERS
// GET /api/auth/members
// =========================================================

router.get(
  "/members",
  getMembers
);

// =========================================================
// REGISTER
// POST /api/auth/register
//
// Content-Type:
// multipart/form-data
//
// Image field:
// profileImage
//
// IMPORTANT:
// uploadProfile already contains
// upload.single("profileImage")
// =========================================================

router.post(
  "/register",
  uploadProfile,
  registerUser
);

// =========================================================
// SIGNUP
// POST /api/auth/signup
// =========================================================

router.post(
  "/signup",
  uploadProfile,
  registerUser
);

// =========================================================
// LOGIN
// POST /api/auth/login
// =========================================================

router.post(
  "/login",
  loginUser
);

// =========================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =========================================================

router.post(
  "/forgot-password",
  forgotPassword
);

// =========================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// =========================================================

router.post(
  "/reset-password",
  resetPassword
);

// =========================================================
// PROTECTED ROUTES
// =========================================================

// =========================================================
// GET PROFILE
// GET /api/auth/profile
// =========================================================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

// =========================================================
// UPDATE PROFILE
// PUT /api/auth/profile
//
// Content-Type:
// multipart/form-data
//
// Image field:
// profileImage
// =========================================================

router.put(
  "/profile",
  authMiddleware,
  uploadProfile,
  updateProfile
);

// =========================================================
// DELETE PROFILE PHOTO
// DELETE /api/auth/profile/photo
// =========================================================

router.delete(
  "/profile/photo",
  authMiddleware,
  deleteProfilePhoto
);

// =========================================================
// CHANGE PASSWORD
// PUT /api/auth/change-password
// =========================================================

router.put(
  "/change-password",
  authMiddleware,
  changePassword
);

// =========================================================
// LOGOUT
// POST /api/auth/logout
// =========================================================

router.post(
  "/logout",
  authMiddleware,
  logoutUser
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;