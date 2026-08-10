const pool = require("../config/db");


// =========================================================
// ADMIN - GET EXPENSES
// GET /api/admin/expenses
// =========================================================

const getExpenses = async (
  req,
  res
) => {

  try {

    const result =
      await pool.query(
        `
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
        `
      );

    return res.json({
      success: true,
      expenses:
        result.rows,
    });

  } catch (error) {

    console.error(
      "Get expenses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch expenses",
    });
  }
};


// =========================================================
// ADMIN - CREATE EXPENSE
// POST /api/admin/expenses
// =========================================================

const createExpense = async (
  req,
  res
) => {

  try {

    const {
      eventId,
      title,
      category,
      amount,
      description,
      proofUrl,
    } = req.body;

    if (
      !eventId ||
      !title ||
      amount === undefined
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Event, title and amount are required",
      });
    }

    const event =
      await pool.query(
        `
        SELECT id
        FROM events
        WHERE id = $1
        LIMIT 1
        `,
        [eventId]
      );

    if (
      event.rows.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Event not found",
      });
    }

    const result =
      await pool.query(
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
          $1,$2,$3,$4,$5,$6
        )
        RETURNING *
        `,
        [
          eventId,
          title.trim(),
          category || null,
          Number(amount),
          description || null,
          proofUrl || null,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Expense added successfully",
      expense:
        result.rows[0],
    });

  } catch (error) {

    console.error(
      "Create expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create expense",
    });
  }
};


// =========================================================
// ADMIN - UPDATE EXPENSE
// PUT /api/admin/expenses/:id
// =========================================================

const updateExpense = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;

    const {
      eventId,
      title,
      category,
      amount,
      description,
      proofUrl,
    } = req.body;

    const result =
      await pool.query(
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
          title?.trim() || null,
          category || null,
          amount !== undefined
            ? Number(amount)
            : null,
          description || null,
          proofUrl || null,
          id,
        ]
      );

    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Expense not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Expense updated successfully",
      expense:
        result.rows[0],
    });

  } catch (error) {

    console.error(
      "Update expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update expense",
    });
  }
};


// =========================================================
// ADMIN - DELETE EXPENSE
// DELETE /api/admin/expenses/:id
// =========================================================

const deleteExpense = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;

    const result =
      await pool.query(
        `
        DELETE FROM event_expenses
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Expense not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Expense deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete expense",
    });
  }
};


// =========================================================
// ADMIN - EVENT FINANCIALS
// GET /api/admin/expenses/event/:eventId/summary
// =========================================================

const getEventFinancials =
async (
  req,
  res
) => {

  try {

    const { eventId } =
      req.params;

    const eventResult =
      await pool.query(
        `
        SELECT
          id,
          title,
          price
        FROM events
        WHERE id = $1
        `,
        [eventId]
      );

    if (
      eventResult.rows.length === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Event not found",
      });
    }

    const revenueResult =
      await pool.query(
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

    const expenseResult =
      await pool.query(
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

    const revenue =
      Number(
        revenueResult.rows[0].revenue
      );

    const expenses =
      Number(
        expenseResult.rows[0].expenses
      );

    return res.json({
      success: true,

      event:
        eventResult.rows[0],

      financials: {
        revenue,
        expenses,
        netIncome:
          revenue - expenses,
        bookings:
          Number(
            revenueResult.rows[0].bookings
          ),
      },
    });

  } catch (error) {

    console.error(
      "Event financials error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to calculate event financials",
    });
  }
};


module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getEventFinancials,
};