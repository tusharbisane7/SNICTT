const pool = require("../config/db");
const QRCode = require("qrcode");

const {
  sendMembershipApprovalWhatsApp,
} = require("../services/whatsappService");


// =========================================================
// MEMBERSHIP CONTROLLER
// SNICT
// =========================================================
//
// Responsibilities:
//
// - Membership plans
// - Membership applications
// - Membership payments
// - Payment verification
// - Membership approval
// - Membership rejection
// - Membership renewal
// - Membership QR generation
// - Membership verification
// - Admin membership management
// - WhatsApp approval notification
//
// =========================================================


// =========================================================
// CONSTANTS
// =========================================================

const MEMBERSHIP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};


const PAYMENT_STATUS = {
  PENDING: "pending",
  RECEIVED: "received",
  REJECTED: "rejected",
};


const DEFAULT_MEMBERSHIP_DURATION =
  365;


// =========================================================
// CLIENT URL
// =========================================================

const getClientUrl = () => {

  return (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

};


// =========================================================
// DATABASE ERROR HANDLER
// =========================================================

const sendDatabaseError = (
  res,
  message,
  error
) => {

  console.error(
    "===================================="
  );

  console.error(
    "MEMBERSHIP ERROR"
  );

  console.error(
    "Message:",
    error?.message
  );

  console.error(
    "Code:",
    error?.code
  );

  console.error(
    "Detail:",
    error?.detail
  );

  console.error(
    "Hint:",
    error?.hint
  );

  console.error(
    "Table:",
    error?.table
  );

  console.error(
    "Column:",
    error?.column
  );

  console.error(
    "Constraint:",
    error?.constraint
  );

  console.error(
    "===================================="
  );


  return res.status(500).json({

    success: false,

    message,

    debug:
      process.env.NODE_ENV !==
      "production"
        ? {
            message:
              error?.message,

            code:
              error?.code,

            detail:
              error?.detail,

            hint:
              error?.hint,

            table:
              error?.table,

            column:
              error?.column,

            constraint:
              error?.constraint,
          }
        : undefined,

  });

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
      membership.id ??
      null,

    userId:
      membership.user_id ??
      null,

    userName:
      membership.user_name ??
      membership.full_name ??
      null,

    fullName:
      membership.full_name ??
      membership.user_name ??
      null,

    username:
      membership.username ??
      null,

    email:
      membership.email ??
      null,

    mobile:
      membership.mobile ??
      null,

    planId:
      membership.plan_id ??
      null,

    planName:
      membership.plan_name ??
      null,

    amount:
      Number(
        membership.amount ??
        membership.plan_amount ??
        0
      ),

    membershipNumber:
      membership.membership_number ??
      null,

    status:
      membership.status ??
      MEMBERSHIP_STATUS.PENDING,

    paymentStatus:
      membership.payment_status ??
      PAYMENT_STATUS.PENDING,

    utr:
      membership.utr ??
      membership.transaction_id ??
      null,

    paymentProofUrl:
      membership.payment_proof_url ??
      null,

    startDate:
      membership.start_date ??
      null,

    expiryDate:
      membership.expiry_date ??
      null,

    qrCode:
      membership.qr_code ??
      membership.qr_code_url ??
      null,

    verificationToken:
      membership.verification_token ??
      null,

    rejectionReason:
      membership.rejection_reason ??
      null,

    createdAt:
      membership.created_at ??
      null,

    updatedAt:
      membership.updated_at ??
      null,


    // =====================================================
    // WHATSAPP
    // =====================================================

    whatsappStatus:
      membership.whatsapp_status ??
      "not_sent",

    whatsappMessageId:
      membership.whatsapp_message_id ??
      null,

    whatsappSentAt:
      membership.whatsapp_sent_at ??
      null,

    whatsappError:
      membership.whatsapp_error ??
      null,

  };

};


// =========================================================
// GET USER DETAILS
// =========================================================

const getUserDetails = async (
  client,
  userId
) => {

  const result =
    await client.query(
      `
      SELECT

        id,

        full_name,

        username,

        email,

        mobile,

        profile_image_url

      FROM users

      WHERE id = $1

      LIMIT 1
      `,
      [
        userId,
      ]
    );


  return (
    result.rows[0] ||
    null
  );

};


// =========================================================
// GENERATE MEMBERSHIP NUMBER
// =========================================================
//
// Example:
//
// SNICT-2026-0001
//
// =========================================================

const generateMembershipNumber =
  async (
    client
  ) => {

    const year =
      new Date()
        .getFullYear();


    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {

      const randomNumber =
        Math.floor(
          1000 +
          Math.random() *
          9000
        );


      const membershipNumber =
        `SNICT-${year}-${randomNumber}`;


      const result =
        await client.query(
          `
          SELECT id

          FROM memberships

          WHERE membership_number = $1

          LIMIT 1
          `,
          [
            membershipNumber,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return membershipNumber;

      }

    }


    throw new Error(
      "Unable to generate unique membership number"
    );

  };


// =========================================================
// GENERATE VERIFICATION TOKEN
// =========================================================

const generateVerificationToken =
  () => {

    return (
      require("crypto")
        .randomBytes(32)
        .toString("hex")
    );

  };


// =========================================================
// GENERATE MEMBERSHIP QR
// =========================================================

const generateMembershipQr = async (
  membershipNumber
) => {

  const verificationUrl =
    `${getClientUrl()}/membership/verify/${encodeURIComponent(
      membershipNumber
    )}`;


  return QRCode.toDataURL(
    verificationUrl,
    {
      width: 500,

      margin: 2,

      errorCorrectionLevel:
        "M",
    }
  );

};


// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (
  value
) => {

  if (!value) {
    return null;
  }


  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    return value;

  }


  const date =
    value instanceof Date
      ? value
      : new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

};


// =========================================================
// ADD DAYS TO DATE
// =========================================================

const addDays = (
  dateValue,
  days
) => {

  const date =
    new Date(
      dateValue
    );


  date.setDate(
    date.getDate() +
    Number(days)
  );


  return formatDate(
    date
  );

};


// =========================================================
// GET MEMBERSHIP EXPIRY DATE
// =========================================================

const calculateExpiryDate = (
  startDate,
  durationDays =
    DEFAULT_MEMBERSHIP_DURATION
) => {

  return addDays(
    startDate,
    durationDays
  );

};


// =========================================================
// GET AMOUNT
// =========================================================

const getAmount = (
  membership
) => {

  return Number(
    membership?.amount ??
    membership?.plan_amount ??
    0
  );

};


// =========================================================
// GET PLAN NAME
// =========================================================

const getPlanName = (
  membership
) => {

  return (
    membership?.plan_name ||
    membership?.planName ||
    "Membership"
  );

};


// =========================================================
// GET USER NAME
// =========================================================

const getUserName = (
  membership
) => {

  return (
    membership?.full_name ||
    membership?.user_name ||
    membership?.username ||
    "Member"
  );

};


// =========================================================
// GET MOBILE
// =========================================================

const getMobile = (
  membership
) => {

  return (
    membership?.mobile ||
    membership?.phone ||
    membership?.phone_number ||
    ""
  );

};


// =========================================================
// MEMBERSHIP SELECT
// =========================================================

const membershipSelect = `
  SELECT

    m.*,

    u.full_name,

    u.username,

    u.email,

    u.mobile,

    u.profile_image_url,

    p.name AS plan_name,

    p.duration_years AS plan_duration_years,

    p.price AS plan_amount

  FROM memberships m

  LEFT JOIN users u
    ON u.id = m.user_id

  LEFT JOIN membership_plans p
    ON p.id = m.plan_id
`;


// =========================================================
// ENSURE MEMBERSHIP SCHEMA
// =========================================================

let schemaPromise = null;


const ensureMembershipSchema =
  async () => {

    if (schemaPromise) {
      return schemaPromise;
    }


    schemaPromise =
      (async () => {

        // ===================================================
        // MEMBERSHIPS TABLE
        // ===================================================

        await pool.query(
          `
          ALTER TABLE memberships

          ADD COLUMN IF NOT EXISTS
            plan_id INTEGER,

          ADD COLUMN IF NOT EXISTS
            amount NUMERIC(12,2),

          ADD COLUMN IF NOT EXISTS
            duration_years INTEGER,

          ADD COLUMN IF NOT EXISTS
            utr_number VARCHAR(100),

          ADD COLUMN IF NOT EXISTS
            payment_status VARCHAR(30)
              DEFAULT 'not_submitted',

          ADD COLUMN IF NOT EXISTS
            payment_submitted_at TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            payment_received_at TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            start_date TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            expiry_date TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            approved_at TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            rejected_at TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            rejection_reason TEXT,

          ADD COLUMN IF NOT EXISTS
            qr_code TEXT,

          ADD COLUMN IF NOT EXISTS
            updated_at TIMESTAMP
              DEFAULT CURRENT_TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            whatsapp_status VARCHAR(30)
              DEFAULT 'not_sent',

          ADD COLUMN IF NOT EXISTS
            whatsapp_message_id TEXT,

          ADD COLUMN IF NOT EXISTS
            whatsapp_sent_at TIMESTAMP,

          ADD COLUMN IF NOT EXISTS
            whatsapp_error TEXT
          `
        );


        // ===================================================
        // MEMBERSHIP PLANS
        // ===================================================

        await pool.query(
          `
          CREATE TABLE IF NOT EXISTS
            membership_plans (

            id SERIAL PRIMARY KEY,

            name VARCHAR(100)
              NOT NULL,

            duration_years INTEGER
              NOT NULL,

            price NUMERIC(12,2)
              NOT NULL
              DEFAULT 0,

            is_active BOOLEAN
              NOT NULL
              DEFAULT TRUE,

            created_at TIMESTAMP
              DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
              DEFAULT CURRENT_TIMESTAMP

          )
          `
        );


        // ===================================================
        // PAYMENT SETTINGS
        // ===================================================

        await pool.query(
          `
          CREATE TABLE IF NOT EXISTS
            membership_payment_settings (

            id INTEGER PRIMARY KEY
              DEFAULT 1,

            upi_id VARCHAR(255),

            account_name VARCHAR(255),

            qr_code TEXT,

            updated_at TIMESTAMP
              DEFAULT CURRENT_TIMESTAMP

          )
          `
        );


        // ===================================================
        // DEFAULT PAYMENT SETTINGS
        // ===================================================

        await pool.query(
          `
          INSERT INTO
            membership_payment_settings
            (id)

          VALUES
            (1)

          ON CONFLICT (id)
          DO NOTHING
          `
        );


        // ===================================================
        // DEFAULT PLANS
        // ===================================================

        const plansResult =
          await pool.query(
            `
            SELECT
              COUNT(*)::INTEGER AS count

            FROM membership_plans
            `
          );


        if (
          Number(
            plansResult.rows[0].count
          ) === 0
        ) {

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
            `
          );

          console.log(
            "Default membership plans created."
          );

        }

      })()
        .catch((error) => {

          schemaPromise = null;

          throw error;

        });


    return schemaPromise;

  };


// =========================================================
// MARK EXPIRED IF NEEDED
// =========================================================

const markExpiredIfNeeded =
  async (
    membershipId
  ) => {

    await pool.query(
      `
      UPDATE memberships

      SET

        status = 'expired',

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $1

        AND status = 'approved'

        AND expiry_date IS NOT NULL

        AND expiry_date <= CURRENT_TIMESTAMP
      `,
      [
        membershipId,
      ]
    );

  };


// =========================================================
// MARK ALL EXPIRED
// =========================================================

const markAllExpired =
  async () => {

    await pool.query(
      `
      UPDATE memberships

      SET

        status = 'expired',

        updated_at =
          CURRENT_TIMESTAMP

      WHERE status = 'approved'

        AND expiry_date IS NOT NULL

        AND expiry_date <= CURRENT_TIMESTAMP
      `
    );

  };


// =========================================================
// SEND APPROVAL WHATSAPP
// =========================================================
//
// WhatsApp is intentionally separate from the
// membership database transaction.
//
// If WhatsApp fails:
//
// Membership remains APPROVED.
//
// =========================================================

const sendApprovalWhatsApp =
  async ({
    membership,
    membershipNumber,
    startDate,
    expiryDate,
  }) => {

    const user =
      await getUserDetails(
        pool,
        membership.user_id
      );


    if (!user) {

      return {

        sent: false,

        status: "failed",

        messageId: null,

        error:
          "User not found.",

      };

    }


    if (!user.mobile) {

      return {

        sent: false,

        status: "failed",

        messageId: null,

        error:
          "User does not have a mobile number.",

      };

    }


    try {

      const result =
        await sendMembershipApprovalWhatsApp({

          mobile:
            user.mobile,

          fullName:
            user.full_name ||
            "Member",

          membershipNumber,

          planName:
            membership.plan_name ||
            "Membership",

          amount:
            getAmount(
              membership
            ),

          startDate,

          expiryDate,

          verificationUrl:
            `${getClientUrl()}/membership/verify/${encodeURIComponent(
              membershipNumber
            )}`,

        });


      return result;

    } catch (error) {

      console.error(
        "WhatsApp approval message error:",
        error
      );


      return {

        sent: false,

        status: "failed",

        messageId: null,

        error:
          error?.message ||
          "WhatsApp message failed.",

      };

    }

  };


// =========================================================
// USER - GET MEMBERSHIP
// GET /api/membership/me
// =========================================================

const getMyMembership =
  async (
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
          [
            userId,
          ]
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
          [
            membership.id,
          ]
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

const getMembershipPlans =
  async (
    req,
    res
  ) => {

    try {

      await ensureMembershipSchema();


      const result =
        await pool.query(
          `

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

          `
        );


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

const applyMembership =
  async (
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


      // ===================================================
      // USER
      // ===================================================

      const userResult =
        await client.query(
          `

          SELECT id

          FROM users

          WHERE id = $1

          LIMIT 1

          `,
          [
            userId,
          ]
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


      // ===================================================
      // PLAN
      // ===================================================

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
          [
            planId,
          ]
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


      // ===================================================
      // EXISTING MEMBERSHIP
      // ===================================================

      const existingResult =
        await client.query(
          `

          SELECT *

          FROM memberships

          WHERE user_id = $1

          ORDER BY id DESC

          LIMIT 1

          `,
          [
            userId,
          ]
        );


      if (
        existingResult.rows.length > 0
      ) {

        const existing =
          existingResult.rows[0];


        // ===============================================
        // EXPIRE OLD MEMBERSHIP
        // ===============================================

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
            [
              existing.id,
            ]
          );


          existing.status =
            "expired";

        }


        // ===============================================
        // ACTIVE MEMBERSHIP
        // ===============================================

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


        // ===============================================
        // PENDING MEMBERSHIP
        // ===============================================

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


        // ===============================================
        // EXPIRED / REJECTED
        // ===============================================

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

                payment_received_at =
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

                whatsapp_status =
                  'not_sent',

                whatsapp_message_id =
                  NULL,

                whatsapp_sent_at =
                  NULL,

                whatsapp_error =
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


      // ===================================================
      // NEW MEMBERSHIP
      // ===================================================

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
// USER - SUBMIT PAYMENT
// POST /api/membership/payment
// =========================================================

const submitPayment =
  async (
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


      const utrNumber =
        String(
          req.body.utrNumber ||
          ""
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


      if (!utrNumber) {

        return res.status(400).json({

          success: false,

          message:
            "UTR number is required",

        });

      }


      if (
        utrNumber.length < 6 ||
        utrNumber.length > 100
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid UTR number",

        });

      }


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
        membershipResult.rows.length === 0
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
            `Membership cannot accept payment because its status is "${membership.status}".`,

        });

      }


      if (
        membership.payment_status ===
        "received"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Payment has already been marked as received",

        });

      }


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

            AND user_id = $3

          RETURNING *

          `,
          [
            utrNumber,

            membershipId,

            userId,
          ]
        );


      return res.json({

        success: true,

        message:
          "Payment submitted successfully. Your membership is now waiting for admin approval.",

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
// ADMIN - GET ALL MEMBERSHIPS
// GET /api/membership/admin
// =========================================================

const getAllMemberships =
  async (
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

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

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
          [
            id,
          ]
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
          [
            id,
          ]
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
// ADMIN - MARK PAYMENT RECEIVED
// PUT /api/membership/admin/:id/payment-received
// =========================================================

const markPaymentReceived =
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
            "Invalid membership ID",

        });

      }


      const result =
        await pool.query(
          `

          SELECT *

          FROM memberships

          WHERE id = $1

          LIMIT 1

          `,
          [
            id,
          ]
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


      const membership =
        result.rows[0];


      if (
        membership.status !==
        "pending"
      ) {

        return res.status(400).json({

          success: false,

          message:
            `Payment cannot be verified because membership status is "${membership.status}".`,

        });

      }


      if (
        !membership.utr_number
      ) {

        return res.status(400).json({

          success: false,

          message:
            "UTR number is required before marking payment as received.",

        });

      }


      if (
        membership.payment_status ===
        "received"
      ) {

        return res.json({

          success: true,

          message:
            "Payment is already marked as received",

          membership:
            cleanMembership(
              membership
            ),

        });

      }


      const updated =
        await pool.query(
          `

          UPDATE memberships

          SET

            payment_status =
              'received',

            payment_received_at =
              CURRENT_TIMESTAMP,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *

          `,
          [
            id,
          ]
        );


      return res.json({

        success: true,

        message:
          "Payment marked as received successfully",

        membership:
          cleanMembership(
            updated.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Mark payment received error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to mark payment as received",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - MARK PAYMENT NOT RECEIVED
// PUT /api/membership/admin/:id/payment-not-received
// =========================================================

const markPaymentNotReceived =
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
            "Invalid membership ID",

        });

      }


      const result =
        await pool.query(
          `

          SELECT *

          FROM memberships

          WHERE id = $1

          LIMIT 1

          `,
          [
            id,
          ]
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


      const membership =
        result.rows[0];


      if (
        membership.status !==
        "pending"
      ) {

        return res.status(400).json({

          success: false,

          message:
            `Payment cannot be rejected because membership status is "${membership.status}".`,

        });

      }


      const updated =
        await pool.query(
          `

          UPDATE memberships

          SET

            payment_status =
              'not_received',

            payment_received_at =
              NULL,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *

          `,
          [
            id,
          ]
        );


      return res.json({

        success: true,

        message:
          "Payment marked as not received",

        membership:
          cleanMembership(
            updated.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Mark payment not received error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to mark payment as not received",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - APPROVE MEMBERSHIP
// PUT /api/membership/admin/:id/approve
// =========================================================
//
// FLOW:
//
// Payment received
//       ↓
// UTR verified
//       ↓
// Membership approved
//       ↓
// Membership number generated
//       ↓
// QR generated
//       ↓
// Database COMMIT
//       ↓
// WhatsApp notification
//
// IMPORTANT:
//
// WhatsApp is intentionally sent AFTER COMMIT.
// If WhatsApp fails, the approved membership remains approved.
//
// =========================================================

const approveMembership =
  async (
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


      // ===================================================
      // GET MEMBERSHIP
      // ===================================================

      const membershipResult =
        await client.query(
          `

          SELECT

            m.*,

            p.name AS plan_name,

            p.duration_years
              AS plan_duration_years,

            p.price
              AS plan_amount

          FROM memberships m

          LEFT JOIN membership_plans p

            ON p.id =
              m.plan_id

          WHERE m.id = $1

          FOR UPDATE OF m

          `,
          [
            id,
          ]
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
      // MUST BE PENDING
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
            `Membership cannot be approved because its current status is "${membership.status}".`,

        });

      }


      // ===================================================
      // PAYMENT MUST BE RECEIVED
      // ===================================================

      if (
        membership.payment_status !==
        "received"
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Payment must be marked as received before approving the membership.",

          paymentStatus:
            membership.payment_status,

          utrNumber:
            membership.utr_number ||
            null,

        });

      }


      // ===================================================
      // UTR REQUIRED
      // ===================================================

      if (
        !membership.utr_number
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "UTR number is required before approving membership.",

        });

      }


      // ===================================================
      // PLAN VALIDATION
      // ===================================================

      const durationYears =
        Number(
          membership.duration_years ||
          membership.plan_duration_years ||
          0
        );


      const amount =
        Number(
          membership.amount ??
          membership.plan_amount ??
          0
        );


      if (
        durationYears <= 0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Membership duration is invalid.",

        });

      }


      if (
        amount <= 0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Membership amount is invalid.",

        });

      }


      // ===================================================
      // GENERATE MEMBERSHIP NUMBER
      // ===================================================

      const membershipNumber =
        await generateMembershipNumber(
          client
        );


      // ===================================================
      // START DATE
      // ===================================================

      const startDate =
        new Date();


      // ===================================================
      // EXPIRY DATE
      // ===================================================

      const expiryDate =
        new Date(
          startDate
        );


      expiryDate.setFullYear(
        expiryDate.getFullYear() +
        durationYears
      );


      // ===================================================
      // VERIFICATION TOKEN
      // ===================================================

      const verificationToken =
        generateVerificationToken();


      // ===================================================
      // GENERATE VERIFICATION QR
      // ===================================================

      const qrCode =
        await generateMembershipQr(
          membershipNumber
        );


      // ===================================================
      // UPDATE MEMBERSHIP
      // ===================================================

      const updateResult =
        await client.query(
          `

          UPDATE memberships

          SET

            membership_number =
              $1,

            amount =
              $2,

            duration_years =
              $3,

            payment_status =
              'received',

            status =
              'approved',

            approved_at =
              CURRENT_TIMESTAMP,

            start_date =
              $4,

            expiry_date =
              $5,

            rejected_at =
              NULL,

            rejection_reason =
              NULL,

            qr_code =
              $6,

            verification_token =
              $7,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $8

          RETURNING *

          `,
          [
            membershipNumber,

            amount,

            durationYears,

            startDate,

            expiryDate,

            qrCode,

            verificationToken,

            id,
          ]
        );


      // ===================================================
      // COMMIT APPROVAL
      // ===================================================

      await client.query(
        "COMMIT"
      );


      // ===================================================
      // WHATSAPP
      // ===================================================

      let whatsappResult = {

        sent: false,

        status: "not_sent",

        messageId: null,

        error: null,

      };


      try {

        const userResult =
          await pool.query(
            `

            SELECT

              id,

              full_name,

              mobile

            FROM users

            WHERE id = $1

            LIMIT 1

            `,
            [
              membership.user_id,
            ]
          );


        const user =
          userResult.rows[0];


        if (
          !user?.mobile
        ) {

          whatsappResult = {

            sent: false,

            status: "failed",

            messageId: null,

            error:
              "User does not have a mobile number.",

          };

        } else {

          whatsappResult =
            await sendMembershipApprovalWhatsApp({

              mobile:
                user.mobile,

              fullName:
                user.full_name ||
                "Member",

              membershipNumber,

              planName:
                membership.plan_name ||
                "Membership",

              amount,

              startDate,

              expiryDate,

              verificationUrl:
                `${getClientUrl()}/membership/verify/${encodeURIComponent(
                  membershipNumber
                )}`,

            });

        }


        // =================================================
        // SAVE WHATSAPP STATUS
        // =================================================

        await pool.query(
          `

          UPDATE memberships

          SET

            whatsapp_status =
              $1,

            whatsapp_message_id =
              $2,

            whatsapp_sent_at =
              CASE

                WHEN $1 = 'sent'

                THEN CURRENT_TIMESTAMP

                ELSE whatsapp_sent_at

              END,

            whatsapp_error =
              $3,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $4

          `,
          [
            whatsappResult.status,

            whatsappResult.messageId,

            whatsappResult.error,

            id,
          ]
        );

      } catch (whatsappError) {

        console.error(
          "Membership WhatsApp notification error:",
          whatsappError
        );


        whatsappResult = {

          sent: false,

          status: "failed",

          messageId: null,

          error:
            whatsappError.message ||
            "WhatsApp notification failed.",

        };


        try {

          await pool.query(
            `

            UPDATE memberships

            SET

              whatsapp_status =
                'failed',

              whatsapp_error =
                $1,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $2

            `,
            [
              whatsappResult.error,

              id,
            ]
          );

        } catch (statusError) {

          console.error(
            "Unable to save WhatsApp failure status:",
            statusError
          );

        }

      }


      // ===================================================
      // GET FINAL MEMBERSHIP
      // ===================================================

      const finalResult =
        await pool.query(
          `

          ${membershipSelect}

          WHERE m.id = $1

          LIMIT 1

          `,
          [
            id,
          ]
        );


      const finalMembership =
        finalResult.rows[0];


      // ===================================================
      // RESPONSE
      // ===================================================

      return res.json({

        success: true,

        message:
          whatsappResult.sent
            ? "Membership approved successfully and WhatsApp notification sent."
            : "Membership approved successfully, but WhatsApp notification could not be sent.",

        membership:
          cleanMembership(
            finalMembership
          ),

        whatsapp: {

          sent:
            whatsappResult.sent,

          status:
            whatsappResult.status,

          messageId:
            whatsappResult.messageId,

          error:
            process.env.NODE_ENV !==
            "production"
              ? whatsappResult.error
              : undefined,

        },

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

      await ensureMembershipSchema();


      const id =
        Number(
          req.params.id
        );


      const reason =
        String(
          req.body?.reason ||
          ""
        ).trim();


      // =====================================================
      // VALIDATE ID
      // =====================================================

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


      // =====================================================
      // VALIDATE REASON
      // =====================================================

      if (!reason) {

        return res.status(400).json({

          success: false,

          message:
            "Rejection reason is required",

        });

      }


      if (
        reason.length > 1000
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Rejection reason cannot exceed 1000 characters",

        });

      }


      // =====================================================
      // FIND MEMBERSHIP
      // =====================================================

      const membershipResult =
        await pool.query(
          `

          ${membershipSelect}

          WHERE m.id = $1

          LIMIT 1

          `,
          [
            id,
          ]
        );


      if (
        membershipResult.rows.length ===
        0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Membership not found",

        });

      }


      const membership =
        membershipResult.rows[0];


      // =====================================================
      // ALREADY REJECTED
      // =====================================================

      if (
        membership.status ===
        "rejected"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Membership is already rejected",

        });

      }


      // =====================================================
      // APPROVED MEMBERSHIP CANNOT BE REJECTED
      // =====================================================

      if (
        membership.status ===
        "approved"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "An approved membership cannot be rejected",

        });

      }


      // =====================================================
      // UPDATE
      // =====================================================

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
            reason,

            id,
          ]
        );


      // =====================================================
      // RESPONSE
      // =====================================================

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
// USER - RENEW MEMBERSHIP
// POST /api/membership/renew
// =========================================================

const renewMembership =
  async (
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
          req.body?.planId
        );


      // =====================================================
      // VALIDATE PLAN
      // =====================================================

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


      // =====================================================
      // GET PLAN
      // =====================================================

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
          [
            planId,
          ]
        );


      if (
        planResult.rows.length ===
        0
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


      // =====================================================
      // GET CURRENT MEMBERSHIP
      // =====================================================

      const membershipResult =
        await client.query(
          `

          SELECT *

          FROM memberships

          WHERE user_id = $1

          ORDER BY id DESC

          LIMIT 1

          `,
          [
            userId,
          ]
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
            "No membership found. Please apply for membership first.",

        });

      }


      const currentMembership =
        membershipResult.rows[0];


      // =====================================================
      // ACTIVE MEMBERSHIP
      // =====================================================

      if (
        currentMembership.status ===
        "approved" &&
        currentMembership.expiry_date &&
        new Date(
          currentMembership.expiry_date
        ) > new Date()
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(400).json({

          success: false,

          message:
            "Your current membership is still active.",

          membership:
            cleanMembership(
              currentMembership
            ),

        });

      }


      // =====================================================
      // EXPIRED MEMBERSHIP
      // =====================================================

      const result =
        await client.query(
          `

          UPDATE memberships

          SET

            plan_id =
              $1,

            amount =
              $2,

            duration_years =
              $3,

            status =
              'pending',

            payment_status =
              'not_submitted',

            utr_number =
              NULL,

            payment_submitted_at =
              NULL,

            payment_received_at =
              NULL,

            membership_number =
              NULL,

            start_date =
              NULL,

            expiry_date =
              NULL,

            approved_at =
              NULL,

            rejected_at =
              NULL,

            rejection_reason =
              NULL,

            qr_code =
              NULL,

            verification_token =
              NULL,

            whatsapp_status =
              'not_sent',

            whatsapp_message_id =
              NULL,

            whatsapp_sent_at =
              NULL,

            whatsapp_error =
              NULL,

            applied_at =
              CURRENT_TIMESTAMP,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $4

          RETURNING *

          `,
          [
            plan.id,

            plan.price,

            plan.duration_years,

            currentMembership.id,
          ]
        );


      await client.query(
        "COMMIT"
      );


      return res.json({

        success: true,

        message:
          "Membership renewal application created successfully",

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

    } finally {

      client.release();

    }

  };


// =========================================================
// PUBLIC - VERIFY MEMBERSHIP
// GET /api/membership/verify/:membershipNumber
// =========================================================

const verifyMembership =
  async (
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


      if (
        !membershipNumber
      ) {

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
          [
            membershipNumber,
          ]
        );


      if (
        result.rows.length ===
        0
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


      // =====================================================
      // UPDATE EXPIRY STATUS
      // =====================================================

      await markExpiredIfNeeded(
        membership.id
      );


      // =====================================================
      // GET LATEST
      // =====================================================

      const latest =
        await pool.query(
          `

          ${membershipSelect}

          WHERE m.id = $1

          LIMIT 1

          `,
          [
            membership.id,
          ]
        );


      const finalMembership =
        latest.rows[0];


      // =====================================================
      // RESPONSE
      // =====================================================

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
        await pool.query(
          `

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

            is_active DESC,

            duration_years ASC,

            id ASC

          `
        );


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
                Boolean(
                  plan.is_active
                ),

              createdAt:
                plan.created_at,

              updatedAt:
                plan.updated_at,

            })
          ),

      });

    } catch (error) {

      console.error(
        "Get admin membership plans error:",
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
// ADMIN - CREATE MEMBERSHIP PLAN
// POST /api/membership/admin/plans
// =========================================================

const createMembershipPlan =
  async (
    req,
    res
  ) => {

    try {

      await ensureMembershipSchema();


      const name =
        String(
          req.body?.name ||
          ""
        ).trim();


      const durationYears =
        Number(
          req.body?.durationYears
        );


      const price =
        Number(
          req.body?.price
        );


      const isActive =
        req.body?.isActive !==
        false;


      // =====================================================
      // VALIDATION
      // =====================================================

      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            "Plan name is required",

        });

      }


      if (
        !Number.isInteger(
          durationYears
        ) ||
        durationYears < 1 ||
        durationYears > 20
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Duration must be between 1 and 20 years",

        });

      }


      if (
        !Number.isFinite(price) ||
        price < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid plan price",

        });

      }


      // =====================================================
      // CREATE
      // =====================================================

      const result =
        await pool.query(
          `

          INSERT INTO membership_plans
          (
            name,

            duration_years,

            price,

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

            CURRENT_TIMESTAMP,

            CURRENT_TIMESTAMP
          )

          RETURNING *

          `,
          [
            name,

            durationYears,

            price,

            isActive,
          ]
        );


      const plan =
        result.rows[0];


      return res.status(201).json({

        success: true,

        message:
          "Membership plan created successfully",

        plan: {

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
            Boolean(
              plan.is_active
            ),

          createdAt:
            plan.created_at,

          updatedAt:
            plan.updated_at,

        },

      });

    } catch (error) {

      console.error(
        "Create membership plan error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to create membership plan",

        debug:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,

      });

    }

  };


// =========================================================
// ADMIN - UPDATE MEMBERSHIP PLAN
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


      const name =
        String(
          req.body?.name ||
          ""
        ).trim();


      const durationYears =
        Number(
          req.body?.durationYears
        );


      const price =
        Number(
          req.body?.price
        );


      const isActive =
        req.body?.isActive !==
        false;


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid membership plan ID",

        });

      }


      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            "Plan name is required",

        });

      }


      if (
        !Number.isInteger(
          durationYears
        ) ||
        durationYears < 1 ||
        durationYears > 20
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Duration must be between 1 and 20 years",

        });

      }


      if (
        !Number.isFinite(price) ||
        price < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid plan price",

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
            name,

            durationYears,

            price,

            isActive,

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


      const plan =
        result.rows[0];


      return res.json({

        success: true,

        message:
          "Membership plan updated successfully",

        plan: {

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
            Boolean(
              plan.is_active
            ),

          createdAt:
            plan.created_at,

          updatedAt:
            plan.updated_at,

        },

      });

    } catch (error) {

      console.error(
        "Update membership plan error:",
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
// ADMIN - DELETE / DISABLE MEMBERSHIP PLAN
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
            "Invalid membership plan ID",

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
          [
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
          "Membership plan disabled successfully",

        plan: {

          id:
            result.rows[0].id,

          name:
            result.rows[0].name,

          durationYears:
            Number(
              result.rows[0]
                .duration_years
            ),

          price:
            Number(
              result.rows[0].price
            ),

          isActive:
            Boolean(
              result.rows[0]
                .is_active
            ),

        },

      });

    } catch (error) {

      console.error(
        "Delete membership plan error:",
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
        await pool.query(
          `

          SELECT

            id,

            upi_id,

            account_name,

            qr_code,

            updated_at

          FROM membership_payment_settings

          WHERE id = 1

          LIMIT 1

          `
        );


      const settings =
        result.rows[0] ||
        null;


      return res.json({

        success: true,

        settings: settings
          ? {

              id:
                settings.id,

              upiId:
                settings.upi_id ||
                "",

              accountName:
                settings.account_name ||
                "",

              qrCode:
                settings.qr_code ||
                "",

              updatedAt:
                settings.updated_at,

            }
          : {

              id: 1,

              upiId: "",

              accountName: "",

              qrCode: "",

              updatedAt: null,

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


      const upiId =
        String(
          req.body?.upiId ||
          ""
        ).trim();


      const accountName =
        String(
          req.body?.accountName ||
          ""
        ).trim();


      const qrCode =
        String(
          req.body?.qrCode ||
          ""
        ).trim();


      if (
        !upiId
      ) {

        return res.status(400).json({

          success: false,

          message:
            "UPI ID is required",

        });

      }


      if (
        !accountName
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Account name is required",

        });

      }


      const result =
        await pool.query(
          `

          INSERT INTO
            membership_payment_settings
          (
            id,

            upi_id,

            account_name,

            qr_code,

            updated_at
          )

          VALUES
          (
            1,

            $1,

            $2,

            $3,

            CURRENT_TIMESTAMP
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
            upiId,

            accountName,

            qrCode || null,
          ]
        );


      const settings =
        result.rows[0];


      return res.json({

        success: true,

        message:
          "Payment settings updated successfully",

        settings: {

          id:
            settings.id,

          upiId:
            settings.upi_id,

          accountName:
            settings.account_name,

          qrCode:
            settings.qr_code,

          updatedAt:
            settings.updated_at,

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

      });

    }

  };


// =========================================================
// PUBLIC - GET PAYMENT SETTINGS
// GET /api/membership/payment-settings
// =========================================================
//
// Only payment-related public information is returned.
//
// =========================================================

const getPublicPaymentSettings =
  async (
    req,
    res
  ) => {

    try {

      await ensureMembershipSchema();


      const result =
        await pool.query(
          `

          SELECT

            upi_id,

            account_name,

            qr_code

          FROM membership_payment_settings

          WHERE id = 1

          LIMIT 1

          `
        );


      const settings =
        result.rows[0];


      return res.json({

        success: true,

        settings: {

          upiId:
            settings?.upi_id ||
            "",

          accountName:
            settings?.account_name ||
            "",

          qrCode:
            settings?.qr_code ||
            "",

        },

      });

    } catch (error) {

      console.error(
        "Get public payment settings error:",
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
// ADMIN - MEMBERSHIP STATISTICS
// GET /api/membership/admin/stats
// =========================================================

const getMembershipStats =
  async (
    req,
    res
  ) => {

    try {

      await ensureMembershipSchema();


      await markAllExpired();


      const result =
        await pool.query(
          `

          SELECT

            COUNT(*)::INTEGER
              AS total,

            COUNT(*) FILTER (
              WHERE status =
                'pending'
            )::INTEGER
              AS pending,

            COUNT(*) FILTER (
              WHERE status =
                'approved'
            )::INTEGER
              AS approved,

            COUNT(*) FILTER (
              WHERE status =
                'rejected'
            )::INTEGER
              AS rejected,

            COUNT(*) FILTER (
              WHERE status =
                'expired'
            )::INTEGER
              AS expired,

            COUNT(*) FILTER (
              WHERE payment_status =
                'received'
            )::INTEGER
              AS payment_received,

            COUNT(*) FILTER (
              WHERE payment_status =
                'submitted'
            )::INTEGER
              AS payment_submitted,

            COUNT(*) FILTER (
              WHERE whatsapp_status =
                'sent'
            )::INTEGER
              AS whatsapp_sent,

            COUNT(*) FILTER (
              WHERE whatsapp_status =
                'failed'
            )::INTEGER
              AS whatsapp_failed,

            COALESCE(
              SUM(
                amount
              ) FILTER (
                WHERE
                  payment_status =
                    'received'
              ),
              0
            ) AS total_revenue

          FROM memberships

          `
        );


      const stats =
        result.rows[0];


      return res.json({

        success: true,

        stats: {

          total:
            Number(
              stats.total
            ),

          pending:
            Number(
              stats.pending
            ),

          approved:
            Number(
              stats.approved
            ),

          rejected:
            Number(
              stats.rejected
            ),

          expired:
            Number(
              stats.expired
            ),

          paymentReceived:
            Number(
              stats.payment_received
            ),

          paymentSubmitted:
            Number(
              stats.payment_submitted
            ),

          whatsappSent:
            Number(
              stats.whatsapp_sent
            ),

          whatsappFailed:
            Number(
              stats.whatsapp_failed
            ),

          totalRevenue:
            Number(
              stats.total_revenue
            ),

        },

      });

    } catch (error) {

      console.error(
        "Get membership stats error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to load membership statistics",

      });

    }

  };


// =========================================================
// ADMIN - RESEND APPROVAL WHATSAPP
// POST /api/membership/admin/:id/resend-whatsapp
// =========================================================
//
// This allows admin to resend the approval message when:
//
// - Membership is already approved
// - Previous WhatsApp message failed
// - User did not receive the message
//
// =========================================================

const resendApprovalWhatsApp =
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
            "Invalid membership ID",

        });

      }


      // =====================================================
      // GET APPROVED MEMBERSHIP
      // =====================================================

      const result =
        await pool.query(
          `

          ${membershipSelect}

          WHERE m.id = $1

          LIMIT 1

          `,
          [
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
            "Membership not found",

        });

      }


      const membership =
        result.rows[0];


      // =====================================================
      // MUST BE APPROVED
      // =====================================================

      if (
        membership.status !==
        "approved"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "WhatsApp approval notification can only be sent for an approved membership",

        });

      }


      // =====================================================
      // USER
      // =====================================================

      const userResult =
        await pool.query(
          `

          SELECT

            id,

            full_name,

            mobile

          FROM users

          WHERE id = $1

          LIMIT 1

          `,
          [
            membership.user_id,
          ]
        );


      const user =
        userResult.rows[0];


      if (!user) {

        return res.status(404).json({

          success: false,

          message:
            "Member user account not found",

        });

      }


      if (!user.mobile) {

        return res.status(400).json({

          success: false,

          message:
            "Member does not have a mobile number",

        });

      }


      // =====================================================
      // SEND
      // =====================================================

      let whatsappResult;


      try {

        whatsappResult =
          await sendMembershipApprovalWhatsApp({

            mobile:
              user.mobile,

            fullName:
              user.full_name ||
              "Member",

            membershipNumber:
              membership.membership_number,

            planName:
              membership.plan_name ||
              "Membership",

            amount:
              getAmount(
                membership
              ),

            startDate:
              membership.start_date,

            expiryDate:
              membership.expiry_date,

            verificationUrl:
              `${getClientUrl()}/membership/verify/${encodeURIComponent(
                membership.membership_number
              )}`,

          });

      } catch (error) {

        console.error(
          "Resend WhatsApp error:",
          error
        );


        whatsappResult = {

          sent: false,

          status: "failed",

          messageId: null,

          error:
            error?.message ||
            "Unable to send WhatsApp message",

        };

      }


      // =====================================================
      // SAVE RESULT
      // =====================================================

      await pool.query(
        `

        UPDATE memberships

        SET

          whatsapp_status =
            $1,

          whatsapp_message_id =
            $2,

          whatsapp_sent_at =
            CASE

              WHEN $1 = 'sent'

              THEN CURRENT_TIMESTAMP

              ELSE whatsapp_sent_at

            END,

          whatsapp_error =
            $3,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $4

        `,
        [
          whatsappResult.status,

          whatsappResult.messageId,

          whatsappResult.error,

          id,
        ]
      );


      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({

        success:
          whatsappResult.sent === true,

        message:
          whatsappResult.sent
            ? "WhatsApp approval notification sent successfully."
            : "Unable to send WhatsApp approval notification.",

        whatsapp: {

          sent:
            whatsappResult.sent,

          status:
            whatsappResult.status,

          messageId:
            whatsappResult.messageId,

          error:
            process.env.NODE_ENV !==
            "production"
              ? whatsappResult.error
              : undefined,

        },

      });

    } catch (error) {

      console.error(
        "Resend approval WhatsApp controller error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to resend WhatsApp notification",

      });

    }

  };


// =========================================================
// ADMIN - DELETE MEMBERSHIP
// DELETE /api/membership/admin/:id
// =========================================================
//
// Hard delete is intentionally restricted to prevent accidental
// removal of financial/membership history.
//
// This endpoint changes the membership to rejected instead.
//
// =========================================================

const deleteMembership =
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
            "Invalid membership ID",

        });

      }


      const result =
        await pool.query(
          `

          UPDATE memberships

          SET

            status =
              'rejected',

            rejection_reason =
              'Removed by administrator',

            rejected_at =
              CURRENT_TIMESTAMP,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *

          `,
          [
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
            "Membership not found",

        });

      }


      return res.json({

        success: true,

        message:
          "Membership removed successfully",

        membership:
          cleanMembership(
            result.rows[0]
          ),

      });

    } catch (error) {

      console.error(
        "Delete membership error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to remove membership",

      });

    }

  };


// =========================================================
// EXPORTS
// =========================================================
//
// IMPORTANT:
//
// These names must match the names used in
// membershipRoutes.js.
//
// =========================================================

module.exports = {

  // =======================================================
  // USER
  // =======================================================

  getMyMembership,

  getMembershipPlans,

  applyMembership,

  submitPayment,

  renewMembership,


  // =======================================================
  // PUBLIC
  // =======================================================

  verifyMembership,

  getPublicPaymentSettings,


  // =======================================================
  // ADMIN - MEMBERSHIP
  // =======================================================

  getAllMemberships,

  getMembershipById,

  markPaymentReceived,

  markPaymentNotReceived,

  approveMembership,

  rejectMembership,

  deleteMembership,


  // =======================================================
  // ADMIN - WHATSAPP
  // =======================================================

  resendApprovalWhatsApp,


  // =======================================================
  // ADMIN - PLANS
  // =======================================================

  getMembershipPlansAdmin,

  createMembershipPlan,

  updateMembershipPlan,

  deleteMembershipPlan,


  // =======================================================
  // ADMIN - PAYMENT SETTINGS
  // =======================================================

  getPaymentSettings,

  updatePaymentSettings,


  // =======================================================
  // ADMIN - STATS
  // =======================================================

  getMembershipStats,

};