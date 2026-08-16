import {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  IndianRupee,
  ArrowRight,
  Video,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  PlayCircle,
  Download,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Files,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import "./EventDetails.css";


// =========================================================
// CALCULATE STATUS USING IST
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

    const date =
      eventDate
        .toString()
        .slice(0, 10);

    const start =
      startTime
        ?.toString()
        .slice(0, 8) ||
      "00:00:00";

    const end =
      endTime
        ?.toString()
        .slice(0, 8) ||
      "23:59:59";

    const startDate =
      new Date(
        `${date}T${start}+05:30`
      );

    const endDate =
      new Date(
        `${date}T${end}+05:30`
      );

    const now =
      new Date();

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return "upcoming";
    }

    if (
      now < startDate
    ) {
      return "upcoming";
    }

    if (
      now >= startDate &&
      now <= endDate
    ) {
      return "ongoing";
    }

    return "past";

  } catch (error) {

    console.error(
      "Status calculation error:",
      error
    );

    return "upcoming";
  }
};


// =========================================================
// GET BACKEND ORIGIN
// =========================================================

const getBackendOrigin = () => {

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snict-backend.onrender.com/api";

  try {

    return new URL(
      apiUrl
    ).origin;

  } catch {

    return "https://snict-backend.onrender.com";
  }
};


// =========================================================
// MEDIA URL
// =========================================================

const getMediaUrl = (
  url
) => {

  if (!url) {
    return "";
  }

  const value =
    String(url).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {

    return value;
  }

  const backendOrigin =
    getBackendOrigin();

  if (
    value.startsWith("/")
  ) {

    return `${backendOrigin}${value}`;
  }

  return `${backendOrigin}/${value}`;
};


// =========================================================
// MEDIA ARRAY NORMALIZER
// =========================================================

const normalizeMediaArray = (
  value
) => {

  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value;
};


// =========================================================
// MEDIA ITEM URL
// =========================================================

const getMediaItemUrl = (
  item
) => {

  if (!item) {
    return "";
  }

  if (
    typeof item ===
    "string"
  ) {

    return getMediaUrl(
      item
    );
  }

  return getMediaUrl(
    item.url ||
    item.secure_url ||
    item.secureUrl ||
    item.file_url ||
    item.fileUrl ||
    item.path ||
    item.image_url ||
    item.imageUrl ||
    item.video_url ||
    item.videoUrl ||
    item.document_url ||
    item.documentUrl ||
    item.cloudinary_url ||
    item.cloudinaryUrl
  );
};


// =========================================================
// MEDIA ITEM NAME
// =========================================================

const getMediaItemName = (
  item,
  fallback = "Event Media"
) => {

  if (!item) {
    return fallback;
  }

  if (
    typeof item ===
    "string"
  ) {

    const parts =
      item.split("/");

    return (
      parts[
        parts.length - 1
      ] ||
      fallback
    );
  }

  return (
    item.name ||
    item.original_name ||
    item.originalName ||
    item.filename ||
    item.file_name ||
    item.fileName ||
    item.title ||
    item.public_id ||
    fallback
  );
};


// =========================================================
// FILE SIZE FORMATTER
// =========================================================

const formatFileSize = (
  bytes
) => {

  if (
    bytes === null ||
    bytes === undefined ||
    bytes === ""
  ) {
    return "";
  }

  const size =
    Number(bytes);

  if (
    Number.isNaN(size) ||
    size <= 0
  ) {
    return "";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let index = 0;
  let value = size;

  while (
    value >= 1024 &&
    index <
      units.length - 1
  ) {

    value =
      value / 1024;

    index++;
  }

  return `${value.toFixed(
    value >= 10 || index === 0
      ? 0
      : 1
  )} ${units[index]}`;
};


// =========================================================
// FILE EXTENSION
// =========================================================

const getFileExtension = (
  name
) => {

  if (!name) {
    return "";
  }

  const cleanName =
    String(name)
      .split("?")[0];

  const parts =
    cleanName.split(".");

  if (
    parts.length < 2
  ) {
    return "";
  }

  return (
    parts[
      parts.length - 1
    ] || ""
  ).toUpperCase();
};


// =========================================================
// DOCUMENT TYPE
// =========================================================

const getDocumentType = (
  item
) => {

  const name =
    getMediaItemName(
      item,
      "Document"
    );

  const extension =
    getFileExtension(
      name
    );

  if (
    extension === "PDF"
  ) {
    return "PDF";
  }

  if (
    extension === "DOC" ||
    extension === "DOCX"
  ) {
    return "WORD";
  }

  if (
    extension === "PPT" ||
    extension === "PPTX"
  ) {
    return "POWERPOINT";
  }

  return extension ||
    "DOCUMENT";
};


// =========================================================
// COMPONENT
// =========================================================

function EventDetails() {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();


  // =======================================================
  // EVENT STATE
  // =======================================================

  const [
    event,
    setEvent,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // =======================================================
  // MEDIA STATE
  // =======================================================

  const [
    gallery,
    setGallery,
  ] = useState([]);


  const [
    videos,
    setVideos,
  ] = useState([]);


  const [
    documents,
    setDocuments,
  ] = useState([]);


  const [
    mediaLoading,
    setMediaLoading,
  ] = useState(false);


  const [
    mediaError,
    setMediaError,
  ] = useState("");


  // =======================================================
  // GALLERY LIGHTBOX
  // =======================================================

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);


  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);


  // =======================================================
  // VIDEO MODAL
  // =======================================================

  const [
    videoModalOpen,
    setVideoModalOpen,
  ] = useState(false);


  const [
    activeVideo,
    setActiveVideo,
  ] = useState(null);


  // =========================================================
  // LOAD EVENT
  // =========================================================

  useEffect(() => {

    if (!id) {

      setError(
        "Invalid event."
      );

      setLoading(false);

      return;
    }

    loadEvent();

  }, [id]);


  // =========================================================
  // LOAD EVENT + MEDIA
  // =========================================================

  const loadEvent =
    async () => {

      try {

        setLoading(true);
        setError("");
        setMediaError("");
        setMediaLoading(true);

        /*
         * Load event and media separately.
         *
         * Public endpoints:
         *
         * GET /api/events/:id
         * GET /api/events/:id/media
         */

        const eventRequest =
          api.get(
            `/events/${id}`
          );

        const mediaRequest =
          api.get(
            `/events/${id}/media`
          );


        const [
          eventResponse,
          mediaResponse,
        ] = await Promise.allSettled([
          eventRequest,
          mediaRequest,
        ]);


        // ===================================================
        // EVENT RESPONSE
        // ===================================================

        if (
          eventResponse.status ===
          "rejected"
        ) {

          throw (
            eventResponse.reason
          );
        }


        const eventData =
          eventResponse.value
            ?.data;


        if (
          !eventData?.success ||
          !eventData?.event
        ) {

          setError(
            "Event not found."
          );

          return;
        }


        const backendEvent =
          eventData.event;


        // ===================================================
        // STATUS
        // ===================================================

        const status =
          calculateEventStatus(
            backendEvent.event_date,
            backendEvent.start_time,
            backendEvent.end_time
          );


        // ===================================================
        // EVENT-EMBEDDED MEDIA
        // ===================================================

        let eventGallery =
          normalizeMediaArray(
            backendEvent.gallery
          );

        let eventVideos =
          normalizeMediaArray(
            backendEvent.videos
          );

        let eventDocuments =
          normalizeMediaArray(
            backendEvent.documents
          );


        // ===================================================
        // MEDIA ENDPOINT
        // ===================================================

        if (
          mediaResponse.status ===
          "fulfilled"
        ) {

          const mediaResponseData =
            mediaResponse.value
              ?.data;


          /*
           * Support these possible
           * backend structures:
           *
           * {
           *   gallery: [],
           *   videos: [],
           *   documents: []
           * }
           *
           * OR
           *
           * {
           *   data: {
           *     gallery: [],
           *     videos: [],
           *     documents: []
           *   }
           * }
           *
           * OR
           *
           * {
           *   media: {
           *     gallery: [],
           *     videos: [],
           *     documents: []
           *   }
           * }
           *
           * OR
           *
           * {
           *   event: {
           *     gallery: [],
           *     videos: [],
           *     documents: []
           *   }
           * }
           */

          const mediaData =
            mediaResponseData
              ?.data ||
            mediaResponseData
              ?.media ||
            mediaResponseData
              ?.event ||
            mediaResponseData ||
            {};

          /*
           * Support one additional nested response shape:
           *
           * {
           *   success: true,
           *   data: {
           *     event: {
           *       gallery: [],
           *       videos: [],
           *       documents: []
           *     }
           *   }
           * }
           */
          const nestedMediaData =
            mediaData?.data ||
            mediaData?.media ||
            mediaData?.event ||
            mediaData ||
            {};


          if (
            Array.isArray(
              nestedMediaData.gallery
            )
          ) {

            eventGallery =
              nestedMediaData.gallery;
          }


          if (
            Array.isArray(
              nestedMediaData.videos
            )
          ) {

            eventVideos =
              nestedMediaData.videos;
          }


          if (
            Array.isArray(
              nestedMediaData.documents
            )
          ) {

            eventDocuments =
              nestedMediaData.documents;
          }


          /*
           * Some backends may return
           * images instead of gallery.
           */

          if (
            eventGallery.length === 0 &&
            Array.isArray(
              nestedMediaData.images
            )
          ) {

            eventGallery =
              nestedMediaData.images;
          }


          /*
           * Some backends may return
           * files instead of documents.
           */

          if (
            eventDocuments.length === 0 &&
            Array.isArray(
              nestedMediaData.files
            )
          ) {

            eventDocuments =
              nestedMediaData.files;
          }


        } else {

          console.warn(
            "Event media endpoint unavailable:",
            mediaResponse.reason
          );

          /*
           * Do NOT fail the whole event page
           * when media endpoint fails.
           *
           * Event itself can still load.
           */

          setMediaError(
            "Event media could not be loaded."
          );
        }


        // ===================================================
        // SET MEDIA
        // ===================================================

        setGallery(
          eventGallery
        );

        setVideos(
          eventVideos
        );

        setDocuments(
          eventDocuments
        );


        // ===================================================
        // SET EVENT
        // ===================================================

        setEvent({

          ...backendEvent,

          status,

          gallery:
            eventGallery,

          videos:
            eventVideos,

          documents:
            eventDocuments,

        });


      } catch (error) {

        console.error(
          "Event details error:",
          error
        );


        console.error(
          "Event details response:",
          error.response?.data
        );


        if (
          error.response?.status ===
          404
        ) {

          setError(
            "This event could not be found."
          );

        } else {

          setError(
            error.response?.data?.message ||
            "Unable to load event."
          );
        }


      } finally {

        setLoading(false);
        setMediaLoading(false);

      }
    };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate =
    (date) => {

      if (!date) {
        return "Date not available";
      }


      const value =
        date
          .toString()
          .slice(0, 10);


      const parts =
        value.split("-");


      if (
        parts.length !== 3
      ) {

        return value;
      }


      const [
        year,
        month,
        day,
      ] = parts;


      const dateObject =
        new Date(
          Number(year),
          Number(month) - 1,
          Number(day)
        );


      return dateObject.toLocaleDateString(
        "en-IN",
        {
          weekday:
            "long",

          day:
            "2-digit",

          month:
            "long",

          year:
            "numeric",
        }
      );
    };


  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime =
    (time) => {

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
  // GALLERY IMAGE URL
  // =========================================================

  const getGalleryImageUrl =
    (item) => {

      return getMediaItemUrl(
        item
      );
    };


  // =========================================================
  // OPEN LIGHTBOX
  // =========================================================

  const openLightbox =
    (index) => {

      if (
        gallery.length === 0
      ) {
        return;
      }


      setActiveImageIndex(
        index
      );

      setLightboxOpen(
        true
      );
    };


  // =========================================================
  // CLOSE LIGHTBOX
  // =========================================================

  const closeLightbox =
    () => {

      setLightboxOpen(
        false
      );
    };


  // =========================================================
  // PREVIOUS IMAGE
  // =========================================================

  const previousImage =
    useCallback(() => {

      if (
        gallery.length === 0
      ) {
        return;
      }


      setActiveImageIndex(
        (current) =>
          current === 0
            ? gallery.length - 1
            : current - 1
      );

    }, [gallery.length]);


  // =========================================================
  // NEXT IMAGE
  // =========================================================

  const nextImage =
    useCallback(() => {

      if (
        gallery.length === 0
      ) {
        return;
      }


      setActiveImageIndex(
        (current) =>
          current ===
          gallery.length - 1
            ? 0
            : current + 1
      );

    }, [gallery.length]);


  // =========================================================
  // KEYBOARD CONTROLS
  // =========================================================

  useEffect(() => {

    if (
      !lightboxOpen &&
      !videoModalOpen
    ) {

      return;
    }


    const handleKeyDown =
      (event) => {

        if (
          event.key ===
          "Escape"
        ) {

          setLightboxOpen(
            false
          );

          setVideoModalOpen(
            false
          );

          setActiveVideo(
            null
          );

          return;
        }


        if (
          lightboxOpen &&
          event.key ===
          "ArrowLeft"
        ) {

          previousImage();
        }


        if (
          lightboxOpen &&
          event.key ===
          "ArrowRight"
        ) {

          nextImage();
        }
      };


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    lightboxOpen,
    videoModalOpen,
    previousImage,
    nextImage,
  ]);


  // =========================================================
  // OPEN VIDEO
  // =========================================================

  const openVideo =
    (video) => {

      const url =
        getMediaItemUrl(
          video
        );


      if (!url) {

        alert(
          "Video URL is not available."
        );

        return;
      }


      setActiveVideo(
        video
      );

      setVideoModalOpen(
        true
      );
    };


  // =========================================================
  // CLOSE VIDEO
  // =========================================================

  const closeVideo =
    () => {

      setVideoModalOpen(
        false
      );

      setActiveVideo(
        null
      );
    };


  // =========================================================
  // EVENT REGISTRATION
  // =========================================================
  //
  // The event details page no longer creates a booking.
  //
  // New flow:
  //
  // Event Details
  //      ↓
  // Register for Event
  //      ↓
  // Event Registration Preview
  //      ↓
  // Optional PDF / PPT / PPTX
  //      ↓
  // Payment
  //
  // =========================================================

  const handleRegistration = () => {

    if (!event) {
      return;
    }


    // -------------------------------------------------------
    // PAST EVENT
    // -------------------------------------------------------

    if (
      event.status ===
      "past"
    ) {

      alert(
        "Registration for this event is closed."
      );

      return;
    }


    // -------------------------------------------------------
    // ONGOING EVENT
    // -------------------------------------------------------

    if (
      event.status ===
      "ongoing"
    ) {

      alert(
        "Registration is closed because this event is currently ongoing."
      );

      return;
    }


    // -------------------------------------------------------
    // REGISTRATION DISABLED
    // -------------------------------------------------------

    if (
      event.booking_enabled !==
      true
    ) {

      alert(
        "Registration is currently unavailable for this event."
      );

      return;
    }


    // -------------------------------------------------------
    // AVAILABLE SLOTS
    // -------------------------------------------------------

    const availableSlots =
      event.available_slots !==
        null &&
      event.available_slots !==
        undefined
        ? Number(
            event.available_slots
          )
        : null;


    if (
      availableSlots !==
        null &&
      availableSlots <=
        0
    ) {

      alert(
        "This event is fully booked."
      );

      return;
    }


    // -------------------------------------------------------
    // OPEN EVENT REGISTRATION PAGE
    // -------------------------------------------------------

    navigate(
      `/events/registration/${id}`,
      {
        state: {
          eventId:
            event.id || id,

          eventTitle:
            event.title,

          eventPrice:
            Number(
              event.price || 0
            ),
        },
      }
    );
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading
  ) {

    return (

      <main
        className="event-details-page"
      >

        <div
          className="event-details-loading"
        >

          <div
            className="event-details-spinner"
          />

          <p>
            Loading event...
          </p>

        </div>

      </main>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (
    error ||
    !event
  ) {

    return (

      <main
        className="event-details-page"
      >

        <div
          className="event-details-error"
        >

          <div
            className="event-error-icon"
          >

            <AlertCircle
              size={30}
            />

          </div>


          <span>
            SNICT EVENTS
          </span>


          <h1>
            Event Not Found
          </h1>


          <p>
            {error ||
              "The requested event is not available."}
          </p>


          <Link
            to="/events"
            className="event-error-back"
          >

            <ArrowLeft
              size={17}
            />

            Back to Events

          </Link>

        </div>

      </main>
    );
  }


  // =========================================================
  // EVENT INFORMATION
  // =========================================================

  const eventPrice =
    Number(
      event.price || 0
    );


  const isPast =
    event.status ===
    "past";


  const isOngoing =
    event.status ===
    "ongoing";


  const isUpcoming =
    event.status ===
    "upcoming";


  const bookingEnabled =
    event.booking_enabled ===
    true;


  const maxSlots =
    event.max_slots !==
      null &&
    event.max_slots !==
      undefined
      ? Number(
          event.max_slots
        )
      : null;


  const availableSlots =
    event.available_slots !==
      null &&
    event.available_slots !==
      undefined
      ? Number(
          event.available_slots
        )
      : null;


  const isFull =
    availableSlots !==
      null &&
    availableSlots <= 0;


  // =========================================================
  // ACTIVE LIGHTBOX IMAGE
  // =========================================================

  const activeImage =
    gallery[
      activeImageIndex
    ];


  const activeImageUrl =
    activeImage
      ? getGalleryImageUrl(
          activeImage
        )
      : "";


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main
      className="event-details-page"
    >

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="event-details-hero"
      >

        <div
          className="event-details-hero-background"
        >

          <div />
          <div />

        </div>


        {/* IMAGE */}

        <div
          className="event-details-image"
        >

          {event.image_url ? (

            <img
              src={
                getMediaUrl(
                  event.image_url
                )
              }
              alt={
                event.title
              }

              onError={(e) => {

                e.currentTarget.style.display =
                  "none";

                e.currentTarget.parentElement.classList.add(
                  "image-error"
                );

              }}
            />

          ) : (

            <div
              className="event-details-image-placeholder"
            >

              <CalendarDays
                size={70}
              />

            </div>

          )}

        </div>


        {/* INTRO */}

        <div
          className="event-details-intro"
        >

          <div
            className="event-details-badges"
          >

            <span
              className={`event-details-status ${event.status}`}
            >

              <span />

              {event.status}

            </span>


            <span
              className="event-details-type"
            >

              {event.event_type ||
                "EVENT"}

            </span>

          </div>


          <h1>
            {event.title}
          </h1>


          {event.doctor_name && (

            <div
              className="event-details-doctor"
            >

              <div
                className="event-doctor-icon"
              >

                <UserRound
                  size={19}
                />

              </div>


              <div>

                <strong>
                  {event.doctor_name}
                </strong>


                {event.specialization && (

                  <span>
                    {event.specialization}
                  </span>

                )}

              </div>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section
        className="event-details-container"
      >

        {/* ===================================================
            LEFT CONTENT
        =================================================== */}

        <div
          className="event-details-main"
        >

          {/* OVERVIEW */}

          <section
            className="event-description"
          >

            <span
              className="event-section-label"
            >
              ABOUT THE EVENT
            </span>


            <h2>
              Event Overview
            </h2>


            <p>
              {event.description ||
                "SNICT professional learning and cardiovascular education programme."}
            </p>

          </section>


          {/* EVENT INFORMATION */}

          <section
            className="event-info-grid"
          >

            {/* DATE */}

            <div
              className="event-info-card"
            >

              <div
                className="event-info-icon"
              >

                <CalendarDays
                  size={20}
                />

              </div>


              <span>
                DATE
              </span>


              <strong>
                {formatDate(
                  event.event_date
                )}
              </strong>

            </div>


            {/* TIME */}

            <div
              className="event-info-card"
            >

              <div
                className="event-info-icon"
              >

                <Clock3
                  size={20}
                />

              </div>


              <span>
                TIME
              </span>


              <strong>

                {formatTime(
                  event.start_time
                )}

                {" - "}

                {formatTime(
                  event.end_time
                )}

              </strong>

            </div>


            {/* VENUE */}

            <div
              className="event-info-card"
            >

              <div
                className="event-info-icon"
              >

                {event.event_mode ===
                "online" ? (

                  <Video
                    size={20}
                  />

                ) : (

                  <MapPin
                    size={20}
                  />

                )}

              </div>


              <span>

                {event.event_mode ===
                "online"
                  ? "MODE"
                  : "VENUE"}

              </span>


              <strong>

                {event.venue ||
                  event.event_mode ||
                  "Not specified"}

              </strong>

            </div>

          </section>


          {/* EXTRA INFORMATION */}

          <section
            className="event-extra-info"
          >

            <div
              className="event-extra-item"
            >

              <span>
                EVENT MODE
              </span>


              <strong>

                {event.event_mode ===
                "online"
                  ? "Online"
                  : event.event_mode ===
                    "hybrid"
                  ? "Hybrid"
                  : "Offline"}

              </strong>

            </div>


            {event.doctor_name && (

              <div
                className="event-extra-item"
              >

                <span>
                  EXPERT
                </span>


                <strong>
                  {event.doctor_name}
                </strong>

              </div>

            )}


            {event.specialization && (

              <div
                className="event-extra-item"
              >

                <span>
                  SPECIALIZATION
                </span>


                <strong>
                  {event.specialization}
                </strong>

              </div>

            )}

          </section>


          {/* CAPACITY */}

          {maxSlots !==
            null && (

            <section
              className="event-capacity-card"
            >

              <div
                className="event-capacity-icon"
              >

                <Users
                  size={21}
                />

              </div>


              <div>

                <span>
                  PARTICIPATION
                </span>


                <strong>

                  {availableSlots !==
                  null
                    ? `${availableSlots} seats available`
                    : `${maxSlots} participants maximum`}

                </strong>

              </div>

            </section>

          )}


          {/* =================================================
              EVENT MEDIA
          ================================================= */}

          <section
            className="event-media-section"
          >

            <div
              className="event-media-header"
            >

              <div
                className="event-media-title"
              >

                <Files
                  size={20}
                />

                <span>
                  Event Media
                </span>

              </div>


              <div
                className="event-media-count"
              >

                {gallery.length +
                  videos.length +
                  documents.length}

              </div>

            </div>


            {/* MEDIA ERROR */}

            {mediaError && (
              <div
                className="event-media-error"
              >

                <AlertCircle
                  size={16}
                />

                <span>
                  {mediaError}
                </span>

              </div>
            )}


            {/* MEDIA LOADING */}

            {mediaLoading && (

              <div
                className="event-media-empty"
              >

                <div
                  className="event-details-spinner"
                />

                <strong>
                  Loading event media...
                </strong>

              </div>

            )}


            {/* =================================================
                GALLERY
            ================================================= */}

            {!mediaLoading &&
              gallery.length >
                0 && (

              <div
                className="event-media-block"
              >

                <div
                  className="event-media-block-header"
                >

                  <div>

                    <ImageIcon
                      size={17}
                    />

                    <strong>
                      Gallery
                    </strong>

                  </div>


                  <span>
                    {gallery.length}
                    {" "}
                    Photos
                  </span>

                </div>


                <div
                  className="event-media-grid"
                >

                  {gallery.map(
                    (
                      image,
                      index
                    ) => {

                      const imageUrl =
                        getGalleryImageUrl(
                          image
                        );


                      if (
                        !imageUrl
                      ) {
                        return null;
                      }


                      return (

                        <button
                          type="button"
                          key={
                            image.id ||
                            image.public_id ||
                            imageUrl ||
                            index
                          }
                          className="event-gallery-item"
                          onClick={() =>
                            openLightbox(
                              index
                            )
                          }
                        >

                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              getMediaItemName(
                                image,
                                `Event Gallery ${index + 1}`
                              )
                            }
                            loading="lazy"
                          />


                          <span
                            className="event-gallery-overlay"
                          >

                            <ImageIcon
                              size={27}
                            />

                          </span>

                        </button>

                      );

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                VIDEOS
            ================================================= */}

            {!mediaLoading &&
              videos.length >
                0 && (

              <div
                className="event-media-block"
              >

                <div
                  className="event-media-block-header"
                >

                  <div>

                    <PlayCircle
                      size={17}
                    />

                    <strong>
                      Videos
                    </strong>

                  </div>


                  <span>
                    {videos.length}
                    {" "}
                    Videos
                  </span>

                </div>


                <div
                  className="event-video-grid"
                >

                  {videos.map(
                    (
                      video,
                      index
                    ) => {

                      const videoUrl =
                        getMediaItemUrl(
                          video
                        );


                      if (
                        !videoUrl
                      ) {
                        return null;
                      }


                      return (

                        <article
                          key={
                            video.id ||
                            video.public_id ||
                            videoUrl ||
                            index
                          }
                          className="event-video-card"
                        >

                          <div
                            className="event-video-preview"
                          >

                            <video
                              src={
                                videoUrl
                              }
                              preload="metadata"
                              controls
                              playsInline
                            />

                            <button
                              type="button"
                              className="event-video-play"
                              onClick={() =>
                                openVideo(
                                  video
                                )
                              }
                              aria-label="Open video"
                            >

                              <PlayCircle
                                size={42}
                              />

                            </button>

                          </div>


                          <div
                            className="event-video-info"
                          >

                            <h4>

                              {getMediaItemName(
                                video,
                                `Event Video ${index + 1}`
                              )}

                            </h4>


                            {video.size && (

                              <p>
                                {formatFileSize(
                                  video.size
                                )}
                              </p>

                            )}

                          </div>

                        </article>

                      );

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                DOCUMENTS
            ================================================= */}

            {!mediaLoading &&
              documents.length >
                0 && (

              <div
                className="event-media-block"
              >

                <div
                  className="event-media-block-header"
                >

                  <div>

                    <FileText
                      size={17}
                    />

                    <strong>
                      Documents
                    </strong>

                  </div>


                  <span>
                    {documents.length}
                    {" "}
                    Files
                  </span>

                </div>


                <div
                  className="event-document-list"
                >

                  {documents.map(
                    (
                      document,
                      index
                    ) => {

                      const documentUrl =
                        getMediaItemUrl(
                          document
                        );


                      if (
                        !documentUrl
                      ) {
                        return null;
                      }


                      const name =
                        getMediaItemName(
                          document,
                          `Event Document ${index + 1}`
                        );


                      const type =
                        getDocumentType(
                          document
                        );


                      return (

                        <div
                          key={
                            document.id ||
                            document.public_id ||
                            documentUrl ||
                            index
                          }
                          className="event-document-item"
                        >

                          <div
                            className="event-document-icon"
                          >

                            <FileText
                              size={20}
                            />

                          </div>


                          <div
                            className="event-document-info"
                          >

                            <strong>
                              {name}
                            </strong>


                            <span>

                              {type}

                              {document.size &&
                                ` • ${formatFileSize(
                                  document.size
                                )}`}

                            </span>

                          </div>


                          <a
                            href={
                              documentUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-document-btn"
                          >

                            <ExternalLink
                              size={14}
                            />

                            <span>
                              Open
                            </span>

                          </a>


                          <a
                            href={
                              documentUrl
                            }
                            download
                            className="event-document-btn"
                          >

                            <Download
                              size={14}
                            />

                            <span>
                              Download
                            </span>

                          </a>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            )}


            {/* =================================================
                NO MEDIA
            ================================================= */}

            {!mediaLoading &&
              gallery.length ===
                0 &&
              videos.length ===
                0 &&
              documents.length ===
                0 && (

              <div
                className="event-media-empty"
              >

                <Files
                  size={32}
                />

                <strong>
                  No event media available
                </strong>

                <span>
                  Gallery images, videos and documents
                  will appear here when added by the admin.
                </span>

              </div>

            )}

          </section>

        </div>


        {/* ===================================================
            BOOKING CARD
        =================================================== */}

        <aside
          className="event-booking-card"
        >

          <div
            className="booking-card-label"
          >
            REGISTRATION
          </div>


          {/* PRICE */}

          <div
            className="event-booking-price"
          >

            {eventPrice > 0 ? (

              <>

                <IndianRupee
                  size={27}
                />

                <strong>

                  {eventPrice.toLocaleString(
                    "en-IN"
                  )}

                </strong>

              </>

            ) : (

              <strong>
                FREE
              </strong>

            )}

          </div>


          <span
            className="booking-price-note"
          >

            {eventPrice > 0
              ? "Registration fee"
              : "No registration fee"}

          </span>


          {/* CAPACITY */}

          {maxSlots !==
            null && (

            <div
              className="booking-capacity"
            >

              <Users
                size={16}
              />

              <span>

                {availableSlots !==
                null
                  ? `${availableSlots} of ${maxSlots} seats available`
                  : `Limited to ${maxSlots} participants`}

              </span>

            </div>

          )}


          {/* BOOKING STATUS */}

          {isPast ? (

            <div
              className="booking-closed-message"
            >

              <AlertCircle
                size={18}
              />

              <span>
                Registration closed
              </span>

            </div>

          ) : isOngoing ? (

            <div
              className="booking-closed-message"
            >

              <Clock3
                size={18}
              />

              <span>
                Event is currently ongoing
              </span>

            </div>

          ) : !bookingEnabled ? (

            <div
              className="booking-closed-message"
            >

              <AlertCircle
                size={18}
              />

              <span>
                Registration unavailable
              </span>

            </div>

          ) : isFull ? (

            <div
              className="booking-closed-message"
            >

              <Users
                size={18}
              />

              <span>
                Event fully booked
              </span>

            </div>

          ) : (

            <button
              type="button"
              className="event-book-btn event-registration-btn"
              onClick={
                handleRegistration
              }
            >

              <span>
                Register for Event
              </span>

              <ArrowRight
                size={18}
              />

            </button>

          )}


          {/* LOGIN NOTE */}

          {isUpcoming &&
            bookingEnabled &&
            !isFull && (

            <div
              className="booking-login-note"
            >

              {/* <CheckCircle2
                size={16}
              />

              <span>

                Login is required
                to complete
                registration.

              </span> */}

            </div>

          )}


          {/* BACK */}

          <Link
            to="/events"
            className="back-events-link"
          >

            <ArrowLeft
              size={16}
            />

            Back to Events

          </Link>

        </aside>

      </section>


      {/* =====================================================
          IMAGE LIGHTBOX
      ===================================================== */}

      {lightboxOpen &&
        activeImageUrl && (

        <div
          className="event-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={
            closeLightbox
          }
        >

          <div
            className="event-lightbox-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="event-lightbox-close"
              onClick={
                closeLightbox
              }
              aria-label="Close gallery"
            >

              <X
                size={21}
              />

            </button>


            {gallery.length >
              1 && (

              <button
                type="button"
                className="event-lightbox-nav event-lightbox-prev"
                onClick={
                  previousImage
                }
                aria-label="Previous image"
              >

                <ChevronLeft
                  size={28}
                />

              </button>

            )}


            <img
              src={
                activeImageUrl
              }
              alt={
                getMediaItemName(
                  activeImage,
                  "Event Gallery"
                )
              }
            />


            {gallery.length >
              1 && (

              <button
                type="button"
                className="event-lightbox-nav event-lightbox-next"
                onClick={
                  nextImage
                }
                aria-label="Next image"
              >

                <ChevronRight
                  size={28}
                />

              </button>

            )}


            {gallery.length >
              1 && (

              <div
                className="event-lightbox-counter"
              >

                {activeImageIndex + 1}
                {" / "}
                {gallery.length}

              </div>

            )}

          </div>

        </div>

      )}


      {/* =====================================================
          VIDEO MODAL
      ===================================================== */}

      {videoModalOpen &&
        activeVideo && (

        <div
          className="event-video-modal"
          role="dialog"
          aria-modal="true"
          onClick={
            closeVideo
          }
        >

          <div
            className="event-video-modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="event-lightbox-close"
              onClick={
                closeVideo
              }
              aria-label="Close video"
            >

              <X
                size={21}
              />

            </button>


            <video
              src={
                getMediaItemUrl(
                  activeVideo
                )
              }
              controls
              autoPlay
              playsInline
            />

          </div>

        </div>

      )}

    </main>
  );
}


export default EventDetails;