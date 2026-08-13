const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const pool = require("../config/db");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../config/cloudinary");

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
// IMAGE URL / CLOUDINARY HELPERS
// =========================================================

const getImageUrl = (req, imagePath) => {
  if (!imagePath) {
    return null;
  }

  const image = String(imagePath).trim();

  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  const backendUrl = process.env.BACKEND_URL
    ? String(process.env.BACKEND_URL).replace(/\/+$/, "")
    : `${req.protocol}://${req.get("host")}`;

  if (image.startsWith("/")) {
    return `${backendUrl}${image}`;
  }

  return `${backendUrl}/${image}`;
};

// =========================================================
// GET CLOUDINARY PUBLIC ID
// =========================================================

const getCloudinaryPublicId = (
  imageUrl
) => {
  if (!imageUrl) {
    return null;
  }

  const value =
    String(imageUrl).trim();

  if (
    !value.includes("res.cloudinary.com") ||
    !value.includes("/upload/")
  ) {
    return null;
  }

  try {
    const uploadPart =
      value.split("/upload/")[1];

    if (!uploadPart) {
      return null;
    }

    const parts =
      uploadPart
        .split("/")
        .filter(Boolean);

    if (
      parts.length > 0 &&
      /^v\d+$/.test(parts[0])
    ) {
      parts.shift();
    }

    if (!parts.length) {
      return null;
    }

    return parts
      .join("/")
      .replace(/\.[^/.]+$/, "");

  } catch (error) {
    console.error(
      "Cloudinary public ID extraction error:",
      error.message
    );

    return null;
  }
};

// =========================================================
// DELETE CLOUDINARY IMAGE
// =========================================================

const deleteCloudinaryImage =
  async (
    imageUrl
  ) => {

    const publicId =
      getCloudinaryPublicId(
        imageUrl
      );

    if (!publicId) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
          invalidate: true,
        }
      );

    } catch (error) {
      console.error(
        "Cloudinary image delete error:",
        error.message
      );
    }
  };

// =========================================================
// AUTH COOKIE
// =========================================================

const authCookieOptions = {
  httpOnly: true,

  secure:
    process.env.NODE_ENV ===
    "production",

  sameSite:
    process.env.NODE_ENV ===
    "production"
      ? "none"
      : "lax",

  maxAge:
    7 *
    24 *
    60 *
    60 *
    1000,

  path: "/",
};

// =========================================================
// SET AUTH COOKIE
// =========================================================

const setAuthCookie = (
  res,
  token
) => {
  res.cookie(
    "snict_token",
    token,
    authCookieOptions
  );
};

// =========================================================
// BIO WORD COUNT
// =========================================================

const getWordCount = (
  text
) => {
  if (!text) {
    return 0;
  }

  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

// =========================================================
// CLEAN USER
// =========================================================

const cleanUser = (
  user,
  req
) => {
  return {
    id:
      user.id,

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

    profileImageUrl:
      getImageUrl(
        req,
        user.profile_image_url
      ),

    designation:
      user.designation || "",

    bio:
      user.bio || "",

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
// GET /api/auth/check-username
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

      if (!username) {
        return res.json({
          success: true,
          available: false,
          message:
            "Enter a username",
          suggestions: [],
        });
      }

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

      const result =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE username = $1
          LIMIT 1
          `,
          [username]
        );

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
// REGISTER USER
// POST /api/auth/register
// POST /api/auth/signup
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
        designation,
        bio,
      } = req.body;

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

      const cleanDesignation =
        String(
          designation || ""
        ).trim();

      const cleanBio =
        String(
          bio || ""
        ).trim();

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

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters",
        });
      }

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

      if (
        cleanBio &&
        getWordCount(cleanBio) > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bio cannot exceed 100 words",
        });
      }

      await client.query(
        "BEGIN"
      );

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

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      let profileImageUrl =
        null;

      if (req.file) {
        profileImageUrl =
          req.file.path ||
          req.file.secure_url ||
          req.file.url ||
          null;
      }

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
            blood_group,
            profile_image_url,
            designation,
            bio
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
            $9,
            $10,
            $11,
            $12
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

            profileImageUrl,

            cleanDesignation,

            cleanBio,
          ]
        );

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
            result.rows[0],
            req
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
// POST /api/auth/login
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

      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !identifier ||
        !password
      ) {
        return res.status(400).json({
          success: false,

          code:
            "MISSING_CREDENTIALS",

          message:
            "Username/email and password are required",
        });
      }

      const normalizedIdentifier =
        String(identifier)
          .trim()
          .toLowerCase();

      // =====================================================
      // FIND USER
      // =====================================================

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

      // =====================================================
      // WRONG USERNAME / EMAIL
      // =====================================================

      if (
        result.rows.length ===
        0
      ) {
        return res.status(401).json({

          success: false,

          code:
            "INVALID_IDENTIFIER",

          message:
            "Incorrect username or email",
        });
      }

      const user =
        result.rows[0];

      // =====================================================
      // WRONG PASSWORD
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

          code:
            "INVALID_PASSWORD",

          message:
            "Incorrect password",
        });
      }

      // =====================================================
      // MEMBERSHIP CHECK
      // =====================================================

      const membershipResult =
        await pool.query(
          `
          SELECT
            id,
            membership_number,
            membership_type,
            status,
            rejection_reason,
            applied_at,
            approved_at
          FROM memberships
          WHERE user_id = $1
          ORDER BY applied_at DESC
          LIMIT 1
          `,
          [
            user.id,
          ]
        );

      // =====================================================
      // NO MEMBERSHIP
      // =====================================================

      if (
        membershipResult.rows.length ===
        0
      ) {
        return res.status(403).json({

          success: false,

          code:
            "MEMBERSHIP_REQUIRED",

          message:
            "Please apply for membership before logging in.",
        });
      }

      const membership =
        membershipResult.rows[0];

      // =====================================================
      // MEMBERSHIP PENDING
      // =====================================================

      if (
        membership.status ===
        "pending"
      ) {
        return res.status(403).json({

          success: false,

          code:
            "MEMBERSHIP_PENDING",

          message:
            "Please wait for some time. After your membership is approved, you can login.",

          membershipStatus:
            "pending",
        });
      }

      // =====================================================
      // MEMBERSHIP REJECTED
      // =====================================================

      if (
        membership.status ===
        "rejected"
      ) {
        return res.status(403).json({

          success: false,

          code:
            "MEMBERSHIP_REJECTED",

          message:
            membership.rejection_reason
              ? `Your membership application was rejected. Reason: ${membership.rejection_reason}`
              : "Your membership application was rejected. Please apply again.",

          membershipStatus:
            "rejected",

          rejectionReason:
            membership.rejection_reason ||
            null,
        });
      }

      // =====================================================
      // ONLY APPROVED MEMBERS CAN LOGIN
      // =====================================================

      if (
        membership.status !==
        "approved"
      ) {
        return res.status(403).json({

          success: false,

          code:
            "MEMBERSHIP_NOT_APPROVED",

          message:
            "Your membership is not approved yet. You cannot login.",

          membershipStatus:
            membership.status,
        });
      }

      // =====================================================
      // GENERATE TOKEN
      // =====================================================

      const token =
        generateToken(
          user.id
        );

      // =====================================================
      // SET COOKIE
      // =====================================================

      setAuthCookie(
        res,
        token
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      return res.json({

        success: true,

        message:
          "Login successful",

        user:
          cleanUser(
            user,
            req
          ),

        membership: {

          membershipNumber:
            membership.membership_number,

          membershipType:
            membership.membership_type,

          status:
            membership.status,

          approvedAt:
            membership.approved_at,
        },
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
// POST /api/auth/forgot-password
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

      // =====================================================
      // VALIDATION
      // =====================================================

      if (!email) {

        return res.status(400).json({
          success: false,

          message:
            "Email is required",
        });
      }

      // =====================================================
      // NORMALIZE EMAIL
      // =====================================================

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      // =====================================================
      // FIND USER
      // =====================================================

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

      // =====================================================
      // DO NOT REVEAL ACCOUNT EXISTENCE
      // =====================================================

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
// POST /api/auth/reset-password
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

      // =====================================================
      // VALIDATION
      // =====================================================

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

      // =====================================================
      // NORMALIZE EMAIL
      // =====================================================

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      // =====================================================
      // FIND USER
      // =====================================================

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

      // =====================================================
      // CHECK OTP EXISTS
      // =====================================================

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

      // =====================================================
      // CHECK OTP EXPIRY
      // =====================================================

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

      // =====================================================
      // HASH ENTERED OTP
      // =====================================================

      const otpHash =
        hashOtp(
          String(otp).trim()
        );

      // =====================================================
      // COMPARE OTP
      // =====================================================

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

      // =====================================================
      // HASH NEW PASSWORD
      // =====================================================

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      // =====================================================
      // UPDATE PASSWORD
      // =====================================================

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

      // =====================================================
      // CLEAR AUTH COOKIE
      // =====================================================

      res.clearCookie(
        "snict_token",
        authCookieOptions
      );

      // =====================================================
      // RESPONSE
      // =====================================================

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
// PUT /api/auth/change-password
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

      // =====================================================
      // VALIDATION
      // =====================================================

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

      // =====================================================
      // GET USER
      // =====================================================

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

      // =====================================================
      // VERIFY CURRENT PASSWORD
      // =====================================================

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

      // =====================================================
      // HASH NEW PASSWORD
      // =====================================================

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      // =====================================================
      // UPDATE PASSWORD
      // =====================================================

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
// GET /api/auth/profile
// =========================================================

const getProfile =
  async (
    req,
    res
  ) => {

    try {

      // =====================================================
      // AUTHENTICATION CHECK
      // =====================================================

      if (!req.userId) {

        return res.status(401).json({
          success: false,

          message:
            "Authentication required",
        });
      }

      // =====================================================
      // GET USER
      // =====================================================

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

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        user:
          cleanUser(
            result.rows[0],
            req
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
// PUT /api/auth/profile
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
        designation,
        bio,
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
        String(
          fullName
        ).trim();

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
        String(
          address
        ).trim();

      const cleanSex =
        String(
          sex
        ).trim();

      const cleanBloodGroup =
        String(
          bloodGroup
        ).trim();

      const cleanDesignation =
        String(
          designation || ""
        ).trim();

      const cleanBio =
        String(
          bio || ""
        ).trim();

      const numericAge =
        Number(age);

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
      // DESIGNATION VALIDATION
      // =====================================================

      if (
        cleanDesignation.length >
        150
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Designation must not exceed 150 characters",
        });
      }

      // =====================================================
      // BIO VALIDATION
      // =====================================================

      if (
        getWordCount(
          cleanBio
        ) > 300
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Bio must not exceed 300 words",
        });
      }

      // =====================================================
      // GET CURRENT USER
      // =====================================================

      const currentUserResult =
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
        currentUserResult.rows.length ===
        0
      ) {

        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      const currentUser =
        currentUserResult.rows[0];

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
      // PROFILE IMAGE
      // =====================================================

      let profileImageUrl =
        currentUser.profile_image_url ||
        null;

      if (req.file) {

        const newImageUrl =
          req.file.path ||
          req.file.secure_url ||
          req.file.url ||
          null;

        if (newImageUrl) {

          profileImageUrl =
            newImageUrl;

          if (
            currentUser.profile_image_url
          ) {

            await deleteCloudinaryImage(
              currentUser.profile_image_url
            );
          }
        }
      }

      // =====================================================
      // UPDATE PROFILE
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

            profile_image_url = $9,

            designation = $10,

            bio = $11,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $12

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

            profileImageUrl,

            cleanDesignation,

            cleanBio,

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
            result.rows[0],
            req
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
// GET ALL REGISTERED MEMBERS
// GET /api/auth/members
// =========================================================

const getMembers =
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
            full_name,
            username,
            email,
            mobile,
            age,
            sex,
            address,
            blood_group,
            profile_image_url,
            designation,
            bio,
            created_at
          FROM users
          ORDER BY created_at DESC
          `
        );

      return res.json({

        success: true,

        members:
          result.rows.map(
            (user) =>
              cleanUser(
                user,
                req
              )
          ),
      });

    } catch (error) {

      console.error(
        "Get members error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch members",
      });
    }
  };


// =========================================================
// DELETE PROFILE PHOTO
// DELETE /api/auth/profile/photo
// =========================================================

const deleteProfilePhoto =
  async (
    req,
    res
  ) => {

    try {

      // =====================================================
      // GET CURRENT USER
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT
            id,
            profile_image_url

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

      // =====================================================
      // NO PHOTO
      // =====================================================

      if (
        !user.profile_image_url
      ) {

        return res.json({

          success: true,

          message:
            "Profile photo already removed",
        });
      }

      // =====================================================
      // DELETE FROM CLOUDINARY
      // =====================================================

      await deleteCloudinaryImage(
        user.profile_image_url
      );

      // =====================================================
      // REMOVE URL FROM DATABASE
      // =====================================================

      const updatedResult =
        await pool.query(
          `
          UPDATE users

          SET
            profile_image_url = NULL,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *
          `,
          [
            req.userId,
          ]
        );

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        message:
          "Profile photo deleted successfully",

        user:
          cleanUser(
            updatedResult.rows[0],
            req
          ),
      });

    } catch (error) {

      console.error(
        "Delete profile photo error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to delete profile photo",
      });
    }
  };


// =========================================================
// LOGOUT
// POST /api/auth/logout
// =========================================================

const logoutUser =
  (
    req,
    res
  ) => {

    try {

      // =====================================================
      // CLEAR AUTH COOKIE
      // =====================================================

      res.clearCookie(
        "snict_token",
        authCookieOptions
      );

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        message:
          "Logged out successfully",
      });

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to logout",
      });
    }
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

  getMembers,

  deleteProfilePhoto,

  logoutUser,

};