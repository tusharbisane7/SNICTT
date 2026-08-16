import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
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
import Members from "./pages/Members/Members";
import EventPass from "./pages/Event Pass/EventPass";
import PlacementCommittee
  from "./pages/PlacementCommittee/PlacementCommittee";

import AcademicCommittee
  from "./pages/AcademicCommittee/AcademicCommittee";

import ComplianceCommittee
  from "./pages/ComplianceCommittee/ComplianceCommittee";

import WorkingCommittee
  from "./pages/WorkingCommittee/WorkingCommittee";
import MembershipPayment
  from "./pages/MembershipPayment/MembershipPayment";

import EventRegistration
  from "./pages/EventRegistration/EventRegistration";

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

import AdminDashboard
  from "./pages/Admin/Dashboard/AdminDashboard";

import CommitteeManagement
  from "./pages/Admin/Committees/CommitteeManagement";

import EventManagement
  from "./pages/Admin/Events/EventManagement";

import BookingManagement
  from "./pages/Admin/Bookings/BookingManagement";

import UserManagement
  from "./pages/Admin/Users/UserManagement";

import MembershipManagement
  from "./pages/Admin/Membership/MembershipManagement";

import SliderManagement
  from "./pages/Admin/Slider/SliderManagement";

import RegisteredEventUsers
  from "./pages/Admin/Events/RegisteredEventUsers";

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

import PaymentManagement
  from "./pages/Admin/Payments/PaymentManagement";


// =====================================================
// ATTENDANCE MANAGEMENT
// =====================================================

import AttendanceManagement
  from "./pages/Admin/Attendance/AttendanceManagement";

import ContactManagement from "./pages/Admin/ContactManagement/ContactManagement";
// =====================================================
// ADMIN PROFILE
// =====================================================

import AdminProfile
  from "./pages/Admin/Profile/AdminProfile";


// =====================================================
// APP
// =====================================================

function App() {

  return (

    <BrowserRouter>

      <ScrollToTop />


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
          path="/members"
          element={<Members />}
        />


        <Route
          path="/committees/placement"
          element={<PlacementCommittee />}
        />


        <Route
          path="/committees/academic"
          element={<AcademicCommittee />}
        />


        <Route
          path="/committees/compliance"
          element={<ComplianceCommittee />}
        />


        <Route
          path="/committees/working"
          element={<WorkingCommittee />}
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

        {/* Public event details */}
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


<Route
  path="/membership-payment"
  element={<MembershipPayment />}
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
    ADMIN CONTACT MANAGEMENT
===================================================== */}

<Route
  path="/admin/contacts"
  element={<ContactManagement />}
/>

<Route
  path="/admin/contact"
  element={<ContactManagement />}
/>

        {/* =====================================================
            EVENT REGISTRATION
        =====================================================

        Flow:

        Event Details
              ↓
        Register for Event
              ↓
        Event Registration Preview
              ↓
        Optional PDF / PPT / PPTX upload
              ↓
        Event Payment
              ↓
        Booking / Registration Confirmation

        IMPORTANT:
        This route intentionally stays outside ProtectedRoute.
        EventRegistration can check authentication and redirect
        the user to /login while preserving the event URL.
        ===================================================== */}

        <Route
          path="/events/registration/:id"
          element={<EventRegistration />}
        />


        {/* =====================================================
            LEGACY EVENT BOOKING
        =====================================================

        Kept for existing bookings / old links.
        New registrations should use:

        /events/registration/:id
        ===================================================== */}

        <Route
          path="/events/booking/:id"
          element={
            <ProtectedRoute>
              <EventBooking />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            BOOKING HISTORY
        ===================================================== */}

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


<Route
  path="/admin/events/registered-users"
  element={
    <RegisteredEventUsers />
  }
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


        {/* =====================================================
            ADMIN PROFILE
        ===================================================== */}

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
            ADMIN SLIDER MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/sliders"
          element={<SliderManagement />}
        />


        {/* =====================================================
            ADMIN PAYMENT MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/payments"
          element={<PaymentManagement />}
        />


        {/* =====================================================
            ADMIN ATTENDANCE MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/attendance"
          element={<AttendanceManagement />}
        />
<Route
  path="/event-pass/:bookingId"
  element={<EventPass />}
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