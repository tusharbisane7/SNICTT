const express = require("express");

const {
  getSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  toggleSlider,
} = require("../controllers/sliderController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const sliderUpload =
  require("../middleware/sliderUpload");

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

// GET /api/sliders
router.get(
  "/",
  getSliders
);

// =========================================================
// ADMIN ROUTES
// =========================================================

// GET /api/sliders/admin/all
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllSliders
);

// GET /api/sliders/admin/:id
router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getSliderById
);

// =========================================================
// CREATE SLIDER
// POST /api/sliders/admin
//
// Content-Type:
// multipart/form-data
//
// Image field:
// image
// =========================================================

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  sliderUpload,
  createSlider
);

// =========================================================
// UPDATE SLIDER
// PUT /api/sliders/admin/:id
//
// Image optional
// =========================================================

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  sliderUpload,
  updateSlider
);

// =========================================================
// DELETE SLIDER
// DELETE /api/sliders/admin/:id
// =========================================================

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteSlider
);

// =========================================================
// TOGGLE SLIDER
// PATCH /api/sliders/admin/:id/toggle
// =========================================================

router.patch(
  "/admin/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleSlider
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;