const multer = require("multer");
const cloudinary = require("../config/cloudinary");


// =========================================================
// REGISTRATION / PROFILE FILE UPLOAD
// =========================================================
//
// Supports:
//
// profileImage
// aadhaarCard
//
// Flow:
//
// React
//   ↓
// Multer memoryStorage
//   ↓
// Cloudinary
//   ↓
// req.files
//
// req.files.profileImage[0]
// req.files.aadhaarCard[0]
//
// =========================================================


// =========================================================
// MULTER MEMORY STORAGE
// =========================================================

const storage =
  multer.memoryStorage();


// =========================================================
// ALLOWED FILE TYPES
// =========================================================

const allowedProfileTypes = [

  "image/jpeg",

  "image/jpg",

  "image/png",

  "image/webp",

];


const allowedAadhaarTypes = [

  "application/pdf",

  "image/jpeg",

  "image/jpg",

  "image/png",

  "image/webp",

];


// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (
  req,
  file,
  cb
) => {

  // =======================================================
  // PROFILE IMAGE
  // =======================================================

  if (
    file.fieldname ===
    "profileImage"
  ) {

    if (
      allowedProfileTypes.includes(
        file.mimetype
      )
    ) {

      return cb(
        null,
        true
      );

    }

    return cb(
      new Error(
        "Profile image must be JPG, JPEG, PNG or WEBP."
      ),
      false
    );

  }


  // =======================================================
  // AADHAAR CARD
  // =======================================================

  if (
    file.fieldname ===
    "aadhaarCard"
  ) {

    if (
      allowedAadhaarTypes.includes(
        file.mimetype
      )
    ) {

      return cb(
        null,
        true
      );

    }

    return cb(
      new Error(
        "Aadhaar card must be PDF, JPG, JPEG, PNG or WEBP."
      ),
      false
    );

  }


  // =======================================================
  // UNKNOWN FILE FIELD
  // =======================================================

  return cb(
    new Error(
      `Unexpected file field: ${file.fieldname}`
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

      // Maximum 5 MB per file
      fileSize:
        5 *
        1024 *
        1024,

      // Maximum 2 files total
      files: 2,

    },

  });


// =========================================================
// CLOUDINARY UPLOAD HELPER
// =========================================================

const uploadToCloudinary = (
  buffer,
  options = {}
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const uploadStream =
        cloudinary.uploader.upload_stream(
          options,

          (
            error,
            result
          ) => {

            if (error) {

              return reject(
                error
              );

            }

            resolve(
              result
            );

          }
        );


      uploadStream.end(
        buffer
      );

    }
  );

};


// =========================================================
// GET FILE FROM req.files
// =========================================================

const getFirstFile = (
  files,
  fieldName
) => {

  if (
    !files ||
    !files[fieldName] ||
    !files[fieldName].length
  ) {

    return null;

  }

  return files[fieldName][0];

};


// =========================================================
// UPLOAD ONE FILE TO CLOUDINARY
// =========================================================

const processCloudinaryUpload = async (
  file,
  fieldName
) => {

  if (!file) {

    return null;

  }


  // =======================================================
  // PROFILE IMAGE
  // =======================================================

  if (
    fieldName ===
    "profileImage"
  ) {

    const result =
      await uploadToCloudinary(
        file.buffer,
        {

          folder:
            "snict/profile",

          resource_type:
            "image",

          transformation: [

            {

              width: 1200,

              height: 1200,

              crop:
                "limit",

              quality:
                "auto",

              fetch_format:
                "auto",

            },

          ],

        }
      );


    return result;

  }


  // =======================================================
  // AADHAAR CARD
  // =======================================================
  //
  // PDF:
  // resource_type = raw
  //
  // Image:
  // resource_type = image
  //
  // Keeping Aadhaar separately from profile
  // uploads.
  // =======================================================

  if (
    fieldName ===
    "aadhaarCard"
  ) {

    const isPdf =
      file.mimetype ===
      "application/pdf";


    const result =
      await uploadToCloudinary(
        file.buffer,
        {

          folder:
            "snict/aadhaar",

          resource_type:
            isPdf
              ? "raw"
              : "image",

        }
      );


    return result;

  }


  return null;

};


// =========================================================
// MAIN UPLOAD MIDDLEWARE
// =========================================================
//
// Accepts:
//
// profileImage
// aadhaarCard
//
// =========================================================

const profileUpload = (
  req,
  res,
  next
) => {

  upload.fields([

    {

      name:
        "profileImage",

      maxCount: 1,

    },

    {

      name:
        "aadhaarCard",

      maxCount: 1,

    },

  ])(
    req,
    res,
    async (
      error
    ) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (error) {

        console.error(
          "File upload error:",
          error
        );


        // -----------------------------------------------
        // FILE SIZE
        // -----------------------------------------------

        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res.status(400).json({

            success: false,

            code:
              "FILE_TOO_LARGE",

            message:
              "Each file must be 5 MB or smaller.",

          });

        }


        // -----------------------------------------------
        // TOO MANY FILES
        // -----------------------------------------------

        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res.status(400).json({

            success: false,

            code:
              "LIMIT_FILE_COUNT",

            message:
              "Maximum 2 files can be uploaded.",

          });

        }


        // -----------------------------------------------
        // UNEXPECTED FILE
        // -----------------------------------------------

        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {

          return res.status(400).json({

            success: false,

            code:
              "LIMIT_UNEXPECTED_FILE",

            message:
              "Only profileImage and aadhaarCard files are allowed.",

          });

        }


        // -----------------------------------------------
        // CUSTOM FILE TYPE ERROR
        // -----------------------------------------------

        return res.status(400).json({

          success: false,

          code:
            "INVALID_FILE",

          message:
            error.message ||
            "Unable to upload file.",

        });

      }


      try {

        // =================================================
        // GET FILES
        // =================================================

        const profileImage =
          getFirstFile(
            req.files,
            "profileImage"
          );


        const aadhaarCard =
          getFirstFile(
            req.files,
            "aadhaarCard"
          );


        // =================================================
        // NO FILE
        // =================================================

        if (
          !profileImage &&
          !aadhaarCard
        ) {

          return next();

        }


        // =================================================
        // PROFILE IMAGE UPLOAD
        // =================================================

        if (
          profileImage
        ) {

          const result =
            await processCloudinaryUpload(
              profileImage,
              "profileImage"
            );


          if (!result) {

            return res.status(500).json({

              success: false,

              message:
                "Unable to upload profile image.",

            });

          }


          // ---------------------------------------------
          // ATTACH CLOUDINARY DATA
          // ---------------------------------------------

          profileImage.path =
            result.secure_url;

          profileImage.secure_url =
            result.secure_url;

          profileImage.public_id =
            result.public_id;

          profileImage.filename =
            result.public_id;

          profileImage.cloudinary =
            result;


          // ---------------------------------------------
          // BACKWARD COMPATIBILITY
          //
          // Your old controller uses:
          //
          // req.file
          // ---------------------------------------------

          req.file =
            profileImage;


          req.body.profileImage =
            result.secure_url;

        }


        // =================================================
        // AADHAAR CARD UPLOAD
        // =================================================

        if (
          aadhaarCard
        ) {

          const result =
            await processCloudinaryUpload(
              aadhaarCard,
              "aadhaarCard"
            );


          if (!result) {

            return res.status(500).json({

              success: false,

              message:
                "Unable to upload Aadhaar card.",

            });

          }


          // ---------------------------------------------
          // ATTACH CLOUDINARY DATA
          // ---------------------------------------------

          aadhaarCard.path =
            result.secure_url;

          aadhaarCard.secure_url =
            result.secure_url;

          aadhaarCard.public_id =
            result.public_id;

          aadhaarCard.filename =
            result.public_id;

          aadhaarCard.cloudinary =
            result;


          // ---------------------------------------------
          // IMPORTANT
          //
          // Controller reads:
          //
          // req.files.aadhaarCard[0].path
          // ---------------------------------------------

          req.body.aadhaarCard =
            result.secure_url;

        }


        // =================================================
        // CONTINUE
        // =================================================

        return next();

      } catch (
        cloudinaryError
      ) {

        console.error(
          "Cloudinary upload error:",
          cloudinaryError
        );


        return res.status(500).json({

          success: false,

          code:
            "CLOUDINARY_UPLOAD_ERROR",

          message:
            "Unable to upload file to Cloudinary.",

          debug:
            process.env.NODE_ENV !==
            "production"
              ? cloudinaryError.message
              : undefined,

        });

      }

    }
  );

};


// =========================================================
// EXPORT
// =========================================================

module.exports =
  profileUpload;