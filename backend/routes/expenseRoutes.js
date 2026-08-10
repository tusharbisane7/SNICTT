const express = require("express");

const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getEventFinancials,
} = require("../controllers/expenseController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router =
  express.Router();


// =========================================================
// ALL EXPENSE ROUTES ARE ADMIN ONLY
// =========================================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getExpenses
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createExpense
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateExpense
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteExpense
);

router.get(
  "/event/:eventId/summary",
  authMiddleware,
  adminMiddleware,
  getEventFinancials
);


module.exports =
  router;