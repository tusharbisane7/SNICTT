const multer = require("multer");
const path = require("path");

const cloudinary =
  require("../config/cloudinary");


// =========================================================
// MEMORY STORAGE
// =========================================================

const storage =
  multer.memoryStorage();


// =========================================================
// COVER IMAGE TYPES
// =========================================================

const coverImageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];


const coverImageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];


// =========================================================
// MEDIA TYPES
// =========================================================

const mediaMimeTypes = [

  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // PDF
  "application/pdf",

  // DOC
  "application/msword",

  // DOCX
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // PPT
  "application/vnd.ms-powerpoint",

  // PPTX
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

];


const mediaExtensions = [

  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",

  // Videos
  ".mp4",
  ".webm",
  ".mov",

  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",

];


// =========================================================
// REGISTRATION PRESENTATION TYPES
// =========================================================
//
// User-side event registration:
//
// Allowed:
// - PDF
// - PPT
// - PPTX
//
// Optional:
// - User may register without uploading a file.
//
// =========================================================

const registrationMimeTypes = [

  "application/pdf",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

];


const registrationExtensions = [

  ".pdf",

  ".ppt",

  ".pptx",

];


// =========================================================
// CLOUDINARY UPLOAD
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

      try {

        const uploadStream =
          cloudinary
            .uploader
            .upload_stream(

              options,

              (
                error,
                result
              ) => {

                if (
                  error
                ) {

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

      } catch (
        error
      ) {

        reject(
          error
        );

      }

    }

  );

};


// =========================================================
// GET MEDIA RESOURCE TYPE
// =========================================================

const getMediaResourceType = (
  mimetype
) => {

  if (
    mimetype.startsWith(
      "video/"
    )
  ) {

    return "video";

  }


  if (
    mimetype.startsWith(
      "image/"
    )
  ) {

    return "image";

  }


  // Cloudinary treats
  // PDF/DOC/PPT files as raw.

  return "raw";

};


// =========================================================
// COVER IMAGE FILTER
// =========================================================

const coverImageFilter = (
  req,
  file,
  cb
) => {

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();


  // =======================================================
  // MIME TYPE
  // =======================================================

  if (
    !coverImageMimeTypes.includes(
      file.mimetype
    )
  ) {

    return cb(

      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed for event cover image."
      ),

      false

    );

  }


  // =======================================================
  // EXTENSION
  // =======================================================

  if (
    !coverImageExtensions.includes(
      extension
    )
  ) {

    return cb(

      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed for event cover image."
      ),

      false

    );

  }


  return cb(
    null,
    true
  );

};


// =========================================================
// EVENT COVER IMAGE MULTER
// =========================================================

const coverUpload =
  multer({

    storage,

    fileFilter:
      coverImageFilter,

    limits: {

      // 5 MB
      fileSize:
        5 *
        1024 *
        1024,

      files: 1,

    },

  });


// =========================================================
// MEDIA FILE FILTER
// =========================================================

const mediaFileFilter = (
  req,
  file,
  cb
) => {

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();


  // =======================================================
  // MIME CHECK
  // =======================================================

  if (
    !mediaMimeTypes.includes(
      file.mimetype
    )
  ) {

    return cb(

      new Error(
        "Unsupported file type. Allowed: images, MP4/WEBM/MOV videos, PDF, DOC, DOCX, PPT and PPTX."
      ),

      false

    );

  }


  // =======================================================
  // EXTENSION CHECK
  // =======================================================

  if (
    !mediaExtensions.includes(
      extension
    )
  ) {

    return cb(

      new Error(
        "Unsupported file extension."
      ),

      false

    );

  }


  return cb(
    null,
    true
  );

};


// =========================================================
// EVENT MEDIA MULTER
// =========================================================
//
// Field:
//
// files
//
// Supports:
//
// - Multiple gallery images
// - Multiple videos
// - Multiple documents
//
// =========================================================

const mediaUpload =
  multer({

    storage,

    fileFilter:
      mediaFileFilter,

    limits: {

      // 100 MB per file
      fileSize:
        100 *
        1024 *
        1024,

      // Maximum 20 files
      files: 20,

    },

  }).array(
    "files",
    20
  );


// =========================================================
// EVENT COVER IMAGE MIDDLEWARE
// =========================================================
//
// Used by:
//
// POST /api/events/admin
// PUT  /api/events/admin/:id
//
// Frontend field:
//
// image
//
// =========================================================

const eventUpload = (
  req,
  res,
  next
) => {

  coverUpload.single(
    "image"
  )(

    req,

    res,

    async (
      error
    ) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (
        error
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "EVENT IMAGE UPLOAD ERROR"
        );

        console.error(
          error
        );

        console.error(
          "========================================"
        );


        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Event cover image must be 5 MB or smaller.",

            });

        }


        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Only one event cover image can be uploaded.",

            });

        }


        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Unexpected image field. Please use the 'image' field.",

            });

        }


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              error.message ||
              "Unable to upload event image.",

          });

      }


      // ===================================================
      // NO COVER IMAGE
      // ===================================================

      if (
        !req.file
      ) {

        return next();

      }


      // ===================================================
      // UPLOAD COVER TO CLOUDINARY
      // ===================================================

      try {

        const result =
          await uploadToCloudinary(

            req.file.buffer,

            {

              folder:
                "snict/events",

              resource_type:
                "image",

              transformation: [

                {

                  width:
                    1600,

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


        // =================================================
        // BODY DATA
        // =================================================

        req.body.imageUrl =
          result.secure_url;

        req.body.imagePublicId =
          result.public_id;


        return next();

      } catch (
        cloudinaryError
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "CLOUDINARY EVENT IMAGE UPLOAD ERROR"
        );

        console.error(
          cloudinaryError
        );

        console.error(
          "========================================"
        );


        return res
          .status(500)
          .json({

            success:
              false,

            message:
              "Unable to upload event image to Cloudinary.",

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
// EVENT MEDIA UPLOAD MIDDLEWARE
// =========================================================
//
// Route:
//
// POST /api/events/admin/:id/media
//
// FormData:
//
// files = multiple files
// type  = image / video / document
//
// =========================================================

const eventMediaUpload = (
  req,
  res,
  next
) => {

  mediaUpload(
    req,
    res,

    async (
      error
    ) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (
        error
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "EVENT MEDIA UPLOAD ERROR"
        );

        console.error(
          error
        );

        console.error(
          "========================================"
        );


        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Each media file must be 100 MB or smaller.",

            });

        }


        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Maximum 20 media files can be uploaded at once.",

            });

        }


        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Invalid media field. Please use the 'files' field.",

            });

        }


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              error.message ||
              "Unable to upload event media.",

          });

      }


      // ===================================================
      // NO FILES
      // ===================================================

      if (
        !req.files ||
        req.files.length ===
          0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Please select at least one file.",

          });

      }


      // ===================================================
      // MEDIA TYPE
      // ===================================================

      const requestedType =
        String(
          req.body?.type ||
          ""
        )
          .trim()
          .toLowerCase();


      const allowedTypes = [

        "image",

        "video",

        "document",

      ];


      if (
        !allowedTypes.includes(
          requestedType
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid media type. Use image, video or document.",

          });

      }


      // ===================================================
      // VALIDATE FILES AGAINST REQUESTED TYPE
      // ===================================================

      for (
        const file
        of req.files
      ) {

        const extension =
          path
            .extname(
              file.originalname
            )
            .toLowerCase();


        let actualType =
          "document";


        if (
          file.mimetype.startsWith(
            "image/"
          )
        ) {

          actualType =
            "image";

        } else if (
          file.mimetype.startsWith(
            "video/"
          )
        ) {

          actualType =
            "video";

        }


        // -------------------------------------------------
        // TYPE MISMATCH
        // -------------------------------------------------

        if (
          actualType !==
          requestedType
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                `"${file.originalname}" does not match the selected media type "${requestedType}".`,

            });

        }


        // -------------------------------------------------
        // DOCUMENT VALIDATION
        // -------------------------------------------------

        if (
          requestedType ===
          "document"
        ) {

          const documentExtensions = [

            ".pdf",

            ".doc",

            ".docx",

            ".ppt",

            ".pptx",

          ];


          if (
            !documentExtensions.includes(
              extension
            )
          ) {

            return res
              .status(400)
              .json({

                success:
                  false,

                message:
                  `Unsupported document: ${file.originalname}`,

              });

          }

        }

      }


      // ===================================================
      // UPLOAD EACH FILE
      // ===================================================

      try {

        const uploadedFiles =
          [];


        for (
          const file
          of req.files
        ) {

          const resourceType =
            getMediaResourceType(
              file.mimetype
            );


          const folder =
            requestedType ===
              "image"

              ? "snict/events/gallery"

              : requestedType ===
                "video"

                ? "snict/events/videos"

                : "snict/events/documents";


          const result =
            await uploadToCloudinary(

              file.buffer,

              {

                folder,

                resource_type:
                  resourceType,

              }

            );


          uploadedFiles.push({

            originalName:
              file.originalname,

            fileName:
              file.originalname,

            mimeType:
              file.mimetype,

            size:
              file.size,

            type:
              requestedType,

            url:
              result.secure_url,

            secureUrl:
              result.secure_url,

            publicId:
              result.public_id,

            resourceType:
              result.resource_type,

            format:
              result.format,

            bytes:
              result.bytes,

            cloudinary:
              result,

          });

        }


        // =================================================
        // ATTACH UPLOADED DATA
        // =================================================

        req.eventMedia =
          uploadedFiles;


        req.mediaType =
          requestedType;


        // =================================================
        // CONTINUE TO CONTROLLER
        // =================================================

        return next();

      } catch (
        cloudinaryError
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "CLOUDINARY EVENT MEDIA UPLOAD ERROR"
        );

        console.error(
          cloudinaryError
        );

        console.error(
          "========================================"
        );


        return res
          .status(500)
          .json({

            success:
              false,

            message:
              "Unable to upload event media to Cloudinary.",

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
// EVENT REGISTRATION PRESENTATION FILTER
// =========================================================
//
// User-side upload:
//
// presentation
//
// Allowed:
//
// PDF
// PPT
// PPTX
//
// Optional file.
// Maximum 20 MB.
//
// =========================================================

const registrationPresentationFilter = (
  req,
  file,
  cb
) => {

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();


  // =======================================================
  // MIME TYPE
  // =======================================================

  if (
    !registrationMimeTypes.includes(
      file.mimetype
    )
  ) {

    return cb(

      new Error(
        "Only PDF, PPT and PPTX files are allowed for event registration."
      ),

      false

    );

  }


  // =======================================================
  // FILE EXTENSION
  // =======================================================

  if (
    !registrationExtensions.includes(
      extension
    )
  ) {

    return cb(

      new Error(
        "Only .pdf, .ppt and .pptx files are allowed for event registration."
      ),

      false

    );

  }


  return cb(
    null,
    true
  );

};


// =========================================================
// EVENT REGISTRATION MULTER
// =========================================================
//
// Field:
//
// presentation
//
// Optional:
//
// Yes
//
// Maximum:
//
// 1 file
//
// Maximum size:
//
// 20 MB
//
// =========================================================

const registrationUpload =
  multer({

    storage,

    fileFilter:
      registrationPresentationFilter,

    limits: {

      fileSize:
        20 *
        1024 *
        1024,

      files: 1,

    },

  }).single(
    "presentation"
  );


// =========================================================
// EVENT REGISTRATION UPLOAD MIDDLEWARE
// =========================================================
//
// Route:
//
// POST /api/events/:id/register
//
// Frontend:
//
// presentation = optional PDF/PPT/PPTX
//
// After upload:
//
// req.file
//
// Cloudinary:
//
// resource_type = raw
//
// =========================================================

const eventRegistrationUpload = (
  req,
  res,
  next
) => {

  registrationUpload(
    req,
    res,

    async (
      error
    ) => {

      // ===================================================
      // MULTER ERROR
      // ===================================================

      if (
        error
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "EVENT REGISTRATION FILE ERROR"
        );

        console.error(
          error
        );

        console.error(
          "========================================"
        );


        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Presentation file must be 20 MB or smaller.",

            });

        }


        if (
          error.code ===
          "LIMIT_FILE_COUNT"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Only one presentation file can be uploaded.",

            });

        }


        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {

          return res
            .status(400)
            .json({

              success:
                false,

              message:
                "Invalid presentation field. Please use the 'presentation' field.",

            });

        }


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              error.message ||
              "Unable to upload presentation file.",

          });

      }


      // ===================================================
      // NO FILE
      //
      // IMPORTANT:
      //
      // Presentation is optional.
      //
      // Continue without req.file.
      // ===================================================

      if (
        !req.file
      ) {

        return next();

      }


      // ===================================================
      // UPLOAD PRESENTATION TO CLOUDINARY
      // ===================================================

      try {

        const result =
          await uploadToCloudinary(

            req.file.buffer,

            {

              folder:
                "snict/events/registrations",

              resource_type:
                "raw",

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


        // =================================================
        // ADD EXTRA CLOUDINARY INFORMATION
        // =================================================

        req.file.cloudinary_url =
          result.secure_url;

        req.file.cloudinary_public_id =
          result.public_id;

        req.file.cloudinary_resource_type =
          result.resource_type;

        req.file.cloudinary_format =
          result.format;

        req.file.cloudinary_bytes =
          result.bytes;


        // =================================================
        // OPTIONAL BODY VALUES
        // =================================================

        req.body.presentationUrl =
          result.secure_url;

        req.body.presentationPublicId =
          result.public_id;


        return next();

      } catch (
        cloudinaryError
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "CLOUDINARY EVENT REGISTRATION UPLOAD ERROR"
        );

        console.error(
          cloudinaryError
        );

        console.error(
          "========================================"
        );


        return res
          .status(500)
          .json({

            success:
              false,

            message:
              "Unable to upload presentation to Cloudinary.",

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
// ALIASES
// =========================================================
//
// Existing routes can use:
//
// eventUpload.mediaUpload
//
// New registration route can use:
//
// eventUpload.registrationUpload
//
// =========================================================

eventUpload.mediaUpload =
  eventMediaUpload;


eventUpload.eventMediaUpload =
  eventMediaUpload;


eventUpload.registrationUpload =
  eventRegistrationUpload;


// =========================================================
// DIRECT REGISTRATION ALIAS
// =========================================================

eventUpload.eventRegistrationUpload =
  eventRegistrationUpload;
  // =========================================================
// EXPORT
// =========================================================
//
// Default export:
//
// eventUpload
//
// Available properties:
//
// eventUpload.mediaUpload
// eventUpload.eventMediaUpload
// eventUpload.registrationUpload
// eventUpload.eventRegistrationUpload
//
// =========================================================

module.exports =
  eventUpload;