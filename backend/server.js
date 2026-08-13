const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

// =========================================================
// ROUTES
// =========================================================

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const committeeRoutes = require("./routes/committeeRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const sliderRoutes = require("./routes/sliderRoutes");
const attendanceRoutes =
  require("./routes/attendanceRoutes");

// =========================================================
// APP
// =========================================================

const app = express();

// =========================================================
// CORS
// =========================================================
//
// Production frontend:
// https://snict.net
// https://www.snict.net
//
// Old frontend:
// https://demositesnict.netlify.app
//
// Local development:
// http://localhost:5173
// http://localhost:5174
//
// IMPORTANT:
// These MUST be plain URLs.
// Do NOT use Markdown links.
// =========================================================

const allowedOrigins = [
  "https://snict.net",
  "https://www.snict.net",
  "https://demositesnict.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

// =========================================================
// CORS MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: function (origin, callback) {
      // ===================================================
      // REQUEST WITHOUT ORIGIN
      // ===================================================
      //
      // Examples:
      // Postman
      // Server-to-server requests
      // Health checks
      //
      // ===================================================

      if (!origin) {
        return callback(null, true);
      }

      // ===================================================
      // CHECK ALLOWED ORIGIN
      // ===================================================

      if (allowedOrigins.includes(origin)) {
        console.log("✅ CORS allowed:", origin);

        return callback(null, true);
      }

      // ===================================================
      // BLOCK UNKNOWN ORIGIN
      // ===================================================

      console.error("❌ CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    // =====================================================
    // HTTP-ONLY COOKIE SUPPORT
    // =====================================================

    credentials: true,

    // =====================================================
    // METHODS
    // =====================================================

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    // =====================================================
    // HEADERS
    // =====================================================

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],

    // =====================================================
    // PREFLIGHT
    // =====================================================

    optionsSuccessStatus: 204,
  })
);

// =========================================================
// BODY PARSERS
// =========================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =========================================================
// COOKIE PARSER
// =========================================================

app.use(cookieParser());

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "SNICT Backend API is running",

    environment:
      process.env.NODE_ENV || "development",

    frontend: "https://snict.net",

    api: "https://snict-backend.onrender.com/api",
  });
});

// =========================================================
// MEMBERSHIP ROUTES
// =========================================================

app.use(
  "/api/membership",
  membershipRoutes
);

// =========================================================
// AUTH ROUTES
// =========================================================

app.use(
  "/api/auth",
  authRoutes
);

// =========================================================
// ADMIN ROUTES
// =========================================================

app.use(
  "/api/admin",
  adminRoutes
);

// =========================================================
// COMMITTEE ROUTES
// =========================================================

app.use(
  "/api/committees",
  committeeRoutes
);

// =========================================================
// EVENT ROUTES
// =========================================================

app.use(
  "/api/events",
  eventRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

// =========================================================
// BOOKING ROUTES
// =========================================================

app.use(
  "/api/bookings",
  bookingRoutes
);

// =========================================================
// PAYMENT ROUTES
// =========================================================

app.use(
  "/api/payments",
  paymentRoutes
);

// =========================================================
// EXPENSE ROUTES
// =========================================================

app.use(
  "/api/admin/expenses",
  expenseRoutes
);

// =========================================================
// SLIDER ROUTES
// =========================================================

app.use(
  "/api/sliders",
  sliderRoutes
);

// =========================================================
// 404 ROUTE
// =========================================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Global server error:",
      error
    );

    // =====================================================
    // CORS ERROR
    // =====================================================

    if (
      error.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        success: false,
        message: "CORS origin not allowed",
        origin:
          req.headers.origin || null,
      });
    }

    // =====================================================
    // GENERAL ERROR
    // =====================================================

    return res.status(500).json({
      success: false,
      message: "Internal server error",

      debug:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    });
  }
);

// =========================================================
// SERVER
// =========================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 SNICT backend running on port ${PORT}`
    );

    console.log(
      `🌐 Environment: ${
        process.env.NODE_ENV ||
        "development"
      }`
    );

    console.log(
      "🌐 Frontend: https://snict.net"
    );

    console.log(
      "🔗 Backend: https://snict-backend.onrender.com/"
    );

    console.log(
      "☁️ Cloudinary image storage enabled"
    );
  }
);