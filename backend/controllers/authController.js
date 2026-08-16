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
// GENERAL HELPERS
// =========================================================

const createExpiry = () => {
  const expiry = new Date();

  expiry.setMinutes(
    expiry.getMinutes() + 10
  );

  return expiry;
};


// =========================================================
// IMAGE URL HELPER
// =========================================================

const getImageUrl = (
  req,
  imagePath
) => {
  if (!imagePath) {
    return null;
  }

  const image =
    String(imagePath).trim();

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

  const backendUrl =
    process.env.BACKEND_URL
      ? String(
          process.env.BACKEND_URL
        ).replace(/\/+$/, "")
      : `${req.protocol}://${req.get("host")}`;

  if (image.startsWith("/")) {
    return `${backendUrl}${image}`;
  }

  return `${backendUrl}/${image}`;
};


// =========================================================
// CLOUDINARY PUBLIC ID
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
    !value.includes(
      "res.cloudinary.com"
    ) ||
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
// AUTH COOKIE OPTIONS
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
// NORMAL AUTH COOKIE
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
// TEMPORARY SIGNUP AUTH COOKIE
//
// Used when:
//
// Signup
//   ↓
// Membership Payment
//
// Cookie validity = 30 minutes
// =========================================================

const setSignupAuthCookie = (
  res,
  token
) => {

  res.cookie(
    "snict_token",
    token,
    {
      ...authCookieOptions,

      maxAge:
        30 *
        60 *
        1000,
    }
  );

};


// =========================================================
// BIO CHARACTER COUNT
//
// IMPORTANT:
// Bio limit is 300 CHARACTERS,
// NOT 300 WORDS.
// =========================================================

const getCharacterCount = (
  text
) => {

  if (!text) {
    return 0;
  }

  return Array.from(
    String(text)
  ).length;

};


// =========================================================
// CLEAN BIO
// =========================================================

const cleanBioText = (
  text
) => {

  return String(
    text || ""
  ).trim();

};


// =========================================================
// AADHAAR NORMALIZER
//
// Accepts:
//
// 123456789012
//
// Also accepts:
//
// 1234 5678 9012
//
// Returns only 12 digits.
// =========================================================

const normalizeAadhaar = (
  aadhaar
) => {

  return String(
    aadhaar || ""
  )
    .replace(/\D/g, "")
    .trim();

};


// =========================================================
// AADHAAR LAST FOUR DIGITS
//
// We NEVER expose complete Aadhaar
// to the frontend.
// =========================================================

const getAadhaarLast4 = (
  aadhaar
) => {

  const normalized =
    normalizeAadhaar(
      aadhaar
    );

  if (
    normalized.length !== 12
  ) {
    return null;
  }

  return normalized.slice(-4);

};


// =========================================================
// FILE HELPER
//
// Supports:
//
// req.file
//
// AND:
//
// req.files.profileImage
// req.files.aadhaarCard
//
// This makes controller compatible
// with the new registration middleware.
// =========================================================

const getUploadedFile = (
  req,
  fieldName
) => {

  // -------------------------------------------------------
  // Multer upload.fields()
  // -------------------------------------------------------

  if (
    req.files &&
    !Array.isArray(req.files) &&
    req.files[fieldName] &&
    req.files[fieldName].length > 0
  ) {

    return req.files[fieldName][0];

  }


  // -------------------------------------------------------
  // Multer upload.single()
  //
  // Existing profile upload compatibility
  // -------------------------------------------------------

  if (
    req.file &&
    fieldName === "profileImage"
  ) {

    return req.file;

  }


  return null;

};


// =========================================================
// FILE URL
// =========================================================

const getUploadedFileUrl = (
  file
) => {

  if (!file) {
    return null;
  }

  return (
    file.path ||
    file.secure_url ||
    file.url ||
    null
  );

};


// =========================================================
// CLEAN USER RESPONSE
//
// SECURITY:
//
// Aadhaar number is NEVER returned.
// Aadhaar document URL is NEVER returned.
//
// Only last 4 digits are returned.
// =========================================================

const cleanUser = (
  user,
  req
) => {

  const aadhaarLast4 =
    user.aadhaar_number
      ? getAadhaarLast4(
          user.aadhaar_number
        )
      : null;

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

    // -----------------------------------------------------
    // SECURITY:
    // Only last four digits are exposed.
    // -----------------------------------------------------

    aadhaarLast4,

    // -----------------------------------------------------
    // This is useful for frontend UI.
    // It does NOT expose the document URL.
    // -----------------------------------------------------

    aadhaarProvided:
      Boolean(
        user.aadhaar_number ||
        user.aadhaar_card_url
      ),

    createdAt:
      user.created_at,
  };

};


// =========================================================
// SAFE HASH COMPARE
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
          [
            username,
          ]
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
//
// POST /api/auth/register
// POST /api/auth/signup
//
// New fields:
//
// aadhaarNumber
// aadhaarCard
//
// Bio:
//
// MAX 300 CHARACTERS
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

        aadhaarNumber,

        signupWithMembership,

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
            "All required fields are required",

        });

      }


      // =====================================================
      // NORMALIZE BASIC DATA
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
        String(mobile)
          .replace(
            /\D/g,
            ""
          );


      const cleanFullName =
        String(
          fullName
        ).trim();

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
        cleanBioText(
          bio
        );


      // =====================================================
      // NORMALIZE AADHAAR
      // =====================================================

      const normalizedAadhaar =
        normalizeAadhaar(
          aadhaarNumber
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
      // BIO VALIDATION
      //
      // IMPORTANT:
      // 300 CHARACTERS, NOT WORDS.
      // =====================================================

      if (
        getCharacterCount(
          cleanBio
        ) > 300
      ) {

        return res.status(400).json({

          success: false,

          code:
            "BIO_TOO_LONG",

          message:
            "Bio cannot exceed 300 characters",

        });

      }


      // =====================================================
      // AADHAAR VALIDATION
      //
      // Registration now requires Aadhaar.
      // =====================================================

      if (
        !normalizedAadhaar
      ) {

        return res.status(400).json({

          success: false,

          code:
            "AADHAAR_REQUIRED",

          message:
            "Aadhaar number is required",

        });

      }


      if (
        !/^[0-9]{12}$/.test(
          normalizedAadhaar
        )
      ) {

        return res.status(400).json({

          success: false,

          code:
            "INVALID_AADHAAR",

          message:
            "Please enter a valid 12-digit Aadhaar number",

        });

      }


      // =====================================================
      // AADHAAR CARD FILE
      // =====================================================

      const aadhaarCardFile =
        getUploadedFile(
          req,
          "aadhaarCard"
        );

      const profileImageFile =
        getUploadedFile(
          req,
          "profileImage"
        );


      if (
        !aadhaarCardFile
      ) {

        return res.status(400).json({

          success: false,

          code:
            "AADHAAR_CARD_REQUIRED",

          message:
            "Aadhaar card document is required",

        });

      }


      // =====================================================
      // FILE URLS
      // =====================================================

      const profileImageUrl =
        getUploadedFileUrl(
          profileImageFile
        );

      const aadhaarCardUrl =
        getUploadedFileUrl(
          aadhaarCardFile
        );


      if (
        !aadhaarCardUrl
      ) {

        return res.status(400).json({

          success: false,

          code:
            "AADHAAR_UPLOAD_FAILED",

          message:
            "Unable to process Aadhaar card upload",

        });

      }


      // =====================================================
      // DATABASE TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // CHECK DUPLICATE USER
      // =====================================================

      const existingUser =
        await client.query(
          `
          SELECT
            id,
            username,
            email,
            mobile,
            aadhaar_number
          FROM users
          WHERE
            email = $1
            OR username = $2
            OR mobile = $3
            OR aadhaar_number = $4
          LIMIT 1
          `,
          [
            normalizedEmail,

            normalizedUsername,

            normalizedMobile,

            normalizedAadhaar,
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

            code:
              "EMAIL_EXISTS",

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

            code:
              "USERNAME_EXISTS",

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

            code:
              "MOBILE_EXISTS",

            message:
              "Mobile number already registered",

          });

        }


        if (
          existing.aadhaar_number ===
          normalizedAadhaar
        ) {

          return res.status(409).json({

            success: false,

            code:
              "AADHAAR_EXISTS",

            message:
              "This Aadhaar number is already registered",

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
      //
      // IMPORTANT:
      //
      // Requires DB columns:
      //
      // aadhaar_number
      // aadhaar_card_url
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
            blood_group,
            profile_image_url,
            designation,
            bio,
            aadhaar_number,
            aadhaar_card_url
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
            $12,
            $13,
            $14
          )
          RETURNING *
          `,
          [

            cleanFullName,

            normalizedUsername,

            normalizedEmail,

            normalizedMobile,

            passwordHash,

            numericAge,

            cleanSex,

            cleanAddress,

            cleanBloodGroup,

            profileImageUrl,

            cleanDesignation,

            cleanBio,

            normalizedAadhaar,

            aadhaarCardUrl,

          ]
        );


      // =====================================================
      // COMMIT
      // =====================================================

      await client.query(
        "COMMIT"
      );


      // =====================================================
      // MEMBERSHIP SIGNUP FLOW
      //
      // Signup
      //   ↓
      // Temporary cookie
      //   ↓
      // Membership Payment
      // =====================================================

      const isSignupWithMembership =
        String(
          signupWithMembership ||
          ""
        ).toLowerCase() ===
        "true";


      if (
        isSignupWithMembership
      ) {

        const signupToken =
          generateToken(
            result.rows[0].id
          );

        setSignupAuthCookie(
          res,
          signupToken
        );

      }


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.status(201).json({

        success: true,

        message:
          isSignupWithMembership
            ? "Account created successfully. Continue to membership payment."
            : "Account created successfully",

        email:
          normalizedEmail,

        user:
          cleanUser(
            result.rows[0],
            req
          ),

        nextStep:
          isSignupWithMembership
            ? "membership-payment"
            : "login",

      });


    } catch (error) {

      // =====================================================
      // ROLLBACK
      // =====================================================

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
// LOGIN USER
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


      // =====================================================
      // NORMALIZE IDENTIFIER
      // =====================================================

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
      // USER NOT FOUND
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

          code:
            "INVALID_PASSWORD",

          message:
            "Incorrect password",

        });

      }


      // =====================================================
      // GET MEMBERSHIP
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
      // MEMBERSHIP REQUIRED
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
      // PENDING MEMBERSHIP
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
      // REJECTED MEMBERSHIP
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
      // MEMBERSHIP NOT APPROVED
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
      // GENERATE AUTH TOKEN
      // =====================================================

      const token =
        generateToken(
          user.id
        );


      setAuthCookie(
        res,
        token
      );


      // =====================================================
      // RESPONSE
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
      // DO NOT REVEAL USER EXISTENCE
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
          updated_at = CURRENT_TIMESTAMP
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


      // =====================================================
      // RESPONSE
      // =====================================================

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
      // CHECK OTP
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
      // CHECK EXPIRY
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
      // HASH PROVIDED OTP
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
          updated_at = CURRENT_TIMESTAMP
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
      // AUTHENTICATION
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
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          passwordHash,
          user.id,
        ]
      );


      // =====================================================
      // RESPONSE
      // =====================================================

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
//
// Returns the logged-in user's profile.
//
// SECURITY:
// - Complete Aadhaar number is NEVER returned.
// - Aadhaar document URL is NEVER returned.
// - Only Aadhaar last 4 digits are returned.
// =========================================================

const getProfile =
  async (
    req,
    res
  ) => {

    try {

      // =====================================================
      // AUTH CHECK
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


      const user =
        result.rows[0];


      // =====================================================
      // GET MEMBERSHIP
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
            approved_at,
            start_date,
            expiry_date
          FROM memberships
          WHERE user_id = $1
          ORDER BY applied_at DESC
          LIMIT 1
          `,
          [
            user.id,
          ]
        );


      const membership =
        membershipResult.rows.length >
        0
          ? membershipResult.rows[0]
          : null;


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        user:
          cleanUser(
            user,
            req
          ),

        membership,

      });

    } catch (error) {

      console.error(
        "Get profile error:",
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
//
// Supports:
//
// fullName
// mobile
// age
// sex
// address
// bloodGroup
// designation
// bio
// aadhaarNumber
// profileImage
// aadhaarCard
//
// IMPORTANT:
//
// Bio maximum = 300 characters.
//
// Aadhaar = exactly 12 digits.
//
// =========================================================

const updateProfile =
  async (
    req,
    res
  ) => {

    try {

      // =====================================================
      // AUTH CHECK
      // =====================================================

      if (!req.userId) {

        return res.status(401).json({

          success: false,

          message:
            "Authentication required",

        });

      }


      // =====================================================
      // REQUEST DATA
      // =====================================================

      const {

        fullName,

        mobile,

        age,

        sex,

        address,

        bloodGroup,

        designation,

        bio,

        aadhaarNumber,

      } = req.body;


      // =====================================================
      // GET EXISTING USER
      // =====================================================

      const userResult =
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
        userResult.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "User not found",

        });

      }


      const existingUser =
        userResult.rows[0];


      // =====================================================
      // PREPARE VALUES
      // =====================================================

      const cleanFullName =
        fullName !== undefined
          ? String(
              fullName
            ).trim()
          : existingUser.full_name;


      const cleanMobile =
        mobile !== undefined
          ? String(
              mobile
            )
              .replace(
                /\D/g,
                ""
              )
          : existingUser.mobile;


      const cleanAge =
        age !== undefined &&
        age !== ""
          ? Number(age)
          : existingUser.age;


      const cleanSex =
        sex !== undefined
          ? String(
              sex
            ).trim()
          : existingUser.sex;


      const cleanAddress =
        address !== undefined
          ? String(
              address
            ).trim()
          : existingUser.address;


      const cleanBloodGroup =
        bloodGroup !== undefined
          ? String(
              bloodGroup
            ).trim()
          : existingUser.blood_group;


      const cleanDesignation =
        designation !== undefined
          ? String(
              designation
            ).trim()
          : existingUser.designation;


      const cleanBio =
        bio !== undefined
          ? cleanBioText(
              bio
            )
          : existingUser.bio || "";


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
          cleanAge
        ) ||
        cleanAge < 1 ||
        cleanAge > 120
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid age",

        });

      }


      // =====================================================
      // BIO VALIDATION
      //
      // 300 CHARACTERS MAX
      // =====================================================

      if (
        getCharacterCount(
          cleanBio
        ) > 300
      ) {

        return res.status(400).json({

          success: false,

          code:
            "BIO_TOO_LONG",

          message:
            "Bio cannot exceed 300 characters",

        });

      }


      // =====================================================
      // AADHAAR
      //
      // Only validate if the user sends
      // a new Aadhaar number.
      // =====================================================

      let finalAadhaar =
        existingUser.aadhaar_number ||
        null;


      if (
        aadhaarNumber !== undefined
      ) {

        const normalizedAadhaar =
          normalizeAadhaar(
            aadhaarNumber
          );


        if (
          !/^[0-9]{12}$/.test(
            normalizedAadhaar
          )
        ) {

          return res.status(400).json({

            success: false,

            code:
              "INVALID_AADHAAR",

            message:
              "Aadhaar number must contain exactly 12 digits",

          });

        }


        // ===================================================
        // CHECK DUPLICATE AADHAAR
        // ===================================================

        const duplicateAadhaar =
          await pool.query(
            `
            SELECT id
            FROM users
            WHERE
              aadhaar_number = $1
              AND id <> $2
            LIMIT 1
            `,
            [
              normalizedAadhaar,
              req.userId,
            ]
          );


        if (
          duplicateAadhaar.rows.length >
          0
        ) {

          return res.status(409).json({

            success: false,

            code:
              "AADHAAR_EXISTS",

            message:
              "This Aadhaar number is already registered",

          });

        }


        finalAadhaar =
          normalizedAadhaar;

      }


      // =====================================================
      // FILES
      // =====================================================

      const profileImageFile =
        getUploadedFile(
          req,
          "profileImage"
        );


      const aadhaarCardFile =
        getUploadedFile(
          req,
          "aadhaarCard"
        );


      // =====================================================
      // CURRENT FILE URLS
      // =====================================================

      let finalProfileImageUrl =
        existingUser.profile_image_url ||
        null;


      let finalAadhaarCardUrl =
        existingUser.aadhaar_card_url ||
        null;


      // =====================================================
      // NEW PROFILE IMAGE
      // =====================================================

      if (
        profileImageFile
      ) {

        const newProfileImageUrl =
          getUploadedFileUrl(
            profileImageFile
          );


        if (
          newProfileImageUrl
        ) {

          finalProfileImageUrl =
            newProfileImageUrl;

        }

      }


      // =====================================================
      // NEW AADHAAR CARD
      // =====================================================

      if (
        aadhaarCardFile
      ) {

        const newAadhaarCardUrl =
          getUploadedFileUrl(
            aadhaarCardFile
          );


        if (
          newAadhaarCardUrl
        ) {

          finalAadhaarCardUrl =
            newAadhaarCardUrl;

        }

      }


      // =====================================================
      // UPDATE USER
      // =====================================================

      const result =
        await pool.query(
          `
          UPDATE users
          SET
            full_name = $1,
            mobile = $2,
            age = $3,
            sex = $4,
            address = $5,
            blood_group = $6,
            designation = $7,
            bio = $8,
            aadhaar_number = $9,
            aadhaar_card_url = $10,
            profile_image_url = $11,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $12
          RETURNING *
          `,
          [

            cleanFullName,

            cleanMobile,

            cleanAge,

            cleanSex,

            cleanAddress,

            cleanBloodGroup,

            cleanDesignation,

            cleanBio,

            finalAadhaar,

            finalAadhaarCardUrl,

            finalProfileImageUrl,

            req.userId,

          ]
        );


      // =====================================================
      // DELETE OLD PROFILE IMAGE
      //
      // Only after successful database update.
      // =====================================================

      if (
        profileImageFile &&
        existingUser.profile_image_url &&
        existingUser.profile_image_url !==
          finalProfileImageUrl
      ) {

        await deleteCloudinaryImage(
          existingUser.profile_image_url
        );

      }


      // =====================================================
      // RESPONSE
      // =====================================================

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

      return res.status(500).json({

        success: false,

        message:
          "Unable to update profile",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// GET ALL MEMBERS
// GET /api/auth/members
// =========================================================
//
// IMPORTANT:
//
// This endpoint should ideally be protected by
// adminMiddleware.
//
// Since your current authRoutes exposes it publicly,
// keep this controller response free from:
// - password
// - complete Aadhaar
// - Aadhaar document URL
//
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
            aadhaar_number,
            created_at
          FROM users
          ORDER BY created_at DESC
          `
        );


      // =====================================================
      // MAP MEMBERS
      // =====================================================

      const members =
        result.rows.map(
          (user) => ({

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
              user.designation ||
              "",

            bio:
              user.bio ||
              "",

            // ------------------------------------------------
            // SECURITY
            // ------------------------------------------------

            aadhaarLast4:
              getAadhaarLast4(
                user.aadhaar_number
              ),

            aadhaarProvided:
              Boolean(
                user.aadhaar_number
              ),

            createdAt:
              user.created_at,

          })
        );


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        count:
          members.length,

        members,

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
      // AUTH CHECK
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
      // DELETE CLOUDINARY IMAGE
      // =====================================================

      if (
        user.profile_image_url
      ) {

        await deleteCloudinaryImage(
          user.profile_image_url
        );

      }


      // =====================================================
      // CLEAR DATABASE URL
      // =====================================================

      await pool.query(
        `
        UPDATE users
        SET
          profile_image_url = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
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
// LOGOUT USER
// POST /api/auth/logout
// =========================================================

const logoutUser =
  async (
    req,
    res
  ) => {

    try {

      // =====================================================
      // CLEAR AUTH COOKIE
      // =====================================================

      res.clearCookie(
        "snict_token",
        {
          ...authCookieOptions,

          maxAge: 0,
        }
      );


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success: true,

        message:
          "Logout successful",

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
// EXPORT CONTROLLERS
// =========================================================

module.exports = {

  checkUsername,

  registerUser,

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