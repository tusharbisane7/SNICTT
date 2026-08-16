const pool = require("../config/db");

// =========================================================
// HELPER FUNCTIONS
// =========================================================

// ---------------------------------------------------------
// MASK AADHAAR
// ---------------------------------------------------------
//
// Example:
//
// 123456789012
//
// becomes:
//
// XXXX XXXX 9012
//
// We do NOT expose the complete Aadhaar number.
// ---------------------------------------------------------

const maskAadhaar = (aadhaar) => {
  if (!aadhaar) {
    return "";
  }

  const clean = String(aadhaar).replace(/\D/g, "");

  if (clean.length < 4) {
    return "XXXX XXXX";
  }

  const lastFour = clean.slice(-4);

  return `XXXX XXXX ${lastFour}`;
};


// =========================================================
// FORMAT MEMBER RESPONSE
// =========================================================
//
// Keeps sensitive fields out of the API response.
//
// =========================================================

const formatMember = (member) => {

  if (!member) {
    return null;
  }

  return {
    id: member.id,

    full_name:
      member.full_name || "",

    username:
      member.username || "",

    email:
      member.email || "",

    mobile:
      member.mobile || "",

    age:
      member.age ?? null,

    sex:
      member.sex || "",

    address:
      member.address || "",

    blood_group:
      member.blood_group || "",

    designation:
      member.designation || "",

    bio:
      member.bio || "",

    profile_image_url:
      member.profile_image_url || "",

    // Never send complete Aadhaar
    aadhaar_last4:
      member.aadhaar_number
        ? String(member.aadhaar_number)
            .replace(/\D/g, "")
            .slice(-4)
        : "",

    aadhaar_masked:
      maskAadhaar(
        member.aadhaar_number
      ),

    created_at:
      member.created_at,

    updated_at:
      member.updated_at,
  };
};


// =========================================================
// GET ALL MEMBERS
// =========================================================
//
// GET /api/admin/members
//
// ADMIN ONLY
//
// Returns:
//
// - Basic member information
// - Designation
// - Bio
// - Profile image
// - Masked Aadhaar
//
// =========================================================

const getAllMembers = async (
  req,
  res
) => {

  try {

    const result =
      await pool.query(`
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
          designation,
          bio,
          profile_image_url,
          aadhaar_number,
          created_at,
          updated_at
        FROM users
        ORDER BY created_at DESC
      `);


    const members =
      result.rows.map(
        formatMember
      );


    return res.json({

      success: true,

      members,

    });

  } catch (error) {

    console.error(
      "Get all members error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch members",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// =========================================================
// GET SINGLE MEMBER
// =========================================================
//
// GET /api/admin/members/:id
//
// ADMIN ONLY
//
// =========================================================

const getMemberById = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    if (!id) {

      return res.status(400).json({

        success: false,

        message:
          "Member ID is required",

      });

    }


    const result =
      await pool.query(
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
          designation,
          bio,
          profile_image_url,
          aadhaar_number,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Member not found",

      });

    }


    return res.json({

      success: true,

      member:
        formatMember(
          result.rows[0]
        ),

    });

  } catch (error) {

    console.error(
      "Get member error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch member",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// =========================================================
// UPDATE MEMBER
// =========================================================
//
// PUT /api/admin/members/:id
//
// ADMIN ONLY
//
// Supported:
//
// fullName
// username
// email
// mobile
// age
// sex
// address
// bloodGroup
// designation
// bio
// profileImageUrl
// aadhaarNumber
//
// =========================================================

const updateMember = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    if (!id) {

      return res.status(400).json({

        success: false,

        message:
          "Member ID is required",

      });

    }


    const {

      fullName,
      username,
      email,
      mobile,
      age,
      sex,
      address,
      bloodGroup,
      designation,
      bio,
      profileImageUrl,
      aadhaarNumber,

    } = req.body;


    // =====================================================
    // REQUIRED FIELDS
    // =====================================================

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

        message:
          "All required member fields are required",

      });

    }


    // =====================================================
    // NORMALIZE
    // =====================================================

    const cleanFullName =
      String(fullName)
        .trim();


    const cleanUsername =
      String(username)
        .trim()
        .toLowerCase();


    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();


    const cleanMobile =
      String(mobile)
        .replace(/\D/g, "");


    const cleanSex =
      String(sex)
        .trim();


    const cleanAddress =
      String(address)
        .trim();


    const cleanBloodGroup =
      String(bloodGroup)
        .trim();


    const cleanDesignation =
      String(
        designation || ""
      ).trim();


    const cleanBio =
      String(
        bio || ""
      ).trim();


    const cleanProfileImageUrl =
      String(
        profileImageUrl || ""
      ).trim();


    const cleanAadhaar =
      String(
        aadhaarNumber || ""
      )
        .replace(/\D/g, "");


    const numericAge =
      Number(age);


    // =====================================================
    // USERNAME VALIDATION
    // =====================================================

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


    // =====================================================
    // EMAIL VALIDATION
    // =====================================================

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Please enter a valid email",

      });

    }


    // =====================================================
    // MOBILE VALIDATION
    // =====================================================

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


    // =====================================================
    // AGE VALIDATION
    // =====================================================

    if (
      !Number.isInteger(
        numericAge
      ) ||
      numericAge < 1 ||
      numericAge > 120
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Please enter a valid age",

      });

    }


    // =====================================================
    // BIO VALIDATION
    // =====================================================

    if (
      cleanBio.length > 300
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Bio must not exceed 300 characters",

      });

    }


    // =====================================================
    // DESIGNATION VALIDATION
    // =====================================================

    if (
      cleanDesignation.length > 100
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Designation must not exceed 100 characters",

      });

    }


    // =====================================================
    // AADHAAR VALIDATION
    // =====================================================

    if (
      cleanAadhaar &&
      !/^[0-9]{12}$/.test(
        cleanAadhaar
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Aadhaar number must contain exactly 12 digits",

      });

    }


    // =====================================================
    // CHECK MEMBER EXISTS
    // =====================================================

    const memberExists =
      await pool.query(
        `
        SELECT
          id
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );


    if (
      memberExists.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Member not found",

      });

    }


    // =====================================================
    // CHECK DUPLICATES
    // =====================================================

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


    if (
      duplicate.rows.length > 0
    ) {

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


    // =====================================================
    // UPDATE MEMBER
    // =====================================================

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
          designation = $9,
          bio = $10,
          profile_image_url = $11,
          aadhaar_number = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13

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
          designation,
          bio,
          profile_image_url,
          aadhaar_number,
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
          cleanDesignation || null,
          cleanBio || null,
          cleanProfileImageUrl || null,
          cleanAadhaar || null,
          id,
        ]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Member not found",

      });

    }


    return res.json({

      success: true,

      message:
        "Member updated successfully",

      member:
        formatMember(
          result.rows[0]
        ),

    });

  } catch (error) {

    console.error(
      "Update member error:",
      error
    );


    // PostgreSQL unique constraint
    if (
      error.code === "23505"
    ) {

      return res.status(409).json({

        success: false,

        message:
          "Username, email, mobile or another unique member field already exists",

      });

    }


    return res.status(500).json({

      success: false,

      message:
        "Unable to update member",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// =========================================================
// DELETE MEMBER
// =========================================================
//
// DELETE /api/admin/members/:id
//
// ADMIN ONLY
//
// =========================================================

const deleteMember = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    if (!id) {

      return res.status(400).json({

        success: false,

        message:
          "Member ID is required",

      });

    }


    // =====================================================
    // CHECK MEMBER
    // =====================================================

    const existing =
      await pool.query(
        `
        SELECT
          id,
          full_name
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );


    if (
      existing.rows.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Member not found",

      });

    }


    // =====================================================
    // DELETE
    // =====================================================

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


    // =====================================================
    // FOREIGN KEY PROTECTION
    // =====================================================

    if (
      error.code === "23503"
    ) {

      return res.status(409).json({

        success: false,

        message:
          "This member cannot be deleted because related records exist.",

      });

    }


    return res.status(500).json({

      success: false,

      message:
        "Unable to delete member",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// =========================================================
// MEMBER STATISTICS
// =========================================================
//
// GET /api/admin/members/stats
//
// ADMIN ONLY
//
// =========================================================

const getMemberStats = async (
  req,
  res
) => {

  try {

    const result =
      await pool.query(`
        SELECT
          COUNT(*)::INTEGER
          AS total_members
        FROM users
      `);


    return res.json({

      success: true,

      stats: {

        totalMembers:
          result.rows[0]
            .total_members,

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

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

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