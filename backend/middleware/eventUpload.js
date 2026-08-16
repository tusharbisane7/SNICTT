const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary");


// =========================================================
// STORAGE
// =========================================================

const storage =
  multer.memoryStorage();


// =========================================================
// HELPERS
// =========================================================

const getExtension =
  (filename = "") =>
    path
      .extname(filename)
      .toLowerCase();


const uploadToCloudinary =
  (
    buffer,
    options = {}
  ) =>
    new Promise(
      (
        resolve,
        reject
      ) => {

        try {

          const stream =
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


          stream.end(
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


// =========================================================
// ERROR HANDLER
// =========================================================

const sendUploadError =
  (
    res,
    error,
    fallbackMessage
  ) => {

    console.error(
      "========================================"
    );

    console.error(
      "EVENT UPLOAD ERROR"
    );

    console.error(
      error
    );

    console.error(
      "========================================"
    );


    // -------------------------------------------------------
    // FILE SIZE
    // -------------------------------------------------------

    if (
      error?.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res.status(
        400
      ).json({

        success: false,

        message:
          fallbackMessage,

      });

    }


    // -------------------------------------------------------
    // FILE COUNT
    // -------------------------------------------------------

    if (
      error?.code ===
      "LIMIT_FILE_COUNT"
    ) {

      return res.status(
        400
      ).json({

        success: false,

        message:
          "Too many files were uploaded.",

      });

    }


    // -------------------------------------------------------
    // UNEXPECTED FILE
    // -------------------------------------------------------

    if (
      error?.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {

      return res.status(
        400
      ).json({

        success: false,

        message:
          error.message ||
          "Unexpected file field.",

      });

    }


    return res.status(
      400
    ).json({

      success: false,

      message:
        error?.message ||
        "Unable to process uploaded file.",

      debug:
        process.env.NODE_ENV !==
        "production"

          ? error?.message

          : undefined,

    });

  };


// =========================================================
// EVENT COVER IMAGE
// =========================================================
//
// Used by:
//
// POST /api/events/admin
// PUT  /api/events/admin/:id
//
// Field:
//
// image
//
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


const coverImageFilter =
  (
    req,
    file,
    cb
  ) => {

    const extension =
      getExtension(
        file.originalname
      );


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


    cb(
      null,
      true
    );

  };


const coverUpload =
  multer({

    storage,

    fileFilter:
      coverImageFilter,

    limits: {

      fileSize:
        5 * 1024 * 1024,

      files: 1,

    },

  });


// =========================================================
// EVENT MEDIA
// =========================================================
//
// Supported:
//
// IMAGE
// DOCUMENT
//
// NOT SUPPORTED:
//
// VIDEO FILE
//
// Videos must be added through:
//
// POST /api/events/admin/:id/media/youtube
//
// =========================================================

const mediaMimeTypes = [

  // -------------------------------------------------------
  // IMAGES
  // -------------------------------------------------------

  "image/jpeg",

  "image/jpg",

  "image/png",

  "image/webp",

  "image/gif",


  // -------------------------------------------------------
  // PDF
  // -------------------------------------------------------

  "application/pdf",


  // -------------------------------------------------------
  // DOC
  // -------------------------------------------------------

  "application/msword",


  // -------------------------------------------------------
  // DOCX
  // -------------------------------------------------------

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",


  // -------------------------------------------------------
  // PPT
  // -------------------------------------------------------

  "application/vnd.ms-powerpoint",


  // -------------------------------------------------------
  // PPTX
  // -------------------------------------------------------

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

];


const mediaExtensions = [

  ".jpg",

  ".jpeg",

  ".png",

  ".webp",

  ".gif",

  ".pdf",

  ".doc",

  ".docx",

  ".ppt",

  ".pptx",

];


const mediaFileFilter =
  (
    req,
    file,
    cb
  ) => {

    const extension =
      getExtension(
        file.originalname
      );


    if (
      !mediaMimeTypes.includes(
        file.mimetype
      )
    ) {

      return cb(
        new Error(
          "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, PPT and PPTX."
        ),
        false
      );

    }


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


    cb(
      null,
      true
    );

  };


const mediaUploadParser =
  multer({

    storage,

    fileFilter:
      mediaFileFilter,

    limits: {

      // ---------------------------------------------------
      // 100 MB PER FILE
      // ---------------------------------------------------

      fileSize:
        100 * 1024 * 1024,

      // ---------------------------------------------------
      // MAX 20 FILES
      // ---------------------------------------------------

      files: 20,

    },

  }).array(
    "files",
    20
  );


// =========================================================
// GET CLOUDINARY RESOURCE TYPE
// =========================================================

const getMediaResourceType =
  (
    mimetype = ""
  ) => {

    // -------------------------------------------------------
    // IMAGE
    // -------------------------------------------------------

    if (
      mimetype.startsWith(
        "image/"
      )
    ) {

      return "image";

    }


    // -------------------------------------------------------
    // DOCUMENT
    //
    // PDF/DOC/DOCX/PPT/PPTX
    // are uploaded as RAW.
    // -------------------------------------------------------

    return "raw";

  };


// =========================================================
// EVENT COVER IMAGE MIDDLEWARE
// =========================================================
//
// POST /api/events/admin
// PUT  /api/events/admin/:id
//
// Field:
//
// image
//
// =========================================================

const eventUpload =
  (
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

        // =================================================
        // MULTER ERROR
        // =================================================

        if (
          error
        ) {

          return sendUploadError(
            res,
            error,
            "Event cover image must be 5 MB or smaller."
          );

        }


        // =================================================
        // NO IMAGE
        //
        // Cover image is optional.
        // =================================================

        if (
          !req.file
        ) {

          return next();

        }


        try {

          // =================================================
          // CLOUDINARY
          // =================================================

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
          // ALSO PUT IN BODY
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
            "CLOUDINARY EVENT COVER IMAGE ERROR:",
            cloudinaryError
          );


          return res.status(
            500
          ).json({

            success: false,

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
// POST /api/events/admin/:id/media
//
// FormData:
//
// files = one or more files
// type  = image / document
//
// IMPORTANT:
//
// This middleware uploads files to Cloudinary ONCE.
//
// The controller should NOT upload them again.
//
// Cloudinary result is passed through:
//
// req.eventMedia
//
// =========================================================

const eventMediaUpload =
  (
    req,
    res,
    next
  ) => {

    mediaUploadParser(
      req,
      res,
      async (
        error
      ) => {

        // =================================================
        // MULTER ERROR
        // =================================================

        if (
          error
        ) {

          return sendUploadError(
            res,
            error,
            "Each media file must be 100 MB or smaller."
          );

        }


        // =================================================
        // NO FILE
        // =================================================

        if (
          !req.files ||
          req.files.length === 0
        ) {

          return res.status(
            400
          ).json({

            success: false,

            message:
              "Please select at least one file.",

          });

        }


        // =================================================
        // MEDIA TYPE
        // =================================================

        const requestedType =
          String(
            req.body?.type ||
            ""
          )
            .trim()
            .toLowerCase();


        // =================================================
        // ALLOWED TYPES
        // =================================================

        const allowedTypes = [

          "image",

          "document",

        ];


        if (
          !allowedTypes.includes(
            requestedType
          )
        ) {

          return res.status(
            400
          ).json({

            success: false,

            message:
              "Invalid media type. Use image or document. Videos must be added using a YouTube URL.",

          });

        }


        // =================================================
        // VALIDATE EVERY FILE
        // =================================================

        for (
          const file
          of req.files
        ) {

          const actualType =
            file.mimetype.startsWith(
              "image/"
            )

              ? "image"

              : "document";


          // -------------------------------------------------
          // TYPE MUST MATCH
          // -------------------------------------------------

          if (
            actualType !==
            requestedType
          ) {

            return res.status(
              400
            ).json({

              success: false,

              message:
                `"${file.originalname}" does not match the selected media type "${requestedType}".`,

            });

          }


          // -------------------------------------------------
          // DOCUMENT EXTENSIONS
          // -------------------------------------------------

          if (
            requestedType ===
            "document"
          ) {

            const allowedDocumentExtensions = [

              ".pdf",

              ".doc",

              ".docx",

              ".ppt",

              ".pptx",

            ];


            const extension =
              getExtension(
                file.originalname
              );


            if (
              !allowedDocumentExtensions.includes(
                extension
              )
            ) {

              return res.status(
                400
              ).json({

                success: false,

                message:
                  `Unsupported document: ${file.originalname}`,

              });

            }

          }

        }


        // =================================================
        // UPLOAD TO CLOUDINARY
        // =================================================

        try {

          const uploadedFiles =
            [];


          for (
            const file
            of req.files
          ) {

            // =============================================
            // RESOURCE TYPE
            // =============================================

            const resourceType =
              getMediaResourceType(
                file.mimetype
              );


            // =============================================
            // FOLDER
            // =============================================

            const folder =
              requestedType ===
              "image"

                ? "snict/events/gallery"

                : "snict/events/documents";


            // =============================================
            // CLOUDINARY UPLOAD
            // =============================================

            const result =
              await uploadToCloudinary(
                file.buffer,
                {

                  folder,

                  resource_type:
                    resourceType,

                }
              );


            // =============================================
            // STORE RESULT
            // =============================================

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


              // -------------------------------------------
              // CLOUDINARY URL
              // -------------------------------------------

              url:
                result.secure_url,

              secureUrl:
                result.secure_url,


              // -------------------------------------------
              // CLOUDINARY PUBLIC ID
              // -------------------------------------------

              publicId:
                result.public_id,


              // -------------------------------------------
              // CLOUDINARY INFO
              // -------------------------------------------

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
          // PASS TO CONTROLLER
          // =================================================

          req.eventMedia =
            uploadedFiles;


          req.mediaType =
            requestedType;


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


          return res.status(
            500
          ).json({

            success: false,

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
// EVENT REGISTRATION PRESENTATION
// =========================================================
//
// Field:
//
// presentation
//
// Allowed:
//
// PDF
// PPT
// PPTX
//
// Optional.
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


const registrationPresentationFilter =
  (
    req,
    file,
    cb
  ) => {

    const extension =
      getExtension(
        file.originalname
      );


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


    cb(
      null,
      true
    );

  };


const registrationUploadParser =
  multer({

    storage,

    fileFilter:
      registrationPresentationFilter,

    limits: {

      fileSize:
        20 * 1024 * 1024,

      files: 1,

    },

  }).single(
    "presentation"
  );


// =========================================================
// EVENT REGISTRATION UPLOAD
// =========================================================
//
// POST /api/events/:id/register
//
// Field:
//
// presentation
//
// =========================================================

const eventRegistrationUpload =
  (
    req,
    res,
    next
  ) => {

    registrationUploadParser(
      req,
      res,
      async (
        error
      ) => {

        // =================================================
        // MULTER ERROR
        // =================================================

        if (
          error
        ) {

          return sendUploadError(
            res,
            error,
            "Presentation file must be 20 MB or smaller."
          );

        }


        // =================================================
        // PRESENTATION OPTIONAL
        // =================================================

        if (
          !req.file
        ) {

          return next();

        }


        try {

          // =================================================
          // CLOUDINARY
          // =================================================

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
          // FILE DATA
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
          // BODY
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
            "CLOUDINARY EVENT REGISTRATION UPLOAD ERROR:",
            cloudinaryError
          );


          return res.status(
            500
          ).json({

            success: false,

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
// Keep these aliases because your routes/controller may use
// either naming convention.
//
// =========================================================

eventUpload.mediaUpload =
  eventMediaUpload;


eventUpload.eventMediaUpload =
  eventMediaUpload;


eventUpload.registrationUpload =
  eventRegistrationUpload;


eventUpload.eventRegistrationUpload =
  eventRegistrationUpload;


// =========================================================
// EXPORT
// =========================================================

module.exports =
  eventUpload;