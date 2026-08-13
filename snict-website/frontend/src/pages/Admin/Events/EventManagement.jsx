import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  X,
  XCircle,
  Users,
  Eye,
  EyeOff,
  TicketCheck,
  Image as ImageIcon,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  CreditCard,
  User,
  Mail,
  Phone,
  IndianRupee,
  MapPin,
  ReceiptText,
  AlertCircle,
} from "lucide-react";

import api from "../../../services/api";

import "./EventManagement.css";


// =========================================================
// INITIAL EVENT FORM
// =========================================================

const initialForm = {
  title: "",
  eventType: "CME",
  description: "",
  doctorName: "",
  specialization: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  eventMode: "offline",
  price: "",
  maxSlots: "",
  bookingEnabled: true,
  published: true,
};


// =========================================================
// COMPONENT
// =========================================================

function EventManagement() {

  // =======================================================
  // MAIN TAB
  // =======================================================

  const [activeTab, setActiveTab] =
    useState("events");


  // =======================================================
  // EVENTS STATE
  // =======================================================

  const [events, setEvents] =
    useState([]);

  const [form, setForm] =
    useState({
      ...initialForm,
    });

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [filter, setFilter] =
    useState("all");


  // =======================================================
  // EVENT IMAGE
  // =======================================================

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const imageInputRef =
    useRef(null);


  // =======================================================
  // GENERAL ERROR
  // =======================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =======================================================
  // REGISTERED USERS / BOOKINGS
  // =======================================================

  const [bookings, setBookings] =
    useState([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(false);

  const [bookingsRefreshing, setBookingsRefreshing] =
    useState(false);

  const [bookingSearch, setBookingSearch] =
    useState("");

  const [bookingEventFilter, setBookingEventFilter] =
    useState("all");

  const [bookingPaymentFilter, setBookingPaymentFilter] =
    useState("all");

  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [bookingActionLoading, setBookingActionLoading] =
    useState(false);


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadEvents();
  }, []);


  // =========================================================
  // LOAD BOOKINGS WHEN TAB OPENED
  // =========================================================

  useEffect(() => {

    if (activeTab === "registrations") {
      loadBookings();
    }

  }, [activeTab]);


  // =========================================================
  // CLEAN IMAGE OBJECT URL
  // =========================================================

  useEffect(() => {

    return () => {

      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {

        URL.revokeObjectURL(
          imagePreview
        );

      }

    };

  }, [imagePreview]);


  // =========================================================
  // SUCCESS MESSAGE AUTO CLEAR
  // =========================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess("");
      }, 3500);

    return () =>
      clearTimeout(timer);

  }, [success]);


  // =========================================================
  // LOAD EVENTS
  // =========================================================

  const loadEvents = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/events/admin/all"
        );

      if (
        response.data?.success
      ) {

        const backendEvents =
          response.data.events || [];

        const normalizedEvents =
          backendEvents.map(
            (event) => ({
              ...event,

              status:
                calculateEventStatus(
                  event.event_date,
                  event.start_time,
                  event.end_time
                ),
            })
          );

        setEvents(
          normalizedEvents
        );

      } else {

        setEvents([]);

      }

    } catch (error) {

      console.error(
        "Admin events error:",
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
          "Unable to load events."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // NORMALIZE ADMIN BOOKING RESPONSE
  // =========================================================
  //
  // Backend /api/bookings/admin returns flat PostgreSQL fields:
  //
  // booking_id, booking_code, user_id, event_id, amount,
  // booking_status, full_name, username, email, mobile,
  // profile_image_url, event_name, event_date, start_time,
  // end_time, venue, event_mode, payment_id,
  // payment_status, transaction_id, pass_id, pass_code,
  // pass_token, valid_from, valid_until, attendance_id,
  // attendance_code, attendance_status, marked_at, marked_by
  //
  // Keep the original backend field names. This avoids creating
  // a frontend shape that does not exist in the backend.
  // =========================================================

  const normalizeBooking = (booking) => ({
    ...booking,

    booking_id:
      booking.booking_id ??
      booking.id ??
      null,

    booking_code:
      booking.booking_code ??
      "",

    user_id:
      booking.user_id ??
      null,

    event_id:
      booking.event_id ??
      null,

    amount:
      booking.amount ??
      0,

    booking_status:
      booking.booking_status ??
      "payment_pending",

    full_name:
      booking.full_name ??
      "",

    username:
      booking.username ??
      "",

    email:
      booking.email ??
      "",

    mobile:
      booking.mobile ??
      "",

    profile_image_url:
      booking.profile_image_url ??
      "",

    event_name:
      booking.event_name ??
      "",

    event_date:
      booking.event_date ??
      null,

    start_time:
      booking.start_time ??
      null,

    end_time:
      booking.end_time ??
      null,

    venue:
      booking.venue ??
      "",

    event_mode:
      booking.event_mode ??
      "",

    payment_id:
      booking.payment_id ??
      null,

    payment_status:
      booking.payment_status ??
      "pending",

    transaction_id:
      booking.transaction_id ??
      "",

    pass_id:
      booking.pass_id ??
      null,

    pass_code:
      booking.pass_code ??
      "",

    pass_token:
      booking.pass_token ??
      "",

    valid_from:
      booking.valid_from ??
      null,

    valid_until:
      booking.valid_until ??
      null,

    attendance_id:
      booking.attendance_id ??
      null,

    attendance_code:
      booking.attendance_code ??
      "",

    attendance_status:
      booking.attendance_status ??
      "",

    marked_at:
      booking.marked_at ??
      null,

    marked_by:
      booking.marked_by ??
      null,
  });


  // =========================================================
  // LOAD ALL BOOKINGS
  // =========================================================

  const loadBookings = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setBookingsRefreshing(true);
      } else {
        setBookingsLoading(true);
      }

      setError("");

      const response =
        await api.get(
          "/bookings/admin"
        );

      if (
        response.data?.success
      ) {

        const backendBookings =
          Array.isArray(
            response.data.bookings
          )
            ? response.data.bookings
            : [];

        setBookings(
          backendBookings.map(
            normalizeBooking
          )
        );

      } else {

        setBookings([]);

        setError(
          response.data?.message ||
          "Unable to load registered users."
        );

      }

    } catch (error) {

      console.error(
        "Load event registrations error:",
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
          "Unable to load registered users."
        );

      }

    } finally {

      setBookingsLoading(false);
      setBookingsRefreshing(false);

    }

  };


  // =========================================================
  // EVENT STATUS
  // =========================================================

  const calculateEventStatus = (
    eventDate,
    startTime,
    endTime
  ) => {

    if (!eventDate) {
      return "upcoming";
    }

    try {

      const dateString =
        eventDate
          .toString()
          .slice(0, 10);

      const startTimeString =
        startTime
          ?.toString()
          .slice(0, 8) ||
        "00:00:00";

      const endTimeString =
        endTime
          ?.toString()
          .slice(0, 8) ||
        "23:59:59";

      const start =
        new Date(
          `${dateString}T${startTimeString}+05:30`
        );

      const end =
        new Date(
          `${dateString}T${endTimeString}+05:30`
        );

      const now =
        new Date();

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {

        return "upcoming";

      }

      if (now < start) {
        return "upcoming";
      }

      if (
        now >= start &&
        now <= end
      ) {

        return "ongoing";

      }

      return "past";

    } catch (error) {

      console.error(
        "Event status calculation error:",
        error
      );

      return "upcoming";

    }

  };


  // =========================================================
  // EVENT FORM CHANGE
  // =========================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );

  };


  // =========================================================
  // IMAGE SELECT
  // =========================================================

  const handleImageChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;

    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setError(
        "Event image must be 5 MB or smaller."
      );

      event.target.value = "";

      return;

    }

    setError("");

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(
      previewUrl
    );

  };


  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  const removeSelectedImage =
    () => {

      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {

        URL.revokeObjectURL(
          imagePreview
        );

      }

      setImageFile(null);
      setImagePreview("");

      if (
        imageInputRef.current
      ) {

        imageInputRef.current.value =
          "";

      }

    };


  // =========================================================
  // CREATE EVENT
  // =========================================================

  const openCreate = () => {

    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setImageFile(null);
    setImagePreview("");

    if (
      imageInputRef.current
    ) {

      imageInputRef.current.value =
        "";

    }

    setShowForm(true);
    setError("");

  };


  // =========================================================
  // EDIT EVENT
  // =========================================================

  const openEdit = (
    event
  ) => {

    setEditingId(
      event.id
    );

    setForm({

      title:
        event.title || "",

      eventType:
        event.event_type ||
        "CME",

      description:
        event.description ||
        "",

      doctorName:
        event.doctor_name ||
        "",

      specialization:
        event.specialization ||
        "",

      eventDate:
        event.event_date
          ?.toString()
          .slice(0, 10) ||
        "",

      startTime:
        event.start_time
          ?.toString()
          .slice(0, 5) ||
        "",

      endTime:
        event.end_time
          ?.toString()
          .slice(0, 5) ||
        "",

      venue:
        event.venue || "",

      eventMode:
        event.event_mode ||
        "offline",

      price:
        event.price ?? "",

      maxSlots:
        event.max_slots ?? "",

      bookingEnabled:
        Boolean(
          event.booking_enabled
        ),

      published:
        Boolean(
          event.published
        ),

    });

    setImageFile(null);

    setImagePreview(
      event.image_url || ""
    );

    if (
      imageInputRef.current
    ) {

      imageInputRef.current.value =
        "";

    }

    setShowForm(true);
    setError("");

  };


  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {

    if (saving) {
      return;
    }

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

    }

    setShowForm(false);

    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setImageFile(null);
    setImagePreview("");

    if (
      imageInputRef.current
    ) {

      imageInputRef.current.value =
        "";

    }

  };


  // =========================================================
  // VALIDATE EVENT
  // =========================================================

  const validateForm = () => {

    if (!form.title.trim()) {

      setError(
        "Event title is required."
      );

      return false;

    }

    if (!form.eventDate) {

      setError(
        "Event date is required."
      );

      return false;

    }

    if (!form.startTime) {

      setError(
        "Start time is required."
      );

      return false;

    }

    if (!form.endTime) {

      setError(
        "End time is required."
      );

      return false;

    }

    const start =
      new Date(
        `${form.eventDate}T${form.startTime}:00`
      );

    const end =
      new Date(
        `${form.eventDate}T${form.endTime}:00`
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {

      setError(
        "Invalid date or time."
      );

      return false;

    }

    if (end <= start) {

      setError(
        "End time must be after start time."
      );

      return false;

    }

    if (
      form.price !== "" &&
      Number(form.price) < 0
    ) {

      setError(
        "Price cannot be negative."
      );

      return false;

    }

    if (
      form.maxSlots !== "" &&
      Number(form.maxSlots) <= 0
    ) {

      setError(
        "Maximum slots must be greater than zero."
      );

      return false;

    }

    return true;

  };


  // =========================================================
  // SAVE EVENT
  // =========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    if (!validateForm()) {
      return;
    }

    try {

      setSaving(true);

      const payload =
        new FormData();

      payload.append(
        "title",
        form.title.trim()
      );

      payload.append(
        "eventType",
        form.eventType
      );

      payload.append(
        "description",
        form.description.trim()
      );

      payload.append(
        "doctorName",
        form.doctorName.trim()
      );

      payload.append(
        "specialization",
        form.specialization.trim()
      );

      payload.append(
        "eventDate",
        form.eventDate
      );

      payload.append(
        "startTime",
        form.startTime
      );

      payload.append(
        "endTime",
        form.endTime
      );

      payload.append(
        "venue",
        form.venue.trim()
      );

      payload.append(
        "eventMode",
        form.eventMode
      );

      payload.append(
        "price",
        form.price === ""
          ? "0"
          : String(
              Number(
                form.price
              )
            )
      );

      payload.append(
        "maxSlots",
        form.maxSlots === ""
          ? ""
          : String(
              Number(
                form.maxSlots
              )
            )
      );

      payload.append(
        "bookingEnabled",
        String(
          form.bookingEnabled
        )
      );

      payload.append(
        "published",
        String(
          form.published
        )
      );

      if (imageFile) {

        payload.append(
          "image",
          imageFile
        );

      }

      if (editingId) {

        await api.put(
          `/events/admin/${editingId}`,
          payload
        );

      } else {

        await api.post(
          "/events/admin",
          payload
        );

      }

      closeForm();

      setSuccess(
        editingId
          ? "Event updated successfully."
          : "Event created successfully."
      );

      await loadEvents();

    } catch (error) {

      console.error(
        "Save event error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to save event."
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // DELETE EVENT
  // =========================================================

  const deleteEvent = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(id);
      setError("");

      await api.delete(
        `/events/admin/${id}`
      );

      setSuccess(
        "Event deleted successfully."
      );

      await loadEvents();

    } catch (error) {

      console.error(
        "Delete event error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to delete event."
      );

    } finally {

      setDeletingId(null);

    }

  };


  // =========================================================
  // FILTER EVENTS
  // =========================================================

  const filteredEvents =
    events.filter(
      (event) => {

        if (filter === "all") {
          return true;
        }

        if (
          filter === "upcoming"
        ) {

          return (
            event.status ===
            "upcoming"
          );

        }

        if (
          filter === "ongoing"
        ) {

          return (
            event.status ===
            "ongoing"
          );

        }

        if (
          filter === "past"
        ) {

          return (
            event.status ===
            "past"
          );

        }

        if (
          filter === "published"
        ) {

          return (
            event.published ===
            true
          );

        }

        if (
          filter === "draft"
        ) {

          return (
            event.published ===
            false
          );

        }

        return true;

      }
    );


  // =========================================================
  // BOOKING HELPERS
  // =========================================================

  const getBookingId = (
    booking
  ) => {

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

    // Backend admin booking API returns:
    // b.id AS booking_id
    return (
      booking.booking_id ||
      booking.id ||
      null
    );

  };


  const getUserName = (
    booking
  ) => {

    // Backend returns u.full_name
    return (
      booking.full_name ||
      booking.user_name ||
      booking.username ||
      booking.user?.name ||
      booking.user?.fullName ||
      "Unknown User"
    );

  };


  const getUsername = (
    booking
  ) => {

    return (
      booking.username ||
      booking.user?.username ||
      "—"
    );

  };


  const getEmail = (
    booking
  ) => {

    return (
      booking.email ||
      booking.user_email ||
      booking.user?.email ||
      "—"
    );

  };


  const getPhone = (
    booking
  ) => {

    // Backend returns u.mobile
    return (
      booking.mobile ||
      booking.phone ||
      booking.user_phone ||
      booking.user?.mobile ||
      booking.user?.phone ||
      "—"
    );

  };


  const getEventId = (
    booking
  ) => {

    return (
      booking.event_id ||
      booking.eventId ||
      booking.event?.id ||
      ""
    );

  };


  const getEventName = (
    booking
  ) => {

    // Backend returns e.title AS event_name
    return (
      booking.event_name ||
      booking.event_title ||
      booking.event?.title ||
      booking.event?.name ||
      booking.title ||
      "Unknown Event"
    );

  };


  const getEventType = (
    booking
  ) => {

    // Current admin booking API returns event_mode,
    // not event_type.
    return (
      booking.event_type ||
      booking.event?.event_type ||
      booking.event_mode ||
      "EVENT"
    );

  };


  const getEventDate = (
    booking
  ) => {
    return (
      booking.event_date ||
      null
    );
  };


  const getEventTime = (
    booking
  ) => {
    const start =
      formatTime(
        booking.start_time
      );

    const end =
      formatTime(
        booking.end_time
      );

    if (start && end) {
      return `${start} - ${end}`;
    }

    return start || end || "—";
  };


  const getEventMode = (
    booking
  ) => {
    return (
      booking.event_mode ||
      "—"
    );
  };


  const getVenue = (
    booking
  ) => {
    return (
      booking.venue ||
      "—"
    );
  };


  const getAttendanceStatus = (
    booking
  ) => {
    return (
      booking.attendance_status ||
      "not generated"
    );
  };


  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  const getPaymentStatus = (
    booking
  ) => {

    return String(
      booking.payment_status ||
      booking.paymentStatus ||
      "pending"
    ).toLowerCase();

  };


  const getBookingStatus = (
    booking
  ) => {

    return String(
      booking.booking_status ||
      booking.status ||
      "pending"
    ).toLowerCase();

  };


  const getAmount = (
    booking
  ) => {

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


  const getBookingDate = (
    booking
  ) => {

    // The current admin booking API does not select b.created_at.
    // Use the event date as the available date from the backend.
    return (
      booking.event_date ||
      booking.created_at ||
      booking.createdAt ||
      booking.booking_date ||
      booking.booked_at ||
      null
    );

  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
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
  // FORMAT DATE TIME
  // =========================================================

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


  // =========================================================
  // EVENT DATE
  // =========================================================

  const formatEventDate = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(
        `${String(value).slice(
          0,
          10
        )}T00:00:00`
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


  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "";
    }

    return String(value)
      .slice(0, 5);

  };


  // =========================================================
  // EVENT LIST FOR BOOKING FILTER
  // =========================================================

  const bookingEvents =
    useMemo(() => {

      const eventMap =
        new Map();

      bookings.forEach(
        (booking) => {

          const id =
            getEventId(
              booking
            );

          const name =
            getEventName(
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

        }
      );

      return Array.from(
        eventMap.entries()
      );

    }, [bookings]);


  // =========================================================
  // FILTER BOOKINGS
  // =========================================================

  const filteredBookings =
    useMemo(() => {

      const query =
        bookingSearch
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {

          const bookingId =
            String(
              getBookingId(
                booking
              )
            ).toLowerCase();

          const name =
            String(
              getUserName(
                booking
              )
            ).toLowerCase();

          const username =
            String(
              getUsername(
                booking
              )
            ).toLowerCase();

          const email =
            String(
              getEmail(
                booking
              )
            ).toLowerCase();

          const phone =
            String(
              getPhone(
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

          const matchesSearch =
            !query ||
            bookingId.includes(
              query
            ) ||
            name.includes(
              query
            ) ||
            username.includes(
              query
            ) ||
            email.includes(
              query
            ) ||
            phone.includes(
              query
            ) ||
            eventName.includes(
              query
            );

          const matchesEvent =
            bookingEventFilter ===
              "all" ||
            eventId ===
              bookingEventFilter;

          const matchesPayment =
            bookingPaymentFilter ===
              "all" ||
            paymentStatus ===
              bookingPaymentFilter;

          const matchesStatus =
            bookingStatusFilter ===
              "all" ||
            bookingStatus ===
              bookingStatusFilter;

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
      bookingSearch,
      bookingEventFilter,
      bookingPaymentFilter,
      bookingStatusFilter,
    ]);


  // =========================================================
  // BOOKING STATISTICS
  // =========================================================

  const bookingStats =
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

      return {
        total,
        confirmed,
        pending,
        paid,
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

      if (bookingActionLoading) {
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

        setBookingActionLoading(
          true
        );

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

        await loadBookings(
          true
        );

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
          error.response?.data?.message ||
          error.message ||
          "Unable to update booking status."
        );

      } finally {

        setBookingActionLoading(
          false
        );

      }

    };


  // =========================================================
  // DELETE BOOKING
  // =========================================================

  const deleteBooking =
    async (
      booking
    ) => {

      if (bookingActionLoading) {
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

        setBookingActionLoading(
          true
        );

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

        setBookingActionLoading(
          false
        );

      }

    };


  // =========================================================
  // LOADING EVENTS
  // =========================================================

  if (
    activeTab === "events" &&
    loading
  ) {

    return (
      <main className="admin-events-page">

        <div className="admin-events-container">

          <div className="admin-event-state">

            <CalendarDays
              size={38}
            />

            <h3>
              Loading events...
            </h3>

          </div>

        </div>

      </main>
    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="admin-events-page">

      <div className="admin-events-container">


        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="admin-events-header">

          <div>

            <span className="admin-events-eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              Event Management
            </h1>

            <p>
              Create and manage SNICT
              events and monitor event
              registrations.
            </p>

          </div>


          <div className="admin-events-header-actions">

            {activeTab === "events" && (

              <button
                type="button"
                className="admin-add-event-btn"
                onClick={openCreate}
              >

                <Plus size={18} />

                Create Event

              </button>

            )}


            {activeTab ===
              "registrations" && (

              <button
                type="button"
                className="admin-add-event-btn"
                onClick={() =>
                  loadBookings(true)
                }
                disabled={
                  bookingsRefreshing
                }
              >

                <RefreshCw
                  size={17}
                  className={
                    bookingsRefreshing
                      ? "admin-event-spin"
                      : ""
                  }
                />

                {bookingsRefreshing
                  ? "Refreshing..."
                  : "Refresh"}

              </button>

            )}

          </div>

        </header>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="admin-event-error">

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


        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (

          <div className="admin-event-success">

            <CheckCircle2
              size={17}
            />

            <span>
              {success}
            </span>

          </div>

        )}


        {/* ===================================================
            MAIN TABS
        =================================================== */}

        <section className="admin-event-main-tabs">

          <button
            type="button"
            className={
              activeTab === "events"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("events")
            }
          >

            <CalendarDays
              size={18}
            />

            Events

            <span>
              {events.length}
            </span>

          </button>


          <button
            type="button"
            className={
              activeTab ===
              "registrations"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "registrations"
              )
            }
          >

            <Users
              size={18}
            />

            Registered Users

            <span>
              {bookings.length}
            </span>

          </button>

        </section>


        {/* ===================================================
            EVENTS TAB
        =================================================== */}

        {activeTab === "events" && (

          <>

            {/* EVENT FILTERS */}

            <section className="admin-event-toolbar">

              <div className="admin-event-filter-label">

                <CalendarDays
                  size={18}
                />

                <span>
                  Events
                </span>

              </div>


              <div className="admin-event-filters">

                <button
                  type="button"
                  className={
                    filter === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("all")
                  }
                >
                  All
                  <span>
                    {events.length}
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    filter ===
                    "upcoming"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      "upcoming"
                    )
                  }
                >
                  Upcoming
                  <span>
                    {
                      events.filter(
                        (event) =>
                          event.status ===
                          "upcoming"
                      ).length
                    }
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    filter ===
                    "ongoing"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      "ongoing"
                    )
                  }
                >
                  Ongoing
                  <span>
                    {
                      events.filter(
                        (event) =>
                          event.status ===
                          "ongoing"
                      ).length
                    }
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    filter === "past"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("past")
                  }
                >
                  Past
                  <span>
                    {
                      events.filter(
                        (event) =>
                          event.status ===
                          "past"
                      ).length
                    }
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    filter ===
                    "published"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      "published"
                    )
                  }
                >
                  Published
                </button>


                <button
                  type="button"
                  className={
                    filter === "draft"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("draft")
                  }
                >
                  Drafts
                </button>

              </div>

            </section>


            {/* EVENT FORM */}

            {showForm && (

              <div className="event-form-overlay">

                <div className="event-form-modal">

                  <div className="event-form-header">

                    <div>

                      <span>
                        {editingId
                          ? "EDIT EVENT"
                          : "NEW EVENT"}
                      </span>

                      <h2>
                        {editingId
                          ? "Update Event"
                          : "Create Event"}
                      </h2>

                    </div>


                    <button
                      type="button"
                      className="event-modal-close"
                      onClick={
                        closeForm
                      }
                    >

                      <X size={21} />

                    </button>

                  </div>


                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="admin-event-form"
                  >

                    <div className="form-field full">

                      <label>
                        Event Title *
                      </label>

                      <input
                        name="title"
                        value={
                          form.title
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter event title"
                        required
                      />

                    </div>


                    <div className="form-row">

                      <div className="form-field">

                        <label>
                          Event Type
                        </label>

                        <select
                          name="eventType"
                          value={
                            form.eventType
                          }
                          onChange={
                            handleChange
                          }
                        >

                          <option value="CME">
                            CME
                          </option>

                          <option value="Workshop">
                            Workshop
                          </option>

                          <option value="Conference">
                            Conference
                          </option>

                          <option value="Consultation">
                            Consultation
                          </option>

                          <option value="Seminar">
                            Seminar
                          </option>

                          <option value="Other">
                            Other
                          </option>

                        </select>

                      </div>


                      <div className="form-field">

                        <label>
                          Event Mode
                        </label>

                        <select
                          name="eventMode"
                          value={
                            form.eventMode
                          }
                          onChange={
                            handleChange
                          }
                        >

                          <option value="offline">
                            Offline
                          </option>

                          <option value="online">
                            Online
                          </option>

                          <option value="hybrid">
                            Hybrid
                          </option>

                        </select>

                      </div>

                    </div>


                    <div className="form-row three">

                      <div className="form-field">

                        <label>
                          Event Date *
                        </label>

                        <input
                          type="date"
                          name="eventDate"
                          value={
                            form.eventDate
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          Start Time *
                        </label>

                        <input
                          type="time"
                          name="startTime"
                          value={
                            form.startTime
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          End Time *
                        </label>

                        <input
                          type="time"
                          name="endTime"
                          value={
                            form.endTime
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>


                    <div className="form-field full">

                      <label>
                        Venue
                      </label>

                      <input
                        name="venue"
                        value={
                          form.venue
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Event venue"
                      />

                    </div>


                    <div className="form-row">

                      <div className="form-field">

                        <label>
                          Price
                        </label>

                        <input
                          type="number"
                          min="0"
                          name="price"
                          value={
                            form.price
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0"
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          Maximum Slots
                        </label>

                        <input
                          type="number"
                          min="1"
                          name="maxSlots"
                          value={
                            form.maxSlots
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Unlimited"
                        />

                      </div>

                    </div>


                    <div className="form-field full">

                      <label>
                        Description
                      </label>

                      <textarea
                        name="description"
                        value={
                          form.description
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Describe the event..."
                        rows="5"
                      />

                    </div>


                    <div className="form-row">

                      <div className="form-field">

                        <label>
                          Doctor / Speaker
                        </label>

                        <input
                          name="doctorName"
                          value={
                            form.doctorName
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Name"
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          Specialization
                        </label>

                        <input
                          name="specialization"
                          value={
                            form.specialization
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Specialization"
                        />

                      </div>

                    </div>


                    {/* IMAGE */}

                    <div className="form-field full">

                      <label>
                        Event Image
                      </label>

                      <input
                        ref={
                          imageInputRef
                        }
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={
                          handleImageChange
                        }
                      />

                      {imagePreview && (

                        <div
                          className="event-image-preview"
                        >

                          <img
                            src={
                              imagePreview
                            }
                            alt="Event preview"
                          />

                          <button
                            type="button"
                            className="event-remove-image"
                            onClick={
                              removeSelectedImage
                            }
                          >

                            <X size={16} />

                          </button>

                        </div>

                      )}

                    </div>


                    {/* OPTIONS */}

                    <div className="event-checkboxes">

                      <label>

                        <input
                          type="checkbox"
                          name="bookingEnabled"
                          checked={
                            form.bookingEnabled
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <span>
                          Enable Booking
                        </span>

                      </label>


                      <label>

                        <input
                          type="checkbox"
                          name="published"
                          checked={
                            form.published
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <span>
                          Publish Event
                        </span>

                      </label>

                    </div>


                    {/* ACTIONS */}

                    <div className="event-form-actions">

                      <button
                        type="button"
                        onClick={
                          closeForm
                        }
                        disabled={
                          saving
                        }
                      >
                        Cancel
                      </button>


                      <button
                        type="submit"
                        disabled={
                          saving
                        }
                      >

                        {saving
                          ? "Saving..."
                          : editingId
                            ? "Update Event"
                            : "Create Event"}

                      </button>

                    </div>

                  </form>

                </div>

              </div>

            )}


            {/* EVENTS LIST */}

            <section className="admin-events-list">

              {filteredEvents.length ===
              0 ? (

                <div className="admin-event-state">

                  <CalendarDays
                    size={36}
                  />

                  <h3>
                    No events found
                  </h3>

                  <p>
                    Create an event or
                    change the selected
                    filter.
                  </p>

                </div>

              ) : (

                filteredEvents.map(
                  (event) => (

                    <article
                      className="admin-event-row"
                      key={
                        event.id
                      }
                    >

                      <div className="admin-event-image">

                        {event.image_url ? (

                          <img
                            src={
                              event.image_url
                            }
                            alt={
                              event.title
                            }
                            onError={(
                              e
                            ) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <CalendarDays
                            size={27}
                          />

                        )}

                      </div>


                      <div className="admin-event-row-info">

                        <div className="admin-event-type">
                          {
                            event.event_type
                          }
                        </div>

                        <h3>
                          {
                            event.title
                          }
                        </h3>

                        <p>

                          {formatEventDate(
                            event.event_date
                          )}

                          {" • "}

                          {formatTime(
                            event.start_time
                          )}

                          {" - "}

                          {formatTime(
                            event.end_time
                          )}

                        </p>

                        {event.doctor_name && (

                          <small>

                            {
                              event.doctor_name
                            }

                            {event.specialization &&
                              ` • ${event.specialization}`}

                          </small>

                        )}

                      </div>


                      <div className="admin-event-status-wrapper">

                        <span
                          className={`admin-event-status ${event.status}`}
                        >
                          {
                            event.status
                          }
                        </span>


                        <span
                          className={`admin-publish-status ${
                            event.published
                              ? "published"
                              : "draft"
                          }`}
                        >

                          {event.published ? (

                            <>
                              <Eye
                                size={13}
                              />
                              Published
                            </>

                          ) : (

                            <>
                              <EyeOff
                                size={13}
                              />
                              Draft
                            </>

                          )}

                        </span>

                      </div>


                      <div className="admin-event-bookings">

                        <div>

                          <Users
                            size={16}
                          />

                          <strong>

                            {Number(
                              event.booked_slots ||
                              0
                            )}

                            {event.max_slots !==
                              null &&
                              event.max_slots !==
                                undefined && (

                                <span>
                                  /
                                  {
                                    event.max_slots
                                  }
                                </span>

                              )}

                          </strong>

                        </div>

                        <small>
                          Bookings
                        </small>

                      </div>


                      <div className="admin-event-booking-status">

                        <TicketCheck
                          size={16}
                        />

                        <span>
                          {
                            event.booking_enabled
                              ? "Booking On"
                              : "Booking Off"
                          }
                        </span>

                      </div>


                      <div className="admin-event-row-price">

                        <small>
                          Fee
                        </small>

                        <strong>

                          ₹
                          {Number(
                            event.price ||
                            0
                          ).toLocaleString(
                            "en-IN"
                          )}

                        </strong>

                      </div>


                      <div className="admin-event-actions">

                        <button
                          type="button"
                          title="Edit event"
                          onClick={() =>
                            openEdit(
                              event
                            )
                          }
                        >

                          <Pencil
                            size={16}
                          />

                        </button>


                        <button
                          type="button"
                          className="delete"
                          title="Delete event"
                          disabled={
                            deletingId ===
                            event.id
                          }
                          onClick={() =>
                            deleteEvent(
                              event.id
                            )
                          }
                        >

                          <Trash2
                            size={16}
                          />

                        </button>

                      </div>

                    </article>

                  )
                )

              )}

            </section>

          </>

        )}


        {/* ===================================================
            REGISTERED USERS TAB
        =================================================== */}

        {activeTab ===
          "registrations" && (

          <section className="admin-event-registrations">


            {/* REGISTRATION STATS */}

            <div className="admin-registration-stats">

              <div className="admin-registration-stat">

                <div>
                  <TicketCheck
                    size={20}
                  />
                </div>

                <span>
                  Total Registrations
                </span>

                <strong>
                  {
                    bookingStats.total
                  }
                </strong>

              </div>


              <div className="admin-registration-stat">

                <div>
                  <CheckCircle2
                    size={20}
                  />
                </div>

                <span>
                  Confirmed
                </span>

                <strong>
                  {
                    bookingStats.confirmed
                  }
                </strong>

              </div>


              <div className="admin-registration-stat">

                <div>
                  <Clock3
                    size={20}
                  />
                </div>

                <span>
                  Pending
                </span>

                <strong>
                  {
                    bookingStats.pending
                  }
                </strong>

              </div>


              <div className="admin-registration-stat">

                <div>
                  <CreditCard
                    size={20}
                  />
                </div>

                <span>
                  Paid
                </span>

                <strong>
                  {
                    bookingStats.paid
                  }
                </strong>

              </div>

            </div>


            {/* REGISTRATION TOOLBAR */}

            <div className="admin-registration-toolbar">

              <div className="admin-registration-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search name, username, email, mobile, booking ID or event..."
                  value={
                    bookingSearch
                  }
                  onChange={(
                    e
                  ) =>
                    setBookingSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              <select
                value={
                  bookingEventFilter
                }
                onChange={(
                  e
                ) =>
                  setBookingEventFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Events
                </option>

                {bookingEvents.map(
                  ([
                    id,
                    name,
                  ]) => (

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
                value={
                  bookingPaymentFilter
                }
                onChange={(
                  e
                ) =>
                  setBookingPaymentFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Payments
                </option>

                <option value="pending">
                  Payment Pending
                </option>

                <option value="submitted">
                  Payment Submitted
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="verified">
                  Verified
                </option>

              </select>


              <select
                value={
                  bookingStatusFilter
                }
                onChange={(
                  e
                ) =>
                  setBookingStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="confirmed">
                  Confirmed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

                <option value="rejected">
                  Rejected
                </option>

              </select>

            </div>


            {/* REGISTRATION TABLE */}

            {bookingsLoading ? (

              <div className="admin-registration-loading">

                <RefreshCw
                  size={30}
                  className="admin-event-spin"
                />

                <h3>
                  Loading registered users...
                </h3>

              </div>

            ) : filteredBookings.length ===
              0 ? (

              <div className="admin-registration-empty">

                <Users
                  size={42}
                />

                <h3>
                  No registered users found
                </h3>

                <p>
                  Users who book an event
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="admin-registration-table-wrapper">

                <table className="admin-registration-table">

                  <thead>

                    <tr>

                      <th>
                        User
                      </th>

                      <th>
                        Contact
                      </th>

                      <th>
                        Event
                      </th>

                      <th>
                        Booking ID
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Payment
                      </th>

                      <th>
                        Booking
                      </th>

                      <th>
                        Event Date
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
                              getDatabaseBookingId(
                                booking
                              ) ||
                              getBookingId(
                                booking
                              )
                            }
                            onClick={() =>
                              setSelectedBooking(
                                booking
                              )
                            }
                            style={{
                              cursor:
                                "pointer",
                            }}
                          >


                            {/* USER */}

                            <td>

                              <div className="admin-registration-user">

                                <div className="admin-registration-avatar">

                                  <User
                                    size={18}
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

                                  <small>
                                    @
                                    {
                                      getUsername(
                                        booking
                                      )
                                    }
                                  </small>

                                </div>

                              </div>

                            </td>


                            {/* CONTACT */}

                            <td>

                              <div className="admin-registration-contact">

                                <span>

                                  <Mail
                                    size={13}
                                  />

                                  {
                                    getEmail(
                                      booking
                                    )
                                  }

                                </span>


                                <span>

                                  <Phone
                                    size={13}
                                  />

                                  {
                                    getPhone(
                                      booking
                                    )
                                  }

                                </span>

                              </div>

                            </td>


                            {/* EVENT */}

                            <td>

                              <div className="admin-registration-event">

                                <strong>
                                  {
                                    getEventName(
                                      booking
                                    )
                                  }
                                </strong>

                                <small>
                                  {
                                    getEventType(
                                      booking
                                    )
                                  }
                                </small>

                              </div>

                            </td>


                            {/* BOOKING ID */}

                            <td>

                              <span className="admin-registration-booking-id">

                                #
                                {
                                  getBookingId(
                                    booking
                                  )
                                }

                              </span>

                            </td>


                            {/* AMOUNT */}

                            <td>

                              <strong className="admin-registration-amount">

                                ₹
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
                                className={`admin-registration-badge payment-${paymentStatus}`}
                              >

                                {paymentStatus}

                              </span>

                            </td>


                            {/* BOOKING STATUS */}

                            <td>

                              <span
                                className={`admin-registration-badge booking-${bookingStatus}`}
                              >

                                {bookingStatus}

                              </span>

                            </td>


                            {/* REGISTERED */}

                            <td>

                              <span className="admin-registration-date">

                                {
                                  formatDateTime(
                                    getBookingDate(
                                      booking
                                    )
                                  )
                                }

                              </span>

                            </td>


 
                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}


        {/* ===================================================
            REGISTERED USER DETAILS MODAL
        =================================================== */}

        {selectedBooking && (

          <div
            className="admin-registration-modal-overlay"
            onClick={() =>
              setSelectedBooking(
                null
              )
            }
          >

            <div
              className="admin-registration-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="admin-registration-modal-header">

                <div>

                  <span>
                    EVENT REGISTRATION
                  </span>

                  <h2>
                    User Booking Details
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

                  <X size={20} />

                </button>

              </div>


              <div className="admin-registration-details">

                {/* USER */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <User
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {
                        getUserName(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* USERNAME */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <User
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Username
                    </span>

                    <strong>
                      @
                      {
                        getUsername(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* EMAIL */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <Mail
                      size={19}
                    />
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

                </div>


                {/* MOBILE */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <Phone
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Mobile
                    </span>

                    <strong>
                      {
                        getPhone(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* EVENT */}

                <div className="admin-registration-detail-card full">

                  <div className="admin-registration-detail-icon">
                    <CalendarDays
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Event
                    </span>

                    <strong>
                      {
                        getEventName(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* EVENT DATE */}

                <div className="admin-registration-detail-card">
                  <div className="admin-registration-detail-icon">
                    <CalendarDays
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Event Date
                    </span>

                    <strong>
                      {formatEventDate(
                        getEventDate(
                          selectedBooking
                        )
                      )}
                    </strong>
                  </div>
                </div>


                {/* EVENT TIME */}

                <div className="admin-registration-detail-card">
                  <div className="admin-registration-detail-icon">
                    <Clock3
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Event Time
                    </span>

                    <strong>
                      {getEventTime(
                        selectedBooking
                      )}
                    </strong>
                  </div>
                </div>


                {/* EVENT MODE */}

                <div className="admin-registration-detail-card">
                  <div className="admin-registration-detail-icon">
                    <MapPin
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Event Mode
                    </span>

                    <strong>
                      {getEventMode(
                        selectedBooking
                      )}
                    </strong>
                  </div>
                </div>


                {/* VENUE */}

                <div className="admin-registration-detail-card full">
                  <div className="admin-registration-detail-icon">
                    <MapPin
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Venue
                    </span>

                    <strong>
                      {getVenue(
                        selectedBooking
                      )}
                    </strong>
                  </div>
                </div>


                {/* BOOKING ID */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <TicketCheck
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Booking ID
                    </span>

                    <strong>
                      #
                      {
                        getBookingId(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* AMOUNT */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <IndianRupee
                      size={19}
                    />
                  </div>

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

                </div>


                {/* PAYMENT */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <CreditCard
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Payment Status
                    </span>

                    <strong>
                      {
                        getPaymentStatus(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* BOOKING STATUS */}

                <div className="admin-registration-detail-card">

                  <div className="admin-registration-detail-icon">
                    <CheckCircle2
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Booking Status
                    </span>

                    <strong>
                      {
                        getBookingStatus(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* UTR */}

                <div className="admin-registration-detail-card full">

                  <div className="admin-registration-detail-icon">
                    <ReceiptText
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Transaction / UTR
                    </span>

                    <strong>
                      {
                        getTransactionId(
                          selectedBooking
                        )
                      }
                    </strong>

                  </div>

                </div>


                {/* EVENT PASS */}

                <div className="admin-registration-detail-card">
                  <div className="admin-registration-detail-icon">
                    <TicketCheck
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Event Pass
                    </span>

                    <strong>
                      {selectedBooking.pass_code ||
                        "Not generated"}
                    </strong>
                  </div>
                </div>


                {/* ATTENDANCE */}

                <div className="admin-registration-detail-card">
                  <div className="admin-registration-detail-icon">
                    <Users
                      size={19}
                    />
                  </div>

                  <div>
                    <span>
                      Attendance
                    </span>

                    <strong>
                      {getAttendanceStatus(
                        selectedBooking
                      )}
                    </strong>
                  </div>
                </div>


                {/* BOOKING DATE */}

                <div className="admin-registration-detail-card full">

                  <div className="admin-registration-detail-icon">
                    <Clock3
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Event Date
                    </span>

                    <strong>
                      {
                        formatEventDate(
                          getBookingDate(
                            selectedBooking
                          )
                        )
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* MODAL ACTIONS */}

              <div className="admin-registration-modal-actions">

                {getBookingStatus(
                  selectedBooking
                ) !== "confirmed" && (

                  <button
                    type="button"
                    className="registration-confirm-btn"
                    disabled={
                      bookingActionLoading
                    }
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "confirmed"
                      )
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
                ) !== "rejected" && (

                  <button
                    type="button"
                    className="registration-reject-btn"
                    disabled={
                      bookingActionLoading
                    }
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking,
                        "rejected"
                      )
                    }
                  >

                    <XCircle
                      size={16}
                    />

                    Reject

                  </button>

                )}


                <button
                  type="button"
                  className="registration-delete-btn"
                  disabled={
                    bookingActionLoading
                  }
                  onClick={() =>
                    deleteBooking(
                      selectedBooking
                    )
                  }
                >

                  <Trash2
                    size={16}
                  />

                  Delete

                </button>


                <button
                  type="button"
                  className="registration-close-btn"
                  onClick={() =>
                    setSelectedBooking(
                      null
                    )
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>

  );

}


export default EventManagement;