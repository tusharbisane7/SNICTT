const pool = require("../config/db");
const QRCode = require("qrcode");

// =========================================================
// MEMBERSHIP SCHEMA INITIALIZATION
// =========================================================

let schemaPromise = null;

const ensureMembershipSchema = async () => {
  if (schemaPromise) {
    return schemaPromise;
  }

  schemaPromise = (async () => {
    // -------------------------------------------------------
    // Existing memberships table
    // -------------------------------------------------------

    await pool.query(`
      ALTER TABLE memberships
        ADD COLUMN IF NOT EXISTS plan_id INTEGER,
        ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS duration_years INTEGER,
        ADD COLUMN IF NOT EXISTS utr_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30)
          DEFAULT 'not_submitted',
        ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP
    `);

    // -------------------------------------------------------
    // Membership plans
    // -------------------------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        duration_years INTEGER NOT NULL,
        price NUMERIC(12,2) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // -------------------------------------------------------
    // Payment settings
    // -------------------------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_payment_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        upi_id VARCHAR(255),
        account_name VARCHAR(255),
        qr_code TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // -------------------------------------------------------
    // Default payment settings
    // -------------------------------------------------------

    await pool.query(`
      INSERT INTO membership_payment_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    // -------------------------------------------------------
    // Default membership plans
    // -------------------------------------------------------

    const plansResult = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM membership_plans
    `);

    if (
      Number(plansResult.rows[0].count) === 0
    ) {
      await pool.query(`
        INSERT INTO membership_plans
        (
          name,
          duration_years,
          price,
          is_active
        )
        VALUES
        (
          '1 Year Membership',
          1,
          0,
          TRUE
        ),
        (
          '2 Year Membership',
          2,
          0,
          TRUE
        )
      `);

      console.log(
        "Default membership plans created."
      );
    }

    // -------------------------------------------------------
    // Helpful index for UTR
    // -------------------------------------------------------

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      idx_memberships_utr_number
      ON memberships(utr_number)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      idx_memberships_user_id
      ON memberships(user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      idx_memberships_status
      ON memberships(status)
    `);

    console.log(
      "Membership schema verified"
    );
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  return schemaPromise;
};

// =========================================================
// CLIENT URL
// =========================================================

const getClientUrl = () => {
  const configuredUrl =
    String(
      process.env.CLIENT_URL || ""
    ).trim();

  // -------------------------------------------------------
  // Production MUST have CLIENT_URL
  // -------------------------------------------------------

  if (
    process.env.NODE_ENV === "production"
  ) {
    if (!configuredUrl) {
      throw new Error(
        "CLIENT_URL is missing in production. Set CLIENT_URL to your live frontend URL."
      );
    }
  }

  return (
    configuredUrl ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
};

// =========================================================
// GENERATE MEMBERSHIP QR
// =========================================================

const generateMembershipQr = async (
  membershipNumber
) => {
  const clientUrl =
    getClientUrl();

  const verificationUrl =
    `${clientUrl}/membership/verify/${encodeURIComponent(
      membershipNumber
    )}`;

  console.log(
    "Membership verification URL:",
    verificationUrl
  );

  return QRCode.toDataURL(
    verificationUrl,
    {
      width: 500,
      margin: 2,
      errorCorrectionLevel: "H",
    }
  );
};

// =========================================================
// CLEAN MEMBERSHIP
// =========================================================

const cleanMembership = (
  membership
) => {
  if (!membership) {
    return null;
  }

  return {
    id:
      membership.id,

    userId:
      membership.user_id,

    membershipNumber:
      membership.membership_number ||
      null,

    membershipType:
      membership.membership_type ||
      null,

    status:
      membership.status ||
      null,

    planId:
      membership.plan_id ||
      null,

    planName:
      membership.plan_name ||
      null,

    amount:
      membership.amount !== null &&
      membership.amount !== undefined
        ? Number(membership.amount)
        : null,

    durationYears:
      membership.duration_years !== null &&
      membership.duration_years !== undefined
        ? Number(
            membership.duration_years
          )
        : null,

    utrNumber:
      membership.utr_number ||
      null,

    paymentStatus:
      membership.payment_status ||
      "not_submitted",

    paymentSubmittedAt:
      membership.payment_submitted_at ||
      null,

    appliedAt:
      membership.applied_at ||
      null,

    approvedAt:
      membership.approved_at ||
      null,

    startDate:
      membership.start_date ||
      null,

    expiryDate:
      membership.expiry_date ||
      null,

    rejectedAt:
      membership.rejected_at ||
      null,

    rejectionReason:
      membership.rejection_reason ||
      null,

    qrCode:
      membership.qr_code ||
      null,

    updatedAt:
      membership.updated_at ||
      null,

    user:
      membership.full_name
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
// MEMBERSHIP SELECT
// =========================================================

const membershipSelect = `
  SELECT

    m.id,
    m.user_id,
    m.membership_number,
    m.membership_type,
    m.status,

    m.plan_id,
    m.amount,
    m.duration_years,

    m.utr_number,
    m.payment_status,
    m.payment_submitted_at,

    m.applied_at,
    m.approved_at,

    m.start_date,
    m.expiry_date,

    m.rejected_at,
    m.rejection_reason,

    m.qr_code,
    m.updated_at,

    p.name AS plan_name,

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

  LEFT JOIN membership_plans p
    ON p.id = m.plan_id
`;

// =========================================================
// MARK EXPIRED
// =========================================================

const markExpiredIfNeeded = async (
  membershipId
) => {
  await pool.query(
    `
    UPDATE memberships

    SET
      status = 'expired',
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $1

      AND status = 'approved'

      AND expiry_date IS NOT NULL

      AND expiry_date <= CURRENT_TIMESTAMP
    `,
    [membershipId]
  );
};

// =========================================================
// MARK ALL EXPIRED
// =========================================================

const markAllExpired = async () => {
  await pool.query(`
    UPDATE memberships

    SET
      status = 'expired',
      updated_at = CURRENT_TIMESTAMP

    WHERE status = 'approved'

      AND expiry_date IS NOT NULL

      AND expiry_date <= CURRENT_TIMESTAMP
  `);
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
    await ensureMembershipSchema();

    const userId =
      req.userId;

    const result =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.user_id = $1

        ORDER BY m.id DESC

        LIMIT 1
        `,
        [userId]
      );

    if (
      result.rows.length === 0
    ) {
      return res.json({
        success: true,
        hasMembership: false,
        membership: null,
      });
    }

    const membership =
      result.rows[0];

    await markExpiredIfNeeded(
      membership.id
    );

    const latest =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.id = $1

        LIMIT 1
        `,
        [membership.id]
      );

    return res.json({
      success: true,

      hasMembership: true,

      membership:
        cleanMembership(
          latest.rows[0]
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

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// USER - GET MEMBERSHIP PLANS
// GET /api/membership/plans
// =========================================================

const getMembershipPlans = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const result =
      await pool.query(`
        SELECT
          id,
          name,
          duration_years,
          price,
          is_active,
          created_at,
          updated_at

        FROM membership_plans

        WHERE is_active = TRUE

        ORDER BY duration_years ASC
      `);

    return res.json({
      success: true,

      plans:
        result.rows.map(
          (plan) => ({
            id:
              plan.id,

            name:
              plan.name,

            durationYears:
              Number(
                plan.duration_years
              ),

            price:
              Number(
                plan.price
              ),

            isActive:
              plan.is_active,

            createdAt:
              plan.created_at,

            updatedAt:
              plan.updated_at,
          })
        ),
    });

  } catch (error) {
    console.error(
      "Get membership plans error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load membership plans",
    });
  }
};

// =========================================================
// USER - APPLY MEMBERSHIP
// POST /api/membership/apply
// =========================================================

const applyMembership = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  try {
    await ensureMembershipSchema();

    const userId =
      req.userId;

    const planId =
      Number(
        req.body.planId
      );

    if (
      !Number.isInteger(planId) ||
      planId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid membership plan is required",
      });
    }

    await client.query(
      "BEGIN"
    );

    // -------------------------------------------------------
    // USER
    // -------------------------------------------------------

    const userResult =
      await client.query(
        `
        SELECT id
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [userId]
      );

    if (
      userResult.rows.length === 0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        success: false,
        message:
          "User account not found",
      });
    }

    // -------------------------------------------------------
    // PLAN
    // -------------------------------------------------------

    const planResult =
      await client.query(
        `
        SELECT
          id,
          name,
          duration_years,
          price

        FROM membership_plans

        WHERE id = $1

          AND is_active = TRUE

        LIMIT 1
        `,
        [planId]
      );

    if (
      planResult.rows.length === 0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        success: false,
        message:
          "Selected membership plan is not available",
      });
    }

    const plan =
      planResult.rows[0];

    // -------------------------------------------------------
    // EXISTING MEMBERSHIP
    // -------------------------------------------------------

    const existingResult =
      await client.query(
        `
        SELECT *
        FROM memberships

        WHERE user_id = $1

        ORDER BY id DESC

        LIMIT 1
        `,
        [userId]
      );

    if (
      existingResult.rows.length > 0
    ) {
      const existing =
        existingResult.rows[0];

      // -----------------------------------------------------
      // EXPIRE OLD MEMBERSHIP
      // -----------------------------------------------------

      if (
        existing.status ===
          "approved" &&
        existing.expiry_date &&
        new Date(
          existing.expiry_date
        ) <= new Date()
      ) {
        await client.query(
          `
          UPDATE memberships

          SET
            status = 'expired',
            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
          `,
          [existing.id]
        );

        existing.status =
          "expired";
      }

      // -----------------------------------------------------
      // ACTIVE
      // -----------------------------------------------------

      if (
        existing.status ===
        "approved"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "You already have an active membership",
          membership:
            cleanMembership(
              existing
            ),
        });
      }

      // -----------------------------------------------------
      // PENDING
      // -----------------------------------------------------

      if (
        existing.status ===
        "pending"
      ) {
        await client.query(
          "ROLLBACK"
        );

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

      // -----------------------------------------------------
      // REUSE EXPIRED / REJECTED
      // -----------------------------------------------------

      if (
        existing.status ===
          "expired" ||
        existing.status ===
          "rejected"
      ) {
        const result =
          await client.query(
            `
            UPDATE memberships

            SET

              plan_id = $1,
              amount = $2,
              duration_years = $3,

              membership_type =
                'regular',

              status =
                'pending',

              membership_number =
                NULL,

              utr_number =
                NULL,

              payment_status =
                'not_submitted',

              payment_submitted_at =
                NULL,

              applied_at =
                CURRENT_TIMESTAMP,

              approved_at =
                NULL,

              start_date =
                NULL,

              expiry_date =
                NULL,

              rejected_at =
                NULL,

              rejection_reason =
                NULL,

              qr_code =
                NULL,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $4

            RETURNING *
            `,
            [
              plan.id,
              plan.price,
              plan.duration_years,
              existing.id,
            ]
          );

        await client.query(
          "COMMIT"
        );

        return res.json({
          success: true,

          message:
            "Membership application created successfully",

          membership:
            cleanMembership(
              result.rows[0]
            ),
        });
      }
    }

    // -------------------------------------------------------
    // NEW MEMBERSHIP
    // -------------------------------------------------------

    const result =
      await client.query(
        `
        INSERT INTO memberships
        (
          user_id,
          membership_type,
          status,

          plan_id,
          amount,
          duration_years,

          payment_status,
          applied_at
        )

        VALUES
        (
          $1,
          'regular',
          'pending',

          $2,
          $3,
          $4,

          'not_submitted',
          CURRENT_TIMESTAMP
        )

        RETURNING *
        `,
        [
          userId,
          plan.id,
          plan.price,
          plan.duration_years,
        ]
      );

    await client.query(
      "COMMIT"
    );

    return res.status(201).json({
      success: true,

      message:
        "Membership application created successfully",

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
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Apply membership error:",
      error
    );

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

  } finally {
    client.release();
  }
};

// =========================================================
// USER - SUBMIT PAYMENT / UTR
// POST /api/membership/payment
// =========================================================

const submitPayment = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const userId =
      req.userId;

    const membershipId =
      Number(
        req.body.membershipId
      );

    const cleanUtr =
      String(
        req.body.utrNumber || ""
      ).trim();

    if (
      !Number.isInteger(
        membershipId
      ) ||
      membershipId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid membership ID is required",
      });
    }

    if (!cleanUtr) {
      return res.status(400).json({
        success: false,
        message:
          "UTR number is required",
      });
    }

    if (
      cleanUtr.length < 6 ||
      cleanUtr.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid UTR number",
      });
    }

    // -------------------------------------------------------
    // FIND MEMBERSHIP
    // -------------------------------------------------------

    const membershipResult =
      await pool.query(
        `
        SELECT *
        FROM memberships

        WHERE id = $1
          AND user_id = $2

        LIMIT 1
        `,
        [
          membershipId,
          userId,
        ]
      );

    if (
      membershipResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Membership application not found",
      });
    }

    const membership =
      membershipResult.rows[0];

    if (
      membership.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be submitted for this membership",
      });
    }

    // -------------------------------------------------------
    // PREVENT RESUBMISSION AFTER PAYMENT
    // -------------------------------------------------------

    if (
      membership.payment_status ===
      "submitted"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment has already been submitted and is waiting for admin approval",
        membership:
          cleanMembership(
            membership
          ),
      });
    }

    // -------------------------------------------------------
    // DUPLICATE UTR
    // -------------------------------------------------------

    const duplicate =
      await pool.query(
        `
        SELECT id
        FROM memberships

        WHERE utr_number = $1
          AND id != $2

        LIMIT 1
        `,
        [
          cleanUtr,
          membershipId,
        ]
      );

    if (
      duplicate.rows.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This UTR number has already been submitted",
      });
    }

    // -------------------------------------------------------
    // SAVE PAYMENT
    // -------------------------------------------------------

    const result =
      await pool.query(
        `
        UPDATE memberships

        SET

          utr_number = $1,

          payment_status =
            'submitted',

          payment_submitted_at =
            CURRENT_TIMESTAMP,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING *
        `,
        [
          cleanUtr,
          membershipId,
        ]
      );

    return res.json({
      success: true,

      message:
        "Payment submitted successfully. Waiting for admin approval.",

      membership:
        cleanMembership(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Submit payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit payment",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// USER - RENEW MEMBERSHIP
// POST /api/membership/renew
// =========================================================

const renewMembership = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const userId =
      req.userId;

    const planId =
      Number(
        req.body.planId
      );

    if (
      !Number.isInteger(planId) ||
      planId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid membership plan is required",
      });
    }

    // -------------------------------------------------------
    // PLAN
    // -------------------------------------------------------

    const planResult =
      await pool.query(
        `
        SELECT *
        FROM membership_plans

        WHERE id = $1
          AND is_active = TRUE

        LIMIT 1
        `,
        [planId]
      );

    if (
      planResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan not found",
      });
    }

    const plan =
      planResult.rows[0];

    // -------------------------------------------------------
    // CURRENT MEMBERSHIP
    // -------------------------------------------------------

    const existingResult =
      await pool.query(
        `
        SELECT *
        FROM memberships

        WHERE user_id = $1

        ORDER BY id DESC

        LIMIT 1
        `,
        [userId]
      );

    if (
      existingResult.rows.length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No membership found. Please apply for membership first.",
      });
    }

    const existing =
      existingResult.rows[0];

    // -------------------------------------------------------
    // ACTIVE MEMBERSHIP
    // -------------------------------------------------------

    if (
      existing.status ===
        "approved" &&
      existing.expiry_date &&
      new Date(
        existing.expiry_date
      ) > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your membership is still active. You can renew after expiry.",
      });
    }

    // -------------------------------------------------------
    // PENDING
    // -------------------------------------------------------

    if (
      existing.status ===
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A membership application/payment is already pending.",
        membership:
          cleanMembership(
            existing
          ),
      });
    }

    // -------------------------------------------------------
    // EXPIRE OLD
    // -------------------------------------------------------

    if (
      existing.status ===
      "approved"
    ) {
      await pool.query(
        `
        UPDATE memberships

        SET
          status = 'expired',
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1
        `,
        [existing.id]
      );
    }

    // -------------------------------------------------------
    // CREATE RENEWAL
    // -------------------------------------------------------

    const result =
      await pool.query(
        `
        UPDATE memberships

        SET

          plan_id = $1,

          amount = $2,

          duration_years = $3,

          status = 'pending',

          membership_number =
            NULL,

          utr_number =
            NULL,

          payment_status =
            'not_submitted',

          payment_submitted_at =
            NULL,

          applied_at =
            CURRENT_TIMESTAMP,

          approved_at =
            NULL,

          start_date =
            NULL,

          expiry_date =
            NULL,

          rejected_at =
            NULL,

          rejection_reason =
            NULL,

          qr_code =
            NULL,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $4

        RETURNING *
        `,
        [
          plan.id,
          plan.price,
          plan.duration_years,
          existing.id,
        ]
      );

    return res.json({
      success: true,

      message:
        "Renewal application created successfully",

      membership:
        cleanMembership(
          result.rows[0]
        ),
    });

  } catch (error) {
    console.error(
      "Renew membership error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to renew membership",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
};

// =========================================================
// PUBLIC - VERIFY MEMBERSHIP
// GET /api/membership/verify/:membershipNumber
// =========================================================

const verifyMembership = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const membershipNumber =
      String(
        req.params.membershipNumber ||
        ""
      ).trim();

    if (!membershipNumber) {
      return res.status(400).json({
        success: false,
        valid: false,
        message:
          "Membership number is required",
      });
    }

    const result =
      await pool.query(
        `
        ${membershipSelect}

        WHERE
          m.membership_number = $1

        LIMIT 1
        `,
        [membershipNumber]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        valid: false,
        message:
          "Membership not found",
      });
    }

    const membership =
      result.rows[0];

    await markExpiredIfNeeded(
      membership.id
    );

    const latest =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.id = $1

        LIMIT 1
        `,
        [membership.id]
      );

    const finalMembership =
      latest.rows[0];

    return res.json({
      success: true,

      valid:
        finalMembership.status ===
        "approved",

      membership:
        cleanMembership(
          finalMembership
        ),
    });

  } catch (error) {
    console.error(
      "Verify membership error:",
      error
    );

    return res.status(500).json({
      success: false,
      valid: false,
      message:
        "Unable to verify membership",

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

const getAllMemberships = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    await markAllExpired();

    const result =
      await pool.query(
        `
        ${membershipSelect}

        ORDER BY

          CASE
            WHEN m.status =
              'pending'
              THEN 1

            WHEN m.status =
              'approved'
              THEN 2

            WHEN m.status =
              'expired'
              THEN 3

            WHEN m.status =
              'rejected'
              THEN 4

            ELSE 5
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

const getMembershipById = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const id =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership ID",
      });
    }

    const result =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.id = $1

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
          "Membership not found",
      });
    }

    await markExpiredIfNeeded(
      id
    );

    const latest =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.id = $1

        LIMIT 1
        `,
        [id]
      );

    return res.json({
      success: true,

      membership:
        cleanMembership(
          latest.rows[0]
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

const approveMembership = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  try {
    await ensureMembershipSchema();

    const id =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership ID",
      });
    }

    await client.query(
      "BEGIN"
    );

    // -------------------------------------------------------
    // LOCK MEMBERSHIP
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // ALREADY APPROVED
    // -------------------------------------------------------

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
      });
    }

    // -------------------------------------------------------
    // ONLY PENDING
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // PAYMENT REQUIRED
    // -------------------------------------------------------

    if (
      membership.payment_status !==
      "submitted"
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment UTR has not been submitted yet",
      });
    }

    // -------------------------------------------------------
    // PLAN
    // -------------------------------------------------------

    if (
      !membership.plan_id
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,
        message:
          "Membership plan is missing",
      });
    }

    const planResult =
      await client.query(
        `
        SELECT *
        FROM membership_plans

        WHERE id = $1

        LIMIT 1
        `,
        [membership.plan_id]
      );

    if (
      planResult.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,
        message:
          "Membership plan not found",
      });
    }

    const plan =
      planResult.rows[0];

    // -------------------------------------------------------
    // ADVISORY LOCK
    // -------------------------------------------------------

    await client.query(`
      SELECT pg_advisory_xact_lock(782341)
    `);

    // -------------------------------------------------------
    // GENERATE MEMBERSHIP NUMBER
    // -------------------------------------------------------

    const year =
      new Date().getFullYear();

    const countResult =
      await client.query(`
        SELECT
          COUNT(*)::INTEGER AS count

        FROM memberships

        WHERE membership_number IS NOT NULL
      `);

    const nextNumber =
      Number(
        countResult.rows[0].count || 0
      ) + 1;

    const membershipNumber =
      `SNICT-${year}-${String(
        nextNumber
      ).padStart(5, "0")}`;

    // -------------------------------------------------------
    // START DATE
    // -------------------------------------------------------

    const startDate =
      new Date();

    // -------------------------------------------------------
    // EXPIRY DATE
    // -------------------------------------------------------

    const expiryDate =
      new Date(
        startDate
      );

    expiryDate.setFullYear(
      expiryDate.getFullYear() +
        Number(
          plan.duration_years
        )
    );

    // -------------------------------------------------------
    // GENERATE QR
    // -------------------------------------------------------

    const qrCode =
      await generateMembershipQr(
        membershipNumber
      );

    // -------------------------------------------------------
    // APPROVE
    // -------------------------------------------------------

    const result =
      await client.query(
        `
        UPDATE memberships

        SET

          membership_number =
            $1,

          status =
            'approved',

          payment_status =
            'approved',

          approved_at =
            CURRENT_TIMESTAMP,

          start_date =
            $2,

          expiry_date =
            $3,

          rejected_at =
            NULL,

          rejection_reason =
            NULL,

          qr_code =
            $4,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $5

        RETURNING *
        `,
        [
          membershipNumber,
          startDate,
          expiryDate,
          qrCode,
          id,
        ]
      );

    await client.query(
      "COMMIT"
    );

    // -------------------------------------------------------
    // COMPLETE DATA
    // -------------------------------------------------------

    const finalResult =
      await pool.query(
        `
        ${membershipSelect}

        WHERE m.id = $1

        LIMIT 1
        `,
        [id]
      );

    return res.json({
      success: true,

      message:
        "Membership approved successfully",

      membership:
        cleanMembership(
          finalResult.rows[0]
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

const rejectMembership = async (
  req,
  res
) => {
  try {
    await ensureMembershipSchema();

    const id =
      Number(
        req.params.id
      );

    const rejectionReason =
      String(
        req.body.reason || ""
      ).trim();

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership ID",
      });
    }

    if (
      !rejectionReason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

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

    const result =
      await pool.query(
        `
        UPDATE memberships

        SET

          status =
            'rejected',

          payment_status =
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
// ADMIN - GET MEMBERSHIP PLANS
// GET /api/membership/admin/plans
// =========================================================

const getMembershipPlansAdmin =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const result =
        await pool.query(`
          SELECT
            id,
            name,
            duration_years,
            price,
            is_active,
            created_at,
            updated_at

          FROM membership_plans

          ORDER BY
            duration_years ASC
        `);

      return res.json({
        success: true,

        plans:
          result.rows.map(
            (plan) => ({
              id:
                plan.id,

              name:
                plan.name,

              durationYears:
                Number(
                  plan.duration_years
                ),

              price:
                Number(
                  plan.price
                ),

              isActive:
                plan.is_active,

              createdAt:
                plan.created_at,

              updatedAt:
                plan.updated_at,
            })
          ),
      });

    } catch (error) {
      console.error(
        "Admin plans error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch membership plans",
      });
    }
  };

// =========================================================
// ADMIN - CREATE PLAN
// POST /api/membership/admin/plans
// =========================================================

const createMembershipPlan =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const cleanName =
        String(
          req.body.name || ""
        ).trim();

      const duration =
        Number(
          req.body.durationYears
        );

      const amount =
        Number(
          req.body.price
        );

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            "Plan name is required",
        });
      }

      if (
        !Number.isInteger(
          duration
        ) ||
        duration < 1 ||
        duration > 20
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duration must be between 1 and 20 years",
        });
      }

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a valid amount",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO membership_plans
          (
            name,
            duration_years,
            price,
            is_active
          )

          VALUES
          (
            $1,
            $2,
            $3,
            TRUE
          )

          RETURNING *
          `,
          [
            cleanName,
            duration,
            amount,
          ]
        );

      return res.status(201).json({
        success: true,

        message:
          "Membership plan created successfully",

        plan:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "Create plan error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create membership plan",
      });
    }
  };

// =========================================================
// ADMIN - UPDATE PLAN
// PUT /api/membership/admin/plans/:id
// =========================================================

const updateMembershipPlan =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const id =
        Number(
          req.params.id
        );

      const cleanName =
        String(
          req.body.name || ""
        ).trim();

      const duration =
        Number(
          req.body.durationYears
        );

      const amount =
        Number(
          req.body.price
        );

      const active =
        req.body.isActive ===
        undefined
          ? true
          : Boolean(
              req.body.isActive
            );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid plan ID",
        });
      }

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            "Plan name is required",
        });
      }

      if (
        !Number.isInteger(
          duration
        ) ||
        duration < 1 ||
        duration > 20
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid duration",
        });
      }

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid price",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE membership_plans

          SET

            name =
              $1,

            duration_years =
              $2,

            price =
              $3,

            is_active =
              $4,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $5

          RETURNING *
          `,
          [
            cleanName,
            duration,
            amount,
            active,
            id,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Membership plan not found",
        });
      }

      return res.json({
        success: true,

        message:
          "Membership plan updated successfully",

        plan:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "Update plan error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update membership plan",
      });
    }
  };

// =========================================================
// ADMIN - DISABLE PLAN
// DELETE /api/membership/admin/plans/:id
// =========================================================

const deleteMembershipPlan =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid plan ID",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE membership_plans

          SET

            is_active =
              FALSE,

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
            "Membership plan not found",
        });
      }

      return res.json({
        success: true,

        message:
          "Membership plan disabled successfully",

        plan:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "Delete plan error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to disable membership plan",
      });
    }
  };

// =========================================================
// ADMIN - GET PAYMENT SETTINGS
// GET /api/membership/admin/payment-settings
// =========================================================

const getPaymentSettings =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const result =
        await pool.query(`
          SELECT
            id,
            upi_id,
            account_name,
            qr_code,
            updated_at

          FROM membership_payment_settings

          WHERE id = 1

          LIMIT 1
        `);

      const row =
        result.rows[0];

      return res.json({
        success: true,

        settings: row
          ? {
              id:
                row.id,

              upiId:
                row.upi_id || "",

              accountName:
                row.account_name ||
                "",

              qrCode:
                row.qr_code ||
                null,

              updatedAt:
                row.updated_at,
            }
          : {
              id: 1,
              upiId: "",
              accountName: "",
              qrCode: null,
            },
      });

    } catch (error) {
      console.error(
        "Get payment settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load payment settings",
      });
    }
  };

// =========================================================
// ADMIN - UPDATE PAYMENT SETTINGS
// PUT /api/membership/admin/payment-settings
// =========================================================

const updatePaymentSettings =
  async (
    req,
    res
  ) => {
    try {
      await ensureMembershipSchema();

      const cleanUpi =
        String(
          req.body.upiId || ""
        ).trim();

      const cleanName =
        String(
          req.body.accountName || ""
        ).trim();

      const cleanQr =
        req.body.qrCode
          ? String(
              req.body.qrCode
            ).trim()
          : null;

      const result =
        await pool.query(
          `
          UPDATE membership_payment_settings

          SET

            upi_id =
              $1,

            account_name =
              $2,

            qr_code =
              $3,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = 1

          RETURNING *
          `,
          [
            cleanUpi,
            cleanName,
            cleanQr,
          ]
        );

      // -------------------------------------------------------
      // Safety fallback
      // -------------------------------------------------------

      if (
        result.rows.length === 0
      ) {
        const inserted =
          await pool.query(
            `
            INSERT INTO membership_payment_settings
            (
              id,
              upi_id,
              account_name,
              qr_code
            )

            VALUES
            (
              1,
              $1,
              $2,
              $3
            )

            ON CONFLICT (id)
            DO UPDATE SET

              upi_id =
                EXCLUDED.upi_id,

              account_name =
                EXCLUDED.account_name,

              qr_code =
                EXCLUDED.qr_code,

              updated_at =
                CURRENT_TIMESTAMP

            RETURNING *
            `,
            [
              cleanUpi,
              cleanName,
              cleanQr,
            ]
          );

        const row =
          inserted.rows[0];

        return res.json({
          success: true,

          message:
            "Payment settings updated successfully",

          settings: {
            id:
              row.id,

            upiId:
              row.upi_id || "",

            accountName:
              row.account_name || "",

            qrCode:
              row.qr_code || null,

            updatedAt:
              row.updated_at,
          },
        });
      }

      const row =
        result.rows[0];

      return res.json({
        success: true,

        message:
          "Payment settings updated successfully",

        settings: {
          id:
            row.id,

          upiId:
            row.upi_id || "",

          accountName:
            row.account_name || "",

          qrCode:
            row.qr_code || null,

          updatedAt:
            row.updated_at,
        },
      });

    } catch (error) {
      console.error(
        "Update payment settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update payment settings",

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
  // USER
  getMyMembership,
  getMembershipPlans,
  applyMembership,
  submitPayment,
  renewMembership,
  verifyMembership,

  // ADMIN
  getAllMemberships,
  getMembershipById,
  approveMembership,
  rejectMembership,

  // ADMIN PLANS
  getMembershipPlansAdmin,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,

  // ADMIN PAYMENT
  getPaymentSettings,
  updatePaymentSettings,
};