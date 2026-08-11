const multer = require("multer");
const path = require("path");

const cloudinary =
  require("../config/cloudinary");

// =========================================================
// MULTER MEMORY STORAGE
// =========================================================

const storage =
  multer.memoryStorage();

// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (
  req,
  file,
  cb
) => {

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

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();

  if (
    allowedMimeTypes.includes(
      file.mimetype
    ) &&
    allowedExtensions.includes(
      extension
    )
  ) {
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

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files: 1,
    },
  });

// =========================================================
// CLOUDINARY BUFFER UPLOAD
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
// COMMITTEE UPLOAD
// =========================================================
//
// Frontend:
//
// formData.append("photo", file)
//
// Route:
//
// committeeUpload
//
// NOT:
//
// committeeUpload.single("photo")
//
// =========================================================

const committeeUpload = (
  req,
  res,
  next
) => {

  upload.single("photo")(
    req,
    res,
    async (error) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (error) {

        console.error(
          "Committee image upload error:",
          error
        );

        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Committee image must be 5 MB or smaller.",
          });
        }

        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Only one committee image can be uploaded.",
          });
        }

        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Unexpected image field. Please use the 'photo' field.",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Unable to upload committee image.",
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
                "snict/committee",

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
        // ATTACH CLOUDINARY DATA
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

        // Useful for controller
        req.body.imageUrl =
          result.secure_url;

        req.body.photo =
          result.secure_url;

        next();

      } catch (cloudinaryError) {

        console.error(
          "Cloudinary committee upload error:",
          cloudinaryError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to upload committee image to Cloudinary.",
        });
      }
    }
  );
};

module.exports =
  committeeUpload;