const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =========================================================
// PROFILE UPLOAD DIRECTORY
// =========================================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/profile"
);

// Create directory if it doesn't exist
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

const storage = multer.diskStorage({

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

    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const uniqueName =
      `profile-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(
      null,
      uniqueName
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

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {

    cb(
      null,
      true
    );

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );

  }

};

// =========================================================
// MULTER
// =========================================================

const uploadProfile = multer({

  storage,

  fileFilter,

  limits: {

    // Maximum 5 MB
    fileSize:
      5 * 1024 * 1024,

  },

});

// =========================================================
// EXPORT
// =========================================================

module.exports =
  uploadProfile;