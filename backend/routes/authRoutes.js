const express = require("express");


// =========================================================
// CONTROLLERS
// =========================================================

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


// =========================================================
// MIDDLEWARE
// =========================================================

const authMiddleware =
  require("../middleware/authMiddleware");


// =========================================================
// FILE UPLOAD MIDDLEWARE
// =========================================================
//
// This is your EXISTING middleware.
//
// It has been updated to support:
//
// profileImage
// aadhaarCard
//
// It uses:
//
// upload.fields([
//   {
//     name: "profileImage",
//     maxCount: 1
//   },
//   {
//     name: "aadhaarCard",
//     maxCount: 1
//   }
// ])
//
// IMPORTANT:
//
// Do NOT require uploadRegistration.js.
// It does not exist in your project.
//
// =========================================================

const uploadProfile =
  require("../middleware/uploadProfile");


// =========================================================
// ROUTER
// =========================================================

const router =
  express.Router();


// =========================================================
// PUBLIC ROUTES
// =========================================================


// =========================================================
// CHECK USERNAME
//
// GET /api/auth/check-username?username=test
// =========================================================

router.get(
  "/check-username",
  checkUsername
);


// =========================================================
// GET ALL REGISTERED MEMBERS
//
// GET /api/auth/members
//
// NOTE:
//
// Currently public because your existing route
// was public.
//
// For production, this should ideally be protected
// using adminMiddleware.
// =========================================================

router.get(
  "/members",
  getMembers
);


// =========================================================
// REGISTER
//
// POST /api/auth/register
//
// Content-Type:
//
// multipart/form-data
//
// Text fields:
//
// fullName
// username
// email
// mobile
// password
// age
// sex
// address
// bloodGroup
// designation
// bio
// aadhaarNumber
// signupWithMembership
//
// Files:
//
// profileImage
// aadhaarCard
//
// =========================================================

router.post(
  "/register",
  uploadProfile,
  registerUser
);


// =========================================================
// SIGNUP
//
// POST /api/auth/signup
//
// Main registration route.
//
// Flow:
//
// Signup
//    ↓
// Account Created
//    ↓
// Temporary Authentication Cookie
//    ↓
// Membership Payment Page
//
// Content-Type:
//
// multipart/form-data
//
// Files:
//
// profileImage
// aadhaarCard
//
// =========================================================

router.post(
  "/signup",
  uploadProfile,
  registerUser
);


// =========================================================
// LOGIN
//
// POST /api/auth/login
//
// Body:
//
// {
//   "identifier": "username/email",
//   "password": "password"
// }
//
// =========================================================

router.post(
  "/login",
  loginUser
);


// =========================================================
// FORGOT PASSWORD
//
// POST /api/auth/forgot-password
//
// Body:
//
// {
//   "email": "user@example.com"
// }
//
// =========================================================

router.post(
  "/forgot-password",
  forgotPassword
);


// =========================================================
// RESET PASSWORD
//
// POST /api/auth/reset-password
//
// Body:
//
// {
//   "email": "user@example.com",
//   "otp": "123456",
//   "newPassword": "newpassword"
// }
//
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
//
// GET /api/auth/profile
//
// Returns:
//
// - User details
// - Membership information
// - Aadhaar last 4 digits
//
// SECURITY:
//
// Complete Aadhaar number is NOT returned.
// Aadhaar document URL is NOT returned.
//
// =========================================================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);


// =========================================================
// UPDATE PROFILE
//
// PUT /api/auth/profile
//
// Content-Type:
//
// multipart/form-data
//
// Text fields:
//
// fullName
// mobile
// age
// sex
// address
// bloodGroup
// designation
// bio
// aadhaarNumber
//
// Files:
//
// profileImage
// aadhaarCard
//
// Bio:
//
// Maximum 300 characters
//
// Aadhaar:
//
// Exactly 12 digits
//
// =========================================================

router.put(
  "/profile",
  authMiddleware,
  uploadProfile,
  updateProfile
);


// =========================================================
// DELETE PROFILE PHOTO
//
// DELETE /api/auth/profile/photo
//
// =========================================================

router.delete(
  "/profile/photo",
  authMiddleware,
  deleteProfilePhoto
);


// =========================================================
// CHANGE PASSWORD
//
// PUT /api/auth/change-password
//
// Body:
//
// {
//   "currentPassword": "...",
//   "newPassword": "..."
// }
//
// =========================================================

router.put(
  "/change-password",
  authMiddleware,
  changePassword
);


// =========================================================
// LOGOUT
//
// POST /api/auth/logout
//
// =========================================================

router.post(
  "/logout",
  authMiddleware,
  logoutUser
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;