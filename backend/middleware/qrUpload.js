const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// =========================================================
// MEMBERSHIP PAYMENT QR UPLOAD
// =========================================================
//
// Flow:
//
// Desktop
//   ↓
// Multer memoryStorage
//   ↓
// req.file.buffer
//   ↓
// Cloudinary upload_stream()
//   ↓
// result.secure_url
//   ↓
// req.file.path
//
// Frontend field:
// qrCode
//
// Supported:
// JPG
// JPEG
// PNG
// WEBP
//
// Maximum:
// 5 MB
//
// =========================================================


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


  if (
    allowedMimeTypes.includes(
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
      "Only JPG, JPEG, PNG and WEBP images are allowed for payment QR."
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
// UPLOAD BUFFER TO CLOUDINARY
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
// QR UPLOAD MIDDLEWARE
// =========================================================

const qrUpload = (
  req,
  res,
  next
) => {

  upload.single(
    "qrCode"
  )(
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
          "QR upload error:",
          error
        );


        // ===============================================
        // FILE TOO LARGE
        // ===============================================

        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res.status(
            400
          ).json({

            success:
              false,

            message:
              "Payment QR image must be 5 MB or smaller.",

          });

        }


        // ===============================================
        // TOO MANY FILES
        // ===============================================

        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res.status(
            400
          ).json({

            success:
              false,

            message:
              "Only one payment QR image can be uploaded.",

          });

        }


        // ===============================================
        // WRONG FIELD
        // ===============================================

        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {

          return res.status(
            400
          ).json({

            success:
              false,

            message:
              "Unexpected image field. Please use 'qrCode'.",

          });

        }


        // ===============================================
        // OTHER MULTER ERROR
        // ===============================================

        return res.status(
          400
        ).json({

          success:
            false,

          message:
            error.message ||
            "Unable to upload payment QR image.",

        });

      }


      // ===================================================
      // NO FILE
      // ===================================================
      //
      // This is allowed because admin may only update:
      //
      // - UPI ID
      // - Account Name
      //
      // without replacing the existing QR.
      //
      // ===================================================

      if (
        !req.file
      ) {

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
                "snict/membership/payment-qr",

              resource_type:
                "image",

              public_id:
                "membership-payment-qr",

              overwrite:
                true,

              invalidate:
                true,

              transformation: [

                {

                  width:
                    1200,

                  height:
                    1200,

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


        // =================================================
        // CLOUDINARY URL CHECK
        // =================================================

        if (
          !result ||
          !result.secure_url
        ) {

          console.error(
            "Cloudinary QR upload returned no secure URL:",
            result
          );


          return res.status(
            500
          ).json({

            success:
              false,

            message:
              "QR image uploaded but Cloudinary URL was not generated.",

          });

        }


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


        // =================================================
        // ALSO MAKE URL AVAILABLE
        // =================================================

        req.body.qrCode =
          result.secure_url;


        // =================================================
        // CONTINUE
        // =================================================

        next();

      } catch (
        cloudinaryError
      ) {

        console.error(
          "Cloudinary payment QR upload error:",
          cloudinaryError
        );


        return res.status(
          500
        ).json({

          success:
            false,

          message:
            "Unable to upload payment QR image to Cloudinary.",

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
  qrUpload;