const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const pool = require("../config/db");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const {
  generateOtp,
  hashOtp,
} = require("../utils/generateOtp");

// =========================================================
// HELPERS
// =========================================================

const createExpiry = () => {
  const expiry = new Date();

  expiry.setMinutes(
    expiry.getMinutes() + 10
  );

  return expiry;
};

// =========================================================
// AUTH COOKIE
// =========================================================

const setAuthCookie = (
  res,
  token
) => {
  res.cookie(
    "snict_token",
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
};

// =========================================================
// CLEAN USER
// =========================================================

const cleanUser = (
  user
) => {
  return {
    id: user.id,

    fullName:
      user.full_name,

    username:
      user.username,

    email:
      user.email,

    mobile:
      user.mobile,

    age:
      user.age,

    sex:
      user.sex,

    address:
      user.address,

    bloodGroup:
      user.blood_group,

    createdAt:
      user.created_at,
  };
};

// =========================================================
// SAFE OTP COMPARISON
// =========================================================

const safeHashCompare = (
  hashA,
  hashB
) => {
  if (
    !hashA ||
    !hashB
  ) {
    return false;
  }

  const a =
    Buffer.from(
      String(hashA),
      "utf8"
    );

  const b =
    Buffer.from(
      String(hashB),
      "utf8"
    );

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    a,
    b
  );
};

// =========================================================
// CHECK USERNAME
// =========================================================

const checkUsername =
  async (
    req,
    res
  ) => {
    try {
      const username =
        String(
          req.query.username ||
            ""
        )
          .trim()
          .toLowerCase();

      // Empty username
      if (!username) {
        return res.json({
          success: true,

          available: false,

          message:
            "Enter a username",

          suggestions: [],
        });
      }

      // Username format
      if (
        !/^[a-z0-9_]{3,20}$/.test(
          username
        )
      ) {
        return res.json({
          success: true,

          available: false,

          message:
            "Username must be 3-20 characters and contain only letters, numbers and underscore",

          suggestions: [],
        });
      }

      // Check database
      const result =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE username = $1
          LIMIT 1
          `,
          [
            username,
          ]
        );

      // Available
      if (
        result.rows.length ===
        0
      ) {
        return res.json({
          success: true,

          available: true,

          message:
            "Username available",

          suggestions: [],
        });
      }

      // Suggestions
      const suggestions = [
        `${username}_01`,
        `${username}_2026`,
        `${username}123`,
        `${username}_official`,
      ];

      return res.json({
        success: true,

        available: false,

        message:
          "Username already taken",

        suggestions,
      });

    } catch (error) {
      console.error(
        "Check username error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to check username",
      });
    }
  };

// =========================================================
// SIGNUP
// EMAIL VERIFICATION REMOVED
// =========================================================

const registerUser =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const {
        fullName,
        username,
        email,
        mobile,
        password,
        age,
        sex,
        address,
        bloodGroup,
      } = req.body;

      // =====================================================
      // REQUIRED FIELDS
      // =====================================================

      if (
        !fullName ||
        !username ||
        !email ||
        !mobile ||
        !password ||
        age === undefined ||
        age === null ||
        !sex ||
        !address ||
        !bloodGroup
      ) {
        return res.status(400).json({
          success: false,

          message:
            "All fields are required",
        });
      }

      // =====================================================
      // NORMALIZE
      // =====================================================

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedUsername =
        String(username)
          .trim()
          .toLowerCase();

      const normalizedMobile =
        String(mobile).replace(
          /\D/g,
          ""
        );

      // =====================================================
      // MOBILE VALIDATION
      // =====================================================

      if (
        !/^[0-9]{10}$/.test(
          normalizedMobile
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please enter a valid 10-digit mobile number",
        });
      }

      // =====================================================
      // USERNAME VALIDATION
      // =====================================================

      if (
        !/^[a-z0-9_]{3,20}$/.test(
          normalizedUsername
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

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please enter a valid email",
        });
      }

      // =====================================================
      // PASSWORD VALIDATION
      // =====================================================

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Password must be at least 8 characters",
        });
      }

      // =====================================================
      // AGE VALIDATION
      // =====================================================

      const numericAge =
        Number(age);

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
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );

      // =====================================================
      // CHECK EXISTING USER
      // =====================================================

      const existingUser =
        await client.query(
          `
          SELECT
            id,
            username,
            email,
            mobile
          FROM users
          WHERE
            email = $1
            OR username = $2
            OR mobile = $3
          `,
          [
            normalizedEmail,
            normalizedUsername,
            normalizedMobile,
          ]
        );

      if (
        existingUser.rows.length >
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        const existing =
          existingUser.rows[0];

        if (
          existing.email ===
          normalizedEmail
        ) {
          return res.status(409).json({
            success: false,

            message:
              "Email already registered",
          });
        }

        if (
          existing.username ===
          normalizedUsername
        ) {
          return res.status(409).json({
            success: false,

            message:
              "Username already taken",
          });
        }

        if (
          existing.mobile ===
          normalizedMobile
        ) {
          return res.status(409).json({
            success: false,

            message:
              "Mobile number already registered",
          });
        }
      }

      // =====================================================
      // HASH PASSWORD
      // =====================================================

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      // =====================================================
      // INSERT USER
      // =====================================================

      const result =
        await client.query(
          `
          INSERT INTO users
          (
            full_name,
            username,
            email,
            mobile,
            password_hash,
            age,
            sex,
            address,
            blood_group
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
            $8,
            $9
          )
          RETURNING *
          `,
          [
            String(
              fullName
            ).trim(),

            normalizedUsername,

            normalizedEmail,

            normalizedMobile,

            passwordHash,

            numericAge,

            String(
              sex
            ).trim(),

            String(
              address
            ).trim(),

            String(
              bloodGroup
            ).trim(),
          ]
        );

      // =====================================================
      // COMMIT
      // =====================================================

      await client.query(
        "COMMIT"
      );

      return res.status(201).json({
        success: true,

        message:
          "Account created successfully",

        email:
          normalizedEmail,

        user:
          cleanUser(
            result.rows[0]
          ),
      });

    } catch (error) {

      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (
        rollbackError
      ) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }

      console.error(
        "Signup error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create account",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? {
                error:
                  error.message,

                code:
                  error.code,

                detail:
                  error.detail,

                constraint:
                  error.constraint,
              }
            : undefined,
      });

    } finally {

      client.release();

    }
  };

// =========================================================
// LOGIN
// =========================================================

const loginUser =
  async (
    req,
    res
  ) => {

    try {

      const {
        identifier,
        password,
      } = req.body;

      if (
        !identifier ||
        !password
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Username/email and password are required",
        });
      }

      const normalizedIdentifier =
        String(identifier)
          .trim()
          .toLowerCase();

      const result =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE
            email = $1
            OR username = $1
          LIMIT 1
          `,
          [
            normalizedIdentifier,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(401).json({
          success: false,

          message:
            "Invalid username/email or password",
        });
      }

      const user =
        result.rows[0];

      // =====================================================
      // PASSWORD
      // =====================================================

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (
        !passwordMatch
      ) {
        return res.status(401).json({
          success: false,

          message:
            "Invalid username/email or password",
        });
      }

      // =====================================================
      // GENERATE TOKEN
      // =====================================================

      const token =
        generateToken(
          user.id
        );

      setAuthCookie(
        res,
        token
      );

      return res.json({
        success: true,

        message:
          "Login successful",

        user:
          cleanUser(user),
      });

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to login",
      });
    }
  };

// =========================================================
// FORGOT PASSWORD
// =========================================================

const forgotPassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        email,
      } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,

          message:
            "Email is required",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const result =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
          LIMIT 1
          `,
          [
            normalizedEmail,
          ]
        );

      // Do not reveal whether account exists
      if (
        result.rows.length ===
        0
      ) {
        return res.json({
          success: true,

          message:
            "If an account exists, a reset OTP has been sent.",
        });
      }

      const user =
        result.rows[0];

      // =====================================================
      // GENERATE OTP
      // =====================================================

      const otp =
        generateOtp();

      const otpHash =
        hashOtp(
          String(otp)
        );

      const otpExpiry =
        createExpiry();

      // =====================================================
      // SAVE OTP
      // =====================================================

      await pool.query(
        `
        UPDATE users
        SET
          reset_otp_hash = $1,
          reset_otp_expires = $2,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [
          otpHash,
          otpExpiry,
          user.id,
        ]
      );

      // =====================================================
      // SEND EMAIL
      // =====================================================

      await sendEmail(
        user.email,

        "SNICT Password Reset OTP",

        `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          "
        >

          <h2
            style="
              color: #087ea4;
            "
          >
            Reset your SNICT password
          </h2>

          <p>
            We received a request
            to reset your password.
          </p>

          <p>
            Your password reset OTP is:
          </p>

          <div
            style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px;
              background: #eefaff;
              text-align: center;
              color: #087ea4;
              margin: 20px 0;
            "
          >
            ${otp}
          </div>

          <p>
            This OTP expires in
            10 minutes.
          </p>

          <p>
            If you did not request
            a password reset,
            you can safely ignore
            this email.
          </p>

        </div>
        `
      );

      return res.json({
        success: true,

        message:
          "If an account exists, a reset OTP has been sent.",
      });

    } catch (error) {

      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to process password reset",
      });
    }
  };

// =========================================================
// RESET PASSWORD
// =========================================================

const resetPassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        email,
        otp,
        newPassword,
      } = req.body;

      if (
        !email ||
        !otp ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Email, OTP and new password are required",
        });
      }

      if (
        newPassword.length <
        8
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Password must be at least 8 characters",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const result =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
          LIMIT 1
          `,
          [
            normalizedEmail,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid reset request",
        });
      }

      const user =
        result.rows[0];

      if (
        !user.reset_otp_hash ||
        !user.reset_otp_expires
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Reset OTP not available",
        });
      }

      if (
        new Date() >
        new Date(
          user.reset_otp_expires
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Reset OTP has expired",
        });
      }

      const otpHash =
        hashOtp(
          String(otp).trim()
        );

      if (
        !safeHashCompare(
          otpHash,
          user.reset_otp_hash
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid reset OTP",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await pool.query(
        `
        UPDATE users
        SET
          password_hash = $1,
          reset_otp_hash = NULL,
          reset_otp_expires = NULL,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          passwordHash,
          user.id,
        ]
      );

      // Remove login cookie
      res.clearCookie(
        "snict_token",
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
          "Password reset successfully. Please login again.",
      });

    } catch (error) {

      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to reset password",
      });
    }
  };

// =========================================================
// CHANGE PASSWORD
// =========================================================

const changePassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Current and new passwords are required",
        });
      }

      if (
        newPassword.length <
        8
      ) {
        return res.status(400).json({
          success: false,

          message:
            "New password must be at least 8 characters",
        });
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "New password must be different from current password",
        });
      }

      const result =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [
            req.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      const user =
        result.rows[0];

      const valid =
        await bcrypt.compare(
          currentPassword,
          user.password_hash
        );

      if (!valid) {
        return res.status(400).json({
          success: false,

          message:
            "Current password is incorrect",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await pool.query(
        `
        UPDATE users
        SET
          password_hash = $1,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          passwordHash,
          user.id,
        ]
      );

      return res.json({
        success: true,

        message:
          "Password changed successfully",
      });

    } catch (error) {

      console.error(
        "Change password error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to change password",
      });
    }
  };

// =========================================================
// GET PROFILE
// =========================================================

const getProfile =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [
            req.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      return res.json({
        success: true,

        user:
          cleanUser(
            result.rows[0]
          ),
      });

    } catch (error) {

      console.error(
        "Profile error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch profile",
      });
    }
  };

// =========================================================
// UPDATE PROFILE
// =========================================================

const updateProfile =
  async (
    req,
    res
  ) => {

    try {

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
            "All profile fields are required",
        });
      }

      // =====================================================
      // NORMALIZE
      // =====================================================

      const cleanFullName =
        String(fullName).trim();

      const normalizedUsername =
        String(username)
          .trim()
          .toLowerCase();

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const cleanMobile =
        String(mobile).replace(
          /\D/g,
          ""
        );

      const cleanAddress =
        String(address).trim();

      const cleanSex =
        String(sex).trim();

      const cleanBloodGroup =
        String(bloodGroup).trim();

      const numericAge =
        Number(age);

      // =====================================================
      // AGE
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
      // USERNAME
      // =====================================================

      if (
        !/^[a-z0-9_]{3,20}$/.test(
          normalizedUsername
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Username must be 3-20 characters and contain only letters, numbers and underscore",
        });
      }

      // =====================================================
      // EMAIL
      // =====================================================

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please enter a valid email",
        });
      }

      // =====================================================
      // MOBILE
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
      // CHECK DUPLICATES
      // =====================================================

      const existingUser =
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
            normalizedUsername,
            normalizedEmail,
            cleanMobile,
            req.userId,
          ]
        );

      if (
        existingUser.rows.length >
        0
      ) {

        const existing =
          existingUser.rows[0];

        if (
          existing.username ===
          normalizedUsername
        ) {
          return res.status(409).json({
            success: false,

            message:
              "Username already taken",
          });
        }

        if (
          existing.email ===
          normalizedEmail
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
      // UPDATE
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
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $9
          RETURNING *
          `,
          [
            cleanFullName,
            normalizedUsername,
            normalizedEmail,
            cleanMobile,
            numericAge,
            cleanSex,
            cleanAddress,
            cleanBloodGroup,
            req.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      return res.json({
        success: true,

        message:
          "Profile updated successfully",

        user:
          cleanUser(
            result.rows[0]
          ),
      });

    } catch (error) {

      console.error(
        "Update profile error:",
        error
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Code:",
        error.code
      );

      console.error(
        "Detail:",
        error.detail
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update profile",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? {
                error:
                  error.message,

                code:
                  error.code,

                detail:
                  error.detail,
              }
            : undefined,
      });
    }
  };

// =========================================================
// LOGOUT
// =========================================================

const logoutUser =
  (
    req,
    res
  ) => {

    res.clearCookie(
      "snict_token",
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
        "Logged out successfully",
    });
  };

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  registerUser,
  checkUsername,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  logoutUser,
};