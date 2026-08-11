const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

// =========================================================
// VALID COMMITTEES
// =========================================================

const VALID_COMMITTEES = [
  "Placement Committee",
  "Academic Committee",
  "Compliance Committee",
  "Working Committee",
];

// =========================================================
// COMMITTEE SLUG MAP
// =========================================================

const COMMITTEE_MAP = {
  placement: "Placement Committee",
  academic: "Academic Committee",
  compliance: "Compliance Committee",
  working: "Working Committee",
};

// =========================================================
// CLEAN MEMBER
// =========================================================

const cleanMember = (member) => {
  return {
    id: member.id,

    committeeName:
      member.committee_name || "",

    memberName:
      member.member_name || "",

    designation:
      member.designation || "",

    bio:
      member.bio || "",

    qualification:
      member.qualification || "",

    photoUrl:
      member.photo_url || null,

    displayOrder:
      Number(member.display_order) || 0,

    isActive:
      Boolean(member.is_active),

    createdAt:
      member.created_at,

    updatedAt:
      member.updated_at,
  };
};

// =========================================================
// VALIDATE COMMITTEE
// =========================================================

const validateCommittee = (committeeName) => {
  if (!committeeName) {
    return false;
  }

  return VALID_COMMITTEES.includes(
    String(committeeName).trim()
  );
};

// =========================================================
// DELETE CLOUDINARY IMAGE
// =========================================================

const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return;
    }

    const value =
      String(imageUrl).trim();

    // Only process Cloudinary URLs
    if (
      !value.includes(
        "res.cloudinary.com"
      )
    ) {
      return;
    }

    /*
      Example:

      https://res.cloudinary.com/zb5dk8tg/image/upload/v1234567890/snict/committee/committee-12345.jpg

      Public ID:

      snict/committee/committee-12345
    */

    const uploadMarker =
      "/upload/";

    const uploadIndex =
      value.indexOf(
        uploadMarker
      );

    if (
      uploadIndex === -1
    ) {
      return;
    }

    let publicPath =
      value.substring(
        uploadIndex +
          uploadMarker.length
      );

    // Remove query/hash
    publicPath =
      publicPath
        .split("?")[0]
        .split("#")[0];

    const parts =
      publicPath
        .split("/")
        .filter(Boolean);

    /*
      Find Cloudinary version.
      Example:
      v1234567890
    */

    const versionIndex =
      parts.findIndex(
        (part) =>
          /^v\d+$/.test(part)
      );

    if (
      versionIndex !== -1
    ) {
      publicPath =
        parts
          .slice(
            versionIndex + 1
          )
          .join("/");
    } else {
      publicPath =
        parts.join("/");
    }

    // Remove extension
    publicPath =
      publicPath.replace(
        /\.(jpg|jpeg|png|webp|gif|avif)$/i,
        ""
      );

    if (!publicPath) {
      return;
    }

    const result =
      await cloudinary.uploader.destroy(
        publicPath,
        {
          resource_type:
            "image",

          invalidate:
            true,
        }
      );

    if (
      result?.result !== "ok" &&
      result?.result !==
        "not found"
    ) {
      console.warn(
        "Cloudinary destroy result:",
        result?.result,
        publicPath
      );
    } else {
      console.log(
        "Cloudinary image deleted:",
        publicPath,
        result?.result
      );
    }

  } catch (error) {

    console.error(
      "Cloudinary image delete error:",
      error.message
    );
  }
};

// =========================================================
// GET UPLOADED PHOTO URL
// =========================================================

const getUploadedPhotoUrl = (
  req
) => {

  if (!req.file) {
    return null;
  }

  /*
    CloudinaryStorage provides
    the uploaded Cloudinary URL
    through req.file.path.
  */

  return (
    req.file.path ||
    null
  );
};

// =========================================================
// DELETE NEWLY UPLOADED IMAGE
// =========================================================

const cleanupUploadedImage =
  async (req) => {

    if (!req.file) {
      return;
    }

    try {

      await deleteCloudinaryImage(
        req.file.path
      );

    } catch (error) {

      console.error(
        "Uploaded Cloudinary image cleanup error:",
        error
      );
    }
  };

// =========================================================
// GET ALL ACTIVE COMMITTEE MEMBERS
// PUBLIC
// GET /api/committees
// =========================================================

const getCommitteeMembers =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            committee_name,
            member_name,
            designation,
            bio,
            qualification,
            photo_url,
            display_order,
            is_active,
            created_at,
            updated_at

          FROM committee_members

          WHERE is_active = TRUE

          ORDER BY
            CASE committee_name

              WHEN 'Placement Committee'
                THEN 1

              WHEN 'Academic Committee'
                THEN 2

              WHEN 'Compliance Committee'
                THEN 3

              WHEN 'Working Committee'
                THEN 4

              ELSE 5

            END,

            display_order ASC,
            id ASC
          `
        );

      return res.json({

        success: true,

        members:
          result.rows.map(
            cleanMember
          ),

      });

    } catch (error) {

      console.error(
        "Get committee members error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch committee members",

      });
    }
  };

// =========================================================
// GET MEMBERS BY COMMITTEE
// PUBLIC
// GET /api/committees/:committeeName
// =========================================================

const getCommitteeByName =
  async (
    req,
    res
  ) => {

    try {

      const {
        committeeName,
      } = req.params;

      const normalizedName =
        String(
          committeeName || ""
        )
          .trim()
          .toLowerCase();

      const actualCommittee =
        COMMITTEE_MAP[
          normalizedName
        ];

      if (
        !actualCommittee
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Invalid committee name",

          allowedCommittees:
            Object.keys(
              COMMITTEE_MAP
            ),

        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            committee_name,
            member_name,
            designation,
            bio,
            qualification,
            photo_url,
            display_order,
            is_active,
            created_at,
            updated_at

          FROM committee_members

          WHERE
            committee_name = $1
            AND is_active = TRUE

          ORDER BY
            display_order ASC,
            id ASC
          `,
          [
            actualCommittee,
          ]
        );

      return res.json({

        success: true,

        committee:
          actualCommittee,

        members:
          result.rows.map(
            cleanMember
          ),

      });

    } catch (error) {

      console.error(
        "Get committee by name error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch committee members",

      });
    }
  };

// =========================================================
// GET ALL COMMITTEE MEMBERS
// ADMIN
// GET /api/committees/admin
// =========================================================

const getAllCommitteeMembers =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            committee_name,
            member_name,
            designation,
            bio,
            qualification,
            photo_url,
            display_order,
            is_active,
            created_at,
            updated_at

          FROM committee_members

          ORDER BY
            CASE committee_name

              WHEN 'Placement Committee'
                THEN 1

              WHEN 'Academic Committee'
                THEN 2

              WHEN 'Compliance Committee'
                THEN 3

              WHEN 'Working Committee'
                THEN 4

              ELSE 5

            END,

            display_order ASC,
            id ASC
          `
        );

      return res.json({

        success: true,

        members:
          result.rows.map(
            cleanMember
          ),

      });

    } catch (error) {

      console.error(
        "Get all committee members error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch committee members",

      });
    }
  };

// =========================================================
// GET SINGLE MEMBER
// ADMIN
// GET /api/committees/admin/member/:id
// =========================================================

const getCommitteeMemberById =
  async (
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
            committee_name,
            member_name,
            designation,
            bio,
            qualification,
            photo_url,
            display_order,
            is_active,
            created_at,
            updated_at

          FROM committee_members

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
            "Committee member not found",

        });
      }

      return res.json({

        success: true,

        member:
          cleanMember(
            result.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Get committee member error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch committee member",

      });
    }
  };

// =========================================================
// ADD COMMITTEE MEMBER
// ADMIN
// POST /api/committees/admin
// =========================================================

const addCommitteeMember =
  async (
    req,
    res
  ) => {

    try {

      const {
        committeeName,
        memberName,
        designation,
        bio,
        qualification,
        displayOrder,
        isActive,
      } = req.body;

      // =====================================================
      // REQUIRED
      // =====================================================

      if (
        !committeeName ||
        !memberName
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Committee name and member name are required",

        });
      }

      // =====================================================
      // COMMITTEE
      // =====================================================

      const cleanCommitteeName =
        String(
          committeeName
        ).trim();

      if (
        !validateCommittee(
          cleanCommitteeName
        )
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Invalid committee name",

          allowedCommittees:
            VALID_COMMITTEES,

        });
      }

      // =====================================================
      // MEMBER NAME
      // =====================================================

      const cleanMemberName =
        String(
          memberName
        ).trim();

      if (
        !cleanMemberName
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Member name is required",

        });
      }

      if (
        cleanMemberName.length >
        150
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Member name cannot exceed 150 characters",

        });
      }

      // =====================================================
      // DESIGNATION
      // =====================================================

      const cleanDesignation =
        designation
          ? String(
              designation
            ).trim()
          : null;

      if (
        cleanDesignation &&
        cleanDesignation.length >
          150
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Designation cannot exceed 150 characters",

        });
      }

      // =====================================================
      // BIO
      // =====================================================

      const cleanBio =
        bio
          ? String(
              bio
            ).trim()
          : null;

      if (
        cleanBio &&
        cleanBio.length >
          2000
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Bio cannot exceed 2000 characters",

        });
      }

      // =====================================================
      // QUALIFICATION
      // =====================================================

      const cleanQualification =
        qualification
          ? String(
              qualification
            ).trim()
          : null;

      if (
        cleanQualification &&
        cleanQualification.length >
          250
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Qualification cannot exceed 250 characters",

        });
      }

      // =====================================================
      // PHOTO
      // =====================================================

      const photoUrl =
        getUploadedPhotoUrl(
          req
        );

      // =====================================================
      // DISPLAY ORDER
      // =====================================================

      const numericOrder =
        Number(
          displayOrder
        );

      const finalOrder =
        Number.isInteger(
          numericOrder
        ) &&
        numericOrder >= 0
          ? numericOrder
          : 0;

      // =====================================================
      // ACTIVE
      // =====================================================

      const finalIsActive =
        typeof isActive ===
          "undefined" ||
        isActive === null
          ? true
          : isActive !== false &&
            isActive !== "false";

      // =====================================================
      // INSERT
      // =====================================================

      const result =
        await pool.query(
          `
          INSERT INTO committee_members
          (
            committee_name,
            member_name,
            designation,
            bio,
            qualification,
            photo_url,
            display_order,
            is_active,
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
            $7,
            $8,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )

          RETURNING *
          `,
          [
            cleanCommitteeName,
            cleanMemberName,
            cleanDesignation,
            cleanBio,
            cleanQualification,
            photoUrl,
            finalOrder,
            finalIsActive,
          ]
        );

      return res.status(201).json({

        success: true,

        message:
          "Committee member added successfully",

        member:
          cleanMember(
            result.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Add committee member error:",
        error
      );

      // Delete uploaded Cloudinary image
      // if database insertion failed.

      await cleanupUploadedImage(
        req
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to add committee member",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });
    }
  };

// =========================================================
// UPDATE COMMITTEE MEMBER
// ADMIN
// PUT /api/committees/admin/:id
// =========================================================

const updateCommitteeMember =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        committeeName,
        memberName,
        designation,
        bio,
        qualification,
        displayOrder,
        isActive,
      } = req.body;

      // =====================================================
      // GET OLD MEMBER
      // =====================================================

      const existingResult =
        await pool.query(
          `
          SELECT *
          FROM committee_members
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );

      if (
        existingResult.rows.length ===
        0
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(404).json({

          success: false,

          message:
            "Committee member not found",

        });
      }

      const oldMember =
        existingResult.rows[0];

      // =====================================================
      // REQUIRED
      // =====================================================

      if (
        !committeeName ||
        !memberName
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Committee name and member name are required",

        });
      }

      // =====================================================
      // COMMITTEE
      // =====================================================

      const cleanCommitteeName =
        String(
          committeeName
        ).trim();

      if (
        !validateCommittee(
          cleanCommitteeName
        )
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Invalid committee name",

          allowedCommittees:
            VALID_COMMITTEES,

        });
      }

      // =====================================================
      // MEMBER NAME
      // =====================================================

      const cleanMemberName =
        String(
          memberName
        ).trim();

      if (
        !cleanMemberName
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Member name is required",

        });
      }

      if (
        cleanMemberName.length >
        150
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Member name cannot exceed 150 characters",

        });
      }

      // =====================================================
      // DESIGNATION
      // =====================================================

      const cleanDesignation =
        designation
          ? String(
              designation
            ).trim()
          : null;

      if (
        cleanDesignation &&
        cleanDesignation.length >
          150
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Designation cannot exceed 150 characters",

        });
      }

      // =====================================================
      // BIO
      // =====================================================

      const cleanBio =
        bio
          ? String(
              bio
            ).trim()
          : null;

      if (
        cleanBio &&
        cleanBio.length >
          2000
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Bio cannot exceed 2000 characters",

        });
      }

      // =====================================================
      // QUALIFICATION
      // =====================================================

      const cleanQualification =
        qualification
          ? String(
              qualification
            ).trim()
          : null;

      if (
        cleanQualification &&
        cleanQualification.length >
          250
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(400).json({

          success: false,

          message:
            "Qualification cannot exceed 250 characters",

        });
      }

      // =====================================================
      // PHOTO
      // =====================================================

      let finalPhotoUrl =
        oldMember.photo_url ||
        null;

      if (req.file) {

        finalPhotoUrl =
          getUploadedPhotoUrl(
            req
          );
      }

      // =====================================================
      // DISPLAY ORDER
      // =====================================================

      const numericOrder =
        Number(
          displayOrder
        );

      const finalOrder =
        Number.isInteger(
          numericOrder
        ) &&
        numericOrder >= 0
          ? numericOrder
          : Number(
              oldMember.display_order
            ) || 0;

      // =====================================================
      // ACTIVE
      // =====================================================

      const finalIsActive =
        typeof isActive ===
          "undefined" ||
        isActive === null
          ? Boolean(
              oldMember.is_active
            )
          : isActive !== false &&
            isActive !== "false";

      // =====================================================
      // UPDATE
      // =====================================================

      const result =
        await pool.query(
          `
          UPDATE committee_members

          SET
            committee_name = $1,
            member_name = $2,
            designation = $3,
            bio = $4,
            qualification = $5,
            photo_url = $6,
            display_order = $7,
            is_active = $8,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $9

          RETURNING *
          `,
          [
            cleanCommitteeName,
            cleanMemberName,
            cleanDesignation,
            cleanBio,
            cleanQualification,
            finalPhotoUrl,
            finalOrder,
            finalIsActive,
            id,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {

        await cleanupUploadedImage(
          req
        );

        return res.status(404).json({

          success: false,

          message:
            "Committee member not found",

        });
      }

      // =====================================================
      // DELETE OLD CLOUDINARY IMAGE
      // ONLY AFTER DB UPDATE SUCCESS
      // =====================================================

      if (
        req.file &&
        oldMember.photo_url &&
        oldMember.photo_url !==
          finalPhotoUrl
      ) {

        await deleteCloudinaryImage(
          oldMember.photo_url
        );
      }

      return res.json({

        success: true,

        message:
          "Committee member updated successfully",

        member:
          cleanMember(
            result.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Update committee member error:",
        error
      );

      // Delete newly uploaded image
      // if update failed.

      await cleanupUploadedImage(
        req
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to update committee member",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });
    }
  };

// =========================================================
// DELETE COMMITTEE MEMBER
// ADMIN
// DELETE /api/committees/admin/:id
// =========================================================

const deleteCommitteeMember =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      // =====================================================
      // GET IMAGE BEFORE DELETE
      // =====================================================

      const existingResult =
        await pool.query(
          `
          SELECT
            id,
            photo_url

          FROM committee_members

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
            "Committee member not found",

        });
      }

      const oldPhoto =
        existingResult.rows[0]
          .photo_url;

      // =====================================================
      // DELETE MEMBER
      // =====================================================

      const result =
        await pool.query(
          `
          DELETE FROM committee_members

          WHERE id = $1

          RETURNING id
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
            "Committee member not found",

        });
      }

      // =====================================================
      // DELETE CLOUDINARY IMAGE
      // =====================================================

      if (oldPhoto) {

        await deleteCloudinaryImage(
          oldPhoto
        );
      }

      return res.json({

        success: true,

        message:
          "Committee member deleted successfully",

      });

    } catch (error) {

      console.error(
        "Delete committee member error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to delete committee member",

      });
    }
  };

// =========================================================
// EXPORT
// =========================================================

module.exports = {

  getCommitteeMembers,

  getCommitteeByName,

  getAllCommitteeMembers,

  getCommitteeMemberById,

  addCommitteeMember,

  updateCommitteeMember,

  deleteCommitteeMember,

};