const pool = require("../config/db");

// =========================================================
// GET ALL COMMITTEE MEMBERS
// PUBLIC
// =========================================================

const getCommitteeMembers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        committee_name,
        member_name,
        designation,
        qualification,
        photo_url,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM committee_members
      WHERE is_active = TRUE
      ORDER BY
        committee_name ASC,
        display_order ASC,
        id ASC
      `
    );

    return res.json({
      success: true,
      members: result.rows,
    });

  } catch (error) {
    console.error(
      "Get committee members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch committee members",
    });
  }
};

// =========================================================
// GET ALL MEMBERS INCLUDING INACTIVE
// ADMIN
// =========================================================

const getAllCommitteeMembers = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        committee_name,
        member_name,
        designation,
        qualification,
        photo_url,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM committee_members
      ORDER BY
        committee_name ASC,
        display_order ASC,
        id ASC
      `
    );

    return res.json({
      success: true,
      members: result.rows,
    });

  } catch (error) {
    console.error(
      "Get all committee members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch committee members",
    });
  }
};

// =========================================================
// ADD MEMBER
// =========================================================

const addCommitteeMember = async (
  req,
  res
) => {
  try {
    const {
      committeeName,
      memberName,
      designation,
      qualification,
      photoUrl,
      displayOrder,
      isActive,
    } = req.body;

    if (
      !committeeName ||
      !memberName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Committee name and member name are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO committee_members
      (
        committee_name,
        member_name,
        designation,
        qualification,
        photo_url,
        display_order,
        is_active,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        String(committeeName).trim(),

        String(memberName).trim(),

        designation
          ? String(designation).trim()
          : null,

        qualification
          ? String(qualification).trim()
          : null,

        photoUrl
          ? String(photoUrl).trim()
          : null,

        Number.isInteger(
          Number(displayOrder)
        )
          ? Number(displayOrder)
          : 0,

        isActive !== false,
      ]
    );

    return res.status(201).json({
      success: true,

      message:
        "Committee member added successfully",

      member: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Add committee member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to add committee member",
    });
  }
};

// =========================================================
// UPDATE MEMBER
// =========================================================

const updateCommitteeMember = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      committeeName,
      memberName,
      designation,
      qualification,
      photoUrl,
      displayOrder,
      isActive,
    } = req.body;

    if (
      !committeeName ||
      !memberName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Committee name and member name are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE committee_members
      SET
        committee_name = $1,
        member_name = $2,
        designation = $3,
        qualification = $4,
        photo_url = $5,
        display_order = $6,
        is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
      `,
      [
        String(committeeName).trim(),

        String(memberName).trim(),

        designation
          ? String(designation).trim()
          : null,

        qualification
          ? String(qualification).trim()
          : null,

        photoUrl
          ? String(photoUrl).trim()
          : null,

        Number.isInteger(
          Number(displayOrder)
        )
          ? Number(displayOrder)
          : 0,

        isActive !== false,

        id,
      ]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Committee member not found",
      });
    }

    return res.json({
      success: true,

      message:
        "Committee member updated successfully",

      member: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Update committee member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update committee member",
    });
  }
};

// =========================================================
// DELETE MEMBER
// =========================================================

const deleteCommitteeMember = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM committee_members
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
          "Committee member not found",
      });
    }

    return res.json({
      success: true,

      message:
        "Committee member deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete committee member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete committee member",
    });
  }
};

module.exports = {
  getCommitteeMembers,
  getAllCommitteeMembers,
  addCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
};