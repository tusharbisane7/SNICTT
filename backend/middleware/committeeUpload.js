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
// CREATE DIRECTORY IF NOT EXISTS
// =========================================================

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

// =========================================================
// STORAGE
// =========================================================

const storage =
  multer.diskStorage({

    destination: (
      req,
      file,
      cb
    ) => {

      cb(
        null,
        uploadDirectory
      );

    },

    filename: (
      req,
      file,
      cb
    ) => {

      // =====================================================
      // ORIGINAL EXTENSION
      // =====================================================

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      // =====================================================
      // SAFE RANDOM FILE NAME
      // =====================================================

      const randomName =
        crypto
          .randomBytes(16)
          .toString("hex");

      const timestamp =
        Date.now();

      const filename =
        `committee-${timestamp}-${randomName}${extension}`;

      cb(
        null,
        filename
      );

    },

  });

// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (
  req,
  file,
  cb
) => {

  // =======================================================
  // ALLOWED MIME TYPES
  // =======================================================

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  // =======================================================
  // ALLOWED EXTENSIONS
  // =======================================================

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();

  // =======================================================
  // VALIDATE
  // =======================================================

  if (
    allowedMimeTypes.includes(
      file.mimetype
    ) &&
    allowedExtensions.includes(
      extension
    )
  ) {

    cb(
      null,
      true
    );

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );

  }

};

// =========================================================
// MULTER
// =========================================================

const upload =
  multer({

    storage,

    fileFilter,

    limits: {

      // Maximum image size = 5 MB
      fileSize:
        5 * 1024 * 1024,

      // Only one file
      files: 1,

    },

  });

// =========================================================
// ERROR HANDLER
// =========================================================
//
// This wrapper converts Multer errors into
// proper API responses.
//
// =========================================================

const committeeUpload =
  (
    req,
    res,
    next
  ) => {

    upload.single("photo")(
      req,
      res,
      (error) => {

        // ===================================================
        // NO ERROR
        // ===================================================

        if (!error) {

          return next();

        }

        console.error(
          "Committee image upload error:",
          error
        );

        // ===================================================
        // MULTER FILE SIZE ERROR
        // ===================================================

        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Image size must be 5 MB or less.",

          });

        }

        // ===================================================
        // TOO MANY FILES
        // ===================================================

        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Only one profile image can be uploaded.",

          });

        }

        // ===================================================
        // INVALID FILE TYPE
        // ===================================================

        return res.status(400).json({

          success: false,

          message:
            error.message ||
            "Unable to upload image.",

        });

      }

    );

  };

// =========================================================
// EXPORT
// =========================================================

module.exports =
  committeeUpload;