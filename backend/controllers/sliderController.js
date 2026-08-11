const pool = require("../config/db");

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
// HELPER - GET UPLOADED IMAGE URL
// =========================================================

const getUploadedImageUrl = (req) => {

  if (!req.file) {
    return "";
  }

  /*
   * Multer gives us the uploaded filename.
   *
   * Example:
   * req.file.filename
   * = slider-1723456789.jpg
   */

  const baseUrl =
    process.env.BACKEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  return `${baseUrl}/uploads/sliders/${req.file.filename}`;
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
      result.rows.length === 0
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
//
// IMPORTANT:
// This route expects:
//
// upload.single("image")
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
          "Please select a slider image from your desktop",

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
    // IMAGE URL
    // =====================================================

    const imageUrl =
      getUploadedImageUrl(req);


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

    const order =
      Number.isInteger(
        Number(displayOrder)
      )
        ? Number(displayOrder)
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
//
// IMAGE IS OPTIONAL DURING UPDATE
//
// If admin selects a new image:
// new image replaces old image.
//
// If no image selected:
// existing image remains.
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
    // CHECK EXISTING SLIDER
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
      existingResult.rows.length === 0
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


    // =====================================================
    // IF NEW IMAGE SELECTED
    // =====================================================

    if (req.file) {

      imageUrl =
        getUploadedImageUrl(req);

    }


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

    const order =
      Number.isInteger(
        Number(displayOrder)
      )
        ? Number(displayOrder)
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
    // UPDATE
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


    const result =
      await pool.query(
        `
        DELETE FROM sliders

        WHERE id = $1

        RETURNING *
        `,
        [id]
      );


    if (
      result.rows.length === 0
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
      result.rows.length === 0
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