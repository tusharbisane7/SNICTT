const pool = require("../config/db");

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
// Convert database field names to frontend-friendly names
// =========================================================

const cleanMember = (member) => {
  return {
    id: member.id,

    committeeName:
      member.committee_name,

    memberName:
      member.member_name,

    designation:
      member.designation || "",

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
// GET ALL ACTIVE COMMITTEE MEMBERS
// PUBLIC
//
// GET /api/committees
// =========================================================

const getCommitteeMembers = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        committee_name,
        member_name,
        designation,
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
        result.rows.map(cleanMember),
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
//
// GET /api/committees/placement
// GET /api/committees/academic
// GET /api/committees/compliance
// GET /api/committees/working
// =========================================================

const getCommitteeByName = async (
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

    if (!actualCommittee) {
      return res.status(404).json({
        success: false,

        message:
          "Invalid committee name",

        allowedCommittees:
          Object.keys(COMMITTEE_MAP),
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        committee_name,
        member_name,
        designation,
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
// GET ALL MEMBERS INCLUDING INACTIVE
// ADMIN
//
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
//
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
        result.rows.length === 0
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
//
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
        qualification,
        photoUrl,
        displayOrder,
        isActive,
      } = req.body;


      // =====================================================
      // REQUIRED FIELDS
      // =====================================================

      if (
        !committeeName ||
        !memberName
      ) {
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

      if (!cleanMemberName) {
        return res.status(400).json({
          success: false,

          message:
            "Member name is required",
        });
      }

      if (
        cleanMemberName.length > 150
      ) {
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
        cleanDesignation.length > 150
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Designation cannot exceed 150 characters",
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
        cleanQualification.length > 250
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Qualification cannot exceed 250 characters",
        });
      }


      // =====================================================
      // PHOTO URL
      // =====================================================

      const cleanPhotoUrl =
        photoUrl
          ? String(
              photoUrl
            ).trim()
          : null;


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
      // ACTIVE STATUS
      // =====================================================

      const finalIsActive =
        isActive !== false;


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
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )

          RETURNING *
          `,
          [
            cleanCommitteeName,

            cleanMemberName,

            cleanDesignation,

            cleanQualification,

            cleanPhotoUrl,

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
//
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
        qualification,
        photoUrl,
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
        return res.status(400).json({
          success: false,

          message:
            "Member name is required",
        });
      }

      if (
        cleanMemberName.length > 150
      ) {
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
        cleanDesignation.length > 150
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Designation cannot exceed 150 characters",
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
        cleanQualification.length > 250
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Qualification cannot exceed 250 characters",
        });
      }


      // =====================================================
      // PHOTO
      // =====================================================

      const cleanPhotoUrl =
        photoUrl
          ? String(
              photoUrl
            ).trim()
          : null;


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
        isActive !== false;


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
            qualification = $4,
            photo_url = $5,
            display_order = $6,
            is_active = $7,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $8

          RETURNING *
          `,
          [
            cleanCommitteeName,

            cleanMemberName,

            cleanDesignation,

            cleanQualification,

            cleanPhotoUrl,

            finalOrder,

            finalIsActive,

            id,
          ]
        );


      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Committee member not found",
        });
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
//
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
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Committee member not found",
        });
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