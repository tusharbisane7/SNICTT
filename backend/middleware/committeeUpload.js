const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// =========================================================
// UPLOAD DIRECTORY
// =========================================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "committee"
);

// =========================================================
// CREATE UPLOAD DIRECTORY
// =========================================================

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// =========================================================
// STORAGE
// =========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    try {
      // Get original extension
      const extension = path
        .extname(file.originalname)
        .toLowerCase();

      // Generate secure random filename
      const randomName = crypto
        .randomBytes(16)
        .toString("hex");

      const timestamp = Date.now();

      const filename =
        `committee-${timestamp}-${randomName}${extension}`;

      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  },
});

// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  // Validate MIME type + extension
  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed."
    )
  );
};

// =========================================================
// MULTER CONFIGURATION
// =========================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum image size = 5 MB
    fileSize: 5 * 1024 * 1024,

    // Only one image
    files: 1,
  },
});

// =========================================================
// COMMITTEE UPLOAD MIDDLEWARE
//
// IMPORTANT:
// This already contains:
//
// upload.single("photo")
//
// Therefore committeeRoutes.js should use:
//
// committeeUpload
//
// NOT:
//
// committeeUpload.single("photo")
// =========================================================

const committeeUpload = (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    // =====================================================
    // NO ERROR
    // =====================================================

    if (!error) {
      return next();
    }

    console.error(
      "Committee image upload error:",
      error
    );

    // =====================================================
    // FILE TOO LARGE
    // =====================================================

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Image size must be 5 MB or less.",
      });
    }

    // =====================================================
    // TOO MANY FILES
    // =====================================================

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message:
          "Only one profile image can be uploaded.",
      });
    }

    // =====================================================
    // UNEXPECTED FILE
    // =====================================================

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected image field. Please upload the image using the 'photo' field.",
      });
    }

    // =====================================================
    // INVALID FILE TYPE
    // =====================================================

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to upload committee image.",
    });
  });
};

// =========================================================
// EXPORT
// =========================================================

module.exports = committeeUpload;