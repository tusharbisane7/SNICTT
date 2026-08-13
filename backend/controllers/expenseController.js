const pool = require("../config/db");

// =========================================================
// ADMIN - GET EXPENSES
// GET /api/admin/expenses
// =========================================================

const getExpenses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ex.id,
        ex.event_id,
        ex.title,
        ex.category,
        ex.amount,
        ex.description,
        ex.proof_url,
        ex.created_at,

        e.title AS event_title

      FROM event_expenses ex

      INNER JOIN events e
        ON e.id = ex.event_id

      ORDER BY
        ex.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      expenses: result.rows,
      total: result.rows.length,
    });

  } catch (error) {
    console.error("========================================");
    console.error("GET EXPENSES ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("Table:", error.table);
    console.error("Column:", error.column);
    console.error("Constraint:", error.constraint);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to fetch expenses",

      debug:
        process.env.NODE_ENV !== "production"
          ? {
              message: error.message || null,
              code: error.code || null,
              detail: error.detail || null,
              hint: error.hint || null,
              table: error.table || null,
              column: error.column || null,
              constraint: error.constraint || null,
            }
          : undefined,
    });
  }
};


// =========================================================
// ADMIN - CREATE EXPENSE
// POST /api/admin/expenses
// =========================================================

const createExpense = async (req, res) => {
  try {
    const {
      eventId,
      title,
      category,
      amount,
      description,
      proofUrl,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event is required",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense title is required",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Expense amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid expense amount",
      });
    }

    // =====================================================
    // CHECK EVENT
    // =====================================================

    const eventResult = await pool.query(
      `
      SELECT
        id,
        title
      FROM events
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =====================================================
    // CREATE EXPENSE
    // =====================================================

    const result = await pool.query(
      `
      INSERT INTO event_expenses (
        event_id,
        title,
        category,
        amount,
        description,
        proof_url
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING *
      `,
      [
        eventId,
        String(title).trim(),
        category
          ? String(category).trim()
          : null,
        numericAmount,
        description
          ? String(description).trim()
          : null,
        proofUrl
          ? String(proofUrl).trim()
          : null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense: result.rows[0],
    });

  } catch (error) {
    console.error("========================================");
    console.error("CREATE EXPENSE ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("Table:", error.table);
    console.error("Column:", error.column);
    console.error("Constraint:", error.constraint);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to create expense",

      debug:
        process.env.NODE_ENV !== "production"
          ? {
              message: error.message || null,
              code: error.code || null,
              detail: error.detail || null,
              hint: error.hint || null,
              table: error.table || null,
              column: error.column || null,
              constraint: error.constraint || null,
            }
          : undefined,
    });
  }
};


// =========================================================
// ADMIN - UPDATE EXPENSE
// PUT /api/admin/expenses/:id
// =========================================================

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      eventId,
      title,
      category,
      amount,
      description,
      proofUrl,
    } = req.body;

    // =====================================================
    // CHECK EXPENSE ID
    // =====================================================

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required",
      });
    }

    // =====================================================
    // CHECK EVENT IF PROVIDED
    // =====================================================

    if (eventId) {
      const eventResult = await pool.query(
        `
        SELECT id
        FROM events
        WHERE id = $1
        LIMIT 1
        `,
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }
    }

    // =====================================================
    // VALIDATE AMOUNT
    // =====================================================

    let numericAmount = null;

    if (
      amount !== undefined &&
      amount !== null &&
      amount !== ""
    ) {
      numericAmount = Number(amount);

      if (
        Number.isNaN(numericAmount) ||
        !Number.isFinite(numericAmount) ||
        numericAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid expense amount",
        });
      }
    }

    // =====================================================
    // UPDATE EXPENSE
    // =====================================================

    const result = await pool.query(
      `
      UPDATE event_expenses
      SET
        event_id = COALESCE($1, event_id),
        title = COALESCE($2, title),
        category = $3,
        amount = COALESCE($4, amount),
        description = $5,
        proof_url = $6,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $7

      RETURNING *
      `,
      [
        eventId || null,

        title !== undefined &&
        title !== null &&
        String(title).trim() !== ""
          ? String(title).trim()
          : null,

        category !== undefined &&
        category !== null &&
        String(category).trim() !== ""
          ? String(category).trim()
          : null,

        numericAmount,

        description !== undefined &&
        description !== null &&
        String(description).trim() !== ""
          ? String(description).trim()
          : null,

        proofUrl !== undefined &&
        proofUrl !== null &&
        String(proofUrl).trim() !== ""
          ? String(proofUrl).trim()
          : null,

        id,
      ]
    );

    // =====================================================
    // NOT FOUND
    // =====================================================

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: result.rows[0],
    });

  } catch (error) {
    console.error("========================================");
    console.error("UPDATE EXPENSE ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("Table:", error.table);
    console.error("Column:", error.column);
    console.error("Constraint:", error.constraint);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to update expense",

      debug:
        process.env.NODE_ENV !== "production"
          ? {
              message: error.message || null,
              code: error.code || null,
              detail: error.detail || null,
              hint: error.hint || null,
              table: error.table || null,
              column: error.column || null,
              constraint: error.constraint || null,
            }
          : undefined,
    });
  }
};


// =========================================================
// ADMIN - DELETE EXPENSE
// DELETE /api/admin/expenses/:id
// =========================================================

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM event_expenses
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      deletedId: result.rows[0].id,
    });

  } catch (error) {
    console.error("========================================");
    console.error("DELETE EXPENSE ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("Table:", error.table);
    console.error("Column:", error.column);
    console.error("Constraint:", error.constraint);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to delete expense",

      debug:
        process.env.NODE_ENV !== "production"
          ? {
              message: error.message || null,
              code: error.code || null,
              detail: error.detail || null,
              hint: error.hint || null,
              table: error.table || null,
              column: error.column || null,
              constraint: error.constraint || null,
            }
          : undefined,
    });
  }
};


// =========================================================
// ADMIN - EVENT FINANCIALS
// GET /api/admin/expenses/event/:eventId/summary
// =========================================================

const getEventFinancials = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // =====================================================
    // EVENT
    // =====================================================

    const eventResult = await pool.query(
      `
      SELECT
        id,
        title,
        price
      FROM events
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =====================================================
    // REVENUE
    // =====================================================

    const revenueResult = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(p.amount),
          0
        ) AS revenue,

        COUNT(
          DISTINCT b.id
        )::INTEGER AS bookings

      FROM event_payments p

      INNER JOIN event_bookings b
        ON b.id = p.booking_id

      WHERE b.event_id = $1
        AND p.payment_status = 'verified'
      `,
      [eventId]
    );

    // =====================================================
    // EXPENSES
    // =====================================================

    const expenseResult = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(amount),
          0
        ) AS expenses

      FROM event_expenses

      WHERE event_id = $1
      `,
      [eventId]
    );

    // =====================================================
    // CALCULATE
    // =====================================================

    const revenue = Number(
      revenueResult.rows[0]?.revenue || 0
    );

    const expenses = Number(
      expenseResult.rows[0]?.expenses || 0
    );

    const bookings = Number(
      revenueResult.rows[0]?.bookings || 0
    );

    const netIncome =
      revenue - expenses;

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      event: eventResult.rows[0],

      financials: {
        revenue,
        expenses,
        netIncome,
        bookings,
      },
    });

  } catch (error) {
    console.error("========================================");
    console.error("EVENT FINANCIALS ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("Table:", error.table);
    console.error("Column:", error.column);
    console.error("Constraint:", error.constraint);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to calculate event financials",

      debug:
        process.env.NODE_ENV !== "production"
          ? {
              message: error.message || null,
              code: error.code || null,
              detail: error.detail || null,
              hint: error.hint || null,
              table: error.table || null,
              column: error.column || null,
              constraint: error.constraint || null,
            }
          : undefined,
    });
  }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getEventFinancials,
};