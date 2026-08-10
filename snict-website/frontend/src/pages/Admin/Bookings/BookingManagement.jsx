import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  TicketCheck,
  Trash2,
  User,
  X,
  XCircle,
  MapPin,
  Smartphone,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

import api from "../../../services/api";

import "./BookingManagement.css";

function BookingManagement() {
  // =========================================================
  // STATE
  // =========================================================

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [eventFilter, setEventFilter] =
    useState("all");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  const loadBookings = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get("/bookings/admin");

      if (response.data?.success) {
        setBookings(
          response.data.bookings || []
        );
      } else {
        setBookings([]);

        setError(
          response.data?.message ||
            "Unable to load bookings."
        );
      }
    } catch (error) {
      console.error(
        "Load bookings error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setError(
          "Admin authentication expired. Please login again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load bookings."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadBookings();
  }, []);

  // =========================================================
  // SUCCESS MESSAGE AUTO CLEAR
  // =========================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getBookingId = (booking) => {
    return (
      booking.booking_code ||
      booking.booking_id ||
      booking.id ||
      "N/A"
    );
  };

  const getDatabaseBookingId = (
    booking
  ) => {
    return (
      booking.id ||
      booking.booking_id ||
      null
    );
  };

  const getUserName = (booking) => {
    return (
      booking.user_name ||
      booking.full_name ||
      booking.username ||
      booking.user?.name ||
      booking.user?.fullName ||
      "Unknown User"
    );
  };

  const getEmail = (booking) => {
    return (
      booking.email ||
      booking.user_email ||
      booking.user?.email ||
      "—"
    );
  };

  const getPhone = (booking) => {
    return (
      booking.phone ||
      booking.mobile ||
      booking.user_phone ||
      booking.user?.phone ||
      booking.user?.mobile ||
      ""
    );
  };

  const getEventId = (booking) => {
    return (
      booking.event_id ||
      booking.eventId ||
      booking.event?.id ||
      ""
    );
  };

  const getEventName = (booking) => {
    return (
      booking.event_title ||
      booking.event_name ||
      booking.event?.title ||
      booking.event?.name ||
      booking.title ||
      "Unknown Event"
    );
  };

  const getEventType = (booking) => {
    return (
      booking.event_type ||
      booking.event?.event_type ||
      "EVENT"
    );
  };

  const getPaymentStatus = (booking) => {
    return String(
      booking.payment_status ||
        booking.paymentStatus ||
        "pending"
    ).toLowerCase();
  };

  const getBookingStatus = (booking) => {
    return String(
      booking.booking_status ||
        booking.status ||
        "pending"
    ).toLowerCase();
  };

  const getAmount = (booking) => {
    return Number(
      booking.amount ||
        booking.payment_amount ||
        booking.price ||
        booking.event_price ||
        0
    );
  };

  const getTransactionId = (
    booking
  ) => {
    return (
      booking.transaction_id ||
      booking.transactionId ||
      booking.utr ||
      "—"
    );
  };

  const getPaymentMethod = (
    booking
  ) => {
    return (
      booking.payment_method ||
      booking.paymentMethod ||
      "UPI"
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // FORMAT DATE + TIME
  // =========================================================

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // FORMAT EVENT DATE
  // =========================================================

  const formatEventDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(
      `${String(value).slice(
        0,
        10
      )}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (value) => {
    if (!value) {
      return "";
    }

    return String(value).slice(0, 5);
  };

  // =========================================================
  // EVENT LIST
  // =========================================================

  const events = useMemo(() => {
    const eventMap = new Map();

    bookings.forEach((booking) => {
      const id = getEventId(booking);

      const name = getEventName(
        booking
      );

      if (
        id !== undefined &&
        id !== null &&
        id !== ""
      ) {
        eventMap.set(
          String(id),
          name
        );
      }
    });

    return Array.from(
      eventMap.entries()
    );
  }, [bookings]);

  // =========================================================
  // FILTER BOOKINGS
  // =========================================================

  const filteredBookings = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return bookings.filter(
      (booking) => {
        const bookingId =
          String(
            getBookingId(booking)
          ).toLowerCase();

        const databaseId =
          String(
            getDatabaseBookingId(
              booking
            ) || ""
          ).toLowerCase();

        const name =
          String(
            getUserName(booking)
          ).toLowerCase();

        const email =
          String(
            getEmail(booking)
          ).toLowerCase();

        const eventName =
          String(
            getEventName(booking)
          ).toLowerCase();

        const eventId = String(
          getEventId(booking)
        );

        const paymentStatus =
          getPaymentStatus(
            booking
          );

        const bookingStatus =
          getBookingStatus(
            booking
          );

        const matchesSearch =
          !query ||
          bookingId.includes(
            query
          ) ||
          databaseId.includes(
            query
          ) ||
          name.includes(query) ||
          email.includes(query) ||
          eventName.includes(
            query
          );

        const matchesEvent =
          eventFilter === "all" ||
          eventId === eventFilter;

        const matchesPayment =
          paymentFilter === "all" ||
          paymentStatus ===
            paymentFilter;

        const matchesStatus =
          statusFilter === "all" ||
          bookingStatus ===
            statusFilter;

        return (
          matchesSearch &&
          matchesEvent &&
          matchesPayment &&
          matchesStatus
        );
      }
    );
  }, [
    bookings,
    search,
    eventFilter,
    paymentFilter,
    statusFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    const total = bookings.length;

    const confirmed =
      bookings.filter(
        (booking) =>
          getBookingStatus(
            booking
          ) === "confirmed"
      ).length;

    const pending =
      bookings.filter(
        (booking) => {
          const status =
            getBookingStatus(
              booking
            );

          return (
            status === "pending" ||
            status ===
              "payment_pending"
          );
        }
      ).length;

    const paid =
      bookings.filter(
        (booking) => {
          const status =
            getPaymentStatus(
              booking
            );

          return (
            status === "paid" ||
            status === "verified"
          );
        }
      ).length;

    const revenue =
      bookings
        .filter((booking) => {
          const status =
            getPaymentStatus(
              booking
            );

          return (
            status === "paid" ||
            status === "verified"
          );
        })
        .reduce(
          (
            totalAmount,
            booking
          ) =>
            totalAmount +
            getAmount(booking),
          0
        );

    return {
      total,
      confirmed,
      pending,
      paid,
      revenue,
    };
  }, [bookings]);

  // =========================================================
  // UPDATE BOOKING STATUS
  // =========================================================

  const updateBookingStatus =
    async (
      booking,
      status
    ) => {
      if (actionLoading) {
        return;
      }

      const bookingId =
        getDatabaseBookingId(
          booking
        );

      if (!bookingId) {
        setError(
          "Invalid booking ID."
        );

        return;
      }

      try {
        setActionLoading(true);

        setError("");

        const response =
          await api.put(
            `/bookings/admin/${bookingId}/status`,
            {
              status,
            }
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
              "Unable to update booking."
          );
        }

        await loadBookings(true);

        setSelectedBooking(
          (previous) =>
            previous
              ? {
                  ...previous,
                  booking_status:
                    status,
                }
              : null
        );

        setSuccess(
          `Booking ${status.replace(
            "_",
            " "
          )} successfully.`
        );
      } catch (error) {
        console.error(
          "Update booking status error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to update booking status."
        );
      } finally {
        setActionLoading(false);
      }
    };

  // =========================================================
  // DELETE BOOKING
  // =========================================================

  const deleteBooking = async (
    booking
  ) => {
    if (actionLoading) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this booking?"
      );

    if (!confirmed) {
      return;
    }

    const bookingId =
      getDatabaseBookingId(
        booking
      );

    if (!bookingId) {
      setError(
        "Invalid booking ID."
      );

      return;
    }

    try {
      setActionLoading(true);

      setError("");

      const response =
        await api.delete(
          `/bookings/admin/${bookingId}`
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data
            ?.message ||
            "Unable to delete booking."
        );
      }

      setBookings(
        (previous) =>
          previous.filter(
            (item) => {
              const itemId =
                getDatabaseBookingId(
                  item
                );

              return (
                String(itemId) !==
                String(bookingId)
              );
            }
          )
      );

      setSelectedBooking(null);

      setSuccess(
        "Booking deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete booking error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          "Unable to delete booking."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setEventFilter("all");
    setPaymentFilter("all");
    setStatusFilter("all");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="booking-management-page">

        <div className="booking-management-loading">

          <div className="booking-loading-spinner" />

          <p>
            Loading booking management...
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="booking-management-page">

      <div className="booking-management-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="booking-management-header">

          <div>

            <span className="booking-management-label">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Booking Management
            </h1>

            <p>
              Manage event registrations,
              payments and booking
              status from one place.
            </p>

          </div>


          <button
            type="button"
            className="booking-refresh-btn"
            onClick={() =>
              loadBookings(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "booking-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </header>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="booking-management-alert error">

            <AlertCircle
              size={17}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={15} />
            </button>

          </div>
        )}


        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="booking-management-alert success">

            <CheckCircle2
              size={17}
            />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* =================================================
            STATS
        ================================================= */}

        <section className="booking-management-stats">

          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <TicketCheck
                size={20}
              />
            </div>

            <div>

              <span>
                Total Bookings
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>

          </div>


          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <CheckCircle2
                size={20}
              />
            </div>

            <div>

              <span>
                Confirmed
              </span>

              <strong>
                {stats.confirmed}
              </strong>

            </div>

          </div>


          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <Clock3
                size={20}
              />
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {stats.pending}
              </strong>

            </div>

          </div>


          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <CreditCard
                size={20}
              />
            </div>

            <div>

              <span>
                Verified Revenue
              </span>

              <strong>
                ₹
                {stats.revenue.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            FILTER TOOLBAR
        ================================================= */}

        <section className="booking-management-toolbar">

          <div className="booking-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search booking, member, email or event..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <div className="booking-filters">

            <select
              value={eventFilter}
              onChange={(event) =>
                setEventFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Events
              </option>

              {events.map(
                ([id, name]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {name}
                  </option>
                )
              )}

            </select>


            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Payments
              </option>

              <option value="pending">
                Pending
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

              <option value="failed">
                Failed
              </option>

            </select>


            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Status
              </option>

              <option value="payment_pending">
                Payment Pending
              </option>

              <option value="confirmed">
                Confirmed
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

        </section>


        {/* =================================================
            FILTER SUMMARY
        ================================================= */}

        {(search ||
          eventFilter !== "all" ||
          paymentFilter !== "all" ||
          statusFilter !== "all") && (

          <div className="booking-filter-summary">

            <span>
              Showing{" "}
              <strong>
                {
                  filteredBookings.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {bookings.length}
              </strong>{" "}
              bookings
            </span>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        )}


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredBookings.length ===
        0 ? (

          <div className="booking-empty">

            <TicketCheck
              size={42}
            />

            <h2>
              No bookings found
            </h2>

            <p>
              There are no bookings
              matching your current
              filters.
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <section className="booking-table-wrapper">

            <div className="booking-table-scroll">

              <table className="booking-table">

                <thead>

                  <tr>

                    <th>
                      Booking
                    </th>

                    <th>
                      Member
                    </th>

                    <th>
                      Event
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Booking Status
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredBookings.map(
                    (booking) => {

                      const paymentStatus =
                        getPaymentStatus(
                          booking
                        );

                      const bookingStatus =
                        getBookingStatus(
                          booking
                        );

                      return (
                        <tr
                          key={
                            booking.id ||
                            booking.booking_id
                          }
                        >

                          {/* BOOKING */}

                          <td>

                            <div className="booking-code-cell">

                              <strong>
                                {
                                  getBookingId(
                                    booking
                                  )
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  getDatabaseBookingId(
                                    booking
                                  )
                                }
                              </span>

                            </div>

                          </td>


                          {/* MEMBER */}

                          <td>

                            <div className="booking-member">

                              <div className="booking-member-avatar">

                                <User
                                  size={15}
                                />

                              </div>

                              <div>

                                <strong>
                                  {
                                    getUserName(
                                      booking
                                    )
                                  }
                                </strong>

                                <span>
                                  {
                                    getEmail(
                                      booking
                                    )
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* EVENT */}

                          <td>

                            <div className="booking-event-cell">

                              <strong>
                                {
                                  getEventName(
                                    booking
                                  )
                                }
                              </strong>

                              <span>
                                {
                                  getEventType(
                                    booking
                                  )
                                }
                              </span>

                            </div>

                          </td>


                          {/* AMOUNT */}

                          <td>

                            <strong className="booking-amount">

                              <IndianRupee
                                size={14}
                              />

                              {getAmount(
                                booking
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </strong>

                          </td>


                          {/* PAYMENT */}

                          <td>

                            <span
                              className={`booking-status payment-${paymentStatus}`}
                            >
                              {paymentStatus.replace(
                                "_",
                                " "
                              )}
                            </span>

                          </td>


                          {/* BOOKING STATUS */}

                          <td>

                            <span
                              className={`booking-status booking-${bookingStatus}`}
                            >
                              {bookingStatus.replace(
                                "_",
                                " "
                              )}
                            </span>

                          </td>


                          {/* DATE */}

                          <td>

                            <span className="booking-date">

                              {formatDate(
                                booking.created_at ||
                                  booking.createdAt ||
                                  booking.booking_date
                              )}

                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="booking-row-actions">

                              {/* VIEW */}

                              <button
                                type="button"
                                className="booking-view-btn"
                                onClick={() =>
                                  setSelectedBooking(
                                    booking
                                  )
                                }
                                title="View booking"
                              >
                                <Eye
                                  size={15}
                                />
                              </button>


                              {/* CONFIRM */}

                              {(bookingStatus ===
                                "payment_pending" ||
                                bookingStatus ===
                                  "pending") && (

                                <button
                                  type="button"
                                  className="booking-confirm-btn"
                                  onClick={() =>
                                    updateBookingStatus(
                                      booking,
                                      "confirmed"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Confirm booking"
                                >

                                  <CheckCircle2
                                    size={15}
                                  />

                                </button>

                              )}


                              {/* COMPLETE */}

                              {bookingStatus ===
                                "confirmed" && (

                                <button
                                  type="button"
                                  className="booking-complete-btn"
                                  onClick={() =>
                                    updateBookingStatus(
                                      booking,
                                      "completed"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Mark completed"
                                >

                                  <CheckCircle2
                                    size={15}
                                  />

                                </button>

                              )}


                              {/* CANCEL */}

                              {bookingStatus !==
                                "cancelled" && (
                                <button
                                  type="button"
                                  className="booking-cancel-btn"
                                  onClick={() =>
                                    updateBookingStatus(
                                      booking,
                                      "cancelled"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Cancel booking"
                                >

                                  <XCircle
                                    size={15}
                                  />

                                </button>
                              )}


                              {/* DELETE */}

                              <button
                                type="button"
                                className="booking-delete-btn"
                                onClick={() =>
                                  deleteBooking(
                                    booking
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                title="Delete booking"
                              >

                                <Trash2
                                  size={15}
                                />

                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </div>


      {/* =====================================================
          BOOKING DETAILS MODAL
      ===================================================== */}

      {selectedBooking && (

        <div
          className="booking-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedBooking(
                null
              );
            }

          }}
        >

          <section
            className="booking-details-modal"
            role="dialog"
            aria-modal="true"
          >

            {/* MODAL HEADER */}

            <header className="booking-modal-header">

              <div>

                <span>
                  BOOKING DETAILS
                </span>

                <h2>
                  {
                    getBookingId(
                      selectedBooking
                    )
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
              >

                <X
                  size={19}
                />

              </button>

            </header>


            {/* MODAL BODY */}

            <div className="booking-details-body">

              {/* EVENT */}

              <div className="booking-detail-event">

                <div className="booking-detail-event-icon">

                  <CalendarDays
                    size={21}
                  />

                </div>

                <div>

                  <span>
                    EVENT
                  </span>

                  <strong>
                    {
                      getEventName(
                        selectedBooking
                      )
                    }
                  </strong>

                  <small>
                    {
                      getEventType(
                        selectedBooking
                      )
                    }
                  </small>

                </div>

              </div>


              {/* EVENT INFO */}

              <div className="booking-detail-event-info">

                <div>

                  <span>
                    Event Date
                  </span>

                  <strong>
                    {formatEventDate(
                      selectedBooking.event_date
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Time
                  </span>

                  <strong>

                    {formatTime(
                      selectedBooking.start_time
                    )}

                    {" - "}

                    {formatTime(
                      selectedBooking.end_time
                    )}

                  </strong>

                </div>


                {selectedBooking.venue && (

                  <div>

                    <span>
                      Venue
                    </span>

                    <strong>

                      <MapPin
                        size={14}
                      />

                      {
                        selectedBooking.venue
                      }

                    </strong>

                  </div>

                )}

              </div>


              {/* MEMBER INFORMATION */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <User
                    size={17}
                  />

                  <span>
                    MEMBER INFORMATION
                  </span>

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Name
                    </span>

                    <strong>
                      {
                        getUserName(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {
                        getEmail(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  {getPhone(
                    selectedBooking
                  ) && (

                    <div>

                      <span>
                        Contact Number
                      </span>

                      <strong>
                        {
                          getPhone(
                            selectedBooking
                          )
                        }
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* PAYMENT INFORMATION */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <CreditCard
                    size={17}
                  />

                  <span>
                    PAYMENT INFORMATION
                  </span>

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Amount
                    </span>

                    <strong>
                      ₹
                      {getAmount(
                        selectedBooking
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Payment Method
                    </span>

                    <strong>

                      <Smartphone
                        size={14}
                      />

                      {
                        getPaymentMethod(
                          selectedBooking
                        )
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Payment Status
                    </span>

                    <strong
                      className={`modal-status ${getPaymentStatus(
                        selectedBooking
                      )}`}
                    >
                      {
                        getPaymentStatus(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Transaction ID / UTR
                    </span>

                    <strong className="transaction-id">

                      {
                        getTransactionId(
                          selectedBooking
                        )
                      }

                    </strong>

                  </div>

                </div>

              </div>


              {/* BOOKING INFORMATION */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <TicketCheck
                    size={17}
                  />

                  <span>
                    BOOKING INFORMATION
                  </span>

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Booking Code
                    </span>

                    <strong>
                      {
                        getBookingId(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Booking Status
                    </span>

                    <strong
                      className={`modal-status ${getBookingStatus(
                        selectedBooking
                      )}`}
                    >
                      {getBookingStatus(
                        selectedBooking
                      ).replace(
                        "_",
                        " "
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Created
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedBooking.created_at
                      )}
                    </strong>

                  </div>


                  {selectedBooking.verified_at && (

                    <div>

                      <span>
                        Payment Verified
                      </span>

                      <strong>
                        {formatDateTime(
                          selectedBooking.verified_at
                        )}
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* PAYMENT PROOF */}

              {selectedBooking.payment_proof_url && (

                <div className="booking-payment-proof">

                  <span>
                    PAYMENT PROOF
                  </span>

                  <a
                    href={
                      selectedBooking.payment_proof_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Payment Proof
                  </a>

                </div>

              )}


              {/* MODAL ACTIONS */}

              <div className="booking-modal-actions">

                {(getBookingStatus(
                  selectedBooking
                ) ===
                  "payment_pending" ||
                  getBookingStatus(
                    selectedBooking
                  ) ===
                    "pending") && (

                  <button
                    type="button"
                    className="booking-modal-confirm"
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "confirmed"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >

                    <CheckCircle2
                      size={16}
                    />

                    Confirm Booking

                  </button>

                )}


                {getBookingStatus(
                  selectedBooking
                ) ===
                  "confirmed" && (

                  <button
                    type="button"
                    className="booking-modal-complete"
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "completed"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >

                    <CheckCircle2
                      size={16}
                    />

                    Mark Completed

                  </button>

                )}


                {getBookingStatus(
                  selectedBooking
                ) !==
                  "cancelled" && (

                  <button
                    type="button"
                    className="booking-modal-cancel"
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "cancelled"
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >

                    <XCircle
                      size={16}
                    />

                    Cancel Booking

                  </button>

                )}


                <button
                  type="button"
                  className="booking-modal-delete"
                  onClick={() =>
                    deleteBooking(
                      selectedBooking
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >

                  <Trash2
                    size={16}
                  />

                  Delete

                </button>

              </div>

            </div>

          </section>

        </div>

      )}

    </main>
  );
}

export default BookingManagement;