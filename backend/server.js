const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const committeeRoutes = require("./routes/committeeRoutes");
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
const app = express();

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(cookieParser());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "SNICT Backend API is running",
  });
});

/* =========================================================
   AUTH ROUTES
========================================================= */

app.use(
  "/api/membership",
  membershipRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

app.use(
  "/api/admin",
  adminRoutes
);

/* =========================================================
   COMMITTEE ROUTES
========================================================= */

app.use(
  "/api/committees",
  committeeRoutes
);

app.use(
  "/api/events",
  eventRoutes
);

app.use(
  "/api/bookings",
  bookingRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/admin/expenses",
  expenseRoutes
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "Global server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

/* =========================================================
   SERVER
========================================================= */

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 SNICT backend running on http://localhost:${PORT}`
    );
  }
);