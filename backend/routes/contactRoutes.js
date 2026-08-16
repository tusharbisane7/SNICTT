const express = require("express");

const {
  createContactEnquiry,
  getAllContactEnquiries,
  getContactEnquiryById,
  updateContactEnquiryStatus,
  deleteContactEnquiry,
} = require("../controllers/contactController");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();


// =========================================================
// PUBLIC
// =========================================================

// POST /api/contact
// Anyone can submit an enquiry.

router.post(
  "/",
  createContactEnquiry
);


// =========================================================
// ADMIN
// =========================================================

// GET /api/contact/admin
router.get(
  "/admin",
  adminMiddleware,
  getAllContactEnquiries
);


// GET /api/contact/admin/:id
router.get(
  "/admin/:id",
  adminMiddleware,
  getContactEnquiryById
);


// PUT /api/contact/admin/:id/status
router.put(
  "/admin/:id/status",
  adminMiddleware,
  updateContactEnquiryStatus
);


// DELETE /api/contact/admin/:id
router.delete(
  "/admin/:id",
  adminMiddleware,
  deleteContactEnquiry
);


module.exports = router;