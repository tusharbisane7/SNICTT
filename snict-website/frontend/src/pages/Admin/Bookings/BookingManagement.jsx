import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  UserX,
  Ticket,
} from "lucide-react";

import api from "../../../services/api";

import "./BookingManagement.css";


// =========================================================
// BOOKING MANAGEMENT
// =========================================================

function BookingManagement() {

  // =======================================================
  // STATE
  // =======================================================

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

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

  const [attendanceFilter, setAttendanceFilter] =
    useState("all");

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [selectedPass, setSelectedPass] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [passLoading, setPassLoading] =
    useState(false);

  const [copiedCode, setCopiedCode] =
    useState("");

  const [qrLoading, setQrLoading] =
    useState(false);


  // =======================================================
  // LOAD BOOKINGS
  // =======================================================

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
        await api.get(
          "/bookings/admin"
        );

      if (
        response.data?.success
      ) {

        setBookings(
          Array.isArray(
            response.data.bookings
          )
            ? response.data.bookings
            : []
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


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadBookings();

  }, []);


  // =======================================================
  // AUTO CLEAR SUCCESS
  // =======================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {

        setSuccess("");

      }, 4000);

    return () =>
      clearTimeout(timer);

  }, [success]);


  // =======================================================
  // HELPERS
  // =======================================================

  const getDatabaseBookingId = (
    booking
  ) => {

    return (
      booking?.id ??
      booking?.booking_id ??
      null
    );
  };


  const getBookingCode = (
    booking
  ) => {

    return (
      booking?.booking_code ||
      "N/A"
    );
  };


  const getUserName = (
    booking
  ) => {

    return (
      booking?.full_name ||
      booking?.user_name ||
      booking?.username ||
      booking?.user?.name ||
      "Unknown User"
    );
  };


  const getEmail = (
    booking
  ) => {

    return (
      booking?.email ||
      booking?.user_email ||
      booking?.user?.email ||
      "—"
    );
  };


  const getPhone = (
    booking
  ) => {

    return (
      booking?.mobile ||
      booking?.phone ||
      booking?.user_phone ||
      booking?.user?.mobile ||
      booking?.user?.phone ||
      ""
    );
  };


  const getEventId = (
    booking
  ) => {

    return (
      booking?.event_id ??
      booking?.eventId ??
      booking?.event?.id ??
      ""
    );
  };


  const getEventName = (
    booking
  ) => {

    return (
      booking?.event_title ||
      booking?.event_name ||
      booking?.event?.title ||
      booking?.event?.name ||
      "Unknown Event"
    );
  };


  const getEventType = (
    booking
  ) => {

    return (
      booking?.event_type ||
      booking?.event?.event_type ||
      "EVENT"
    );
  };


  const getPaymentStatus = (
    booking
  ) => {

    return String(
      booking?.payment_status ||
      booking?.paymentStatus ||
      "pending"
    ).toLowerCase();
  };


  const getBookingStatus = (
    booking
  ) => {

    return String(
      booking?.booking_status ||
      booking?.status ||
      "pending"
    ).toLowerCase();
  };


  const getAmount = (
    booking
  ) => {

    const value =
      booking?.payment_amount ??
      booking?.amount ??
      booking?.booking_amount ??
      booking?.event_price ??
      booking?.price ??
      0;

    return Number(value) || 0;
  };


  const getTransactionId = (
    booking
  ) => {

    return (
      booking?.transaction_id ||
      booking?.transactionId ||
      booking?.utr ||
      "—"
    );
  };


  const getPaymentMethod = (
    booking
  ) => {

    return (
      booking?.payment_method ||
      booking?.paymentMethod ||
      "UPI"
    );
  };


  const getPaymentProof = (
    booking
  ) => {

    return (
      booking?.payment_proof_url ||
      booking?.paymentProofUrl ||
      ""
    );
  };


  // =======================================================
  // PASS HELPERS
  // =======================================================

  const getPassCode = (
    booking
  ) => {

    return (
      booking?.pass_code ||
      booking?.passCode ||
      booking?.pass?.pass_code ||
      "N/A"
    );
  };


  const getPassToken = (
    booking
  ) => {

    return (
      booking?.pass_token ||
      booking?.passToken ||
      booking?.pass?.pass_token ||
      ""
    );
  };


  const getAttendanceCode = (
    booking
  ) => {

    return (
      booking?.attendance_code ||
      booking?.attendanceCode ||
      booking?.attendance?.attendance_code ||
      "N/A"
    );
  };


  const getAttendanceStatus = (
    booking
  ) => {

    const value =
      booking?.attendance_status ||
      booking?.attendanceStatus ||
      booking?.attendance?.attendance_status ||
      "";

    const normalized =
      String(value).toLowerCase();

    if (
      normalized === "present" ||
      normalized === "checked_in" ||
      normalized === "checked-in" ||
      normalized === "attended"
    ) {

      return "present";
    }

    return "not_present";
  };


  const getAttendanceMarkedAt = (
    booking
  ) => {

    return (
      booking?.attendance_marked_at ||
      booking?.marked_at ||
      booking?.attendanceMarkedAt ||
      booking?.attendance?.marked_at ||
      null
    );
  };


  const getAttendanceMarkedBy = (
    booking
  ) => {

    return (
      booking?.attendance_marked_by ||
      booking?.marked_by ||
      booking?.attendanceMarkedBy ||
      booking?.attendance?.marked_by ||
      null
    );
  };


  // =======================================================
  // DATE
  // =======================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(
        `${String(value).slice(0, 10)}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

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


  // =======================================================
  // DATE TIME
  // =======================================================

  const formatDateTime = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

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


  // =======================================================
  // TIME
  // =======================================================

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    return String(value).slice(
      0,
      5
    );
  };


  // =======================================================
  // EVENT LIST
  // =======================================================

  const events =
    useMemo(() => {

      const map =
        new Map();

      bookings.forEach(
        (booking) => {

          const eventId =
            getEventId(
              booking
            );

          if (
            eventId !== "" &&
            eventId !== null &&
            eventId !== undefined
          ) {

            map.set(
              String(eventId),
              getEventName(
                booking
              )
            );
          }
        }
      );

      return Array.from(
        map.entries()
      );

    }, [bookings]);


  // =======================================================
  // FILTER BOOKINGS
  // =======================================================

  const filteredBookings =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {

          const bookingCode =
            String(
              getBookingCode(
                booking
              )
            ).toLowerCase();

          const bookingId =
            String(
              getDatabaseBookingId(
                booking
              ) || ""
            ).toLowerCase();

          const name =
            String(
              getUserName(
                booking
              )
            ).toLowerCase();

          const email =
            String(
              getEmail(
                booking
              )
            ).toLowerCase();

          const eventName =
            String(
              getEventName(
                booking
              )
            ).toLowerCase();

          const eventId =
            String(
              getEventId(
                booking
              )
            );

          const paymentStatus =
            getPaymentStatus(
              booking
            );

          const bookingStatus =
            getBookingStatus(
              booking
            );

          const attendanceStatus =
            getAttendanceStatus(
              booking
            );

          const matchesSearch =
            !query ||
            bookingCode.includes(query) ||
            bookingId.includes(query) ||
            name.includes(query) ||
            email.includes(query) ||
            eventName.includes(query);

          const matchesEvent =
            eventFilter === "all" ||
            eventId === eventFilter;

          const matchesPayment =
            paymentFilter === "all" ||
            paymentStatus === paymentFilter;

          const matchesStatus =
            statusFilter === "all" ||
            bookingStatus === statusFilter;

          const matchesAttendance =
            attendanceFilter === "all" ||
            attendanceStatus === attendanceFilter;

          return (
            matchesSearch &&
            matchesEvent &&
            matchesPayment &&
            matchesStatus &&
            matchesAttendance
          );
        }
      );

    }, [
      bookings,
      search,
      eventFilter,
      paymentFilter,
      statusFilter,
      attendanceFilter,
    ]);


  // =======================================================
  // STATISTICS
  // =======================================================

  const stats =
    useMemo(() => {

      const total =
        bookings.length;

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
              status === "payment_pending"
            );
          }
        ).length;

      const paid =
        bookings.filter(
          (booking) =>
            getPaymentStatus(
              booking
            ) === "verified"
        ).length;

      const revenue =
        bookings
          .filter(
            (booking) =>
              getPaymentStatus(
                booking
              ) === "verified"
          )
          .reduce(
            (
              totalAmount,
              booking
            ) =>
              totalAmount +
              getAmount(
                booking
              ),
            0
          );

      const attended =
        bookings.filter(
          (booking) =>
            getAttendanceStatus(
              booking
            ) === "present"
        ).length;

      const notAttended =
        total - attended;

      return {
        total,
        confirmed,
        pending,
        paid,
        revenue,
        attended,
        notAttended,
      };

    }, [bookings]);


  // =======================================================
  // CONFIRM PAYMENT
  //
  // IMPORTANT:
  // This is NOT the old booking status endpoint.
  //
  // PUT:
  // /bookings/admin/:id/confirm-payment
  //
  // Backend will:
  //
  // payment submitted
  //       ↓
  // payment verified
  //       ↓
  // booking confirmed
  //       ↓
  // event pass generated
  //       ↓
  // attendance generated
  // =======================================================

  const confirmPayment =
    async (
      booking
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

      const paymentStatus =
        getPaymentStatus(
          booking
        );

      if (
        paymentStatus ===
        "verified"
      ) {

        setSuccess(
          "Payment is already verified."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Confirm payment for ${getBookingCode(
            booking
          )}?\n\nAmount: ₹${getAmount(
            booking
          ).toLocaleString(
            "en-IN"
          )}\n\nThis will verify the payment, confirm the booking and generate the event pass.`
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionLoading(true);

        setError("");

        setSuccess("");

        const response =
          await api.put(
            `/bookings/admin/${bookingId}/confirm-payment`
          );

        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to confirm payment."
          );
        }

        // ---------------------------------------------------
        // REFRESH FROM DATABASE
        // ---------------------------------------------------

        await loadBookings(true);

        // ---------------------------------------------------
        // UPDATE SELECTED BOOKING
        // ---------------------------------------------------

        if (
          selectedBooking &&
          String(
            getDatabaseBookingId(
              selectedBooking
            )
          ) ===
          String(
            bookingId
          )
        ) {

          setSelectedBooking(
            (previous) => ({
              ...(previous || {}),
              ...(response.data.booking || {}),
              booking_status:
                "confirmed",
              status:
                "confirmed",
              payment_status:
                "verified",
            })
          );
        }

        // ---------------------------------------------------
        // SUCCESS
        // ---------------------------------------------------

        setSuccess(
          response.data?.message ||
          "Payment confirmed successfully. Booking confirmed and event pass generated."
        );

      } catch (error) {

        console.error(
          "Confirm payment error:",
          error
        );

        const serverMessage =
          error.response?.data?.message;

        const debugMessage =
          error.response?.data?.debug?.message;

        setError(
          serverMessage ||
          debugMessage ||
          error.message ||
          "Unable to confirm payment."
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =======================================================
  // UPDATE BOOKING STATUS
  //
  // IMPORTANT:
  // Do NOT use this function for payment confirmation.
  // Payment confirmation uses confirmPayment().
  // =======================================================

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
            response.data?.message ||
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
                  status,
                }
              : null
        );

        setSuccess(
          `Booking ${String(
            status
          ).replace(
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
          error.response?.data?.message ||
          error.message ||
          "Unable to update booking status."
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =======================================================
  // VIEW PASS
  //
  // GET:
  // /bookings/admin/:id/pass
  // =======================================================

  const viewPass =
    async (
      booking
    ) => {

      if (passLoading) {
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

        setPassLoading(true);

        setError("");

        const response =
          await api.get(
            `/bookings/admin/${bookingId}/pass`
          );

        if (
          !response.data?.success ||
          !response.data?.pass
        ) {

          throw new Error(
            response.data?.message ||
            "Event pass not found."
          );
        }

        setSelectedPass(
          response.data.pass
        );

      } catch (error) {

        console.error(
          "View pass error:",
          error
        );

        setError(
          error.response?.data?.message ||
          error.message ||
          "Unable to load event pass."
        );

      } finally {

        setPassLoading(false);

      }
    };


  // =======================================================
  // CLOSE PASS
  // =======================================================

  const closePass =
    () => {

      if (passLoading) {
        return;
      }

      setSelectedPass(null);

    };


  // =======================================================
  // COPY CODE
  // =======================================================

  const copyCode =
    async (
      code
    ) => {

      if (
        !code ||
        code === "N/A"
      ) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          String(code)
        );

        setCopiedCode(
          String(code)
        );

        setTimeout(
          () => {
            setCopiedCode("");
          },
          1800
        );

      } catch (error) {

        console.error(
          "Copy code error:",
          error
        );

        setError(
          "Unable to copy code."
        );
      }
    };


  // =======================================================
  // PASS QR
  // =======================================================

  const getPassQrUrl =
    (pass) => {

      if (!pass) {
        return "";
      }

      if (
        pass.qr_code_url
      ) {
        return pass.qr_code_url;
      }

      const payload = {
        type:
          "SNICT_EVENT_PASS",

        passId:
          pass.pass_id ||
          pass.id ||
          null,

        passCode:
          pass.pass_code ||
          "",

        passToken:
          pass.pass_token ||
          "",

        bookingId:
          pass.booking_id ||
          null,

        bookingCode:
          pass.booking_code ||
          "",

        attendanceCode:
          pass.attendance_code ||
          "",
      };

      return (
        "https://api.qrserver.com/v1/create-qr-code/" +
        `?size=320x320&data=${encodeURIComponent(
          JSON.stringify(
            payload
          )
        )}`
      );
    };


  // =======================================================
  // PRINT PASS
  // =======================================================

  const printPass =
    () => {

      window.print();

    };


  // =======================================================
  // DELETE BOOKING
  // =======================================================

  const deleteBooking =
    async (
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
            response.data?.message ||
            "Unable to delete booking."
          );
        }

        setBookings(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  getDatabaseBookingId(
                    item
                  )
                ) !==
                String(
                  bookingId
                )
            )
        );

        setSelectedBooking(
          null
        );

        setSuccess(
          "Booking deleted successfully."
        );

      } catch (error) {

        console.error(
          "Delete booking error:",
          error
        );

        setError(
          error.response?.data?.message ||
          error.message ||
          "Unable to delete booking."
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =======================================================
  // CLEAR FILTERS
  // =======================================================

  const clearFilters =
    () => {

      setSearch("");

      setEventFilter(
        "all"
      );

      setPaymentFilter(
        "all"
      );

      setStatusFilter(
        "all"
      );

      setAttendanceFilter(
        "all"
      );
    };


  // =======================================================
  // LOADING
  // =======================================================

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


  // =======================================================
  // UI
  // =======================================================

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
              payments, booking status and
              event passes.
            </p>

          </div>

          <button
            type="button"
            className="booking-refresh-btn"
            onClick={() =>
              loadBookings(true)
            }
            disabled={
              refreshing ||
              actionLoading
            }
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

              <X
                size={15}
              />

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
              <TicketCheck size={20} />
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
              <CheckCircle2 size={20} />
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
              <Clock3 size={20} />
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
              <CreditCard size={20} />
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


          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <UserCheck size={20} />
            </div>

            <div>
              <span>
                Attended
              </span>

              <strong>
                {stats.attended}
              </strong>
            </div>

          </div>


          <div className="booking-stat-card">

            <div className="booking-stat-icon">
              <UserX size={20} />
            </div>

            <div>
              <span>
                Not Attended
              </span>

              <strong>
                {stats.notAttended}
              </strong>
            </div>

          </div>

        </section>


        {/* =================================================
            FILTER TOOLBAR
        ================================================= */}

        <section className="booking-management-toolbar">

          <div className="booking-search">

            <Search
              size={17}
            />

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


            <select
              value={
                attendanceFilter
              }
              onChange={(event) =>
                setAttendanceFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Attendance
              </option>

              <option value="present">
                Present
              </option>

              <option value="not_present">
                Not Present
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
          statusFilter !== "all" ||
          attendanceFilter !== "all") && (

          <div className="booking-filter-summary">

            <span>

              Showing{" "}

              <strong>
                {filteredBookings.length}
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

        {filteredBookings.length === 0 ? (

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
                      Attendance
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

                      const attendanceStatus =
                        getAttendanceStatus(
                          booking
                        );

                      const canConfirmPayment =
                        paymentStatus ===
                          "submitted" ||
                        paymentStatus ===
                          "pending";

                      return (

                        <tr
                          key={
                            getDatabaseBookingId(
                              booking
                            ) ||
                            getBookingCode(
                              booking
                            )
                          }
                        >

                          {/* BOOKING */}

                          <td>

                            <div className="booking-code-cell">

                              <strong>
                                {
                                  getBookingCode(
                                    booking
                                  )
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  getDatabaseBookingId(
                                    booking
                                  ) ||
                                  "N/A"
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

                              {
                                formatDate(
                                  booking.event_date
                                )
                              }

                            </span>

                          </td>


                          {/* ATTENDANCE */}

                          <td>

                            {attendanceStatus ===
                            "present" ? (

                              <span className="booking-status attendance-present">

                                <UserCheck
                                  size={13}
                                />

                                Present

                              </span>

                            ) : (

                              <span className="booking-status attendance-not-present">

                                <UserX
                                  size={13}
                                />

                                Not Present

                              </span>

                            )}

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


                              {/* CONFIRM PAYMENT */}

                              {canConfirmPayment &&
                                bookingStatus !==
                                  "cancelled" &&
                                bookingStatus !==
                                  "rejected" && (

                                <button
                                  type="button"
                                  className="booking-confirm-btn"
                                  onClick={() =>
                                    confirmPayment(
                                      booking
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Confirm payment"
                                >

                                  <CreditCard
                                    size={15}
                                  />

                                </button>

                              )}


                              {/* VIEW PASS */}

                              {bookingStatus ===
                                "confirmed" && (

                                <button
                                  type="button"
                                  className="booking-pass-view-btn"
                                  onClick={() =>
                                    viewPass(
                                      booking
                                    )
                                  }
                                  disabled={
                                    passLoading
                                  }
                                  title="View event pass"
                                >

                                  <Ticket
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
                                "cancelled" &&
                                bookingStatus !==
                                  "completed" && (

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

            {/* HEADER */}

            <header className="booking-modal-header">

              <div>

                <span>
                  BOOKING DETAILS
                </span>

                <h2>
                  {
                    getBookingCode(
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


            {/* BODY */}

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
                    {
                      formatDate(
                        selectedBooking.event_date
                      )
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Time
                  </span>

                  <strong>

                    {
                      formatTime(
                        selectedBooking.start_time
                      )
                    }

                    {" - "}

                    {
                      formatTime(
                        selectedBooking.end_time
                      )
                    }

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


              {/* MEMBER */}

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


              {/* PAYMENT */}

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


              {/* PAYMENT PROOF */}

              {getPaymentProof(
                selectedBooking
              ) && (

                <div className="booking-payment-proof">

                  <span>
                    PAYMENT PROOF
                  </span>

                  <a
                    href={
                      getPaymentProof(
                        selectedBooking
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Payment Proof
                  </a>

                </div>

              )}


              {/* ATTENDANCE */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    ATTENDANCE & VERIFICATION
                  </span>

                </div>


                <div
                  className={`booking-attendance-badge ${getAttendanceStatus(
                    selectedBooking
                  )}`}
                >

                  {getAttendanceStatus(
                    selectedBooking
                  ) === "present" ? (

                    <>

                      <UserCheck
                        size={18}
                      />

                      <div>

                        <strong>
                          Attendance Marked Present
                        </strong>

                        <span>
                          This booking has been checked in.
                        </span>

                      </div>

                    </>

                  ) : (

                    <>

                      <UserX
                        size={18}
                      />

                      <div>

                        <strong>
                          Not Checked In
                        </strong>

                        <span>
                          Attendance has not been marked.
                        </span>

                      </div>

                    </>

                  )}

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Attendance Status
                    </span>

                    <strong
                      className={`modal-status ${getAttendanceStatus(
                        selectedBooking
                      )}`}
                    >
                      {
                        getAttendanceStatus(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Attendance Code
                    </span>

                    <strong className="transaction-id">

                      {
                        getAttendanceCode(
                          selectedBooking
                        )
                      }

                    </strong>

                  </div>


                  {getAttendanceMarkedAt(
                    selectedBooking
                  ) && (

                    <div>

                      <span>
                        Marked At
                      </span>

                      <strong>

                        {
                          formatDateTime(
                            getAttendanceMarkedAt(
                              selectedBooking
                            )
                          )
                        }

                      </strong>

                    </div>

                  )}


                  {getAttendanceMarkedBy(
                    selectedBooking
                  ) && (

                    <div>

                      <span>
                        Marked By
                      </span>

                      <strong>

                        {
                          getAttendanceMarkedBy(
                            selectedBooking
                          )
                        }

                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* BOOKING */}

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
                        getBookingCode(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Database ID
                    </span>

                    <strong>
                      {
                        getDatabaseBookingId(
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
                      {
                        getBookingStatus(
                          selectedBooking
                        ).replace(
                          "_",
                          " "
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Created
                    </span>

                    <strong>
                      {
                        formatDateTime(
                          selectedBooking.created_at
                        )
                      }
                    </strong>

                  </div>


                  {selectedBooking.verified_at && (

                    <div>

                      <span>
                        Payment Verified
                      </span>

                      <strong>
                        {
                          formatDateTime(
                            selectedBooking.verified_at
                          )
                        }
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* =================================================
                  MODAL ACTIONS
              ================================================= */}

              <div className="booking-modal-actions">


                {/* CONFIRM PAYMENT */}

                {(getPaymentStatus(
                  selectedBooking
                ) === "submitted" ||
                getPaymentStatus(
                  selectedBooking
                ) === "pending") &&
                getBookingStatus(
                  selectedBooking
                ) !== "cancelled" &&
                getBookingStatus(
                  selectedBooking
                ) !== "rejected" && (

                  <button
                    type="button"
                    className="booking-modal-confirm"
                    onClick={() =>
                      confirmPayment(
                        selectedBooking
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >

                    <CreditCard
                      size={16}
                    />

                    {actionLoading
                      ? "Confirming..."
                      : "Confirm Payment"}

                  </button>

                )}


                {/* VIEW PASS */}

                {getBookingStatus(
                  selectedBooking
                ) === "confirmed" && (

                  <button
                    type="button"
                    className="booking-modal-confirm"
                    onClick={() =>
                      viewPass(
                        selectedBooking
                      )
                    }
                    disabled={
                      passLoading
                    }
                  >

                    <Ticket
                      size={16}
                    />

                    {passLoading
                      ? "Loading Pass..."
                      : "View Pass"}

                  </button>

                )}


                {/* COMPLETE */}

                {getBookingStatus(
                  selectedBooking
                ) === "confirmed" && (

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


                {/* CANCEL */}

                {getBookingStatus(
                  selectedBooking
                ) !== "cancelled" &&
                getBookingStatus(
                  selectedBooking
                ) !== "completed" && (

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


                {/* PRINT */}

                <button
                  type="button"
                  className="booking-pass-print-button booking-modal-print"
                  onClick={
                    printPass
                  }
                >

                  <TicketCheck
                    size={16}
                  />

                  Print Pass

                </button>


                {/* DELETE */}

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


      {/* =====================================================
          EVENT PASS MODAL
      ===================================================== */}

      {selectedPass && (

        <div
          className="booking-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closePass();

            }

          }}
        >

          <section
            className="booking-details-modal"
            role="dialog"
            aria-modal="true"
          >

            {/* PASS HEADER */}

            <header className="booking-modal-header">

              <div>

                <span>
                  EVENT PASS
                </span>

                <h2>
                  {
                    selectedPass.booking_code ||
                    "SNICT PASS"
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closePass
                }
              >

                <X
                  size={19}
                />

              </button>

            </header>


            <div className="booking-details-body">


              {/* PASS EVENT */}

              <div className="booking-detail-event">

                <div className="booking-detail-event-icon">

                  <Ticket
                    size={21}
                  />

                </div>

                <div>

                  <span>
                    EVENT
                  </span>

                  <strong>
                    {
                      selectedPass.event_title ||
                      selectedPass.event_name ||
                      "SNICT Event"
                    }
                  </strong>

                  <small>
                    {
                      selectedPass.event_mode ||
                      "Event"
                    }
                  </small>

                </div>

              </div>


              {/* PASS INFORMATION */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <TicketCheck
                    size={17}
                  />

                  <span>
                    PASS INFORMATION
                  </span>

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Pass Code
                    </span>

                    <strong>
                      {
                        selectedPass.pass_code ||
                        "N/A"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Booking Code
                    </span>

                    <strong>
                      {
                        selectedPass.booking_code ||
                        "N/A"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Valid From
                    </span>

                    <strong>
                      {
                        formatDateTime(
                          selectedPass.valid_from
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Valid Until
                    </span>

                    <strong>
                      {
                        formatDateTime(
                          selectedPass.valid_until
                        )
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* EVENT DETAILS */}

              <div className="booking-detail-section">

                <div className="booking-detail-section-title">

                  <CalendarDays
                    size={17}
                  />

                  <span>
                    EVENT DETAILS
                  </span>

                </div>


                <div className="booking-detail-grid">

                  <div>

                    <span>
                      Date
                    </span>

                    <strong>
                      {
                        formatDate(
                          selectedPass.event_date
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Time
                    </span>

                    <strong>

                      {
                        formatTime(
                          selectedPass.start_time
                        )
                      }

                      {" - "}

                      {
                        formatTime(
                          selectedPass.end_time
                        )
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Venue
                    </span>

                    <strong>

                      <MapPin
                        size={14}
                      />

                      {
                        selectedPass.venue ||
                        "—"
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Member
                    </span>

                    <strong>
                      {
                        selectedPass.full_name ||
                        selectedPass.username ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* QR */}

              <div className="booking-pass-qr-section">

                <div className="booking-pass-qr-heading">

                  <QrCode
                    size={19}
                  />

                  <div>

                    <strong>
                      EVENT ENTRY QR
                    </strong>

                    <span>
                      Scan this QR for event entry.
                    </span>

                  </div>

                </div>


                <div className="booking-pass-qr-box">

                  {getPassQrUrl(
                    selectedPass
                  ) ? (

                    <img
                      src={getPassQrUrl(
                        selectedPass
                      )}
                      alt="SNICT Event Pass QR"
                      className="booking-pass-qr-image"
                      onLoad={() =>
                        setQrLoading(
                          false
                        )
                      }
                      onError={() =>
                        setQrLoading(
                          false
                        )
                      }
                    />

                  ) : (

                    <div className="booking-pass-qr-error">

                      <QrCode
                        size={32}
                      />

                      <span>
                        QR code is not available.
                      </span>

                    </div>

                  )}

                </div>


                {/* PASS CODE */}

                <div className="booking-pass-attendance-code">

                  <div className="booking-pass-attendance-code-header">

                    <span>
                      PASS CODE
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        copyCode(
                          selectedPass.pass_code
                        )
                      }
                    >

                      {copiedCode ===
                      String(
                        selectedPass.pass_code ||
                        ""
                      ) ? (

                        <Check
                          size={13}
                        />

                      ) : (

                        <Copy
                          size={13}
                        />

                      )}

                      {copiedCode ===
                      String(
                        selectedPass.pass_code ||
                        ""
                      )
                        ? "Copied"
                        : "Copy"}

                    </button>

                  </div>

                  <strong>
                    {
                      selectedPass.pass_code ||
                      "N/A"
                    }
                  </strong>

                </div>


                {/* ATTENDANCE CODE */}

                {selectedPass.attendance_code && (

                  <div className="booking-pass-attendance-code">

                    <div className="booking-pass-attendance-code-header">

                      <span>
                        ATTENDANCE CODE
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyCode(
                            selectedPass.attendance_code
                          )
                        }
                      >

                        {copiedCode ===
                        String(
                          selectedPass.attendance_code
                        ) ? (

                          <Check
                            size={13}
                          />

                        ) : (

                          <Copy
                            size={13}
                          />

                        )}

                        {copiedCode ===
                        String(
                          selectedPass.attendance_code
                        )
                          ? "Copied"
                          : "Copy"}

                      </button>

                    </div>

                    <strong>
                      {
                        selectedPass.attendance_code
                      }
                    </strong>

                    <small>
                      Use this code if QR scanning is unavailable.
                    </small>

                  </div>

                )}

              </div>


              {/* PASS ACTIONS */}

              <div className="booking-modal-actions">

                <button
                  type="button"
                  className="booking-modal-confirm"
                  onClick={
                    printPass
                  }
                >

                  <TicketCheck
                    size={16}
                  />

                  Print Pass

                </button>


                <button
                  type="button"
                  className="booking-modal-cancel"
                  onClick={
                    closePass
                  }
                >

                  <X
                    size={16}
                  />

                  Close

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