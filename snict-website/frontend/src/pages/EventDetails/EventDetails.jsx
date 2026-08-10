import { useEffect, useState } from "react";

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

    /*
     * Explicit IST timezone.
     */
    const startDate =
      new Date(
        `${date}T${start}+05:30`
      );

    const endDate =
      new Date(
        `${date}T${end}+05:30`
      );

    const now = new Date();

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

    if (now < startDate) {
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


function EventDetails() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();


  const [event, setEvent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [bookingLoading, setBookingLoading] =
    useState(false);


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


  const loadEvent =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            `/events/${id}`
          );


        if (
          response.data?.success &&
          response.data?.event
        ) {

          const backendEvent =
            response.data.event;


          /*
           * Recalculate status on frontend
           * using IST.
           */

          const status =
            calculateEventStatus(
              backendEvent.event_date,
              backendEvent.start_time,
              backendEvent.end_time
            );


          setEvent({
            ...backendEvent,
            status,
          });

        } else {

          setError(
            "Event not found."
          );

        }

      } catch (error) {

        console.error(
          "Event details error:",
          error
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
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
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
  // BOOK EVENT
  // =========================================================

  const handleBook =
    async () => {

      if (bookingLoading) {
        return;
      }

      if (!event) {
        return;
      }


      // -----------------------------------------------------
      // PAST
      // -----------------------------------------------------

      if (
        event.status ===
        "past"
      ) {

        alert(
          "Registration for this event is closed."
        );

        return;
      }


      // -----------------------------------------------------
      // ONGOING
      // -----------------------------------------------------

      if (
        event.status ===
        "ongoing"
      ) {

        alert(
          "Registration is closed because this event is currently ongoing."
        );

        return;
      }


      // -----------------------------------------------------
      // BOOKING DISABLED
      // -----------------------------------------------------

      if (
        event.booking_enabled !==
        true
      ) {

        alert(
          "Booking is currently unavailable for this event."
        );

        return;
      }


      // -----------------------------------------------------
      // FULL
      // -----------------------------------------------------

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
        availableSlots <= 0
      ) {

        alert(
          "This event is fully booked."
        );

        return;
      }


      try {

        setBookingLoading(true);


        /*
         * Backend identifies the logged-in
         * user from authentication.
         */

        const response =
          await api.post(
            `/bookings/event/${id}`
          );


        if (
          response.data?.success &&
          response.data?.booking
        ) {

          const bookingId =
            response.data.booking.id;


          navigate(
            `/events/booking/${bookingId}`,
            {
              state: {
                eventId:
                  event.id,

                eventTitle:
                  event.title,
              },
            }
          );


          return;
        }


        alert(
          response.data?.message ||
            "Unable to create booking."
        );

      } catch (error) {

        console.error(
          "Event booking error:",
          error
        );


        // ---------------------------------------------------
        // LOGIN REQUIRED
        // ---------------------------------------------------

        if (
          error.response?.status ===
          401
        ) {

          navigate(
            "/login",
            {
              state: {
                from:
                  `/events/${id}`,
              },
            }
          );

          return;
        }


        // ---------------------------------------------------
        // EVENT FULL / CONFLICT
        // ---------------------------------------------------

        if (
          error.response?.status ===
          409
        ) {

          alert(
            error.response?.data?.message ||
              "This event is fully booked."
          );


          await loadEvent();

          return;
        }


        alert(
          error.response?.data?.message ||
            "Unable to create booking. Please try again."
        );

      } finally {

        setBookingLoading(false);

      }
    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <main className="event-details-page">

        <div className="event-details-loading">

          <div className="event-details-spinner" />

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
      <main className="event-details-page">

        <div className="event-details-error">

          <div className="event-error-icon">

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
  // RENDER
  // =========================================================

  return (
    <main className="event-details-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="event-details-hero">

        <div className="event-details-hero-background">

          <div />
          <div />

        </div>


        {/* IMAGE */}

        <div className="event-details-image">

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

                e.currentTarget.parentElement.classList.add(
                  "image-error"
                );

              }}
            />

          ) : (

            <div className="event-details-image-placeholder">

              <CalendarDays
                size={70}
              />

            </div>

          )}

        </div>


        {/* INTRO */}

        <div className="event-details-intro">

          <div className="event-details-badges">

            <span
              className={`event-details-status ${event.status}`}
            >

              <span />

              {event.status}

            </span>


            <span className="event-details-type">

              {event.event_type ||
                "EVENT"}

            </span>

          </div>


          <h1>
            {event.title}
          </h1>


          {event.doctor_name && (

            <div className="event-details-doctor">

              <div className="event-doctor-icon">

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

      <section className="event-details-container">


        {/* ===================================================
            LEFT CONTENT
        =================================================== */}

        <div className="event-details-main">


          {/* OVERVIEW */}

          <section className="event-description">

            <span className="event-section-label">
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

          <section className="event-info-grid">


            {/* DATE */}

            <div className="event-info-card">

              <div className="event-info-icon">

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

            <div className="event-info-card">

              <div className="event-info-icon">

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

            <div className="event-info-card">

              <div className="event-info-icon">

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

          <section className="event-extra-info">


            <div className="event-extra-item">

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

              <div className="event-extra-item">

                <span>
                  EXPERT
                </span>


                <strong>
                  {event.doctor_name}
                </strong>

              </div>

            )}


            {event.specialization && (

              <div className="event-extra-item">

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

          {maxSlots !== null && (

            <section className="event-capacity-card">

              <div className="event-capacity-icon">

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

        </div>


        {/* ===================================================
            BOOKING CARD
        =================================================== */}

        <aside className="event-booking-card">


          <div className="booking-card-label">

            REGISTRATION

          </div>


          {/* PRICE */}

          <div className="event-booking-price">

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


          <span className="booking-price-note">

            {eventPrice > 0
              ? "Registration fee"
              : "No registration fee"}

          </span>


          {/* CAPACITY */}

          {maxSlots !== null && (

            <div className="booking-capacity">

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

            <div className="booking-closed-message">

              <AlertCircle
                size={18}
              />

              <span>
                Registration closed
              </span>

            </div>

          ) : isOngoing ? (

            <div className="booking-closed-message">

              <Clock3
                size={18}
              />

              <span>
                Event is currently ongoing
              </span>

            </div>

          ) : !bookingEnabled ? (

            <div className="booking-closed-message">

              <AlertCircle
                size={18}
              />

              <span>
                Booking unavailable
              </span>

            </div>

          ) : isFull ? (

            <div className="booking-closed-message">

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
              className="event-book-btn"
              onClick={
                handleBook
              }
              disabled={
                bookingLoading
              }
            >

              <span>

                {bookingLoading
                  ? "Creating Booking..."
                  : "Book Your Seat"}

              </span>


              {!bookingLoading && (

                <ArrowRight
                  size={18}
                />

              )}

            </button>

          )}


          {/* LOGIN NOTE */}

          {isUpcoming &&
            bookingEnabled &&
            !isFull && (

              <div className="booking-login-note">

                <CheckCircle2
                  size={16}
                />

                <span>

                  Login is required
                  to complete
                  registration.

                </span>

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

    </main>
  );
}

export default EventDetails;