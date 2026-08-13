const express = require("express");

// =========================================================
// CONTROLLERS
// =========================================================

const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getEventFinancials,
} = require("../controllers/expenseController");

// =========================================================
// ADMIN MIDDLEWARE
// =========================================================

const adminMiddleware =
  require("../middleware/adminMiddleware");

// =========================================================
// ROUTER
// =========================================================

const router = express.Router();

// =========================================================
// ADMIN EXPENSE ROUTES
// =========================================================
//
// IMPORTANT:
// Expense management is an ADMIN-only module.
//
// Admin authentication uses:
// snict_admin_token
//
// Therefore:
// DO NOT use authMiddleware here.
//
// adminMiddleware handles admin authentication.
// =========================================================


// =========================================================
// GET ALL EXPENSES
// GET /api/admin/expenses
// =========================================================

router.get(
  "/",
  adminMiddleware,
  getExpenses
);


// =========================================================
// CREATE EXPENSE
// POST /api/admin/expenses
// =========================================================

router.post(
  "/",
  adminMiddleware,
  createExpense
);


// =========================================================
// UPDATE EXPENSE
// PUT /api/admin/expenses/:id
// =========================================================

router.put(
  "/:id",
  adminMiddleware,
  updateExpense
);


// =========================================================
// DELETE EXPENSE
// DELETE /api/admin/expenses/:id
// =========================================================

router.delete(
  "/:id",
  adminMiddleware,
  deleteExpense
);


// =========================================================
// EVENT FINANCIAL SUMMARY
// GET /api/admin/expenses/event/:eventId/summary
// =========================================================

router.get(
  "/event/:eventId/summary",
  adminMiddleware,
  getEventFinancials
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;