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
// with the registration middleware.
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
    // Useful for frontend UI.
    // Does NOT expose the document URL.
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
// Fields:
//
// aadhaarNumber
// aadhaarCard (OPTIONAL)
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
      // Aadhaar NUMBER is required.
      // Aadhaar CARD DOCUMENT is OPTIONAL.
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
      // AADHAAR CARD FILE - OPTIONAL
      //
      // The Aadhaar number remains required.
      //
      // The actual Aadhaar document does NOT have to
      // be uploaded.
      //
      // If uploaded:
      //     store the document URL.
      //
      // If NOT uploaded:
      //     store NULL.
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


      // =====================================================
      // ONLY VALIDATE AADHAAR UPLOAD IF FILE WAS PROVIDED
      // =====================================================

      if (
        aadhaarCardFile &&
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
      // aadhaar_card_url can now be NULL when the
      // document was not uploaded.
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
              ? `Your membership application was rejected: ${membership.rejection_reason}`
              : "Your membership application was rejected.",

          membershipStatus:
            "rejected",

          rejectionReason:
            membership.rejection_reason ||
            null,

        });

      }


      // =====================================================
      // APPROVED MEMBERSHIP
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
            "Your membership is not approved yet.",

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


      // =====================================================
      // SET AUTH COOKIE
      // =====================================================

      setAuthCookie(
        res,
        token
      );


      // =====================================================
      // LOGIN RESPONSE
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

          id:
            membership.id,

          membershipNumber:
            membership.membership_number,

          membershipType:
            membership.membership_type,

          status:
            membership.status,

          appliedAt:
            membership.applied_at,

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
          SELECT
            id,
            full_name,
            email
          FROM users
          WHERE email = $1
          LIMIT 1
          `,
          [
            normalizedEmail,
          ]
        );


      // =====================================================
      // SECURITY
      //
      // Do not reveal whether email exists.
      // =====================================================

      if (
        result.rows.length ===
        0
      ) {

        return res.json({

          success: true,

          message:
            "If an account exists with this email, an OTP has been sent.",

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
          otp
        );


      const otpExpiry =
        createExpiry();


      // =====================================================
      // STORE OTP
      // =====================================================

      await pool.query(
        `
        UPDATE users

        SET

          password_reset_otp_hash = $1,

          password_reset_otp_expires_at = $2

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

      try {

        await sendEmail({

          to:
            normalizedEmail,

          subject:
            "SNICT Password Reset OTP",

          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
              "
            >

              <h2>
                Password Reset Request
              </h2>

              <p>
                Hello
                ${user.full_name || "Member"},
              </p>

              <p>
                Your SNICT password reset OTP is:
              </p>

              <h1>
                ${otp}
              </h1>

              <p>
                This OTP is valid for 10 minutes.
              </p>

              <p>
                If you did not request this,
                you can safely ignore this email.
              </p>

            </div>
          `,

        });

      } catch (emailError) {

        console.error(
          "Forgot password email error:",
          emailError
        );


        // Clear OTP if email failed.

        await pool.query(
          `
          UPDATE users

          SET

            password_reset_otp_hash = NULL,

            password_reset_otp_expires_at = NULL

          WHERE id = $1
          `,
          [
            user.id,
          ]
        );


        return res.status(500).json({

          success: false,

          message:
            "Unable to send password reset OTP",

        });

      }


      return res.json({

        success: true,

        message:
          "If an account exists with this email, an OTP has been sent.",

      });


    } catch (error) {

      console.error(
        "Forgot password error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to process password reset request",

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
        String(
          newPassword
        ).length < 8
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
          SELECT

            id,

            full_name,

            email,

            password_reset_otp_hash,

            password_reset_otp_expires_at

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
            "Invalid email or OTP",

        });

      }


      const user =
        result.rows[0];


      // =====================================================
      // CHECK OTP
      // =====================================================

      if (
        !user.password_reset_otp_hash ||
        !user.password_reset_otp_expires_at
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid or expired OTP",

        });

      }


      const expiry =
        new Date(
          user.password_reset_otp_expires_at
        );


      if (
        Number.isNaN(
          expiry.getTime()
        ) ||
        expiry < new Date()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "OTP has expired",

        });

      }


      const submittedOtpHash =
        hashOtp(
          String(otp).trim()
        );


      if (
        !safeHashCompare(
          submittedOtpHash,
          user.password_reset_otp_hash
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid OTP",

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

          password_reset_otp_hash = NULL,

          password_reset_otp_expires_at = NULL,

          updated_at = CURRENT_TIMESTAMP

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
          "Password reset successfully",

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
// GET PROFILE
// GET /api/auth/profile
// =========================================================

const getProfile =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;


      // =====================================================
      // GET USER
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT
            *
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [
            userId,
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
      // MEMBERSHIP
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

            rejected_at,

            plan_id,

            amount,

            duration_years,

            payment_status,

            start_date,

            expiry_date

          FROM memberships

          WHERE user_id = $1

          ORDER BY applied_at DESC

          LIMIT 1
          `,
          [
            userId,
          ]
        );


      const membership =
        membershipResult.rows[0] ||
        null;


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

        membership:
          membership
            ? {

                id:
                  membership.id,

                membershipNumber:
                  membership.membership_number,

                membershipType:
                  membership.membership_type,

                status:
                  membership.status,

                rejectionReason:
                  membership.rejection_reason,

                appliedAt:
                  membership.applied_at,

                approvedAt:
                  membership.approved_at,

                rejectedAt:
                  membership.rejected_at,

                planId:
                  membership.plan_id,

                amount:
                  membership.amount,

                durationYears:
                  membership.duration_years,

                paymentStatus:
                  membership.payment_status,

                startDate:
                  membership.start_date,

                expiryDate:
                  membership.expiry_date,

              }
            : null,

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
// Aadhaar NUMBER can be updated.
//
// Aadhaar DOCUMENT remains OPTIONAL.
//
// If no new Aadhaar document is uploaded,
// the existing document is preserved.
// =========================================================

const updateProfile =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      const userId =
        req.userId;


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
      // GET CURRENT USER
      // =====================================================

      const currentResult =
        await client.query(
          `
          SELECT *
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [
            userId,
          ]
        );


      if (
        currentResult.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "User not found",

        });

      }


      const currentUser =
        currentResult.rows[0];


      // =====================================================
      // NORMALIZE DATA
      // =====================================================

      const cleanFullName =
        fullName !== undefined
          ? String(
              fullName
            ).trim()
          : currentUser.full_name;


      const normalizedMobile =
        mobile !== undefined
          ? String(
              mobile
            ).replace(
              /\D/g,
              ""
            )
          : currentUser.mobile;


      const numericAge =
        age !== undefined &&
        age !== null &&
        age !== ""
          ? Number(age)
          : currentUser.age;


      const cleanSex =
        sex !== undefined
          ? String(
              sex
            ).trim()
          : currentUser.sex;


      const cleanAddress =
        address !== undefined
          ? String(
              address
            ).trim()
          : currentUser.address;


      const cleanBloodGroup =
        bloodGroup !== undefined
          ? String(
              bloodGroup
            ).trim()
          : currentUser.blood_group;


      const cleanDesignation =
        designation !== undefined
          ? String(
              designation
            ).trim()
          : currentUser.designation;


      const cleanBio =
        bio !== undefined
          ? cleanBioText(
              bio
            )
          : currentUser.bio || "";


      // =====================================================
      // VALIDATION
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
      // AADHAAR NUMBER
      // =====================================================

      let normalizedAadhaar =
        normalizeAadhaar(
          aadhaarNumber
        );


      // If no Aadhaar number was sent during profile
      // update, preserve existing Aadhaar number.

      if (
        !normalizedAadhaar
      ) {

        normalizedAadhaar =
          normalizeAadhaar(
            currentUser.aadhaar_number
          );

      }


      if (
        normalizedAadhaar &&
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


      const newProfileImageUrl =
        getUploadedFileUrl(
          profileImageFile
        );


      const newAadhaarCardUrl =
        getUploadedFileUrl(
          aadhaarCardFile
        );


      // =====================================================
      // AADHAAR DOCUMENT IS OPTIONAL
      //
      // No file = keep existing document.
      //
      // File = replace existing document.
      // =====================================================

      const finalAadhaarCardUrl =
        newAadhaarCardUrl ||
        currentUser.aadhaar_card_url ||
        null;


      // =====================================================
      // PROFILE IMAGE
      //
      // No new image = preserve old image.
      // =====================================================

      const finalProfileImageUrl =
        newProfileImageUrl ||
        currentUser.profile_image_url ||
        null;


      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query(
        "BEGIN"
      );


      // =====================================================
      // CHECK AADHAAR DUPLICATE
      // =====================================================

      if (
        normalizedAadhaar &&
        normalizedAadhaar !==
          currentUser.aadhaar_number
      ) {

        const duplicateAadhaar =
          await client.query(
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

              userId,
            ]
          );


        if (
          duplicateAadhaar.rows.length >
          0
        ) {

          await client.query(
            "ROLLBACK"
          );

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
      // UPDATE USER
      // =====================================================

      const result =
        await client.query(
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

            normalizedMobile,

            numericAge,

            cleanSex,

            cleanAddress,

            cleanBloodGroup,

            cleanDesignation,

            cleanBio,

            normalizedAadhaar,

            finalAadhaarCardUrl,

            finalProfileImageUrl,

            userId,

          ]
        );


      await client.query(
        "COMMIT"
      );


      // =====================================================
      // DELETE OLD PROFILE IMAGE IF REPLACED
      // =====================================================

      if (
        newProfileImageUrl &&
        currentUser.profile_image_url &&
        currentUser.profile_image_url !==
          newProfileImageUrl
      ) {

        await deleteCloudinaryImage(
          currentUser.profile_image_url
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

      try {

        await client.query(
          "ROLLBACK"
        );

      } catch (
        rollbackError
      ) {

        console.error(
          "Profile rollback error:",
          rollbackError.message
        );

      }


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


    } finally {

      client.release();

    }

  };


// =========================================================
// GET MEMBERS
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

            u.id,

            u.full_name,

            u.username,

            u.email,

            u.mobile,

            u.age,

            u.sex,

            u.address,

            u.blood_group,

            u.profile_image_url,

            u.designation,

            u.bio,

            u.aadhaar_number,

            u.created_at,

            m.id
              AS membership_id,

            m.membership_number,

            m.membership_type,

            m.status
              AS membership_status,

            m.approved_at

          FROM users u

          LEFT JOIN LATERAL
          (
            SELECT *

            FROM memberships m

            WHERE m.user_id = u.id

            ORDER BY
              m.applied_at DESC

            LIMIT 1

          ) m ON TRUE

          ORDER BY
            u.created_at DESC
          `
        );


      // =====================================================
      // SECURITY
      //
      // Never expose complete Aadhaar number.
      // =====================================================

      const members =
        result.rows.map(
          (member) => {

            return {

              id:
                member.id,

              fullName:
                member.full_name,

              username:
                member.username,

              email:
                member.email,

              mobile:
                member.mobile,

              age:
                member.age,

              sex:
                member.sex,

              address:
                member.address,

              bloodGroup:
                member.blood_group,

              profileImageUrl:
                getImageUrl(
                  req,
                  member.profile_image_url
                ),

              designation:
                member.designation ||
                "",

              bio:
                member.bio ||
                "",

              aadhaarLast4:
                getAadhaarLast4(
                  member.aadhaar_number
                ),

              membershipId:
                member.membership_id,

              membershipNumber:
                member.membership_number,

              membershipType:
                member.membership_type,

              membershipStatus:
                member.membership_status,

              approvedAt:
                member.approved_at,

              createdAt:
                member.created_at,

            };

          }
        );


      return res.json({

        success: true,

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

      const userId =
        req.userId;


      // =====================================================
      // GET CURRENT PROFILE IMAGE
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
            userId,
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


      const imageUrl =
        result.rows[0]
          .profile_image_url;


      // =====================================================
      // DELETE FROM DATABASE
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
          userId,
        ]
      );


      // =====================================================
      // DELETE FROM CLOUDINARY
      // =====================================================

      if (imageUrl) {

        await deleteCloudinaryImage(
          imageUrl
        );

      }


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
// CHANGE PASSWORD
// PUT /api/auth/change-password
// =========================================================

const changePassword =
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.userId;


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
            "Current password and new password are required",

        });

      }


      if (
        String(
          newPassword
        ).length < 8
      ) {

        return res.status(400).json({

          success: false,

          message:
            "New password must be at least 8 characters",

        });

      }


      // =====================================================
      // GET CURRENT PASSWORD
      // =====================================================

      const result =
        await pool.query(
          `
          SELECT

            id,

            password_hash

          FROM users

          WHERE id = $1

          LIMIT 1
          `,
          [
            userId,
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

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password_hash
        );


      if (
        !passwordMatch
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Current password is incorrect",

        });

      }


      // =====================================================
      // PREVENT SAME PASSWORD
      // =====================================================

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password_hash
        );


      if (
        samePassword
      ) {

        return res.status(400).json({

          success: false,

          message:
            "New password must be different from current password",

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

          userId,
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
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          path: "/",
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
// EXPORT
// =========================================================

module.exports = {

  // =======================================================
  // PUBLIC AUTH
  // =======================================================

  registerUser,

  checkUsername,

  loginUser,

  forgotPassword,

  resetPassword,


  // =======================================================
  // PROFILE
  // =======================================================

  getProfile,

  updateProfile,

  getMembers,

  deleteProfilePhoto,


  // =======================================================
  // PASSWORD
  // =======================================================

  changePassword,


  // =======================================================
  // LOGOUT
  // =======================================================

  logoutUser,

};