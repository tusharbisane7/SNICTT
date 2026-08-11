const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

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

// =========================================================
// APP
// =========================================================

const app = express();

// =========================================================
// CORS
// =========================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://demositesnict.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost and production frontend
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =========================================================
// BODY PARSERS
// =========================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =========================================================
// COOKIE PARSER
// =========================================================

app.use(
  cookieParser()
);

// =========================================================
// UPLOADS / STATIC FILES
// =========================================================
//
// Committee images:
// /uploads/committee/filename.jpg
//
// Slider images:
// /uploads/slider/filename.jpg
//
// This makes uploaded files publicly accessible.
// =========================================================

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
  "/",
  (req, res) => {

    return res.json({
      success: true,

      message:
        "SNICT Backend API is running",
    });
  }
);

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

app.use(
  (req, res) => {

    return res.status(404).json({
      success: false,

      message:
        "API route not found",
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
      "Global server error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Internal server error",
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
      `📁 Uploads served from: ${path.join(
        __dirname,
        "uploads"
      )}`
    );
  }
);