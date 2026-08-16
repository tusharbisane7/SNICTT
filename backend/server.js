const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();


// =========================================================
// ROUTES
// =========================================================

const authRoutes =
  require("./routes/authRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const committeeRoutes =
  require("./routes/committeeRoutes");

const eventRoutes =
  require("./routes/eventRoutes");

const bookingRoutes =
  require("./routes/bookingRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const expenseRoutes =
  require("./routes/expenseRoutes");

const membershipRoutes =
  require("./routes/membershipRoutes");

const sliderRoutes =
  require("./routes/sliderRoutes");

const attendanceRoutes =
  require("./routes/attendanceRoutes");

const eventPassRoutes =
  require("./routes/eventPassRoutes");

const contactRoutes =
  require("./routes/contactRoutes");

// =========================================================
// APP
// =========================================================

const app = express();


// =========================================================
// CORS
// =========================================================
//
// Production frontend:
//
// https://snict.net
// https://www.snict.net
//
// Old frontend:
//
// https://demositesnict.netlify.app
//
// Local development:
//
// http://localhost:5173
// http://localhost:5174
//
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

    origin: function (
      origin,
      callback
    ) {

      // =====================================================
      // REQUEST WITHOUT ORIGIN
      // =====================================================
      //
      // Examples:
      //
      // Postman
      // Server-to-server
      // Health checks
      //
      // =====================================================

      if (!origin) {

        return callback(
          null,
          true
        );

      }


      // =====================================================
      // CHECK ALLOWED ORIGIN
      // =====================================================

      if (
        allowedOrigins.includes(
          origin
        )
      ) {

        console.log(
          "✅ CORS allowed:",
          origin
        );

        return callback(
          null,
          true
        );

      }


      // =====================================================
      // BLOCK UNKNOWN ORIGIN
      // =====================================================

      console.error(
        "❌ CORS blocked origin:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );

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

app.use(
  cookieParser()
);


// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
  "/",
  (
    req,
    res
  ) => {

    return res.json({

      success: true,

      message:
        "SNICT Backend API is running",

      environment:
        process.env.NODE_ENV ||
        "development",

      frontend:
        "https://snict.net",

      api:
        "https://snict-backend.onrender.com/api",

    });

  }
);


// =========================================================
// MEMBERSHIP ROUTES
// =========================================================
//
// Base:
// /api/membership
//
// =========================================================

app.use(
  "/api/membership",
  membershipRoutes
);


// =========================================================
// AUTH ROUTES
// =========================================================
//
// Base:
// /api/auth
//
// =========================================================

app.use(
  "/api/auth",
  authRoutes
);


// =========================================================
// ADMIN ROUTES
// =========================================================
//
// Base:
// /api/admin
//
// =========================================================

app.use(
  "/api/admin",
  adminRoutes
);


// =========================================================
// COMMITTEE ROUTES
// =========================================================
//
// Base:
// /api/committees
//
// =========================================================

app.use(
  "/api/committees",
  committeeRoutes
);


// =========================================================
// EVENT ROUTES
// =========================================================
//
// Base:
// /api/events
//
// =========================================================

app.use(
  "/api/events",
  eventRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);
// =========================================================
// ATTENDANCE ROUTES
// =========================================================
//
// Base:
// /api/attendance
//
// Examples:
//
// GET
// /api/attendance/admin
//
// GET
// /api/attendance/event/:eventId
//
// GET
// /api/attendance/event/:eventId/stats
//
// POST
// /api/attendance/verify-code
//
// POST
// /api/attendance/verify-qr
//
// POST
// /api/attendance/:bookingId/mark-present
//
// =========================================================

app.use(
  "/api/attendance",
  attendanceRoutes
);


// =========================================================
// BOOKING ROUTES
// =========================================================
//
// Base:
// /api/bookings
//
// Examples:
//
// GET
// /api/bookings
//
// POST
// /api/bookings/event/:eventId
//
// GET
// /api/bookings/:id
//
// ADMIN:
//
// GET
// /api/bookings/admin
//
// GET
// /api/bookings/admin/:id
//
// PUT
// /api/bookings/admin/:id/status
//
// DELETE
// /api/bookings/admin/:id
//
// =========================================================

app.use(
  "/api/bookings",
  bookingRoutes
);


// =========================================================
// PAYMENT ROUTES
// =========================================================
//
// Base:
// /api/payments
//
// =========================================================

app.use(
  "/api/payments",
  paymentRoutes
);


// =========================================================
// EXPENSE ROUTES
// =========================================================
//
// Base:
// /api/admin/expenses
//
// =========================================================

app.use(
  "/api/admin/expenses",
  expenseRoutes
);


// =========================================================
// SLIDER ROUTES
// =========================================================
//
// Base:
// /api/sliders
//
// =========================================================

app.use(
  "/api/sliders",
  sliderRoutes
);


// =========================================================
// EVENT PASS ROUTES
// =========================================================
//
// IMPORTANT:
//
// Event Pass has its own controller and routes.
//
// Base:
// /api/event-passes
//
// User:
//
// GET
// /api/event-passes/booking/:bookingId
//
// Example:
//
// /api/event-passes/booking/23
//
// Admin:
//
// GET
// /api/event-passes/admin
//
// GET
// /api/event-passes/admin/booking/:bookingId
//
// =========================================================

app.use(
  "/api/event-passes",
  eventPassRoutes
);


// =========================================================
// 404 ROUTE
// =========================================================

app.use(
  (
    req,
    res
  ) => {

    console.error(
      "❌ API route not found:",
      req.method,
      req.originalUrl
    );

    return res.status(404).json({

      success: false,

      message:
        "API route not found",

      path:
        req.originalUrl,

    });

  }
);


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

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

        message:
          "CORS origin not allowed",

        origin:
          req.headers.origin ||
          null,

      });

    }


    // =====================================================
    // GENERAL ERROR
    // =====================================================

    return res.status(500).json({

      success: false,

      message:
        "Internal server error",

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
  process.env.PORT ||
  5000;


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

    console.log(
      "🎫 Event Pass API: /api/event-passes"
    );

    console.log(
      "📋 Attendance API: /api/attendance"
    );

  }
);