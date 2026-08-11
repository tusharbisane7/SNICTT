const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// =========================================================
// PROFILE IMAGE UPLOAD
// =========================================================
//
// Flow:
//
// React
//   ↓
// Multer memoryStorage
//   ↓
// Cloudinary
//   ↓
// req.file.path = Cloudinary secure URL
//
// Frontend field:
// profileImage
//
// =========================================================

// =========================================================
// MULTER MEMORY STORAGE
// =========================================================

const storage = multer.memoryStorage();

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

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed."
    ),
    false
  );
};

// =========================================================
// MULTER
// =========================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

// =========================================================
// UPLOAD BUFFER TO CLOUDINARY
// =========================================================

const uploadToCloudinary = (
  buffer,
  options = {}
) => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          }
        );

      uploadStream.end(buffer);
    }
  );
};

// =========================================================
// PROFILE UPLOAD MIDDLEWARE
// =========================================================

const profileUpload = (
  req,
  res,
  next
) => {
  upload.single("profileImage")(
    req,
    res,
    async (error) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (error) {
        console.error(
          "Profile image upload error:",
          error
        );

        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Profile image must be 5 MB or smaller.",
          });
        }

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

        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Unexpected image field. Please use 'profileImage'.",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Unable to upload profile image.",
        });
      }

      // ===================================================
      // NO FILE
      // ===================================================

      if (!req.file) {
        return next();
      }

      try {
        // =================================================
        // UPLOAD TO CLOUDINARY
        // =================================================

        const result =
          await uploadToCloudinary(
            req.file.buffer,
            {
              folder:
                "snict/profile",

              resource_type:
                "image",

              transformation: [
                {
                  width: 1200,
                  height: 1200,
                  crop: "limit",
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            }
          );

        // =================================================
        // ATTACH CLOUDINARY INFORMATION
        // =================================================

        req.file.path =
          result.secure_url;

        req.file.secure_url =
          result.secure_url;

        req.file.public_id =
          result.public_id;

        req.file.filename =
          result.public_id;

        req.file.cloudinary =
          result;

        // Also make URL easily available
        req.body.profileImage =
          result.secure_url;

        next();

      } catch (cloudinaryError) {

        console.error(
          "Cloudinary profile upload error:",
          cloudinaryError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to upload profile image to Cloudinary.",
        });
      }
    }
  );
};

module.exports =
  profileUpload;