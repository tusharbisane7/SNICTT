const pool = require("../config/db");

// =========================================================
// SUBMIT CONTACT ENQUIRY
// POST /api/contact
// =========================================================

const createContactEnquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, subject and message are required.",
      });
    }

    // -------------------------------------------------------
    // INSERT
    // -------------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO contact_enquiries
      (
        name,
        email,
        phone,
        subject,
        message
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        name.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        subject,
        message.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Your enquiry has been submitted successfully.",
      enquiry: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Create contact enquiry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit enquiry.",
    });
  }
};


// =========================================================
// ADMIN - GET ALL ENQUIRIES
// GET /api/contact/admin
// =========================================================

const getAllContactEnquiries = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM contact_enquiries
      ORDER BY created_at DESC
      `
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      enquiries: result.rows,
    });

  } catch (error) {
    console.error(
      "Get contact enquiries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch contact enquiries.",
    });
  }
};


// =========================================================
// ADMIN - GET SINGLE ENQUIRY
// GET /api/contact/admin/:id
// =========================================================

const getContactEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM contact_enquiries
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Contact enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      enquiry: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Get contact enquiry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch contact enquiry.",
    });
  }
};


// =========================================================
// ADMIN - UPDATE STATUS
// PUT /api/contact/admin/:id/status
// =========================================================

const updateContactEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "read",
      "replied",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid enquiry status.",
      });
    }

    const result = await pool.query(
      `
      UPDATE contact_enquiries
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Contact enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Enquiry status updated successfully.",
      enquiry: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Update contact enquiry status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update enquiry status.",
    });
  }
};


// =========================================================
// ADMIN - DELETE ENQUIRY
// DELETE /api/contact/admin/:id
// =========================================================

const deleteContactEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM contact_enquiries
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Contact enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Contact enquiry deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete contact enquiry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete contact enquiry.",
    });
  }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createContactEnquiry,
  getAllContactEnquiries,
  getContactEnquiryById,
  updateContactEnquiryStatus,
  deleteContactEnquiry,
};