import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  Search,
  Eye,
  FileDown,
  RefreshCw,
  X,
  CalendarDays,
  Mail,
  Phone,
  User,
  CreditCard,
  Ticket,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../../services/api";

import "./RegisteredEventUsers.css";


// =========================================================
// COMPONENT
// =========================================================

function RegisteredEventUsers() {

  const navigate = useNavigate();


  // =======================================================
  // EVENTS
  // =======================================================

  const [events, setEvents] =
    useState([]);


  const [selectedEventId, setSelectedEventId] =
    useState("all");


  // =======================================================
  // BOOKINGS
  // =======================================================

  const [bookings, setBookings] =
    useState([]);


  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  const [error, setError] =
    useState("");


  // =======================================================
  // SEARCH
  // =======================================================

  const [search, setSearch] =
    useState("");


  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");


  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("all");


  // =======================================================
  // VIEW MODAL
  // =======================================================

  const [selectedUser, setSelectedUser] =
    useState(null);


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadData();

  }, []);


  // =======================================================
  // LOAD EVENTS + BOOKINGS
  // =======================================================

  const loadData = async (
    isRefresh = false
  ) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");


      const [
        eventsResponse,
        bookingsResponse,
      ] = await Promise.all([

        api.get(
          "/events/admin/all"
        ),

        api.get(
          "/bookings/admin"
        ),

      ]);


      // ===================================================
      // EVENTS
      // ===================================================

      if (
        eventsResponse.data?.success
      ) {

        setEvents(
          Array.isArray(
            eventsResponse.data.events
          )
            ? eventsResponse.data.events
            : []
        );

      } else {

        setEvents([]);

      }


      // ===================================================
      // BOOKINGS
      // ===================================================

      if (
        bookingsResponse.data?.success
      ) {

        setBookings(
          Array.isArray(
            bookingsResponse.data.bookings
          )
            ? bookingsResponse.data.bookings
            : []
        );

      } else {

        setBookings([]);

      }

    } catch (err) {

      console.error(
        "Registered event users error:",
        err
      );


      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {

        setError(
          "Admin authentication expired. Please login again."
        );

      } else {

        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load registered users."
        );

      }

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // =======================================================
  // EVENT LIST
  // =======================================================

  const eventOptions =
    useMemo(() => {

      return [...events].sort(
        (a, b) => {

          const dateA =
            new Date(
              a.event_date || 0
            ).getTime();

          const dateB =
            new Date(
              b.event_date || 0
            ).getTime();

          return dateB - dateA;

        }
      );

    }, [events]);


  // =======================================================
  // SELECTED EVENT
  // =======================================================

  const selectedEvent =
    useMemo(() => {

      if (
        selectedEventId === "all"
      ) {
        return null;
      }

      return events.find(
        (event) =>
          String(event.id) ===
          String(selectedEventId)
      );

    }, [
      events,
      selectedEventId,
    ]);


  // =======================================================
  // FILTER BOOKINGS
  // =======================================================

  const filteredUsers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return bookings.filter(
        (booking) => {

          // ===============================================
          // EVENT FILTER
          // ===============================================

          const matchesEvent =
            selectedEventId === "all" ||
            String(
              booking.event_id
            ) ===
              String(
                selectedEventId
              );


          if (!matchesEvent) {
            return false;
          }


          // ===============================================
          // BOOKING STATUS
          // ===============================================

          const bookingStatus =
            String(
              booking.booking_status ||
              booking.status ||
              ""
            ).toLowerCase();


          const matchesBookingStatus =
            bookingStatusFilter === "all" ||
            bookingStatus ===
              bookingStatusFilter;


          if (!matchesBookingStatus) {
            return false;
          }


          // ===============================================
          // PAYMENT STATUS
          // ===============================================

          const paymentStatus =
            String(
              booking.payment_status ||
              ""
            ).toLowerCase();


          const matchesPaymentStatus =
            paymentStatusFilter === "all" ||
            paymentStatus ===
              paymentStatusFilter;


          if (!matchesPaymentStatus) {
            return false;
          }


          // ===============================================
          // SEARCH
          // ===============================================

          if (!query) {
            return true;
          }


          const searchable = [

            booking.full_name,

            booking.username,

            booking.user_name,

            booking.email,

            booking.mobile,

            booking.booking_code,

            booking.transaction_id,

            booking.event_title,

            booking.event_name,

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchable.includes(
            query
          );

        }
      );

    }, [
      bookings,
      selectedEventId,
      search,
      bookingStatusFilter,
      paymentStatusFilter,
    ]);


  // =======================================================
  // STATISTICS
  // =======================================================

  const statistics =
    useMemo(() => {

      const total =
        filteredUsers.length;


      const confirmed =
        filteredUsers.filter(
          (booking) =>
            String(
              booking.booking_status ||
              booking.status ||
              ""
            ).toLowerCase() ===
            "confirmed"
        ).length;


      const pending =
        filteredUsers.filter(
          (booking) => {

            const status =
              String(
                booking.booking_status ||
                booking.status ||
                ""
              ).toLowerCase();


            return (
              status ===
                "pending" ||
              status ===
                "payment_pending"
            );

          }
        ).length;


      const verified =
        filteredUsers.filter(
          (booking) => {

            const status =
              String(
                booking.payment_status ||
                ""
              ).toLowerCase();


            return (
              status ===
                "verified" ||
              status ===
                "paid"
            );

          }
        ).length;


      return {
        total,
        confirmed,
        pending,
        verified,
      };

    }, [filteredUsers]);


  // =======================================================
  // DATE
  // =======================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "-";
    }


    try {

      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "-";
      }


      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    } catch {

      return "-";

    }

  };


  // =======================================================
  // DATE TIME
  // =======================================================

  const formatDateTime = (
    value
  ) => {

    if (!value) {
      return "-";
    }


    try {

      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "-";
      }


      return date.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );

    } catch {

      return "-";

    }

  };


  // =======================================================
  // CURRENCY
  // =======================================================

  const formatCurrency = (
    value
  ) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );

  };


  // =======================================================
  // STATUS CLASS
  // =======================================================

  const getStatusClass = (
    status
  ) => {

    const value =
      String(
        status || ""
      ).toLowerCase();


    if (
      value ===
        "confirmed" ||
      value ===
        "verified" ||
      value ===
        "paid"
    ) {

      return "status-success";

    }


    if (
      value ===
        "pending" ||
      value ===
        "payment_pending" ||
      value ===
        "submitted"
    ) {

      return "status-warning";

    }


    if (
      value ===
        "rejected" ||
      value ===
        "cancelled"
    ) {

      return "status-danger";

    }


    return "status-neutral";

  };


  // =======================================================
  // STATUS LABEL
  // =======================================================

  const getStatusLabel = (
    status
  ) => {

    if (!status) {
      return "N/A";
    }


    return String(
      status
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  };


  // =======================================================
  // VIEW USER
  // =======================================================

  const handleViewUser = (
    booking
  ) => {

    setSelectedUser(
      booking
    );

  };


  // =======================================================
  // CLOSE USER
  // =======================================================

  const closeUser = () => {

    setSelectedUser(null);

  };


  // =======================================================
  // EXPORT ALL USERS TO PDF
  // =======================================================

  const exportUsersPDF = () => {

    if (!filteredUsers.length) {
      alert("No registered users available to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const eventName = getEventName();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SNICT", 14, 16);

    doc.setFontSize(14);
    doc.text("Registered Users in Event", 14, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Event: ${eventName}`, 14, 33);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 39);
    doc.text(`Total Registered: ${filteredUsers.length}`, 210, 33);

    const rows = filteredUsers.map((booking, index) => [
      index + 1,
      booking.full_name ||
        booking.user_name ||
        booking.username ||
        "Unknown User",
      booking.email || "-",
      booking.mobile || "-",
      booking.booking_code || `#${booking.id}`,
      getStatusLabel(
        booking.booking_status ||
        booking.status
      ),
      getStatusLabel(booking.payment_status),
      formatDateTime(
        booking.booking_created_at ||
        booking.created_at
      ),
    ]);

    autoTable(doc, {
      startY: 47,
      head: [[
        "#",
        "Member",
        "Email",
        "Mobile",
        "Booking Code",
        "Booking Status",
        "Payment",
        "Registered On",
      ]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fontStyle: "bold",
      },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(
          `SNICT • Registered Event Members • Page ${data.pageNumber}`,
          14,
          pageHeight - 8
        );
      },
    });

    const safeName = eventName
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 50);

    doc.save(
      `SNICT_Registered_Users_${safeName}.pdf`
    );
  };


  // =======================================================
  // EXPORT INDIVIDUAL MEMBER PDF
  // =======================================================

  const exportMemberPDF = (booking) => {

    if (!booking) {
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const eventName =
      booking.event_title ||
      booking.event_name ||
      selectedEvent?.title ||
      "Event";

    const memberName =
      booking.full_name ||
      booking.user_name ||
      booking.username ||
      "Member";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SNICT", 20, 20);

    doc.setFontSize(15);
    doc.text("Event Registration Details", 20, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Generated: ${formatDateTime(new Date())}`,
      20,
      38
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Member Information", 20, 52);

    autoTable(doc, {
      startY: 58,
      theme: "grid",
      body: [
        ["Full Name", memberName],
        ["Username", booking.username || "-"],
        ["Email", booking.email || "-"],
        ["Mobile", booking.mobile || "-"],
      ],
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
        },
        1: {
          cellWidth: 125,
        },
      },
    });

    let currentY =
      (doc.lastAutoTable?.finalY || 58) + 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      "Event & Registration",
      20,
      currentY
    );

    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      body: [
        ["Event", eventName],
        [
          "Event Date",
          formatDate(
            booking.event_date ||
            selectedEvent?.event_date
          ),
        ],
        [
          "Booking Code",
          booking.booking_code ||
          `#${booking.id}`,
        ],
        [
          "Booking Amount",
          formatCurrency(booking.amount),
        ],
        [
          "Booking Status",
          getStatusLabel(
            booking.booking_status ||
            booking.status
          ),
        ],
        [
          "Payment Status",
          getStatusLabel(
            booking.payment_status
          ),
        ],
        [
          "Payment Method",
          booking.payment_method || "-",
        ],
        [
          "Transaction ID",
          booking.transaction_id ||
          "Not submitted",
        ],
        [
          "Registered On",
          formatDateTime(
            booking.booking_created_at ||
            booking.created_at
          ),
        ],
        [
          "Presentation",
          booking.presentation_url
            ? "Uploaded"
            : "Not uploaded",
        ],
      ],
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
        },
        1: {
          cellWidth: 125,
        },
      },
    });

    const pageHeight =
      doc.internal.pageSize.height;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "This document is generated from the SNICT Event Management System.",
      20,
      pageHeight - 15
    );

    const safeMemberName = memberName
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 40);

    doc.save(
      `SNICT_${safeMemberName}_Registration.pdf`
    );
  };


  // =======================================================
  // EVENT NAME
  // =======================================================

  const getEventName = () => {

    if (selectedEvent) {

      return (
        selectedEvent.title ||
        selectedEvent.event_name ||
        "Event"
      );

    }


    return "All Events";

  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="registered-users-page">

        <div className="registered-users-loading">

          <RefreshCw
            size={34}
            className="registered-users-spin"
          />

          <h3>
            Loading registered users...
          </h3>

          <p>
            Please wait while we load
            event registrations.
          </p>

        </div>

      </div>

    );

  }


  // =======================================================
  // PAGE
  // =======================================================

  return (

    <div className="registered-users-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="registered-users-header">

        <div className="registered-users-header-left">

          <button
            type="button"
            className="registered-users-back"
            onClick={() =>
              navigate(
                "/admin/events"
              )
            }
          >

            <ArrowLeft
              size={18}
            />

            Back to Events

          </button>


          <div>

            <div className="registered-users-eyebrow">

              <Users
                size={16}
              />

              EVENT MANAGEMENT

            </div>


            <h1>
              Registered Users in Event
            </h1>


            <p>
              View members registered
              for your events.
            </p>

          </div>

        </div>


        <div className="registered-users-header-actions">

          <button
            type="button"
            className="registered-users-refresh"
            onClick={() =>
              loadData(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "registered-users-spin"
                  : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            className="registered-users-export"
            onClick={exportUsersPDF}
            disabled={
              filteredUsers.length === 0
            }
          >

            <FileDown
              size={17}
            />

            Export PDF

          </button>

        </div>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="registered-users-alert error">

          <AlertCircle
            size={19}
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="registered-users-stats">

        <div className="registered-stat-card">

          <div className="registered-stat-icon">

            <Users
              size={21}
            />

          </div>

          <div>

            <span>
              Registered
            </span>

            <strong>
              {statistics.total}
            </strong>

          </div>

        </div>


        <div className="registered-stat-card">

          <div className="registered-stat-icon success">

            <CheckCircle2
              size={21}
            />

          </div>

          <div>

            <span>
              Confirmed
            </span>

            <strong>
              {statistics.confirmed}
            </strong>

          </div>

        </div>


        <div className="registered-stat-card">

          <div className="registered-stat-icon warning">

            <Clock3
              size={21}
            />

          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {statistics.pending}
            </strong>

          </div>

        </div>


        <div className="registered-stat-card">

          <div className="registered-stat-icon verified">

            <CreditCard
              size={21}
            />

          </div>

          <div>

            <span>
              Payment Verified
            </span>

            <strong>
              {statistics.verified}
            </strong>

          </div>

        </div>

      </div>


      {/* ===================================================
          FILTER PANEL
      =================================================== */}

      <div className="registered-users-filter-panel">

        <div className="registered-filter-group event-filter">

          <label>
            Select Event
          </label>

          <select
            value={
              selectedEventId
            }
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
          >

            <option value="all">
              All Events
            </option>

            {eventOptions.map(
              (event) => (

                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                </option>

              )
            )}

          </select>

        </div>


        <div className="registered-filter-group search-filter">

          <label>
            Search Member
          </label>

          <div className="registered-search-box">

            <Search
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Name, email, mobile, booking code..."
            />

            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >

                <X
                  size={16}
                />

              </button>

            )}

          </div>

        </div>


        <div className="registered-filter-group">

          <label>
            Booking Status
          </label>

          <select
            value={
              bookingStatusFilter
            }
            onChange={(e) =>
              setBookingStatusFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              All Status
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="payment_pending">
              Payment Pending
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </div>


        <div className="registered-filter-group">

          <label>
            Payment
          </label>

          <select
            value={
              paymentStatusFilter
            }
            onChange={(e) =>
              setPaymentStatusFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              All Payments
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="submitted">
              Submitted
            </option>

            <option value="verified">
              Verified
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </div>

      </div>


      {/* ===================================================
          SELECTED EVENT INFO
      =================================================== */}

      {selectedEvent && (

        <div className="registered-selected-event">

          <div className="selected-event-icon">

            <CalendarDays
              size={23}
            />

          </div>


          <div>

            <span>
              Selected Event
            </span>

            <strong>
              {selectedEvent.title}
            </strong>

            <small>

              {formatDate(
                selectedEvent.event_date
              )}

              {selectedEvent.venue
                ? ` • ${selectedEvent.venue}`
                : ""}

            </small>

          </div>

        </div>

      )}


      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="registered-users-card">

        <div className="registered-users-card-header">

          <div>

            <h2>
              Event Registrations
            </h2>

            <p>
              {filteredUsers.length}
              {" "}
              registered member
              {filteredUsers.length !== 1
                ? "s"
                : ""}
            </p>

          </div>


          <div className="print-only-event-title">

            SNICT — Registered Event Members

            <br />

            {getEventName()}

          </div>

        </div>


        {filteredUsers.length === 0 ? (

          <div className="registered-users-empty">

            <Users
              size={44}
            />

            <h3>
              No registered users found
            </h3>

            <p>
              No members match the
              selected event or filters.
            </p>

          </div>

        ) : (

          <div className="registered-users-table-wrapper">

            <table className="registered-users-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Member
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Booking
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Registered
                  </th>

                  <th className="no-print">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (
                    booking,
                    index
                  ) => {

                    const bookingStatus =
                      booking.booking_status ||
                      booking.status ||
                      "N/A";


                    const paymentStatus =
                      booking.payment_status ||
                      "N/A";


                    return (

                      <tr
                        key={
                          booking.id ||
                          booking.booking_id
                        }
                      >

                        <td>
                          {index + 1}
                        </td>


                        <td>

                          <div className="registered-member-cell">

                            {booking.profile_image_url ? (

                              <img
                                src={
                                  booking.profile_image_url
                                }
                                alt=""
                              />

                            ) : (

                              <div className="registered-member-avatar">

                                <User
                                  size={18}
                                />

                              </div>

                            )}


                            <div>

                              <strong>
                                {
                                  booking.full_name ||
                                  booking.user_name ||
                                  booking.username ||
                                  "Unknown User"
                                }
                              </strong>

                              <span>
                                @
                                {
                                  booking.username ||
                                  "user"
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="registered-contact">

                            <span>
                              <Mail
                                size={14}
                              />

                              {
                                booking.email ||
                                "-"
                              }

                            </span>

                            <span>
                              <Phone
                                size={14}
                              />

                              {
                                booking.mobile ||
                                "-"
                              }

                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="registered-booking-cell">

                            <strong>
                              {
                                booking.booking_code ||
                                `#${booking.id}`
                              }
                            </strong>

                            <span
                              className={
                                `status-pill ${getStatusClass(
                                  bookingStatus
                                )}`
                              }
                            >
                              {
                                getStatusLabel(
                                  bookingStatus
                                )
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              `status-pill ${getStatusClass(
                                paymentStatus
                              )}`
                            }
                          >
                            {
                              getStatusLabel(
                                paymentStatus
                              )
                            }
                          </span>

                        </td>


                        <td>

                          {
                            formatDateTime(
                              booking.booking_created_at ||
                              booking.created_at
                            )
                          }

                        </td>


                        <td className="no-print">

                          <button
                            type="button"
                            className="registered-view-button"
                            onClick={() =>
                              handleViewUser(
                                booking
                              )
                            }
                          >

                            <Eye
                              size={16}
                            />

                            View

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ===================================================
          MEMBER VIEW MODAL
      =================================================== */}

      {selectedUser && (

        <div className="registered-user-modal no-print">

          <div
            className="registered-user-modal-backdrop"
            onClick={
              closeUser
            }
          />


          <div className="registered-user-modal-card">

            <div className="registered-user-modal-header">

              <div>

                <span>
                  EVENT REGISTRATION
                </span>

                <h2>
                  Member Details
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeUser
                }
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <div className="registered-user-profile">

              {selectedUser.profile_image_url ? (

                <img
                  src={
                    selectedUser.profile_image_url
                  }
                  alt=""
                />

              ) : (

                <div className="registered-user-profile-placeholder">

                  <User
                    size={30}
                  />

                </div>

              )}


              <div>

                <h3>
                  {
                    selectedUser.full_name ||
                    selectedUser.user_name ||
                    selectedUser.username ||
                    "Unknown User"
                  }
                </h3>

                <span>
                  @
                  {
                    selectedUser.username ||
                    "-"
                  }
                </span>

              </div>

            </div>


            <div className="registered-detail-grid">

              <div className="registered-detail">

                <span>
                  Email
                </span>

                <strong>
                  {
                    selectedUser.email ||
                    "-"
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Mobile
                </span>

                <strong>
                  {
                    selectedUser.mobile ||
                    "-"
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Booking Code
                </span>

                <strong>
                  {
                    selectedUser.booking_code ||
                    `#${selectedUser.id}`
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Booking Amount
                </span>

                <strong>
                  {
                    formatCurrency(
                      selectedUser.amount
                    )
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Booking Status
                </span>

                <strong>

                  <span
                    className={
                      `status-pill ${getStatusClass(
                        selectedUser.booking_status
                      )}`
                    }
                  >
                    {
                      getStatusLabel(
                        selectedUser.booking_status
                      )
                    }
                  </span>

                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Payment Status
                </span>

                <strong>

                  <span
                    className={
                      `status-pill ${getStatusClass(
                        selectedUser.payment_status
                      )}`
                    }
                  >
                    {
                      getStatusLabel(
                        selectedUser.payment_status
                      )
                    }
                  </span>

                </strong>

              </div>


              <div className="registered-detail full">

                <span>
                  Event
                </span>

                <strong>
                  {
                    selectedUser.event_title ||
                    selectedUser.event_name ||
                    "-"
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Event Date
                </span>

                <strong>
                  {
                    formatDate(
                      selectedUser.event_date
                    )
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Registered On
                </span>

                <strong>
                  {
                    formatDateTime(
                      selectedUser.booking_created_at ||
                      selectedUser.created_at
                    )
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Payment Method
                </span>

                <strong>
                  {
                    selectedUser.payment_method ||
                    "-"
                  }
                </strong>

              </div>


              <div className="registered-detail">

                <span>
                  Transaction ID
                </span>

                <strong>
                  {
                    selectedUser.transaction_id ||
                    "Not submitted"
                  }
                </strong>

              </div>


              <div className="registered-detail full">

                <span>
                  Presentation
                </span>

                <strong>

                  {selectedUser.presentation_url ? (

                    <a
                      href={
                        selectedUser.presentation_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="registered-presentation-link"
                    >

                      <FileText
                        size={16}
                      />

                      View Presentation

                    </a>

                  ) : (

                    "No presentation uploaded"

                  )}

                </strong>

              </div>

            </div>


            <div className="registered-user-modal-footer">

              <button
                type="button"
                className="registered-modal-secondary"
                onClick={
                  closeUser
                }
              >

                Close

              </button>


              <button
                type="button"
                className="registered-modal-primary"
                onClick={() =>
                  exportMemberPDF(selectedUser)
                }
              >

                <FileDown
                  size={17}
                />

                Export Member PDF

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default RegisteredEventUsers;