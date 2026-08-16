const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  getSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  toggleSlider,
} = require("../controllers/sliderController");

// =========================================================
// MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

const sliderUpload =
  require("../middleware/sliderUpload");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// ---------------------------------------------------------
// GET PUBLISHED SLIDERS
//
// GET /api/sliders
//
// No authentication required.
// ---------------------------------------------------------

router.get(
  "/",
  getSliders
);

// =========================================================
// ADMIN ROUTES
//
// IMPORTANT:
//
// Admin authentication uses:
//
// snict_admin_token
//
// Therefore DO NOT use authMiddleware here.
//
// adminMiddleware is responsible for validating
// the admin authentication.
// =========================================================

// ---------------------------------------------------------
// GET ALL SLIDERS
//
// GET /api/sliders/admin/all
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin/all",
  adminMiddleware,
  getAllSliders
);

// ---------------------------------------------------------
// GET SINGLE SLIDER
//
// GET /api/sliders/admin/:id
//
// ADMIN ONLY
// ---------------------------------------------------------

router.get(
  "/admin/:id",
  adminMiddleware,
  getSliderById
);

// =========================================================
// CREATE SLIDER
// =========================================================
//
// POST /api/sliders/admin
//
// Content-Type:
// multipart/form-data
//
// FormData:
//
// image
// title
// description
// slideDate
// displayOrder
// published
//
// =========================================================

router.post(
  "/admin",
  adminMiddleware,
  sliderUpload,
  createSlider
);

// =========================================================
// UPDATE SLIDER
// =========================================================
//
// PUT /api/sliders/admin/:id
//
// Image is optional.
//
// If image is selected:
//     upload new image
//     update Cloudinary URL
//
// If image is not selected:
//     keep existing image
//
// =========================================================

router.put(
  "/admin/:id",
  adminMiddleware,
  sliderUpload,
  updateSlider
);

// =========================================================
// DELETE SLIDER
// =========================================================
//
// DELETE /api/sliders/admin/:id
//
// ADMIN ONLY
// =========================================================

router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteSlider
);

// =========================================================
// TOGGLE SLIDER
// =========================================================
//
// PATCH /api/sliders/admin/:id/toggle
//
// ADMIN ONLY
// =========================================================

router.patch(
  "/admin/:id/toggle",
  adminMiddleware,
  toggleSlider
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;