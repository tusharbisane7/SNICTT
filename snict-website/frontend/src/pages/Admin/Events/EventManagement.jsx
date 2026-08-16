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
  Image as ImageIcon,
  RefreshCw,
  MapPin,
  Upload,
  ExternalLink,
  FolderOpen,
  Video,
  FileText,
  ReceiptText,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Eye,
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
// MEDIA TYPES
// =========================================================

const MEDIA_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  DOCUMENT: "document",
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
  // EVENTS
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
  // MESSAGES
  // =======================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =======================================================
  // MEDIA MANAGEMENT
  // =======================================================

  const [mediaEvent, setMediaEvent] =
    useState(null);

  const [mediaLoading, setMediaLoading] =
    useState(false);

  const [mediaUploading, setMediaUploading] =
    useState(false);

  const [mediaDeletingId, setMediaDeletingId] =
    useState(null);

  const [eventMedia, setEventMedia] =
    useState({
      gallery: [],
      videos: [],
      documents: [],
    });

  const [mediaType, setMediaType] =
    useState(MEDIA_TYPES.IMAGE);

  const [selectedMediaFiles, setSelectedMediaFiles] =
    useState([]);

  const mediaInputRef =
    useRef(null);


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadEvents();
  }, []);


  // =======================================================
  // SUCCESS AUTO CLEAR
  // =======================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess("");
      }, 3500);

    return () => clearTimeout(timer);

  }, [success]);


  // =======================================================
  // IMAGE PREVIEW CLEANUP
  // =======================================================

  useEffect(() => {

    return () => {

      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }

    };

  }, [imagePreview]);


  // =======================================================
  // MEDIA PREVIEW CLEANUP
  // =======================================================

  useEffect(() => {

    return () => {

      selectedMediaFiles.forEach((item) => {

        if (
          item?.preview &&
          item.preview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(item.preview);
        }

      });

    };

  }, [selectedMediaFiles]);


  // =======================================================
  // LOAD EVENTS
  // =======================================================

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
          backendEvents.map((event) => ({
            ...event,
            status:
              calculateEventStatus(
                event.event_date,
                event.start_time,
                event.end_time
              ),
          }));

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
          error.message ||
          "Unable to load events."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // EVENT STATUS
  // =======================================================

  const calculateEventStatus = (
    eventDate,
    startTime,
    endTime
  ) => {

    if (
      !eventDate ||
      !startTime ||
      !endTime
    ) {
      return "upcoming";
    }

    const start =
      new Date(
        `${eventDate}T${startTime}`
      );

    const end =
      new Date(
        `${eventDate}T${endTime}`
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

    if (
      now < start
    ) {
      return "upcoming";
    }

    if (
      now >= start &&
      now <= end
    ) {
      return "ongoing";
    }

    return "past";
  };


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

      return new Date(
        value
      ).toLocaleDateString(
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
  // TIME
  // =======================================================

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "-";
    }

    const parts =
      String(value).split(":");

    if (
      parts.length < 2
    ) {
      return value;
    }

    const hours =
      Number(parts[0]);

    const minutes =
      Number(parts[1]);

    const suffix =
      hours >= 12
        ? "PM"
        : "AM";

    const displayHour =
      hours % 12 || 12;

    return `${displayHour}:${String(
      minutes
    ).padStart(2, "0")} ${suffix}`;

  };


  // =======================================================
  // CURRENCY
  // =======================================================

  const formatCurrency = (
    value
  ) => {

    const amount =
      Number(value || 0);

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(amount);

  };


  // =======================================================
  // DATE + TIME
  // FIX: Previously missing
  // =======================================================

  const formatDateTime = (value) => {

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
  // FILE SIZE
  // FIX: This fixes:
  //
  // ReferenceError:
  // formatFileSize is not defined
  // =======================================================

  const formatFileSize = (
    bytes
  ) => {

    if (
      bytes === null ||
      bytes === undefined ||
      Number(bytes) <= 0
    ) {
      return "0 Bytes";
    }

    const size =
      Number(bytes);

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index =
      Math.floor(
        Math.log(size) /
        Math.log(1024)
      );

    const safeIndex =
      Math.min(
        index,
        units.length - 1
      );

    const formattedSize =
      size /
      Math.pow(
        1024,
        safeIndex
      );

    return `${formattedSize.toFixed(
      safeIndex === 0
        ? 0
        : 2
    )} ${units[safeIndex]}`;

  };


  // =======================================================
  // FILTERED EVENTS
  // =======================================================

  const filteredEvents =
    useMemo(() => {

      if (
        filter === "all"
      ) {
        return events;
      }

      if (
        filter === "published"
      ) {
        return events.filter(
          (event) =>
            Boolean(
              event.published
            )
        );
      }

      if (
        filter === "draft"
      ) {
        return events.filter(
          (event) =>
            !Boolean(
              event.published
            )
        );
      }

      return events.filter(
        (event) =>
          event.status === filter
      );

    }, [
      events,
      filter,
    ]);


  // =======================================================
  // EVENT COUNTS
  // =======================================================

  const eventCounts =
    useMemo(() => {

      return {

        all:
          events.length,

        published:
          events.filter(
            (event) =>
              Boolean(
                event.published
              )
          ).length,

        draft:
          events.filter(
            (event) =>
              !Boolean(
                event.published
              )
          ).length,

        upcoming:
          events.filter(
            (event) =>
              event.status ===
              "upcoming"
          ).length,

        ongoing:
          events.filter(
            (event) =>
              event.status ===
              "ongoing"
          ).length,

        past:
          events.filter(
            (event) =>
              event.status ===
              "past"
          ).length,

      };

    }, [events]);


  // =======================================================
  // HANDLE FORM CHANGE
  // =======================================================

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


  // =======================================================
  // IMAGE CHANGE
  // =======================================================

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
        "Event cover image must be 5 MB or smaller."
      );

      event.target.value = "";

      return;
    }

    setError("");

    setImageFile(file);

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);

  };


  // =======================================================
  // RESET FORM
  // =======================================================

  const resetForm = () => {

    setForm({
      ...initialForm,
    });

    setEditingId(null);

    setImageFile(null);

    setImagePreview("");

    if (
      imageInputRef.current
    ) {
      imageInputRef.current.value = "";
    }

  };


  // =======================================================
  // OPEN CREATE
  // =======================================================

  const openCreate = () => {

    resetForm();

    setError("");

    setSuccess("");

    setShowForm(true);

  };


  // =======================================================
  // OPEN EDIT
  // =======================================================

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
        event.description || "",

      doctorName:
        event.doctor_name || "",

      specialization:
        event.specialization || "",

      eventDate:
        event.event_date
          ? String(
              event.event_date
            ).slice(0, 10)
          : "",

      startTime:
        event.start_time
          ? String(
              event.start_time
            ).slice(0, 5)
          : "",

      endTime:
        event.end_time
          ? String(
              event.end_time
            ).slice(0, 5)
          : "",

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
      imageInputRef.current.value = "";
    }

    setError("");

    setSuccess("");

    setShowForm(true);

  };


  // =======================================================
  // CLOSE FORM
  // =======================================================

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    resetForm();

  };


  // =======================================================
  // REMOVE IMAGE
  // =======================================================

  const removeSelectedImage = () => {

    setImageFile(null);

    setImagePreview("");

    if (
      imageInputRef.current
    ) {
      imageInputRef.current.value = "";
    }

  };


  // =======================================================
  // SUBMIT EVENT
  // =======================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    try {

      setSaving(true);

      setError("");

      setSuccess("");

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
        form.description
      );

      payload.append(
        "doctorName",
        form.doctorName
      );

      payload.append(
        "specialization",
        form.specialization
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
        form.venue
      );

      payload.append(
        "eventMode",
        form.eventMode
      );

      payload.append(
        "price",
        form.price || "0"
      );

      if (
        form.maxSlots !== ""
      ) {

        payload.append(
          "maxSlots",
          form.maxSlots
        );

      }

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
      // EXISTING IMAGE DURING EDIT
      // =====================================================

      if (
        !imageFile &&
        editingId &&
        imagePreview
      ) {

        payload.append(
          "imageUrl",
          imagePreview
        );

      }


      // =====================================================
      // NEW COVER IMAGE
      // =====================================================

      if (imageFile) {

        payload.append(
          "image",
          imageFile
        );

      }


      let response;


      // =====================================================
      // UPDATE
      // =====================================================

      if (editingId) {

        response =
          await api.put(
            `/events/admin/${editingId}`,
            payload
          );

      }


      // =====================================================
      // CREATE
      // =====================================================

      else {

        response =
          await api.post(
            "/events/admin",
            payload
          );

      }


      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to save event."
        );

      }


      setSuccess(
        editingId
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setShowForm(false);

      resetForm();

      await loadEvents();


    } catch (error) {

      console.error(
        "Save event error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to save event."
      );


    } finally {

      setSaving(false);

    }

  };


  // =======================================================
  // DELETE EVENT
  // =======================================================

  const handleDeleteEvent = async (
    event
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${event.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(
        event.id
      );

      setError("");

      const response =
        await api.delete(
          `/events/admin/${event.id}`
        );

      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to delete event."
        );

      }

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
        error.message ||
        "Unable to delete event."
      );

    } finally {

      setDeletingId(null);

    }

  };


  // =========================================================
  // OPEN MEDIA MANAGER
  // =========================================================

  const openMediaManager = async (
    event
  ) => {

    setMediaEvent(event);

    setMediaType(
      MEDIA_TYPES.IMAGE
    );

    setSelectedMediaFiles([]);

    setError("");

    await loadEventMedia(
      event.id
    );

  };


  // =========================================================
  // CLOSE MEDIA MANAGER
  // =========================================================

  const closeMediaManager = () => {

    if (mediaUploading) {
      return;
    }

    clearSelectedMedia();

    setMediaEvent(null);

    setEventMedia({
      gallery: [],
      videos: [],
      documents: [],
    });

  };


  // =========================================================
  // LOAD EVENT MEDIA
  // =========================================================

  const loadEventMedia = async (
    eventId
  ) => {

    if (!eventId) {
      return;
    }

    try {

      setMediaLoading(true);

      setError("");

      const response =
        await api.get(
          `/events/admin/${eventId}/media`
        );

      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to load event media."
        );

      }

      setEventMedia({

        gallery:
          Array.isArray(
            response.data.gallery
          )
            ? response.data.gallery
            : [],

        videos:
          Array.isArray(
            response.data.videos
          )
            ? response.data.videos
            : [],

        documents:
          Array.isArray(
            response.data.documents
          )
            ? response.data.documents
            : [],

      });

    } catch (error) {

      console.error(
        "Load event media error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load event media."
      );

    } finally {

      setMediaLoading(false);

    }

  };


  // =========================================================
  // ACTIVE MEDIA
  // =========================================================

  const activeMediaItems =
    useMemo(() => {

      if (
        mediaType ===
        MEDIA_TYPES.IMAGE
      ) {

        return eventMedia.gallery;

      }

      if (
        mediaType ===
        MEDIA_TYPES.VIDEO
      ) {

        return eventMedia.videos;

      }

      return eventMedia.documents;

    }, [
      mediaType,
      eventMedia,
    ]);


  // =========================================================
  // MEDIA COUNTS
  // =========================================================

  const mediaCounts = {

    images:
      eventMedia.gallery.length,

    videos:
      eventMedia.videos.length,

    documents:
      eventMedia.documents.length,

  };


  // =========================================================
  // MEDIA ACCEPT
  // =========================================================

  const getMediaAccept = () => {

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {

      return [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ].join(",");

    }

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {

      return [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ].join(",");

    }

    return [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ].join(",");

  };


  // =========================================================
  // MEDIA FILE VALIDATION
  // =========================================================

  const validateMediaFile = (
    file
  ) => {

    if (!file) {
      return false;
    }


    // -------------------------------------------------------
    // IMAGE
    // -------------------------------------------------------

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {

      const allowed = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (
        !allowed.includes(
          file.type
        )
      ) {

        setError(
          `"${file.name}" is not a supported image.`
        );

        return false;

      }

    }


    // -------------------------------------------------------
    // VIDEO
    // -------------------------------------------------------

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {

      const allowed = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      if (
        !allowed.includes(
          file.type
        )
      ) {

        setError(
          `"${file.name}" is not a supported video. Use MP4, WEBM or MOV.`
        );

        return false;

      }

    }


    // -------------------------------------------------------
    // DOCUMENT
    // -------------------------------------------------------

    if (
      mediaType ===
      MEDIA_TYPES.DOCUMENT
    ) {

      const extension =
        file.name
          .substring(
            file.name.lastIndexOf(".")
          )
          .toLowerCase();

      const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
      ];

      if (
        !allowedExtensions.includes(
          extension
        )
      ) {

        setError(
          `"${file.name}" is not a supported document.`
        );

        return false;

      }

    }


    // -------------------------------------------------------
    // FILE SIZE
    // -------------------------------------------------------

    if (
      file.size >
      100 * 1024 * 1024
    ) {

      setError(
        `"${file.name}" exceeds the 100 MB limit.`
      );

      return false;

    }


    return true;

  };


  // =========================================================
  // MEDIA FILE CHANGE
  // =========================================================

  const handleMediaFilesChange = (
    event
  ) => {

    const files =
      Array.from(
        event.target.files || []
      );

    if (
      files.length === 0
    ) {
      return;
    }


    // Backend supports maximum 20 files

    if (
      files.length > 20
    ) {

      setError(
        "You can upload maximum 20 files at once."
      );

      event.target.value = "";

      return;

    }


    setError("");

    const validFiles = [];


    files.forEach(
      (file) => {

        if (
          validateMediaFile(
            file
          )
        ) {

          validFiles.push({

            file,

            preview:
              file.type.startsWith(
                "image/"
              )
                ? URL.createObjectURL(
                    file
                  )
                : "",

          });

        }

      }
    );


    if (
      validFiles.length === 0
    ) {

      event.target.value = "";

      return;

    }


    // Cleanup old previews

    selectedMediaFiles.forEach(
      (item) => {

        if (
          item?.preview &&
          item.preview.startsWith(
            "blob:"
          )
        ) {

          URL.revokeObjectURL(
            item.preview
          );

        }

      }
    );


    setSelectedMediaFiles(
      validFiles
    );

  };


  // =========================================================
  // REMOVE SELECTED MEDIA
  // =========================================================

  const removeSelectedMediaFile = (
    index
  ) => {

    setSelectedMediaFiles(
      (previous) => {

        const item =
          previous[index];

        if (
          item?.preview &&
          item.preview.startsWith(
            "blob:"
          )
        ) {

          URL.revokeObjectURL(
            item.preview
          );

        }

        return previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        );

      }
    );

  };


  // =========================================================
  // CLEAR SELECTED MEDIA
  // =========================================================

  const clearSelectedMedia = () => {

    selectedMediaFiles.forEach(
      (item) => {

        if (
          item?.preview &&
          item.preview.startsWith(
            "blob:"
          )
        ) {

          URL.revokeObjectURL(
            item.preview
          );

        }

      }
    );

    setSelectedMediaFiles([]);

    if (
      mediaInputRef.current
    ) {

      mediaInputRef.current.value = "";

    }

  };


  // =========================================================
  // UPLOAD EVENT MEDIA
  // =========================================================

  const uploadEventMediaFiles =
    async () => {

      if (
        !mediaEvent?.id
      ) {

        setError(
          "Please select an event first."
        );

        return;

      }


      if (
        selectedMediaFiles.length === 0
      ) {

        setError(
          "Please select at least one file."
        );

        return;

      }


      try {

        setMediaUploading(true);

        setError("");

        setSuccess("");


        const payload =
          new FormData();


        // Backend expects "type"

        payload.append(
          "type",
          mediaType
        );


        // Backend expects "files"

        selectedMediaFiles.forEach(
          (item) => {

            payload.append(
              "files",
              item.file
            );

          }
        );


        const response =
          await api.post(
            `/events/admin/${mediaEvent.id}/media`,
            payload
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to upload event media."
          );

        }


        setSuccess(
          mediaType ===
          MEDIA_TYPES.IMAGE
            ? "Gallery images uploaded successfully."
            : mediaType ===
              MEDIA_TYPES.VIDEO
              ? "Videos uploaded successfully."
              : "Documents uploaded successfully."
        );


        clearSelectedMedia();


        await loadEventMedia(
          mediaEvent.id
        );


        await loadEvents();


      } catch (error) {

        console.error(
          "Upload event media error:",
          error
        );

        setError(
          error.response?.data?.message ||
          error.message ||
          "Unable to upload event media."
        );


      } finally {

        setMediaUploading(false);

      }

    };


  // =========================================================
  // GET MEDIA ID
  // =========================================================

  const getMediaId = (
    media
  ) => {

    return (
      media?.id ||
      media?.media_id ||
      null
    );

  };


  // =========================================================
  // GET MEDIA URL
  // =========================================================

  const getMediaUrl = (
    media
  ) => {

    return (
      media?.image_url ||
      media?.video_url ||
      media?.file_url ||
      media?.secure_url ||
      media?.url ||
      ""
    );

  };


  // =========================================================
  // GET MEDIA NAME
  // =========================================================

  const getMediaName = (
    media
  ) => {

    return (
      media?.file_name ||
      media?.original_name ||
      media?.originalName ||
      media?.title ||
      media?.name ||
      "Media File"
    );

  };


  // =========================================================
  // GET DOCUMENT ICON
  // =========================================================

  const getDocumentIcon = (
    media
  ) => {

    const name =
      getMediaName(
        media
      ).toLowerCase();


    if (
      name.endsWith(".ppt") ||
      name.endsWith(".pptx")
    ) {

      return (
        <ReceiptText
          size={30}
        />
      );

    }


    return (
      <FileText
        size={30}
      />
    );

  };


  // =========================================================
  // OPEN MEDIA URL
  // =========================================================

  const openMediaUrl = (
    media
  ) => {

    const url =
      getMediaUrl(
        media
      );


    if (!url) {

      setError(
        "Media URL is not available."
      );

      return;

    }


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

  };


  // =========================================================
  // DELETE EVENT MEDIA
  // =========================================================

  const deleteEventMedia =
    async (media) => {

      if (
        !mediaEvent?.id
      ) {
        return;
      }


      const mediaId =
        getMediaId(
          media
        );


      if (!mediaId) {

        setError(
          "Invalid media ID."
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${getMediaName(
            media
          )}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setMediaDeletingId(
          mediaId
        );

        setError("");

        setSuccess("");


        const response =
          await api.delete(
            `/events/admin/${mediaEvent.id}/media/${encodeURIComponent(
              mediaId
            )}`,
            {
              params: {
                type: mediaType,
              },
            }
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to delete media."
          );

        }


        setSuccess(
          "Media deleted successfully."
        );


        await loadEventMedia(
          mediaEvent.id
        );


        await loadEvents();


      } catch (error) {

        console.error(
          "Delete event media error:",
          error
        );

        setError(
          error.response?.data?.message ||
          error.message ||
          "Unable to delete media."
        );


      } finally {

        setMediaDeletingId(null);

      }

    };


  // =========================================================
  // RENDER MEDIA PREVIEW
  // =========================================================

  const renderMediaPreview = (
    media
  ) => {

    const url =
      getMediaUrl(
        media
      );


    // IMAGE

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {

      if (!url) {

        return (
          <div className="event-media-empty-preview">

            <ImageIcon
              size={30}
            />

            <span>
              Preview unavailable
            </span>

          </div>
        );

      }


      return (
        <img
          src={url}
          alt={
            getMediaName(
              media
            )
          }
        />
      );

    }


    // VIDEO

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {

      if (!url) {

        return (
          <div className="event-media-empty-preview">

            <Video
              size={30}
            />

            <span>
              Video unavailable
            </span>

          </div>
        );

      }


      return (
        <video
          src={url}
          controls
          preload="metadata"
        />
      );

    }


    // DOCUMENT

    return (
      <div className="event-media-document-preview">

        <div className="event-media-document-icon">

          {getDocumentIcon(
            media
          )}

        </div>

        <strong
          title={
            getMediaName(
              media
            )
          }
        >
          {getMediaName(
            media
          )}
        </strong>

      </div>
    );

  };
    // =========================================================
  // RENDER SELECTED FILE PREVIEW
  // =========================================================

  const renderSelectedFilePreview = (
    item
  ) => {

    if (!item?.file) {
      return null;
    }

    const file =
      item.file;


    // =======================================================
    // IMAGE
    // =======================================================

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {

      return (
        <div className="event-selected-file-image">

          {item.preview ? (
            <img
              src={item.preview}
              alt={file.name}
            />
          ) : (
            <ImageIcon
              size={30}
            />
          )}

        </div>
      );

    }


    // =======================================================
    // VIDEO
    // =======================================================

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {

      return (
        <div className="event-selected-file-video">

          <Video
            size={30}
          />

        </div>
      );

    }


    // =======================================================
    // DOCUMENT
    // =======================================================

    return (
      <div className="event-selected-file-document">

        {file.name
          .toLowerCase()
          .endsWith(".ppt") ||
        file.name
          .toLowerCase()
          .endsWith(".pptx") ? (
          <ReceiptText
            size={30}
          />
        ) : (
          <FileText
            size={30}
          />
        )}

      </div>
    );

  };


  // =========================================================
  // GET MEDIA TYPE LABEL
  // =========================================================

  const getMediaTypeLabel = () => {

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {
      return "Gallery Images";
    }

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {
      return "Videos";
    }

    return "Documents";

  };


  // =========================================================
  // GET MEDIA TYPE DESCRIPTION
  // =========================================================

  const getMediaTypeDescription = () => {

    if (
      mediaType ===
      MEDIA_TYPES.IMAGE
    ) {

      return "Upload event gallery photos.";

    }

    if (
      mediaType ===
      MEDIA_TYPES.VIDEO
    ) {

      return "Upload event videos.";

    }

    return "Upload PDF, Word or PowerPoint documents.";

  };


  // =========================================================
  // MEDIA TAB CHANGE
  // =========================================================

  const handleMediaTypeChange = (
    type
  ) => {

    if (
      mediaUploading
    ) {
      return;
    }

    clearSelectedMedia();

    setMediaType(
      type
    );

    setError("");

  };


  // =========================================================
  // EVENT IMAGE URL
  // =========================================================

  const getEventImage = (
    event
  ) => {

    return (
      event?.image_url ||
      event?.imageUrl ||
      event?.image ||
      ""
    );

  };


  // =========================================================
  // GET EVENT TITLE
  // =========================================================

  const getEventTitle = (
    event
  ) => {

    return (
      event?.title ||
      "Untitled Event"
    );

  };


  // =========================================================
  // GET EVENT TYPE
  // =========================================================

  const getEventType = (
    event
  ) => {

    return (
      event?.event_type ||
      event?.eventType ||
      "EVENT"
    );

  };


  // =========================================================
  // GET EVENT VENUE
  // =========================================================

  const getEventVenue = (
    event
  ) => {

    return (
      event?.venue ||
      "Venue not specified"
    );

  };


  // =========================================================
  // GET EVENT PRICE
  // =========================================================

  const getEventPrice = (
    event
  ) => {

    const price =
      Number(
        event?.price || 0
      );

    if (
      price <= 0
    ) {
      return "Free";
    }

    return formatCurrency(
      price
    );

  };


  // =========================================================
  // GET BOOKINGS COUNT
  // =========================================================

  const getBookingsCount = (
    event
  ) => {

    return Number(
      event?.booking_count ||
      event?.bookings_count ||
      event?.registered_count ||
      event?.total_bookings ||
      0
    );

  };


  // =========================================================
  // GET MAX SLOTS
  // =========================================================

  const getMaxSlots = (
    event
  ) => {

    const value =
      event?.max_slots ??
      event?.maxSlots;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    return Number(
      value
    );

  };


  // =========================================================
  // GET PUBLISH STATUS
  // =========================================================

  const getPublishStatus = (
    event
  ) => {

    return Boolean(
      event?.published
    )
      ? "published"
      : "draft";

  };


  // =========================================================
  // OPEN EVENT DETAILS
  // =========================================================

  const handleViewEvent = (
    event
  ) => {

    if (!event?.id) {
      return;
    }

    window.open(
      `/events/${event.id}`,
      "_blank",
      "noopener,noreferrer"
    );

  };


  // =========================================================
  // MEDIA ITEM DATE
  // =========================================================

  const getMediaDate = (
    media
  ) => {

    return (
      media?.created_at ||
      media?.createdAt ||
      media?.uploaded_at ||
      media?.uploadedAt ||
      null
    );

  };


  // =========================================================
  // MEDIA MIME TYPE
  // =========================================================

  const getMediaMimeType = (
    media
  ) => {

    return (
      media?.mime_type ||
      media?.mimeType ||
      media?.type ||
      ""
    );

  };


  // =========================================================
  // EVENT ROW
  // =========================================================

  const renderEventRow = (
    event
  ) => {

    const image =
      getEventImage(
        event
      );

    const status =
      event.status ||
      calculateEventStatus(
        event.event_date,
        event.start_time,
        event.end_time
      );

    const bookings =
      getBookingsCount(
        event
      );

    const maxSlots =
      getMaxSlots(
        event
      );

    const price =
      getEventPrice(
        event
      );

    const publishStatus =
      getPublishStatus(
        event
      );


    return (
      <div
        className="admin-event-row"
        key={event.id}
      >

        {/* =================================================
             IMAGE
             ================================================= */}

        <div className="admin-event-image">

          {image ? (
            <img
              src={image}
              alt={getEventTitle(event)}
            />
          ) : (
            <CalendarDays
              size={25}
            />
          )}

        </div>


        {/* =================================================
             EVENT INFO
             ================================================= */}

        <div className="admin-event-row-info">

          <span className="admin-event-type">
            {getEventType(event)}
          </span>

          <h3
            title={getEventTitle(event)}
          >
            {getEventTitle(event)}
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

          <small>
            {getEventVenue(event)}
          </small>

        </div>


        {/* =================================================
             STATUS
             ================================================= */}

        <div className="admin-event-status-wrapper">

          <span
            className={`admin-event-status ${status}`}
          >

            {status}

          </span>

          <span
            className={`admin-publish-status ${publishStatus}`}
          >

            {publishStatus}

          </span>

        </div>


        {/* =================================================
             BOOKINGS
             ================================================= */}

        <div className="admin-event-bookings">

          <div>

            <strong>
              {bookings}

              {maxSlots !== null && (
                <span>
                  {" / "}
                  {maxSlots}
                </span>
              )}
            </strong>

          </div>

          <small>
            Registrations
          </small>

          {event.booking_enabled && (
            <div className="admin-event-booking-status">

              <CheckCircle2
                size={11}
              />

              Booking enabled

            </div>
          )}

        </div>


        {/* =================================================
             PRICE
             ================================================= */}

        <div className="admin-event-row-price">

          <small>
            Entry
          </small>

          <strong>
            {price}
          </strong>

        </div>


        {/* =================================================
             ACTIONS
             ================================================= */}

        <div className="admin-event-actions">

          <button
            type="button"
            title="View event"
            onClick={() =>
              handleViewEvent(
                event
              )
            }
          >
            <Eye
              size={15}
            />
          </button>


          <button
            type="button"
            title="Manage gallery, videos and documents"
            onClick={() =>
              openMediaManager(
                event
              )
            }
          >
            <FolderOpen
              size={15}
            />
          </button>


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
              size={15}
            />
          </button>


          <button
            type="button"
            title="Delete event"
            className="delete"
            disabled={
              deletingId ===
              event.id
            }
            onClick={() =>
              handleDeleteEvent(
                event
              )
            }
          >

            {deletingId ===
            event.id ? (
              <RefreshCw
                size={15}
                className="admin-event-spin"
              />
            ) : (
              <Trash2
                size={15}
              />
            )}

          </button>

        </div>

      </div>
    );

  };


  // =========================================================
  // EVENT FORM
  // =========================================================

  const renderEventForm = () => {

    if (!showForm) {
      return null;
    }


    return (
      <div
        className="event-form-overlay"
        onMouseDown={(event) => {

          if (
            event.target ===
            event.currentTarget
          ) {
            closeForm();
          }

        }}
      >

        <div
          className="event-form-modal"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >

          {/* ===============================================
               HEADER
               =============================================== */}

          <div className="event-form-header">

            <div>

              <span>
                EVENT MANAGEMENT
              </span>

              <h2>
                {editingId
                  ? "Edit Event"
                  : "Create Event"}
              </h2>

            </div>

            <button
              type="button"
              className="event-modal-close"
              onClick={
                closeForm
              }
              disabled={
                saving
              }
            >
              <X
                size={18}
              />
            </button>

          </div>


          {/* ===============================================
               FORM
               =============================================== */}

          <form
            className="admin-event-form"
            onSubmit={
              handleSubmit
            }
          >

            {/* =============================================
                 BASIC INFORMATION
                 ============================================= */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Event Title *
                </label>

                <input
                  type="text"
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


              <div className="form-field">

                <label>
                  Event Type *
                </label>

                <select
                  name="eventType"
                  value={
                    form.eventType
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="CME">
                    CME
                  </option>

                  <option value="Conference">
                    Conference
                  </option>

                  <option value="Workshop">
                    Workshop
                  </option>

                  <option value="Seminar">
                    Seminar
                  </option>

                  <option value="Webinar">
                    Webinar
                  </option>

                  <option value="Meeting">
                    Meeting
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>


            {/* =============================================
                 DESCRIPTION
                 ============================================= */}

            <div className="form-field full">

              <label>
                Description *
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
                required
              />

            </div>


            {/* =============================================
                 DOCTOR
                 ============================================= */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Doctor / Speaker
                </label>

                <input
                  type="text"
                  name="doctorName"
                  value={
                    form.doctorName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Doctor or speaker name"
                />

              </div>


              <div className="form-field">

                <label>
                  Specialization
                </label>

                <input
                  type="text"
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


            {/* =============================================
                 DATE / TIME
                 ============================================= */}

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


            {/* =============================================
                 VENUE / MODE
                 ============================================= */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Venue
                </label>

                <input
                  type="text"
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


            {/* =============================================
                 PRICE / SLOTS
                 ============================================= */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  min="0"
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
                  name="maxSlots"
                  min="1"
                  value={
                    form.maxSlots
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Maximum registrations"
                />

              </div>

            </div>


            {/* =============================================
                 COVER IMAGE
                 ============================================= */}

            <div className="form-field full">

              <label>
                Event Cover Image
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
                <div className="event-image-preview">

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
                    <X
                      size={15}
                    />
                  </button>

                </div>
              )}

            </div>


            {/* =============================================
                 CHECKBOXES
                 ============================================= */}

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


            {/* =============================================
                 ACTIONS
                 ============================================= */}

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

                {saving ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="admin-event-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    {editingId
                      ? "Update Event"
                      : "Create Event"}
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

      </div>
    );

  };
    // =========================================================
  // MEDIA MANAGER
  // =========================================================

  const renderMediaManager = () => {

    if (!mediaEvent) {
      return null;
    }


    return (
      <div
        className="event-form-overlay"
        onMouseDown={(event) => {

          if (
            event.target ===
            event.currentTarget
          ) {

            closeMediaManager();

          }

        }}
      >

        <div
          className="event-media-manager-modal"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >

          {/* =================================================
               HEADER
               ================================================= */}

          <div className="event-form-header">

            <div>

              <span>
                EVENT MEDIA MANAGEMENT
              </span>

              <h2>
                {getEventTitle(
                  mediaEvent
                )}
              </h2>

              <p className="event-media-manager-subtitle">
                Manage gallery images, videos and documents
                for this event.
              </p>

            </div>


            <button
              type="button"
              className="event-modal-close"
              onClick={
                closeMediaManager
              }
              disabled={
                mediaUploading
              }
            >
              <X
                size={18}
              />
            </button>

          </div>


          {/* =================================================
               MEDIA TABS
               ================================================= */}

          <div className="event-media-tabs">

            <button
              type="button"
              className={
                mediaType ===
                MEDIA_TYPES.IMAGE
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMediaTypeChange(
                  MEDIA_TYPES.IMAGE
                )
              }
              disabled={
                mediaUploading
              }
            >

              <ImageIcon
                size={16}
              />

              <span>
                Gallery
              </span>

              <strong>
                {mediaCounts.images}
              </strong>

            </button>


            <button
              type="button"
              className={
                mediaType ===
                MEDIA_TYPES.VIDEO
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMediaTypeChange(
                  MEDIA_TYPES.VIDEO
                )
              }
              disabled={
                mediaUploading
              }
            >

              <Video
                size={16}
              />

              <span>
                Videos
              </span>

              <strong>
                {mediaCounts.videos}
              </strong>

            </button>


            <button
              type="button"
              className={
                mediaType ===
                MEDIA_TYPES.DOCUMENT
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMediaTypeChange(
                  MEDIA_TYPES.DOCUMENT
                )
              }
              disabled={
                mediaUploading
              }
            >

              <FileText
                size={16}
              />

              <span>
                Documents
              </span>

              <strong>
                {mediaCounts.documents}
              </strong>

            </button>

          </div>


          {/* =================================================
               UPLOAD SECTION
               ================================================= */}

          <div className="event-media-upload-section">

            <div className="event-media-upload-heading">

              <div>

                <h3>
                  {getMediaTypeLabel()}
                </h3>

                <p>
                  {getMediaTypeDescription()}
                </p>

              </div>

            </div>


            {/* =================================================
                 DROP / SELECT AREA
                 ================================================= */}

            <div
              className="event-media-upload-box"
              onClick={() => {

                if (
                  mediaUploading
                ) {
                  return;
                }

                mediaInputRef.current?.click();

              }}
            >

              <input
                ref={
                  mediaInputRef
                }
                type="file"
                multiple
                hidden
                accept={
                  getMediaAccept()
                }
                onChange={
                  handleMediaFilesChange
                }
              />


              <div className="event-media-upload-icon">

                {mediaType ===
                MEDIA_TYPES.IMAGE ? (
                  <ImageIcon
                    size={25}
                  />
                ) : mediaType ===
                  MEDIA_TYPES.VIDEO ? (
                  <Video
                    size={25}
                  />
                ) : (
                  <FileText
                    size={25}
                  />
                )}

              </div>


              <h4>
                Select files to upload
              </h4>


              <p>
                Click here to browse your computer
              </p>


              <small>

                {mediaType ===
                MEDIA_TYPES.IMAGE
                  ? "JPG, JPEG, PNG, WEBP or GIF • Maximum 100 MB each"
                  : mediaType ===
                    MEDIA_TYPES.VIDEO
                    ? "MP4, WEBM or MOV • Maximum 100 MB each"
                    : "PDF, DOC, DOCX, PPT or PPTX • Maximum 100 MB each"}

              </small>

            </div>


            {/* =================================================
                 SELECTED FILES
                 ================================================= */}

            {selectedMediaFiles.length >
              0 && (

              <div className="event-selected-media">

                <div className="event-selected-media-header">

                  <div>

                    <strong>
                      Selected Files
                    </strong>

                    <span>
                      {selectedMediaFiles.length}
                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={
                      clearSelectedMedia
                    }
                    disabled={
                      mediaUploading
                    }
                  >
                    Clear all
                  </button>

                </div>


                <div className="event-selected-media-list">

                  {selectedMediaFiles.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="event-selected-media-item"
                        key={`${item.file.name}-${index}`}
                      >

                        {renderSelectedFilePreview(
                          item
                        )}


                        <div className="event-selected-media-info">

                          <strong
                            title={
                              item.file.name
                            }
                          >
                            {item.file.name}
                          </strong>

                          <small>
                            {formatFileSize(
                              item.file.size
                            )}
                          </small>

                        </div>


                        <button
                          type="button"
                          className="event-selected-media-remove"
                          onClick={() =>
                            removeSelectedMediaFile(
                              index
                            )
                          }
                          disabled={
                            mediaUploading
                          }
                        >
                          <X
                            size={15}
                          />
                        </button>

                      </div>

                    )
                  )}

                </div>


                {/* =================================================
                     UPLOAD BUTTON
                     ================================================= */}

                <div className="event-media-upload-actions">

                  <button
                    type="button"
                    className="event-media-upload-btn"
                    onClick={
                      uploadEventMediaFiles
                    }
                    disabled={
                      mediaUploading
                    }
                  >

                    {mediaUploading ? (
                      <>
                        <RefreshCw
                          size={15}
                          className="admin-event-spin"
                        />

                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload
                          size={15}
                        />

                        Upload{" "}
                        {
                          selectedMediaFiles.length
                        }{" "}
                        File
                        {
                          selectedMediaFiles.length !==
                          1
                            ? "s"
                            : ""
                        }
                      </>
                    )}

                  </button>

                </div>

              </div>

            )}

          </div>


          {/* =================================================
               MEDIA LIBRARY
               ================================================= */}

          <div className="event-media-library">

            <div className="event-media-library-header">

              <div>

                <span>
                  MEDIA LIBRARY
                </span>

                <h3>
                  {getMediaTypeLabel()}
                </h3>

              </div>


              <button
                type="button"
                className="event-media-refresh-btn"
                onClick={() =>
                  loadEventMedia(
                    mediaEvent.id
                  )
                }
                disabled={
                  mediaLoading ||
                  mediaUploading
                }
              >

                <RefreshCw
                  size={14}
                  className={
                    mediaLoading
                      ? "admin-event-spin"
                      : ""
                  }
                />

                Refresh

              </button>

            </div>


            {/* =================================================
                 LOADING
                 ================================================= */}

            {mediaLoading ? (

              <div className="event-media-state">

                <RefreshCw
                  size={30}
                  className="admin-event-spin"
                />

                <h3>
                  Loading media...
                </h3>

                <p>
                  Please wait while the media library
                  is loaded.
                </p>

              </div>

            ) : activeMediaItems.length ===
              0 ? (

              /* =================================================
                   EMPTY
                   ================================================= */

              <div className="event-media-state">

                {mediaType ===
                MEDIA_TYPES.IMAGE ? (
                  <ImageIcon
                    size={35}
                  />
                ) : mediaType ===
                  MEDIA_TYPES.VIDEO ? (
                  <Video
                    size={35}
                  />
                ) : (
                  <FileText
                    size={35}
                  />
                )}

                <h3>
                  No{" "}
                  {mediaType ===
                  MEDIA_TYPES.IMAGE
                    ? "gallery images"
                    : mediaType ===
                      MEDIA_TYPES.VIDEO
                      ? "videos"
                      : "documents"}{" "}
                  yet
                </h3>

                <p>
                  Upload your first{" "}
                  {mediaType ===
                  MEDIA_TYPES.IMAGE
                    ? "gallery image"
                    : mediaType ===
                      MEDIA_TYPES.VIDEO
                      ? "video"
                      : "document"}{" "}
                  using the upload area above.
                </p>

              </div>

            ) : (

              /* =================================================
                   MEDIA GRID
                   ================================================= */

              <div
                className={
                  mediaType ===
                  MEDIA_TYPES.DOCUMENT
                    ? "event-media-grid event-media-grid-documents"
                    : "event-media-grid"
                }
              >

                {activeMediaItems.map(
                  (
                    media,
                    index
                  ) => {

                    const mediaId =
                      getMediaId(
                        media
                      );

                    const url =
                      getMediaUrl(
                        media
                      );

                    const name =
                      getMediaName(
                        media
                      );

                    const createdAt =
                      getMediaDate(
                        media
                      );


                    return (
                      <div
                        className={
                          mediaType ===
                          MEDIA_TYPES.DOCUMENT
                            ? "event-media-card event-media-document-card"
                            : "event-media-card"
                        }
                        key={
                          mediaId ||
                          `${name}-${index}`
                        }
                      >

                        {/* =================================
                             PREVIEW
                             ================================= */}

                        <div className="event-media-card-preview">

                          {renderMediaPreview(
                            media
                          )}


                          {/* =================================
                               CARD OVERLAY
                               ================================= */}

                          <div className="event-media-card-overlay">

                            {url && (
                              <button
                                type="button"
                                title="Open"
                                onClick={() =>
                                  openMediaUrl(
                                    media
                                  )
                                }
                              >
                                <ExternalLink
                                  size={15}
                                />
                              </button>
                            )}


                            <button
                              type="button"
                              title="Delete"
                              className="delete"
                              disabled={
                                mediaDeletingId ===
                                mediaId
                              }
                              onClick={() =>
                                deleteEventMedia(
                                  media
                                )
                              }
                            >

                              {mediaDeletingId ===
                              mediaId ? (
                                <RefreshCw
                                  size={15}
                                  className="admin-event-spin"
                                />
                              ) : (
                                <Trash2
                                  size={15}
                                />
                              )}

                            </button>

                          </div>

                        </div>


                        {/* =================================
                             CARD INFORMATION
                             ================================= */}

                        <div className="event-media-card-info">

                          <strong
                            title={name}
                          >
                            {name}
                          </strong>


                          <div className="event-media-card-meta">

                            <span>
                              {getMediaMimeType(
                                media
                              ) ||
                                (
                                  mediaType ===
                                  MEDIA_TYPES.IMAGE
                                    ? "Image"
                                    : mediaType ===
                                      MEDIA_TYPES.VIDEO
                                      ? "Video"
                                      : "Document"
                                )}
                            </span>


                            {media.file_size && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  {formatFileSize(
                                    media.file_size
                                  )}
                                </span>
                              </>
                            )}

                          </div>


                          {createdAt && (
                            <small>
                              {formatDateTime(
                                createdAt
                              )}
                            </small>
                          )}

                        </div>

                      </div>
                    );

                  }
                )}

              </div>

            )}

          </div>


          {/* =================================================
               FOOTER
               ================================================= */}

          <div className="event-media-manager-footer">

            <div>

              <strong>
                Total Media
              </strong>

              <span>
                {mediaCounts.images +
                  mediaCounts.videos +
                  mediaCounts.documents}
              </span>

            </div>


            <button
              type="button"
              className="registration-close-btn"
              onClick={
                closeMediaManager
              }
              disabled={
                mediaUploading
              }
            >
              Close
            </button>

          </div>

        </div>

      </div>
    );

  };


  // =========================================================
  // ALERT
  // =========================================================

  const renderAlerts = () => {

    return (
      <>
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
              <X
                size={15}
              />
            </button>

          </div>

        )}


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

      </>
    );

  };


  // =========================================================
  // EVENT FILTER TOOLBAR
  // =========================================================

  const renderEventToolbar = () => {

    return (
      <div className="admin-event-toolbar">

        <div className="admin-event-filter-label">

          <CalendarDays
            size={16}
          />

          <span>
            Event Status
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
              {eventCounts.all}
            </span>

          </button>


          <button
            type="button"
            className={
              filter === "published"
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

            <span>
              {eventCounts.published}
            </span>

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

            Draft

            <span>
              {eventCounts.draft}
            </span>

          </button>


          <button
            type="button"
            className={
              filter === "upcoming"
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
              {eventCounts.upcoming}
            </span>

          </button>


          <button
            type="button"
            className={
              filter === "ongoing"
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
              {eventCounts.ongoing}
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
              {eventCounts.past}
            </span>

          </button>

        </div>

      </div>
    );

  };


  // =========================================================
  // EVENTS LIST
  // =========================================================

  const renderEventsList = () => {

    if (loading) {

      return (
        <div className="admin-event-state">

          <RefreshCw
            size={30}
            className="admin-event-spin"
          />

          <h3>
            Loading events...
          </h3>

          <p>
            Please wait while events are being loaded.
          </p>

        </div>
      );

    }


    if (
      filteredEvents.length ===
      0
    ) {

      return (
        <div className="admin-event-state">

          <CalendarDays
            size={35}
          />

          <h3>
            No events found
          </h3>

          <p>
            Create an event to get started.
          </p>

        </div>
      );

    }


    return (
      <div className="admin-events-list">

        {filteredEvents.map(
          renderEventRow
        )}

      </div>
    );

  };
    // =========================================================
  // MAIN RENDER
  // =========================================================

  return (
    <div className="admin-events-page">

      <div className="admin-events-container">

        {/* ===================================================
             HEADER
             =================================================== */}

        <div className="admin-events-header">

          <div>

            <span className="admin-events-eyebrow">
              SNICT ADMIN PANEL
            </span>

            <h1>
              Event Management
            </h1>

            <p>
              Create, manage and publish events,
              registrations and event media.
            </p>

          </div>


          <div className="admin-events-header-actions">

            <button
              type="button"
              className="admin-add-event-btn"
              onClick={
                openCreate
              }
            >

              <Plus
                size={16}
              />

              Add Event

            </button>

          </div>

        </div>


        {/* ===================================================
             ALERTS
             =================================================== */}

        {renderAlerts()}


        {/* ===================================================
             MAIN TABS
             =================================================== */}

        <div className="admin-event-main-tabs">

          <button
            type="button"
            className={
              activeTab === "events"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "events"
              )
            }
          >

            <CalendarDays
              size={16}
            />

            Events

            <span>
              {events.length}
            </span>

          </button>


          <button
            type="button"
            className={
              activeTab === "media"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "media"
              )
            }
          >

            <FolderOpen
              size={16}
            />

            Media

            <span>
              {events.reduce(
                (
                  total,
                  event
                ) =>
                  total +
                  Number(
                    event.gallery_count ||
                    0
                  ) +
                  Number(
                    event.video_count ||
                    0
                  ) +
                  Number(
                    event.document_count ||
                    0
                  ),
                0
              )}
            </span>

          </button>

        </div>


        {/* ===================================================
             EVENTS TAB
             =================================================== */}

        {activeTab === "events" && (

          <>

            {renderEventToolbar()}

            {renderEventsList()}

          </>

        )}


        {/* ===================================================
             MEDIA TAB
             =================================================== */}

        {activeTab === "media" && (

          <div className="admin-event-media-overview">

            <div className="admin-media-overview-header">

              <div>

                <span>
                  EVENT MEDIA
                </span>

                <h2>
                  Gallery, Videos & Documents
                </h2>

                <p>
                  Select an event below to manage its
                  gallery images, videos and documents.
                </p>

              </div>

            </div>


            {loading ? (

              <div className="admin-event-state">

                <RefreshCw
                  size={30}
                  className="admin-event-spin"
                />

                <h3>
                  Loading events...
                </h3>

              </div>

            ) : events.length === 0 ? (

              <div className="admin-event-state">

                <FolderOpen
                  size={35}
                />

                <h3>
                  No events available
                </h3>

                <p>
                  Create an event first to manage its media.
                </p>

              </div>

            ) : (

              <div className="admin-media-event-grid">

                {events.map(
                  (event) => {

                    const image =
                      getEventImage(
                        event
                      );

                    const galleryCount =
                      Number(
                        event.gallery_count ||
                        0
                      );

                    const videoCount =
                      Number(
                        event.video_count ||
                        0
                      );

                    const documentCount =
                      Number(
                        event.document_count ||
                        0
                      );


                    return (
                      <div
                        className="admin-media-event-card"
                        key={
                          event.id
                        }
                      >

                        {/* =================================
                             IMAGE
                             ================================= */}

                        <div className="admin-media-event-image">

                          {image ? (

                            <img
                              src={
                                image
                              }
                              alt={
                                getEventTitle(
                                  event
                                )
                              }
                            />

                          ) : (

                            <CalendarDays
                              size={30}
                            />

                          )}

                        </div>


                        {/* =================================
                             CONTENT
                             ================================= */}

                        <div className="admin-media-event-content">

                          <span>
                            {getEventType(
                              event
                            )}
                          </span>

                          <h3>
                            {getEventTitle(
                              event
                            )}
                          </h3>

                          <p>
                            {formatDate(
                              event.event_date
                            )}
                          </p>


                          {/* =================================
                               MEDIA COUNTS
                               ================================= */}

                          <div className="admin-media-event-counts">

                            <div>

                              <ImageIcon
                                size={13}
                              />

                              <span>
                                {galleryCount}
                              </span>

                              <small>
                                Gallery
                              </small>

                            </div>


                            <div>

                              <Video
                                size={13}
                              />

                              <span>
                                {videoCount}
                              </span>

                              <small>
                                Videos
                              </small>

                            </div>


                            <div>

                              <FileText
                                size={13}
                              />

                              <span>
                                {documentCount}
                              </span>

                              <small>
                                Documents
                              </small>

                            </div>

                          </div>


                          {/* =================================
                               MANAGE BUTTON
                               ================================= */}

                          <button
                            type="button"
                            className="admin-media-manage-btn"
                            onClick={() =>
                              openMediaManager(
                                event
                              )
                            }
                          >

                            <FolderOpen
                              size={14}
                            />

                            Manage Media

                          </button>

                        </div>

                      </div>
                    );

                  }
                )}

              </div>

            )}

          </div>

        )}

      </div>


      {/* ===================================================
           EVENT FORM MODAL
           =================================================== */}

      {renderEventForm()}


      {/* ===================================================
           MEDIA MANAGER MODAL
           =================================================== */}

      {renderMediaManager()}

    </div>
  );

}


// =========================================================
// EXPORT
// =========================================================

export default EventManagement;