const express = require("express");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  logoutUser,
} = require("../controllers/authController");

const authMiddleware =
  require("../middleware/authMiddleware");

const router = express.Router();


// =========================================================
// PUBLIC ROUTES
// =========================================================

// Signup
router.post(
  "/signup",
  registerUser
);


// Login
router.post(
  "/login",
  loginUser
);


// Forgot password
router.post(
  "/forgot-password",
  forgotPassword
);


// Reset password
router.post(
  "/reset-password",
  resetPassword
);


// =========================================================
// PROTECTED ROUTES
// =========================================================

// Get profile
router.get(
  "/profile",
  authMiddleware,
  getProfile
);


// Update profile
router.put(
  "/profile",
  authMiddleware,
  updateProfile
);


// Change password
router.put(
  "/change-password",
  authMiddleware,
  changePassword
);


// Logout
router.post(
  "/logout",
  authMiddleware,
  logoutUser
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;