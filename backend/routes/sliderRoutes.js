const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  toggleSlider,
} = require("../controllers/sliderController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router =
  express.Router();


// =========================================================
// CREATE UPLOAD DIRECTORY
// =========================================================

const uploadDirectory =
  path.join(
    __dirname,
    "../uploads/sliders"
  );

if (
  !fs.existsSync(uploadDirectory)
) {

  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );

}


// =========================================================
// MULTER STORAGE
// =========================================================

const storage =
  multer.diskStorage({

    destination:
      (
        req,
        file,
        cb
      ) => {

        cb(
          null,
          uploadDirectory
        );

      },

    filename:
      (
        req,
        file,
        cb
      ) => {

        const extension =
          path.extname(
            file.originalname
          ).toLowerCase();

        const fileName =
          `slider-${Date.now()}-${Math.round(
            Math.random() * 1000000
          )}${extension}`;

        cb(
          null,
          fileName
        );

      },

  });


// =========================================================
// FILE FILTER
// =========================================================

const fileFilter =
  (
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
        )
      );

    }

  };


// =========================================================
// UPLOAD
// =========================================================

const upload =
  multer({

    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },

  });


// =========================================================
// PUBLIC
// =========================================================

router.get(
  "/",
  getSliders
);


// =========================================================
// ADMIN
// =========================================================

router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllSliders
);


router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getSliderById
);


router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  createSlider
);


router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateSlider
);


router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  deleteSlider
);


router.patch(
  "/admin/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleSlider
);


module.exports = router;