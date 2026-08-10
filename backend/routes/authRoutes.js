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
  logoutUser,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

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
// =========================================================

router.post(
  "/register",
  registerUser
);

// =========================================================
// OLD SIGNUP ROUTE
// POST /api/auth/signup
//
// Kept for backward compatibility so existing frontend
// code using /signup will continue to work.
// =========================================================

router.post(
  "/signup",
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
// =========================================================

router.put(
  "/profile",
  authMiddleware,
  updateProfile
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