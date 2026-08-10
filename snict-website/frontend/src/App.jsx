import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// PUBLIC PAGES
// =====================================================

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Team from "./pages/Team/Team";
import Committees from "./pages/Committees/Committees";
import Events from "./pages/Events/Events";
import EventDetails from "./pages/EventDetails/EventDetails";
import Membership from "./pages/Membership/Membership";
import Contact from "./pages/Contact/Contact";

// =====================================================
// USER AUTHENTICATION
// =====================================================

import Profile from "./pages/Profile/Profile";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import Dashboard from "./pages/Dashboard/Dashboard";

// =====================================================
// EVENT USER PAGES
// =====================================================

import EventBooking from "./pages/EventBooking/EventBooking";
import BookingHistory from "./pages/BookingHistory/BookingHistory";

// =====================================================
// ADMIN
// =====================================================

import AdminLogin from "./pages/Admin/AdminLogin";

import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";

import CommitteeManagement from "./pages/Admin/Committees/CommitteeManagement";

import EventManagement from "./pages/Admin/Events/EventManagement";

import BookingManagement from "./pages/Admin/Bookings/BookingManagement";

import UserManagement from "./pages/Admin/Users/UserManagement";

import MembershipManagement from "./pages/Admin/Membership/MembershipManagement";

// PAYMENT MANAGEMENT
import PaymentManagement from "./pages/Admin/Payments/PaymentManagement";
import AdminProfile from "./pages/Admin/Profile/AdminProfile";

function App() {
  return (
    <BrowserRouter>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />


      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/team"
          element={<Team />}
        />

        <Route
          path="/committees"
          element={<Committees />}
        />


        {/* =====================================================
            EVENTS
        ===================================================== */}

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/events/:id"
          element={<EventDetails />}
        />


        {/* =====================================================
            MEMBERSHIP
        ===================================================== */}

        <Route
          path="/membership"
          element={<Membership />}
        />


        {/* =====================================================
            CONTACT
        ===================================================== */}

        <Route
          path="/contact"
          element={<Contact />}
        />


        {/* =====================================================
            USER AUTHENTICATION
        ===================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =====================================================
            USER PROTECTED ROUTES
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            EVENT BOOKING
        ===================================================== */}

        <Route
          path="/events/booking/:id"
          element={
            <ProtectedRoute>
              <EventBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking-history"
          element={
            <ProtectedRoute>
              <BookingHistory />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ADMIN LOGIN
        ===================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* =====================================================
            ADMIN DASHBOARD
        ===================================================== */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />


        {/* =====================================================
            ADMIN COMMITTEE MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/committees"
          element={<CommitteeManagement />}
        />


        {/* =====================================================
            ADMIN EVENT MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/events"
          element={<EventManagement />}
        />


        {/* =====================================================
            ADMIN BOOKING MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/bookings"
          element={<BookingManagement />}
        />


        {/* =====================================================
            ADMIN USER MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/users"
          element={<UserManagement />}
        />

<Route
  path="/admin/profile"
  element={<AdminProfile />}
/>

        {/* =====================================================
            ADMIN MEMBERSHIP MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/memberships"
          element={<MembershipManagement />}
        />


        {/* =====================================================
            ADMIN PAYMENT MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/payments"
          element={<PaymentManagement />}
        />

      </Routes>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />

    </BrowserRouter>
  );
}

export default App;