const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

// =========================================================
// CLEAN SLIDER
// =========================================================

const cleanSlider = (slider) => {
  return {
    id: slider.id,

    imageUrl:
      slider.image_url || "",

    title:
      slider.title || "",

    description:
      slider.description || "",

    slideDate:
      slider.slide_date || null,

    displayOrder:
      Number(slider.display_order || 0),

    published:
      Boolean(slider.published),

    createdAt:
      slider.created_at,

    updatedAt:
      slider.updated_at,
  };
};

// =========================================================
// GET CLOUDINARY IMAGE URL
// =========================================================
//
// With CloudinaryStorage:
//
// req.file.path
//
// contains the complete Cloudinary URL.
//
// Example:
//
// https://res.cloudinary.com/zb5dk8tg/image/upload/...
//
// =========================================================

const getUploadedImageUrl = (req) => {
  if (!req.file) {
    return "";
  }

  // Cloudinary URL
  return (
    req.file.path ||
    req.file.secure_url ||
    ""
  );
};

// =========================================================
// GET CLOUDINARY PUBLIC ID FROM URL
// =========================================================
//
// Used when replacing/deleting an old Cloudinary image.
//
// Example URL:
//
// https://res.cloudinary.com/zb5dk8tg/image/upload/v1234567890/
// snict/sliders/slider-12345.jpg
//
// Returns:
//
// snict/sliders/slider-12345
//
// =========================================================

const getCloudinaryPublicId = (imageUrl) => {
  try {
    if (!imageUrl) {
      return null;
    }

    // Only process Cloudinary URLs
    if (
      !imageUrl.includes(
        "res.cloudinary.com"
      )
    ) {
      return null;
    }

    const uploadMarker =
      "/upload/";

    const uploadIndex =
      imageUrl.indexOf(
        uploadMarker
      );

    if (uploadIndex === -1) {
      return null;
    }

    let publicPath =
      imageUrl.substring(
        uploadIndex +
          uploadMarker.length
      );

    // Remove transformation/version information
    const parts =
      publicPath.split("/");

    // Remove version such as v123456789
    if (
      parts[0] &&
      /^v\d+$/.test(parts[0])
    ) {
      parts.shift();
    }

    publicPath =
      parts.join("/");

    // Remove extension
    publicPath =
      publicPath.replace(
        /\.(jpg|jpeg|png|webp|gif)$/i,
        ""
      );

    return publicPath || null;

  } catch (error) {
    console.error(
      "Cloudinary public ID extraction error:",
      error
    );

    return null;
  }
};

// =========================================================
// DELETE CLOUDINARY IMAGE
// =========================================================

const deleteCloudinaryImage = async (
  imageUrl
) => {
  try {
    const publicId =
      getCloudinaryPublicId(
        imageUrl
      );

    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );

    console.log(
      "Cloudinary image deleted:",
      publicId
    );

  } catch (error) {
    console.error(
      "Cloudinary image delete error:",
      error.message
    );

    // Do not fail the database operation
    // just because old image deletion failed.
  }
};

// =========================================================
// PUBLIC - GET PUBLISHED SLIDERS
// GET /api/sliders
// =========================================================

const getSliders = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(
        `
        SELECT

          id,
          image_url,
          title,
          description,
          slide_date,
          display_order,
          published,
          created_at,
          updated_at

        FROM sliders

        WHERE published = TRUE

        ORDER BY
          display_order ASC,
          id ASC
        `
      );

    return res.json({
      success: true,

      sliders:
        result.rows.map(
          cleanSlider
        ),
    });

  } catch (error) {
    console.error(
      "Get sliders error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load sliders",
    });
  }
};

// =========================================================
// ADMIN - GET ALL SLIDERS
// GET /api/sliders/admin/all
// =========================================================

const getAllSliders = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(
        `
        SELECT

          id,
          image_url,
          title,
          description,
          slide_date,
          display_order,
          published,
          created_at,
          updated_at

        FROM sliders

        ORDER BY
          display_order ASC,
          id ASC
        `
      );

    return res.json({
      success: true,

      sliders:
        result.rows.map(
          cleanSlider
        ),
    });

  } catch (error) {
    console.error(
      "Get all sliders error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load slider management data",
    });
  }
};

// =========================================================
// ADMIN - GET SINGLE SLIDER
// GET /api/sliders/admin/:id
// =========================================================

const getSliderById = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const result =
      await pool.query(
        `
        SELECT

          id,
          image_url,
          title,
          description,
          slide_date,
          display_order,
          published,
          created_at,
          updated_at

        FROM sliders

        WHERE id = $1

        LIMIT 1
        `,
        [id]
      );

    if (
      result.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,

        message:
          "Slider not found",
      });
    }

    return res.json({
      success: true,

      slider:
        cleanSlider(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Get slider error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load slider",
    });
  }
};

// =========================================================
// ADMIN - CREATE SLIDER
// POST /api/sliders/admin
// =========================================================
//
// Expected:
//
// Content-Type:
// multipart/form-data
//
// Image field:
// image
//
// =========================================================

const createSlider = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      slideDate,
      displayOrder,
      published,
    } = req.body;

    // =====================================================
    // IMAGE VALIDATION
    // =====================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,

        message:
          "Please select a slider image",
      });
    }

    // =====================================================
    // TITLE
    // =====================================================

    const cleanTitle =
      String(
        title || ""
      ).trim();

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,

        message:
          "Slider title is required",
      });
    }

    // =====================================================
    // DESCRIPTION
    // =====================================================

    const cleanDescription =
      String(
        description || ""
      ).trim();

    // =====================================================
    // CLOUDINARY IMAGE URL
    // =====================================================

    const imageUrl =
      getUploadedImageUrl(
        req
      );

    if (!imageUrl) {
      return res.status(400).json({
        success: false,

        message:
          "Unable to process uploaded image",
      });
    }

    // =====================================================
    // DISPLAY ORDER
    // =====================================================

    const parsedOrder =
      Number(displayOrder);

    const order =
      Number.isInteger(
        parsedOrder
      )
        ? parsedOrder
        : 0;

    // =====================================================
    // PUBLISHED
    // =====================================================

    let isPublished = true;

    if (
      published !== undefined
    ) {
      isPublished =
        published === true ||
        published === "true";
    }

    // =====================================================
    // INSERT
    // =====================================================

    const result =
      await pool.query(
        `
        INSERT INTO sliders
        (
          image_url,
          title,
          description,
          slide_date,
          display_order,
          published,
          created_at,
          updated_at
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )

        RETURNING *
        `,
        [
          imageUrl,

          cleanTitle,

          cleanDescription ||
            null,

          slideDate ||
            null,

          order,

          isPublished,
        ]
      );

    return res.status(201).json({
      success: true,

      message:
        "Slider created successfully",

      slider:
        cleanSlider(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Create slider error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to create slider",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// ADMIN - UPDATE SLIDER
// PUT /api/sliders/admin/:id
// =========================================================
//
// Image is OPTIONAL.
//
// If new image:
//   upload to Cloudinary
//   save new URL
//   delete old Cloudinary image
//
// If no image:
//   keep existing image
//
// =========================================================

const updateSlider = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      title,
      description,
      slideDate,
      displayOrder,
      published,
    } = req.body;

    // =====================================================
    // TITLE
    // =====================================================

    const cleanTitle =
      String(
        title || ""
      ).trim();

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,

        message:
          "Slider title is required",
      });
    }

    // =====================================================
    // GET EXISTING SLIDER
    // =====================================================

    const existingResult =
      await pool.query(
        `
        SELECT *

        FROM sliders

        WHERE id = $1

        LIMIT 1
        `,
        [id]
      );

    if (
      existingResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,

        message:
          "Slider not found",
      });
    }

    const existing =
      existingResult.rows[0];

    // =====================================================
    // IMAGE
    // =====================================================

    let imageUrl =
      existing.image_url || "";

    let oldImageUrl = null;

    // =====================================================
    // NEW IMAGE SELECTED
    // =====================================================

    if (req.file) {
      const newImageUrl =
        getUploadedImageUrl(
          req
        );

      if (!newImageUrl) {
        return res.status(400).json({
          success: false,

          message:
            "Unable to process uploaded image",
        });
      }

      oldImageUrl =
        existing.image_url;

      imageUrl =
        newImageUrl;
    }

    // =====================================================
    // IMAGE REQUIRED
    // =====================================================

    if (!imageUrl) {
      return res.status(400).json({
        success: false,

        message:
          "Slider image is required",
      });
    }

    // =====================================================
    // DESCRIPTION
    // =====================================================

    const cleanDescription =
      String(
        description || ""
      ).trim();

    // =====================================================
    // DISPLAY ORDER
    // =====================================================

    const parsedOrder =
      Number(displayOrder);

    const order =
      Number.isInteger(
        parsedOrder
      )
        ? parsedOrder
        : 0;

    // =====================================================
    // PUBLISHED
    // =====================================================

    let isPublished = true;

    if (
      published !== undefined
    ) {
      isPublished =
        published === true ||
        published === "true";
    }

    // =====================================================
    // UPDATE DATABASE
    // =====================================================

    const result =
      await pool.query(
        `
        UPDATE sliders

        SET

          image_url = $1,

          title = $2,

          description = $3,

          slide_date = $4,

          display_order = $5,

          published = $6,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $7

        RETURNING *
        `,
        [
          imageUrl,

          cleanTitle,

          cleanDescription ||
            null,

          slideDate ||
            null,

          order,

          isPublished,

          id,
        ]
      );

    // =====================================================
    // DELETE OLD CLOUDINARY IMAGE
    // =====================================================
    //
    // Only after database update succeeds.
    //
    // This prevents losing the old image if the DB update
    // fails.
    //
    // =====================================================

    if (
      oldImageUrl &&
      oldImageUrl !== imageUrl
    ) {
      await deleteCloudinaryImage(
        oldImageUrl
      );
    }

    return res.json({
      success: true,

      message:
        "Slider updated successfully",

      slider:
        cleanSlider(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Update slider error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to update slider",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// ADMIN - DELETE SLIDER
// DELETE /api/sliders/admin/:id
// =========================================================

const deleteSlider = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    // =====================================================
    // GET IMAGE FIRST
    // =====================================================

    const existingResult =
      await pool.query(
        `
        SELECT *

        FROM sliders

        WHERE id = $1

        LIMIT 1
        `,
        [id]
      );

    if (
      existingResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,

        message:
          "Slider not found",
      });
    }

    const existing =
      existingResult.rows[0];

    // =====================================================
    // DELETE DATABASE RECORD
    // =====================================================

    const result =
      await pool.query(
        `
        DELETE FROM sliders

        WHERE id = $1

        RETURNING *
        `,
        [id]
      );

    // =====================================================
    // DELETE CLOUDINARY IMAGE
    // =====================================================

    if (
      existing.image_url
    ) {
      await deleteCloudinaryImage(
        existing.image_url
      );
    }

    return res.json({
      success: true,

      message:
        "Slider deleted successfully",

      slider:
        cleanSlider(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Delete slider error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to delete slider",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// ADMIN - TOGGLE PUBLISHED
// PATCH /api/sliders/admin/:id/toggle
// =========================================================

const toggleSlider = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const result =
      await pool.query(
        `
        UPDATE sliders

        SET

          published =
            NOT published,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING *
        `,
        [id]
      );

    if (
      result.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,

        message:
          "Slider not found",
      });
    }

    return res.json({
      success: true,

      message:
        result.rows[0].published
          ? "Slider published successfully"
          : "Slider unpublished successfully",

      slider:
        cleanSlider(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Toggle slider error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to change slider status",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getSliders,

  getAllSliders,

  getSliderById,

  createSlider,

  updateSlider,

  deleteSlider,

  toggleSlider,
};