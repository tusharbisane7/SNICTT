const pool = require("../config/db");
const QRCode = require("qrcode");

// =========================================================
// HELPER - CLEAN MEMBERSHIP
// =========================================================

const cleanMembership = (membership) => {
  return {
    id: membership.id,

    userId:
      membership.user_id,

    membershipNumber:
      membership.membership_number,

    membershipType:
      membership.membership_type,

    status:
      membership.status,

    appliedAt:
      membership.applied_at,

    approvedAt:
      membership.approved_at,

    rejectedAt:
      membership.rejected_at,

    rejectionReason:
      membership.rejection_reason,

    qrCode:
      membership.qr_code || null,

    updatedAt:
      membership.updated_at,

    user: membership.full_name
      ? {
          id:
            membership.user_id,

          fullName:
            membership.full_name,

          username:
            membership.username,

          email:
            membership.email,

          mobile:
            membership.mobile,

          age:
            membership.age,

          sex:
            membership.sex,

          address:
            membership.address,

          bloodGroup:
            membership.blood_group,
        }
      : undefined,
  };
};

// =========================================================
// USER - GET MY MEMBERSHIP
// GET /api/membership/me
// =========================================================

const getMyMembership = async (
  req,
  res
) => {
  try {
    const userId =
      req.userId;

    const result =
      await pool.query(
        `
        SELECT

          m.id,
          m.user_id,
          m.membership_number,
          m.membership_type,
          m.status,
          m.applied_at,
          m.approved_at,
          m.rejected_at,
          m.rejection_reason,
          m.qr_code,
          m.updated_at,

          u.full_name,
          u.username,
          u.email,
          u.mobile,
          u.age,
          u.sex,
          u.address,
          u.blood_group

        FROM memberships m

        INNER JOIN users u
          ON u.id = m.user_id

        WHERE m.user_id = $1

        LIMIT 1
        `,
        [userId]
      );

    // =====================================================
    // NO MEMBERSHIP
    // =====================================================

    if (
      result.rows.length ===
      0
    ) {
      return res.json({
        success: true,

        hasMembership:
          false,

        membership:
          null,
      });
    }

    return res.json({
      success: true,

      hasMembership:
        true,

      membership:
        cleanMembership(
          result.rows[0]
        ),
    });

  } catch (error) {

    console.error(
      "Get my membership error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load membership",
    });
  }
};

// =========================================================
// USER - APPLY FOR MEMBERSHIP
// POST /api/membership/apply
// =========================================================

const applyMembership = async (
  req,
  res
) => {
  try {

    const userId =
      req.userId;

    // =====================================================
    // CHECK USER
    // =====================================================

    const userResult =
      await pool.query(
        `
        SELECT

          id,
          full_name,
          username,
          email,
          mobile,
          age,
          sex,
          address,
          blood_group

        FROM users

        WHERE id = $1

        LIMIT 1
        `,
        [userId]
      );

    if (
      userResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,

        message:
          "User account not found",
      });
    }

    // =====================================================
    // CHECK EXISTING MEMBERSHIP
    // =====================================================

    const existingResult =
      await pool.query(
        `
        SELECT *
        FROM memberships

        WHERE user_id = $1

        LIMIT 1
        `,
        [userId]
      );

    // =====================================================
    // EXISTING APPLICATION
    // =====================================================

    if (
      existingResult.rows.length >
      0
    ) {

      const existing =
        existingResult.rows[0];

      // ---------------------------------------------------
      // APPROVED
      // ---------------------------------------------------

      if (
        existing.status ===
        "approved"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "You are already an approved member",

          membership:
            cleanMembership(
              existing
            ),
        });
      }

      // ---------------------------------------------------
      // PENDING
      // ---------------------------------------------------

      if (
        existing.status ===
        "pending"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Your membership application is already under review",

          membership:
            cleanMembership(
              existing
            ),
        });
      }

      // ---------------------------------------------------
      // REJECTED
      // Allow re-application
      // ---------------------------------------------------

      if (
        existing.status ===
        "rejected"
      ) {

        const result =
          await pool.query(
            `
            UPDATE memberships

            SET

              status =
                'pending',

              membership_number =
                NULL,

              applied_at =
                CURRENT_TIMESTAMP,

              approved_at =
                NULL,

              rejected_at =
                NULL,

              rejection_reason =
                NULL,

              qr_code =
                NULL,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE user_id = $1

            RETURNING *
            `,
            [userId]
          );

        return res.json({
          success: true,

          message:
            "Membership application submitted successfully",

          membership:
            cleanMembership(
              result.rows[0]
            ),
        });
      }
    }

    // =====================================================
    // CREATE NEW MEMBERSHIP
    // =====================================================

    const result =
      await pool.query(
        `
        INSERT INTO memberships
        (
          user_id,
          membership_type,
          status,
          applied_at
        )

        VALUES
        (
          $1,
          'regular',
          'pending',
          CURRENT_TIMESTAMP
        )

        RETURNING *
        `,
        [userId]
      );

    return res.status(201).json({
      success: true,

      message:
        "Membership application submitted successfully",

      membership:
        cleanMembership(
          result.rows[0]
        ),
    });

  } catch (error) {

    console.error(
      "Apply membership error:",
      error
    );

    // PostgreSQL duplicate user_id
    if (
      error.code ===
      "23505"
    ) {
      return res.status(409).json({
        success: false,

        message:
          "A membership application already exists for this account",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Unable to submit membership application",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// ADMIN - GET ALL MEMBERSHIPS
// GET /api/membership/admin
// =========================================================

const getAllMemberships =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            m.id,
            m.user_id,
            m.membership_number,
            m.membership_type,
            m.status,
            m.applied_at,
            m.approved_at,
            m.rejected_at,
            m.rejection_reason,
            m.qr_code,
            m.updated_at,

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.age,
            u.sex,
            u.address,
            u.blood_group

          FROM memberships m

          INNER JOIN users u
            ON u.id = m.user_id

          ORDER BY
            CASE
              WHEN m.status = 'pending'
                THEN 1

              WHEN m.status = 'approved'
                THEN 2

              WHEN m.status = 'rejected'
                THEN 3

              ELSE 4
            END,

            m.applied_at DESC
          `
        );

      return res.json({
        success: true,

        memberships:
          result.rows.map(
            cleanMembership
          ),
      });

    } catch (error) {

      console.error(
        "Get memberships error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch memberships",
      });
    }
  };

// =========================================================
// ADMIN - GET SINGLE MEMBERSHIP
// GET /api/membership/admin/:id
// =========================================================

const getMembershipById =
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

            m.id,
            m.user_id,
            m.membership_number,
            m.membership_type,
            m.status,
            m.applied_at,
            m.approved_at,
            m.rejected_at,
            m.rejection_reason,
            m.qr_code,
            m.updated_at,

            u.full_name,
            u.username,
            u.email,
            u.mobile,
            u.age,
            u.sex,
            u.address,
            u.blood_group

          FROM memberships m

          INNER JOIN users u
            ON u.id = m.user_id

          WHERE m.id = $1

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
            "Membership not found",
        });
      }

      return res.json({
        success: true,

        membership:
          cleanMembership(
            result.rows[0]
          ),
      });

    } catch (error) {

      console.error(
        "Get membership error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load membership",
      });
    }
  };

// =========================================================
// ADMIN - APPROVE MEMBERSHIP
// PUT /api/membership/admin/:id/approve
// =========================================================

const approveMembership =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();

    try {

      const {
        id,
      } = req.params;

      const adminId =
        req.adminId || null;

      await client.query(
        "BEGIN"
      );

      // ===================================================
      // LOCK MEMBERSHIP
      // ===================================================

      const membershipResult =
        await client.query(
          `
          SELECT *

          FROM memberships

          WHERE id = $1

          FOR UPDATE
          `,
          [id]
        );

      if (
        membershipResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,

          message:
            "Membership not found",
        });
      }

      const membership =
        membershipResult.rows[0];

      // ===================================================
      // ALREADY APPROVED
      // ===================================================

      if (
        membership.status ===
        "approved"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,

          message:
            "Membership is already approved",

          membership:
            cleanMembership(
              membership
            ),
        });
      }

      // ===================================================
      // ONLY PENDING CAN BE APPROVED
      // ===================================================

      if (
        membership.status !==
        "pending"
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,

          message:
            "Only pending membership applications can be approved",
        });
      }

      // ===================================================
      // PREVENT DUPLICATE MEMBERSHIP NUMBER
      // ===================================================
      //
      // Advisory lock ensures that two admins approving
      // at exactly the same time do not generate the
      // same membership number.
      //
      // ===================================================

      await client.query(
        `
        SELECT
          pg_advisory_xact_lock(
            782341
          )
        `
      );

      // ===================================================
      // GET NEXT MEMBERSHIP NUMBER
      // ===================================================

      const year =
        new Date()
          .getFullYear();

      const countResult =
        await client.query(
          `
          SELECT COUNT(*)::INTEGER AS count

          FROM memberships

          WHERE status = 'approved'
          `
        );

      const nextNumber =
        Number(
          countResult.rows[0].count ||
            0
        ) + 1;

      const membershipNumber =
        `SNICT-${year}-${String(
          nextNumber
        ).padStart(5, "0")}`;

      // ===================================================
      // CREATE QR DATA
      // ===================================================

      const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

      const verificationUrl =
        `${clientUrl}/membership/verify/${membershipNumber}`;

      // ===================================================
      // GENERATE QR CODE
      // ===================================================

      const qrCode =
        await QRCode.toDataURL(
          verificationUrl,
          {
            width: 500,

            margin: 2,

            errorCorrectionLevel:
              "H",
          }
        );

      // ===================================================
      // APPROVE MEMBERSHIP
      // ===================================================

      const result =
        await client.query(
          `
          UPDATE memberships

          SET

            membership_number =
              $1,

            status =
              'approved',

            approved_at =
              CURRENT_TIMESTAMP,

            rejected_at =
              NULL,

            rejection_reason =
              NULL,

            qr_code =
              $2,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $3

          RETURNING *
          `,
          [
            membershipNumber,

            qrCode,

            id,
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,

        message:
          "Membership approved successfully",

        membership:
          cleanMembership(
            result.rows[0]
          ),
      });

    } catch (error) {

      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (
        rollbackError
      ) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }

      console.error(
        "Approve membership error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to approve membership",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      });

    } finally {

      client.release();

    }
  };

// =========================================================
// ADMIN - REJECT MEMBERSHIP
// PUT /api/membership/admin/:id/reject
// =========================================================

const rejectMembership =
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        reason,
      } = req.body;

      const rejectionReason =
        String(
          reason || ""
        ).trim();

      // ===================================================
      // VALIDATE REASON
      // ===================================================

      if (
        !rejectionReason
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Rejection reason is required",
        });
      }

      // ===================================================
      // CHECK MEMBERSHIP
      // ===================================================

      const existing =
        await pool.query(
          `
          SELECT

            id,
            status

          FROM memberships

          WHERE id = $1

          LIMIT 1
          `,
          [id]
        );

      if (
        existing.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Membership not found",
        });
      }

      // ===================================================
      // ONLY PENDING CAN BE REJECTED
      // ===================================================

      if (
        existing.rows[0].status !==
        "pending"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only pending membership applications can be rejected",
        });
      }

      // ===================================================
      // REJECT
      // ===================================================

      const result =
        await pool.query(
          `
          UPDATE memberships

          SET

            status =
              'rejected',

            rejected_at =
              CURRENT_TIMESTAMP,

            rejection_reason =
              $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING *
          `,
          [
            rejectionReason,

            id,
          ]
        );

      return res.json({
        success: true,

        message:
          "Membership rejected successfully",

        membership:
          cleanMembership(
            result.rows[0]
          ),
      });

    } catch (error) {

      console.error(
        "Reject membership error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to reject membership",

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

  getMyMembership,

  applyMembership,

  getAllMemberships,

  getMembershipById,

  approveMembership,

  rejectMembership,

};