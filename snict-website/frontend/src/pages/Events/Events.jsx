import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  ArrowRight,
  Search,
  IndianRupee,
  UserRound,
  Video,
  Image,
  FileText,
  PlayCircle,
  Files,
} from "lucide-react";

import api from "../../services/api";

import "./Events.css";


// =========================================================
// CALCULATE EVENT STATUS
// IST = UTC +05:30
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


    /*
     * Explicitly use IST.
     */

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
// BACKEND ORIGIN
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

    return "https://snict-backend.onrender.com/";
  }
};


// =========================================================
// IMAGE / MEDIA URL HELPER
// =========================================================
//
// Supports:
//
// https://...
// http://...
// blob:...
// data:...
// /uploads/...
// uploads/...
//
// Cloudinary URLs are returned unchanged.
// =========================================================

const getEventImageUrl = (
  imageUrl
) => {

  if (!imageUrl) {
    return "";
  }

  const value =
    String(imageUrl).trim();

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


  if (value.startsWith("/")) {

    return `${backendOrigin}${value}`;
  }


  return `${backendOrigin}/${value}`;
};


// =========================================================
// GENERIC MEDIA URL HELPER
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


  if (value.startsWith("/")) {

    return `${backendOrigin}${value}`;
  }


  return `${backendOrigin}/${value}`;
};


// =========================================================
// GET EVENT MEDIA ARRAY
// =========================================================
//
// Supports multiple possible backend field names
// so the frontend remains compatible with the
// existing event API.
// =========================================================

const getMediaArray = (
  event,
  type
) => {

  if (!event) {
    return [];
  }


  if (type === "gallery") {

    const gallery =
      event.gallery ||
      event.images ||
      event.gallery_images ||
      event.galleryImages ||
      [];

    return Array.isArray(
      gallery
    )
      ? gallery
      : [];
  }


  if (type === "videos") {

    const videos =
      event.videos ||
      event.event_videos ||
      event.eventVideos ||
      [];

    return Array.isArray(
      videos
    )
      ? videos
      : [];
  }


  if (type === "documents") {

    const documents =
      event.documents ||
      event.event_documents ||
      event.eventDocuments ||
      [];

    return Array.isArray(
      documents
    )
      ? documents
      : [];
  }


  return [];
};


// =========================================================
// GET MEDIA ITEM URL
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
    item.documentUrl
  );
};


// =========================================================
// GET MEDIA ITEM NAME
// =========================================================

const getMediaItemName = (
  item
) => {

  if (!item) {
    return "Event Media";
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
      "Event Media"
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
    "Event Media"
  );
};


// =========================================================
// GET FILE EXTENSION
// =========================================================

const getFileExtension = (
  name
) => {

  if (!name) {
    return "";
  }


  const parts =
    String(name).split(".");


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
// GET MEDIA COUNT
// =========================================================

const getEventMediaCount = (
  event
) => {

  const gallery =
    getMediaArray(
      event,
      "gallery"
    );

  const videos =
    getMediaArray(
      event,
      "videos"
    );

  const documents =
    getMediaArray(
      event,
      "documents"
    );


  return (
    gallery.length +
    videos.length +
    documents.length
  );
};


// =========================================================
// COMPONENT
// =========================================================

function Events() {

  const [
    events,
    setEvents
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const [
    search,
    setSearch
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter
  ] = useState("all");


  const [
    typeFilter,
    setTypeFilter
  ] = useState("all");


  // =========================================================
  // OPEN EVENT
  // =========================================================
  //
  // Login is NOT required on this page.
  //
  // Clicking View Event directly opens the event details.
  // =========================================================

  const handleEventClick = (
    event
  ) => {

    if (!event?.id) {
      return;
    }

    window.location.href =
      `/events/${event.id}`;
  };


  // =========================================================
  // LOAD EVENTS
  // =========================================================

  useEffect(() => {

    loadEvents();

  }, []);


  const loadEvents =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            "/events"
          );


        const backendEvents =
          response.data?.events ||
          response.data?.data ||
          [];


        /*
         * Normalize all event data on frontend.
         *
         * This also preserves:
         *
         * gallery
         * videos
         * documents
         */

        const normalizedEvents =
          backendEvents.map(
            (event) => {

              const gallery =
                getMediaArray(
                  event,
                  "gallery"
                );


              const videos =
                getMediaArray(
                  event,
                  "videos"
                );


              const documents =
                getMediaArray(
                  event,
                  "documents"
                );


              return {

                ...event,


                status:
                  calculateEventStatus(
                    event.event_date,
                    event.start_time,
                    event.end_time
                  ),


                gallery,

                videos,

                documents,


                mediaCounts: {

                  gallery:
                    gallery.length,

                  videos:
                    videos.length,

                  documents:
                    documents.length,

                  total:
                    gallery.length +
                    videos.length +
                    documents.length,

                },

              };

            }
          );


        setEvents(
          normalizedEvents
        );

      } catch (error) {

        console.error(
          "Events loading error:",
          error
        );


        setError(
          error.response?.data?.message ||
          "Unable to load events."
        );

      } finally {

        setLoading(false);
      }
    };


  // =========================================================
  // EVENT TYPES
  // =========================================================

  const eventTypes =
    useMemo(() => {

      return [
        ...new Set(
          events
            .map(
              (event) =>
                event.event_type
            )
            .filter(Boolean)
        ),
      ];

    }, [events]);


  // =========================================================
  // FILTER EVENTS
  // =========================================================

  const filteredEvents =
    useMemo(() => {

      return events.filter(
        (event) => {

          const searchText =
            search
              .trim()
              .toLowerCase();


          const matchesSearch =
            !searchText ||
            event.title
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            event.doctor_name
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            event.specialization
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            event.event_type
              ?.toLowerCase()
              .includes(
                searchText
              );


          const matchesStatus =
            statusFilter ===
              "all" ||
            event.status ===
              statusFilter;


          const matchesType =
            typeFilter ===
              "all" ||
            event.event_type ===
              typeFilter;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );

    }, [
      events,
      search,
      statusFilter,
      typeFilter,
    ]);


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "";
    }


    /*
     * Don't use:
     *
     * new Date("2026-08-13")
     *
     * because date-only values can
     * cause timezone problems.
     */

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

    <main className="events-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="events-hero">

        <div className="events-hero-glow"></div>

        <div className="events-hero-content">

          <span className="events-label">
            SNICT EVENTS & CME
          </span>

          <h1>
            Learn.
            <span> Connect.</span>
            <br />
            Advance.
          </h1>

          <p>
            Explore professional meetings,
            cardiovascular education programs
            and expert-led learning
            opportunities.
          </p>

        </div>

      </section>


      {/* =====================================================
          FILTER SECTION
      ===================================================== */}

      <section className="events-filter-section">

        <div className="events-filter-container">

          {/* SEARCH */}

          <div className="events-search">

            <Search
              size={18}
            />

            <input
              type="text"
              placeholder="Search events, doctors..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          {/* STATUS FILTER */}

          <div className="events-filter-group">

            <button
              type="button"
              className={
                statusFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("all")
              }
            >
              All
            </button>


            <button
              type="button"
              className={
                statusFilter === "upcoming"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("upcoming")
              }
            >
              Upcoming
            </button>


            <button
              type="button"
              className={
                statusFilter === "ongoing"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("ongoing")
              }
            >
              Ongoing
            </button>


            <button
              type="button"
              className={
                statusFilter === "past"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("past")
              }
            >
              Past
            </button>

          </div>


          {/* EVENT TYPE */}

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              All Event Types
            </option>


            {eventTypes.map(
              (type) => (

                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>

              )
            )}

          </select>

        </div>

      </section>


      {/* =====================================================
          EVENTS LIST
      ===================================================== */}

      <section className="events-list-section">

        <div className="events-list-container">

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="events-state">

              <CalendarDays
                size={35}
              />

              <p>
                Loading events...
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading &&
            error && (

              <div className="events-state error">

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadEvents}
                >
                  Try Again
                </button>

              </div>

            )}


          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            filteredEvents.length === 0 && (

              <div className="events-state">

                <CalendarDays
                  size={40}
                />

                <h3>
                  No events found
                </h3>

                <p>
                  Try changing your
                  search or filters.
                </p>

              </div>

            )}


          {/* =================================================
              EVENT CARDS
          ================================================= */}

          {!loading &&
            !error &&
            filteredEvents.map(
              (event) => (

                <article
                  className="event-card"
                  key={event.id}
                >

                  {/* =========================================
                      EVENT IMAGE
                  ========================================= */}

                  <div className="event-image">

                    {getEventImageUrl(
                      event.image_url ||
                      event.imageUrl ||
                      event.image ||
                      event.photo_url ||
                      event.photoUrl
                    ) ? (

                      <img
                        src={
                          getEventImageUrl(
                            event.image_url ||
                            event.imageUrl ||
                            event.image ||
                            event.photo_url ||
                            event.photoUrl
                          )
                        }
                        alt={
                          event.title ||
                          "SNICT Event"
                        }
                        loading="lazy"
                        onError={(e) => {

                          e.currentTarget.style.display =
                            "none";


                          const placeholder =
                            e.currentTarget
                              .parentElement
                              ?.querySelector(
                                ".event-image-placeholder"
                              );


                          if (
                            placeholder
                          ) {

                            placeholder.style.display =
                              "flex";

                          }

                        }}
                      />

                    ) : (

                      <div className="event-image-placeholder">

                        <CalendarDays
                          size={42}
                        />

                      </div>

                    )}


                    {/* FALLBACK */}

                    <div
                      className="event-image-placeholder"
                      style={{
                        display: "none",
                      }}
                    >

                      <CalendarDays
                        size={42}
                      />

                    </div>


                    {/* EVENT STATUS */}

                    <span
                      className={`event-status ${event.status}`}
                    >
                      {event.status}
                    </span>

                  </div>


                  {/* =========================================
                      EVENT CONTENT
                  ========================================= */}

                  <div className="event-card-content">

                    {/* EVENT TYPE */}

                    <span className="event-type">

                      {event.event_type ||
                        "EVENT"}

                    </span>


                    {/* EVENT TITLE */}

                    <h2>
                      {event.title}
                    </h2>


                    {/* DOCTOR */}

                    {event.doctor_name && (

                      <div className="event-doctor">

                        <UserRound
                          size={16}
                        />

                        <span>

                          {event.doctor_name}

                          {event.specialization &&
                            ` • ${event.specialization}`}

                        </span>

                      </div>

                    )}


                    {/* DESCRIPTION */}

                    <p>

                      {event.description ||
                        "Professional learning opportunity organised by SNICT."}

                    </p>


                    {/* =====================================
                        EVENT META
                    ===================================== */}

                    <div className="event-meta">

                      {/* DATE */}

                      <span>

                        <CalendarDays
                          size={16}
                        />

                        {formatDate(
                          event.event_date
                        )}

                      </span>


                      {/* TIME */}

                      <span>

                        <Clock3
                          size={16}
                        />

                        {formatTime(
                          event.start_time
                        )}

                        {event.end_time &&
                          ` - ${formatTime(
                            event.end_time
                          )}`}

                      </span>


                      {/* VENUE */}

                      {event.venue && (

                        <span>

                          {event.event_mode ===
                          "online" ? (

                            <Video
                              size={16}
                            />

                          ) : (

                            <MapPin
                              size={16}
                            />

                          )}

                          {event.venue}

                        </span>

                      )}

                    </div>


                    {/* =====================================
                        MEDIA SUMMARY
                    ===================================== */}

                    {getEventMediaCount(
                      event
                    ) > 0 && (

                      <div className="event-media-summary">

                        {/* GALLERY */}

                        {getMediaArray(
                          event,
                          "gallery"
                        ).length > 0 && (

                          <span>

                            <Image
                              size={14}
                            />

                            {
                              getMediaArray(
                                event,
                                "gallery"
                              ).length
                            }

                            {" "}
                            Photos

                          </span>

                        )}


                        {/* VIDEOS */}

                        {getMediaArray(
                          event,
                          "videos"
                        ).length > 0 && (

                          <span>

                            <PlayCircle
                              size={14}
                            />

                            {
                              getMediaArray(
                                event,
                                "videos"
                              ).length
                            }

                            {" "}
                            Videos

                          </span>

                        )}


                        {/* DOCUMENTS */}

                        {getMediaArray(
                          event,
                          "documents"
                        ).length > 0 && (

                          <span>

                            <FileText
                              size={14}
                            />

                            {
                              getMediaArray(
                                event,
                                "documents"
                              ).length
                            }

                            {" "}
                            Documents

                          </span>

                        )}

                      </div>

                    )}


                    {/* =====================================
                        CARD BOTTOM
                    ===================================== */}

                    <div className="event-card-bottom">

                      {/* PRICE */}

                      <div className="event-price">

                        {Number(
                          event.price
                        ) > 0 ? (

                          <>

                            <IndianRupee
                              size={16}
                            />

                            {Number(
                              event.price
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </>

                        ) : (

                          "FREE"

                        )}

                      </div>


                      {/* VIEW EVENT */}

                      <button
                        type="button"
                        className="event-view-btn"
                        onClick={() =>
                          handleEventClick(
                            event
                          )
                        }
                      >

                        View Event

                        <ArrowRight
                          size={16}
                        />

                      </button>

                    </div>

                  </div>

                </article>

              )
            )}

        </div>

      </section>

    </main>
  );
}


// =========================================================
// EXPORT
// =========================================================

export default Events;