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
  deleteProfilePhoto,
  logoutUser,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const uploadProfile = require("../middleware/uploadProfile");

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
// REGISTER / SIGNUP
// POST /api/auth/register
//
// Content-Type:
// multipart/form-data
//
// Profile image field:
// profileImage
// =========================================================

router.post(
  "/register",
  uploadProfile.single("profileImage"),
  registerUser
);


// =========================================================
// OLD SIGNUP ROUTE
// POST /api/auth/signup
//
// Kept for backward compatibility.
// =========================================================

router.post(
  "/signup",
  uploadProfile.single("profileImage"),
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
// PROTECTED USER ROUTES
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
// Profile image field:
// profileImage
//
// Allows updating:
// - Full name
// - Username
// - Email
// - Mobile
// - Age
// - Sex
// - Address
// - Blood group
// - Designation
// - Bio
// - Profile image
// =========================================================

router.put(
  "/profile",
  authMiddleware,
  uploadProfile.single("profileImage"),
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