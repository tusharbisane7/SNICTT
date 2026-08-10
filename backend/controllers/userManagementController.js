const pool = require("../config/db");

// =========================================================
// GET ALL MEMBERS
// GET /api/admin/members
// =========================================================

const getAllMembers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        username,
        email,
        mobile,
        age,
        sex,
        address,
        blood_group,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      members: result.rows,
    });
  } catch (error) {
    console.error("Get all members error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch members",
    });
  }
};


// =========================================================
// GET SINGLE MEMBER
// GET /api/admin/members/:id
// =========================================================

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        username,
        email,
        mobile,
        age,
        sex,
        address,
        blood_group,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.json({
      success: true,
      member: result.rows[0],
    });
  } catch (error) {
    console.error("Get member error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch member",
    });
  }
};


// =========================================================
// UPDATE MEMBER
// PUT /api/admin/members/:id
// =========================================================

const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      username,
      email,
      mobile,
      age,
      sex,
      address,
      bloodGroup,
    } = req.body;

    // -----------------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------------

    if (
      !fullName ||
      !username ||
      !email ||
      !mobile ||
      age === undefined ||
      age === null ||
      !sex ||
      !address ||
      !bloodGroup
    ) {
      return res.status(400).json({
        success: false,
        message: "All member fields are required",
      });
    }

    // -----------------------------------------------------
    // NORMALIZE
    // -----------------------------------------------------

    const cleanFullName =
      String(fullName).trim();

    const cleanUsername =
      String(username)
        .trim()
        .toLowerCase();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const cleanMobile =
      String(mobile).replace(/\D/g, "");

    const cleanSex =
      String(sex).trim();

    const cleanAddress =
      String(address).trim();

    const cleanBloodGroup =
      String(bloodGroup).trim();

    const numericAge = Number(age);

    // -----------------------------------------------------
    // VALIDATE
    // -----------------------------------------------------

    if (
      !/^[a-z0-9_]{3,20}$/.test(
        cleanUsername
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-20 characters and contain only letters, numbers and underscore",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (
      !/^[0-9]{10}$/.test(
        cleanMobile
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit mobile number",
      });
    }

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid age",
      });
    }

    // -----------------------------------------------------
    // CHECK DUPLICATES
    // -----------------------------------------------------

    const duplicate =
      await pool.query(
        `
        SELECT
          id,
          username,
          email,
          mobile
        FROM users
        WHERE
          (
            username = $1
            OR email = $2
            OR mobile = $3
          )
          AND id != $4
        LIMIT 1
        `,
        [
          cleanUsername,
          cleanEmail,
          cleanMobile,
          id,
        ]
      );

    if (duplicate.rows.length > 0) {
      const existing =
        duplicate.rows[0];

      if (
        existing.username ===
        cleanUsername
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Username already taken",
        });
      }

      if (
        existing.email ===
        cleanEmail
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Email already registered",
        });
      }

      if (
        existing.mobile ===
        cleanMobile
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Mobile number already registered",
        });
      }
    }

    // -----------------------------------------------------
    // UPDATE
    // -----------------------------------------------------

    const result =
      await pool.query(
        `
        UPDATE users
        SET
          full_name = $1,
          username = $2,
          email = $3,
          mobile = $4,
          age = $5,
          sex = $6,
          address = $7,
          blood_group = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING
          id,
          full_name,
          username,
          email,
          mobile,
          age,
          sex,
          address,
          blood_group,
          created_at,
          updated_at
        `,
        [
          cleanFullName,
          cleanUsername,
          cleanEmail,
          cleanMobile,
          numericAge,
          cleanSex,
          cleanAddress,
          cleanBloodGroup,
          id,
        ]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.json({
      success: true,
      message: "Member updated successfully",
      member: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update member",
    });
  }
};


// =========================================================
// DELETE MEMBER
// DELETE /api/admin/members/:id
// =========================================================

const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------------
    // CHECK MEMBER
    // -----------------------------------------------------

    const existing =
      await pool.query(
        `
        SELECT id, full_name
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // -----------------------------------------------------
    // DELETE
    // -----------------------------------------------------

    await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [id]
    );

    return res.json({
      success: true,
      message:
        "Member deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete member error:",
      error
    );

    // Foreign-key protection
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This member cannot be deleted because related records exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete member",
    });
  }
};


// =========================================================
// MEMBER STATISTICS
// GET /api/admin/members/stats
// =========================================================

const getMemberStats = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(`
        SELECT
          COUNT(*)::INTEGER AS total_members
        FROM users
      `);

    return res.json({
      success: true,
      stats: {
        totalMembers:
          result.rows[0].total_members,
      },
    });
  } catch (error) {
    console.error(
      "Member stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch member statistics",
    });
  }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberStats,
};