const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const generateAdminToken =
  require("../utils/generateAdminToken");


// =========================================================
// ADMIN LOGIN
// =========================================================

const adminLogin = async (
  req,
  res
) => {

  try {

    const {
      username,
      password,
    } = req.body;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !username ||
      !password
    ) {

      return res.status(400).json({
        success: false,

        message:
          "Username and password are required",
      });

    }


    const normalizedUsername =
      String(username)
        .trim()
        .toLowerCase();


    // =====================================================
    // FIND ADMIN
    // =====================================================

    const result =
      await pool.query(
        `
        SELECT

          id,

          username,

          password_hash,

          name,

          email,

          mobile,

          role,

          created_at,

          updated_at

        FROM admins

        WHERE username = $1

        LIMIT 1
        `,
        [
          normalizedUsername,
        ]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(401).json({
        success: false,

        message:
          "Invalid admin username or password",
      });

    }


    const admin =
      result.rows[0];


    // =====================================================
    // CHECK PASSWORD
    // =====================================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password_hash
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,

        message:
          "Invalid admin username or password",
      });

    }


    // =====================================================
    // GENERATE ADMIN TOKEN
    // =====================================================

    const token =
      generateAdminToken(
        admin.id
      );


    // =====================================================
    // SET ADMIN COOKIE
    // =====================================================

    res.cookie(
      "snict_admin_token",
      token,
      {

        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,

        path: "/",

      }
    );


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({

      success: true,

      message:
        "Admin login successful",

      admin: {

        id:
          admin.id,

        username:
          admin.username,

        name:
          admin.name ||
          "Administrator",

        email:
          admin.email ||
          "",

        mobile:
          admin.mobile ||
          "",

        role:
          admin.role ||
          "admin",

        createdAt:
          admin.created_at,

        updatedAt:
          admin.updated_at,

      },

    });


  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to login as admin",

    });

  }

};


// =========================================================
// ADMIN LOGOUT
// =========================================================

const adminLogout = (
  req,
  res
) => {

  res.clearCookie(
    "snict_admin_token",
    {

      httpOnly: true,

      sameSite: "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      path: "/",

    }
  );


  return res.json({

    success: true,

    message:
      "Admin logged out successfully",

  });

};


// =========================================================
// GET ADMIN PROFILE
// GET /api/admin/profile
// =========================================================

const getAdminProfile =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            id,

            username,

            name,

            email,

            mobile,

            role,

            created_at,

            updated_at

          FROM admins

          WHERE id = $1

          LIMIT 1
          `,
          [
            req.adminId,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Admin not found",

        });

      }


      const admin =
        result.rows[0];


      return res.json({

        success: true,

        admin: {

          id:
            admin.id,

          username:
            admin.username,

          name:
            admin.name ||
            "Administrator",

          email:
            admin.email ||
            "",

          mobile:
            admin.mobile ||
            "",

          role:
            admin.role ||
            "admin",

          createdAt:
            admin.created_at,

          updatedAt:
            admin.updated_at,

        },

      });


    } catch (error) {

      console.error(
        "Get admin profile error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch admin profile",

      });

    }

  };


// =========================================================
// UPDATE ADMIN PROFILE
// PUT /api/admin/profile
// =========================================================

const updateAdminProfile =
  async (
    req,
    res
  ) => {

    try {

      const adminId =
        req.adminId;


      const {
        name,
        username,
        email,
        mobile,
      } = req.body;


      // ===================================================
      // CLEAN INPUT
      // ===================================================

      const cleanName =
        String(
          name || ""
        ).trim();


      const cleanUsername =
        String(
          username || ""
        )
          .trim()
          .toLowerCase();


      const cleanEmail =
        String(
          email || ""
        ).trim();


      const cleanMobile =
        String(
          mobile || ""
        ).trim();


      // ===================================================
      // VALIDATE NAME
      // ===================================================

      if (!cleanName) {

        return res.status(400).json({

          success: false,

          message:
            "Name is required.",

        });

      }


      // ===================================================
      // VALIDATE USERNAME
      // ===================================================

      if (!cleanUsername) {

        return res.status(400).json({

          success: false,

          message:
            "Username is required.",

        });

      }


      if (
        cleanUsername.length <
        3
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Username must be at least 3 characters.",

        });

      }


      // ===================================================
      // CHECK EXISTING USERNAME
      // ===================================================

      const existingUsername =
        await pool.query(
          `
          SELECT
            id

          FROM admins

          WHERE username = $1

            AND id <> $2

          LIMIT 1
          `,
          [
            cleanUsername,
            adminId,
          ]
        );


      if (
        existingUsername.rows.length >
        0
      ) {

        return res.status(409).json({

          success: false,

          message:
            "This username is already in use.",

        });

      }


      // ===================================================
      // UPDATE ADMIN
      // ===================================================

      const result =
        await pool.query(
          `
          UPDATE admins

          SET

            name = $1,

            username = $2,

            email = $3,

            mobile = $4,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $5

          RETURNING

            id,

            username,

            name,

            email,

            mobile,

            role,

            created_at,

            updated_at
          `,
          [
            cleanName,

            cleanUsername,

            cleanEmail ||
              null,

            cleanMobile ||
              null,

            adminId,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Admin not found.",

        });

      }


      const admin =
        result.rows[0];


      // ===================================================
      // RESPONSE
      // ===================================================

      return res.json({

        success: true,

        message:
          "Admin profile updated successfully.",

        admin: {

          id:
            admin.id,

          username:
            admin.username,

          name:
            admin.name ||
            "Administrator",

          email:
            admin.email ||
            "",

          mobile:
            admin.mobile ||
            "",

          role:
            admin.role ||
            "admin",

          createdAt:
            admin.created_at,

          updatedAt:
            admin.updated_at,

        },

      });


    } catch (error) {

      console.error(
        "Update admin profile error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to update admin profile",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// CHANGE ADMIN PASSWORD
// PUT /api/admin/change-password
// =========================================================

const changeAdminPassword =
  async (
    req,
    res
  ) => {

    try {

      const adminId =
        req.adminId;


      const {
        currentPassword,
        newPassword,
      } = req.body;


      // ===================================================
      // VALIDATE CURRENT PASSWORD
      // ===================================================

      if (!currentPassword) {

        return res.status(400).json({

          success: false,

          message:
            "Current password is required.",

        });

      }


      // ===================================================
      // VALIDATE NEW PASSWORD
      // ===================================================

      if (!newPassword) {

        return res.status(400).json({

          success: false,

          message:
            "New password is required.",

        });

      }


      if (
        newPassword.length <
        8
      ) {

        return res.status(400).json({

          success: false,

          message:
            "New password must be at least 8 characters.",

        });

      }


      // ===================================================
      // GET ADMIN PASSWORD
      // ===================================================

      const result =
        await pool.query(
          `
          SELECT

            id,

            password_hash

          FROM admins

          WHERE id = $1

          LIMIT 1
          `,
          [
            adminId,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Admin account not found.",

        });

      }


      const admin =
        result.rows[0];


      // ===================================================
      // VERIFY CURRENT PASSWORD
      // ===================================================

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          admin.password_hash
        );


      if (!passwordMatch) {

        return res.status(401).json({

          success: false,

          message:
            "Current password is incorrect.",

        });

      }


      // ===================================================
      // PREVENT SAME PASSWORD
      // ===================================================

      const samePassword =
        await bcrypt.compare(
          newPassword,
          admin.password_hash
        );


      if (samePassword) {

        return res.status(400).json({

          success: false,

          message:
            "New password must be different from your current password.",

        });

      }


      // ===================================================
      // HASH NEW PASSWORD
      // ===================================================

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          12
        );


      // ===================================================
      // UPDATE PASSWORD
      // ===================================================

      await pool.query(
        `
        UPDATE admins

        SET

          password_hash = $1,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $2
        `,
        [
          hashedPassword,

          adminId,
        ]
      );


      // ===================================================
      // RESPONSE
      // ===================================================

      return res.json({

        success: true,

        message:
          "Admin password changed successfully.",

      });


    } catch (error) {

      console.error(
        "Change admin password error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to change admin password",

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

  adminLogin,

  adminLogout,

  getAdminProfile,

  updateAdminProfile,

  changeAdminPassword,

};