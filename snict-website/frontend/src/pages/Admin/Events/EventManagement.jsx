import { useEffect, useRef, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  X,
  Users,
  Eye,
  EyeOff,
  TicketCheck,
  Image as ImageIcon,
} from "lucide-react";

import api from "../../../services/api";

import "./EventManagement.css";

// =========================================================
// INITIAL FORM
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
  const [events, setEvents] = useState([]);

  const [form, setForm] = useState({
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

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  // =========================================================
  // IMAGE STATE
  // =========================================================

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const imageInputRef =
    useRef(null);

  // =========================================================
  // LOAD EVENTS
  // =========================================================

  useEffect(() => {
    loadEvents();
  }, []);

  // =========================================================
  // CLEAN OBJECT URL
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

      if (response.data?.success) {
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
        error.response?.status ===
          401 ||
        error.response?.status ===
          403
      ) {
        setError(
          "Admin authentication expired. Please login again."
        );
      } else {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load events."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CALCULATE EVENT STATUS
  // INDIA TIME
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
  // HANDLE INPUT
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

    // =======================================================
    // FILE TYPE
    // =======================================================

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

    // =======================================================
    // FILE SIZE
    // =======================================================

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

    // =======================================================
    // REVOKE OLD BLOB
    // =======================================================

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    // =======================================================
    // SET FILE
    // =======================================================

    setImageFile(file);

    // =======================================================
    // CREATE PREVIEW
    // =======================================================

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(
      previewUrl
    );
  };

  // =========================================================
  // REMOVE SELECTED IMAGE
  // =========================================================

  const removeSelectedImage = () => {
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

    // =======================================================
    // EXISTING IMAGE
    // =======================================================

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
  // VALIDATE FORM
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

      // =====================================================
      // FORMDATA
      // =====================================================

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
              Number(form.price)
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

      // =====================================================
      // IMAGE
      // =====================================================
      //
      // IMPORTANT:
      // Only append image when a NEW file
      // has been selected.
      //
      // On edit without selecting a new
      // image, backend keeps old image.
      //
      // =====================================================

      if (imageFile) {
        payload.append(
          "image",
          imageFile
        );
      }

      // =====================================================
      // CREATE
      // =====================================================

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

      // =====================================================
      // CLOSE
      // =====================================================

      closeForm();

      // =====================================================
      // RELOAD
      // =====================================================

      await loadEvents();
    } catch (error) {
      console.error(
        "Save event error:",
        error
      );

      if (
        error.response?.status ===
          401 ||
        error.response?.status ===
          403
      ) {
        setError(
          "Admin authentication expired. Please login again."
        );
      } else {
        setError(
          error.response?.data
            ?.message ||
            "Unable to save event."
        );
      }
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

      await loadEvents();
    } catch (error) {
      console.error(
        "Delete event error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
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
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    const dateString =
      date
        .toString()
        .slice(0, 10);

    const parts =
      dateString.split("-");

    if (
      parts.length !== 3
    ) {
      return dateString;
    }

    const [
      year,
      month,
      day,
    ] = parts;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthIndex =
      Number(month) - 1;

    if (
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      return dateString;
    }

    return `${day} ${monthNames[monthIndex]} ${year}`;
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (
    time
  ) => {
    if (!time) {
      return "";
    }

    const value =
      time
        .toString()
        .slice(0, 5);

    const parts =
      value.split(":");

    if (
      parts.length < 2
    ) {
      return value;
    }

    let hour =
      Number(parts[0]);

    const minute =
      parts[1];

    if (
      Number.isNaN(hour)
    ) {
      return value;
    }

    const suffix =
      hour >= 12
        ? "PM"
        : "AM";

    hour =
      hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="admin-events-page">

      <div className="admin-events-container">

        {/* =================================================
            HEADER
        ================================================= */}

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
              events, CME programs,
              consultations and
              professional learning
              programs.
            </p>
          </div>

          <button
            type="button"
            className="admin-add-event-btn"
            onClick={openCreate}
          >
            <Plus size={18} />
            Create Event
          </button>

        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="admin-event-error">
            {error}
          </div>
        )}

        {/* =================================================
            FILTER BAR
        ================================================= */}

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

        {/* =================================================
            EVENT FORM
        ================================================= */}

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

                {/* TITLE */}

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

                {/* TYPE + MODE */}

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

                {/* DATE + TIME */}

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

                {/* DOCTOR */}

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
                      placeholder="Dr. Name"
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
                      placeholder="Cardiology"
                    />

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="form-field">

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
                    rows="5"
                    placeholder="Describe the event..."
                  />

                </div>

                {/* PRICE + SLOTS */}

                <div className="form-row">

                  <div className="form-field">

                    <label>
                      Registration Price
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

                {/* VENUE */}

                <div className="form-field">

                  <label>
                    Venue / Meeting Link
                  </label>

                  <input
                    name="venue"
                    value={
                      form.venue
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Venue or online meeting link"
                  />

                </div>

                {/* =================================================
                    EVENT IMAGE
                ================================================= */}

                <div className="form-field">

                  <label>
                    Event Image
                  </label>

                  <div className="event-image-upload-box">

                    <input
                      ref={
                        imageInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={
                        handleImageChange
                      }
                      className="event-image-file-input"
                    />

                    <div className="event-upload-icon">
                      <ImageIcon
                        size={30}
                      />
                    </div>

                    <div className="event-upload-text">

                      <strong>
                        Choose Event Image
                      </strong>

                      <span>
                        JPG, PNG or WEBP •
                        Maximum 5 MB
                      </span>

                    </div>

                    <label
                      htmlFor={
                        imageInputRef
                          .current
                          ?.id
                      }
                      className="event-browse-button"
                      onClick={() => {
                        imageInputRef.current?.click();
                      }}
                    >
                      Browse
                    </label>

                  </div>

                  {/* IMAGE PREVIEW */}

                  {imagePreview && (
                    <div className="event-image-preview">

                      <img
                        src={
                          imagePreview
                        }
                        alt="Event preview"
                      />

                      <div className="event-image-preview-info">

                        <strong>
                          {imageFile
                            ? imageFile.name
                            : "Current event image"}
                        </strong>

                        <span>
                          {imageFile
                            ? `${(
                                imageFile.size /
                                1024 /
                                1024
                              ).toFixed(
                                2
                              )} MB`
                            : "Existing image"}
                        </span>

                      </div>

                      {imageFile && (
                        <button
                          type="button"
                          className="event-remove-image"
                          onClick={
                            removeSelectedImage
                          }
                        >
                          <X size={16} />
                        </button>
                      )}

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
                    className="event-form-cancel"
                    onClick={
                      closeForm
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="event-form-submit"
                    disabled={saving}
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

        {/* =================================================
            EVENTS LIST
        ================================================= */}

        <section className="admin-events-list">

          {loading ? (

            <div className="admin-event-state">
              Loading events...
            </div>

          ) : filteredEvents.length ===
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
                  key={event.id}
                >

                  {/* IMAGE */}

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

                  {/* INFO */}

                  <div className="admin-event-row-info">

                    <div className="admin-event-type">
                      {event.event_type}
                    </div>

                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {formatDate(
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

                  {/* STATUS */}

                  <div className="admin-event-status-wrapper">

                    <span
                      className={`admin-event-status ${event.status}`}
                    >
                      {event.status}
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

                  {/* BOOKINGS */}

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
                      </strong>

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

                    </div>

                    <small>
                      Bookings
                    </small>

                  </div>

                  {/* BOOKING STATUS */}

                  <div className="admin-event-booking-status">

                    <TicketCheck
                      size={16}
                    />

                    <span>
                      {event.booking_enabled
                        ? "Booking On"
                        : "Booking Off"}
                    </span>

                  </div>

                  {/* PRICE */}

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

                  {/* ACTIONS */}

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

      </div>

    </main>
  );
}

export default EventManagement;