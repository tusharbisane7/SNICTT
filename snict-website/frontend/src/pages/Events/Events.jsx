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
} from "lucide-react";

import { Link } from "react-router-dom";

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
// COMPONENT
// =========================================================

function Events() {

  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [typeFilter, setTypeFilter] =
    useState("all");


  // =========================================================
  // LOAD EVENTS
  // =========================================================

  useEffect(() => {
    loadEvents();
  }, []);


  const loadEvents = async () => {

    try {

      setLoading(true);
      setError("");


      const response =
        await api.get(
          "/events"
        );


      const backendEvents =
        response.data?.events || [];


      /*
       * Recalculate status on frontend.
       *
       * This prevents incorrect Past/Upcoming
       * values caused by timezone conversion.
       */

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
                statusFilter ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "all"
                )
              }
            >
              All
            </button>


            <button
              type="button"
              className={
                statusFilter ===
                "upcoming"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "upcoming"
                )
              }
            >
              Upcoming
            </button>


            <button
              type="button"
              className={
                statusFilter ===
                "ongoing"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "ongoing"
                )
              }
            >
              Ongoing
            </button>


            <button
              type="button"
              className={
                statusFilter ===
                "past"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "past"
                )
              }
            >
              Past
            </button>

          </div>


          {/* EVENT TYPE */}

          <select
            value={
              typeFilter
            }
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


          {/* LOADING */}

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


          {/* ERROR */}

          {!loading &&
            error && (

              <div className="events-state error">

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={
                    loadEvents
                  }
                >
                  Try Again
                </button>

              </div>

            )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredEvents.length ===
              0 && (

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


          {/* EVENTS */}

          {!loading &&
            !error &&
            filteredEvents.map(
              (event) => (

                <article
                  className="event-card"
                  key={event.id}
                >


                  {/* IMAGE */}

                  <div className="event-image">

                    {event.image_url ? (

                      <img
                        src={
                          event.image_url
                        }
                        alt={
                          event.title
                        }

                        onError={(e) => {

                          e.currentTarget.style.display =
                            "none";

                        }}
                      />

                    ) : (

                      <div className="event-image-placeholder">

                        <CalendarDays
                          size={42}
                        />

                      </div>

                    )}


                    {/* STATUS */}

                    <span
                      className={`event-status ${event.status}`}
                    >
                      {event.status}
                    </span>

                  </div>


                  {/* CONTENT */}

                  <div className="event-card-content">


                    {/* TYPE */}

                    <span className="event-type">

                      {event.event_type ||
                        "EVENT"}

                    </span>


                    {/* TITLE */}

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


                    {/* META */}

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


                    {/* BOTTOM */}

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


                      {/* VIEW */}

                      <Link
                        to={`/events/${event.id}`}
                        className="event-view-btn"
                      >

                        View Event

                        <ArrowRight
                          size={16}
                        />

                      </Link>

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

export default Events;