import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  TicketCheck,
  UserCircle,
  WalletCards,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./Dashboard.css";


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

  /* =========================================================
     AUTH
  ========================================================= */

  const { user } = useAuth();


  /* =========================================================
     STATE
  ========================================================= */

  const [bookings, setBookings] = useState([]);

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [eventsError, setEventsError] =
    useState("");

  const [imageError, setImageError] =
    useState(false);

  const [bookedEventSlide, setBookedEventSlide] =
    useState(0);


  /* =========================================================
     LOAD USER BOOKINGS
     
     Backend:
     GET /api/bookings
========================================================= */

  useEffect(() => {

    let mounted = true;

    const loadBookings = async () => {

      try {

        setLoading(true);

        setError("");

        const response =
          await api.get("/bookings");


        if (!mounted) {
          return;
        }


        const data =
          response?.data;


        if (data?.success) {

          setBookings(
            Array.isArray(data.bookings)
              ? data.bookings
              : Array.isArray(data.data)
                ? data.data
                : []
          );

        } else {

          setBookings([]);

        }

      } catch (err) {

        console.error(
          "Dashboard bookings error:",
          err
        );


        if (!mounted) {
          return;
        }


        setError(
          err?.response?.data?.message ||
          "Unable to load your bookings."
        );


        setBookings([]);

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadBookings();


    return () => {
      mounted = false;
    };

  }, []);


  /* =========================================================
     LOAD EVENTS
     
     Backend:
     GET /api/events
     
     IMPORTANT:
     eventRoutes.js:
     
     router.get("/", getEvents);
========================================================= */

  useEffect(() => {

    let mounted = true;


    const loadEvents = async () => {

      try {

        setEventsLoading(true);

        setEventsError("");


        const response =
          await api.get("/events");


        if (!mounted) {
          return;
        }


        const data =
          response?.data;


        /*
         * Supports common response formats:
         *
         * {
         *   success: true,
         *   events: []
         * }
         *
         * {
         *   success: true,
         *   data: []
         * }
         *
         * []
         */

        let eventList = [];


        if (
          Array.isArray(data)
        ) {

          eventList = data;

        } else if (
          Array.isArray(
            data?.events
          )
        ) {

          eventList = data.events;

        } else if (
          Array.isArray(
            data?.data
          )
        ) {

          eventList = data.data;

        }


        setEvents(eventList);

      } catch (err) {

        console.error(
          "Dashboard events error:",
          err
        );


        if (!mounted) {
          return;
        }


        setEventsError(
          err?.response?.data?.message ||
          "Unable to load event information."
        );


        setEvents([]);

      } finally {

        if (mounted) {
          setEventsLoading(false);
        }

      }

    };


    loadEvents();


    return () => {
      mounted = false;
    };

  }, []);


  /* =========================================================
     USER INFORMATION
========================================================= */

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.name ||
    "SNICT Member";


  const email =
    user?.email ||
    "SNICT Member";


  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase();


  /* =========================================================
     PROFILE IMAGE
========================================================= */

  const profileImageUrl = useMemo(() => {

    const image =
      user?.profileImageUrl ||
      user?.profile_image_url ||
      user?.photoUrl ||
      user?.photo ||
      user?.profileImage ||
      "";


    if (!image) {
      return "";
    }


    const imageString =
      String(image).trim();


    if (
      imageString.startsWith(
        "http://"
      ) ||
      imageString.startsWith(
        "https://"
      ) ||
      imageString.startsWith(
        "data:"
      )
    ) {

      return imageString;

    }


    const apiUrl =
      import.meta.env.VITE_API_URL ||
      "";


    if (!apiUrl) {

      return imageString;

    }


    const backendOrigin =
      apiUrl.replace(
        /\/api\/?$/,
        ""
      );


    if (
      imageString.startsWith("/")
    ) {

      return (
        `${backendOrigin}${imageString}`
      );

    }


    return (
      `${backendOrigin}/${imageString}`
    );

  }, [user]);


  useEffect(() => {

    setImageError(false);

  }, [profileImageUrl]);


  /* =========================================================
     GENERIC ID HELPER
========================================================= */

  const getId = (
    item
  ) => {

    if (!item) {
      return null;
    }


    return (
      item.id ??
      item.event_id ??
      item.eventId ??
      item.event?.id ??
      item.event?.event_id ??
      null
    );

  };


  /* =========================================================
     BOOKING EVENT ID
========================================================= */

  const getBookingEventId = (
    booking
  ) => {

    return (
      booking?.event_id ??
      booking?.eventId ??
      booking?.event?.id ??
      booking?.event?.event_id ??
      booking?.eventId_fk ??
      null
    );

  };


  /* =========================================================
     BOOKING STATUS
========================================================= */

  const getBookingStatus = (
    booking
  ) => {

    return String(
      booking?.booking_status ||
      booking?.status ||
      "pending"
    ).toLowerCase();

  };


  /* =========================================================
     PAYMENT STATUS
========================================================= */

  const getPaymentStatus = (
    booking
  ) => {

    return String(
      booking?.payment_status ||
      booking?.paymentStatus ||
      "pending"
    ).toLowerCase();

  };


  /* =========================================================
     EVENT TITLE
========================================================= */

  const getEventTitle = (
    item
  ) => {

    return (
      item?.title ||
      item?.event_title ||
      item?.eventName ||
      item?.name ||
      item?.event?.title ||
      item?.event?.event_title ||
      "SNICT Event"
    );

  };


  /* =========================================================
     EVENT DESCRIPTION
========================================================= */

  const getEventDescription = (
    event
  ) => {

    return (
      event?.description ||
      event?.short_description ||
      event?.summary ||
      event?.event_description ||
      ""
    );

  };


  /* =========================================================
     EVENT IMAGE
========================================================= */

  const getEventImage = (
    event
  ) => {

    const image =
      event?.image_url ||
      event?.imageUrl ||
      event?.image ||
      event?.photo ||
      event?.photo_url ||
      event?.event_image ||
      event?.banner ||
      "";


    if (!image) {
      return "";
    }


    const imageString =
      String(image).trim();


    if (
      imageString.startsWith(
        "http://"
      ) ||
      imageString.startsWith(
        "https://"
      ) ||
      imageString.startsWith(
        "data:"
      )
    ) {

      return imageString;

    }


    const apiUrl =
      import.meta.env.VITE_API_URL ||
      "";


    if (!apiUrl) {
      return imageString;
    }


    const backendOrigin =
      apiUrl.replace(
        /\/api\/?$/,
        ""
      );


    if (
      imageString.startsWith("/")
    ) {

      return (
        `${backendOrigin}${imageString}`
      );

    }


    return (
      `${backendOrigin}/${imageString}`
    );

  };


  /* =========================================================
     EVENT DATE
========================================================= */

  const getEventDate = (
    event,
    booking
  ) => {

    return (
      event?.event_date ||
      event?.eventDate ||
      event?.date ||
      booking?.event_date ||
      booking?.eventDate ||
      event?.start_date ||
      booking?.start_date ||
      ""
    );

  };


  /* =========================================================
     EVENT TIME
========================================================= */

  const getEventTime = (
    event,
    booking
  ) => {

    return (
      event?.start_time ||
      event?.startTime ||
      event?.time ||
      booking?.start_time ||
      booking?.startTime ||
      ""
    );

  };


  /* =========================================================
     EVENT LOCATION
========================================================= */

  const getEventLocation = (
    event,
    booking
  ) => {

    return (
      event?.location ||
      event?.venue ||
      event?.event_location ||
      event?.address ||
      booking?.location ||
      booking?.venue ||
      booking?.event_location ||
      ""
    );

  };


  /* =========================================================
     EVENT PRICE
========================================================= */

  const getEventPrice = (
    event
  ) => {

    return Number(
      event?.price ??
      event?.registration_fee ??
      event?.registrationFee ??
      event?.amount ??
      0
    );

  };


  /* =========================================================
     BOOKING AMOUNT
========================================================= */

  const getBookingAmount = (
    booking
  ) => {

    return Number(
      booking?.amount ??
      booking?.payment_amount ??
      booking?.paymentAmount ??
      booking?.price ??
      0
    );

  };


  /* =========================================================
     FIND EVENT FOR BOOKING
     
     Priority:
     
     1. booking.event
     2. matching event from GET /events
========================================================= */

  const findEventForBooking = (
    booking
  ) => {

    if (
      booking?.event &&
      typeof booking.event ===
        "object"
    ) {

      return booking.event;

    }


    const bookingEventId =
      getBookingEventId(
        booking
      );


    if (
      bookingEventId === null ||
      bookingEventId === undefined
    ) {

      return null;

    }


    return (
      events.find(
        (event) =>
          String(
            getId(event)
          ) ===
          String(
            bookingEventId
          )
      ) ||
      null
    );

  };


  /* =========================================================
     MERGED BOOKED EVENTS
     
     This is the important part.
     
     User bookings are matched with:
     
     GET /api/events
========================================================= */

  const bookedEvents =
    useMemo(() => {

      if (
        !Array.isArray(
          bookings
        )
      ) {

        return [];

      }


      const result = [];


      bookings.forEach(
        (booking) => {

          const event =
            findEventForBooking(
              booking
            );


          /*
           * If booking already contains
           * event information, use it.
           *
           * Otherwise match it with
           * GET /api/events.
           */

          if (
            event
          ) {

            result.push({
              ...event,

              booking,
            });

            return;

          }


          /*
           * Fallback:
           *
           * Some booking APIs may directly
           * return title/date/image.
           */

          if (
            booking?.event_id ||
            booking?.eventId ||
            booking?.event
          ) {

            result.push({
              ...booking,

              booking,
            });

          }

        }
      );


      /*
       * Remove duplicate event cards
       * if the user has multiple bookings
       * for the same event.
       */

      const unique =
        [];


      const seen =
        new Set();


      result.forEach(
        (item) => {

          const eventId =
            getId(item) ||
            getBookingEventId(
              item.booking
            );


          const key =
            eventId !== null &&
            eventId !== undefined
              ? String(eventId)
              : `booking-${item.booking?.id}`;


          if (
            seen.has(key)
          ) {

            return;

          }


          seen.add(key);

          unique.push(item);

        }
      );


      return unique;

    }, [
      bookings,
      events,
    ]);


  /* =========================================================
     STATISTICS
========================================================= */

  const stats = useMemo(() => {

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


          const payment =
            getPaymentStatus(
              booking
            );


          return (
            (
              status ===
                "payment_pending" ||
              status ===
                "pending"
            ) &&
            payment ===
              "pending"
          );

        }
      ).length;


    const waitingVerification =
      bookings.filter(
        (booking) => {

          const payment =
            getPaymentStatus(
              booking
            );


          return (
            payment ===
              "submitted" ||
            payment ===
              "waiting" ||
            payment ===
              "verification_pending"
          );

        }
      ).length;


    const completed =
      bookings.filter(
        (booking) =>
          getBookingStatus(
            booking
          ) === "completed"
      ).length;


    return {
      total,
      confirmed,
      pending,
      waitingVerification,
      completed,
    };

  }, [bookings]);


  /* =========================================================
     RECENT BOOKINGS
========================================================= */

  const recentBookings =
    useMemo(() => {

      return [
        ...bookings,
      ]
        .sort(
          (a, b) => {

            const first =
              new Date(
                a.created_at ||
                a.createdAt ||
                0
              ).getTime();


            const second =
              new Date(
                b.created_at ||
                b.createdAt ||
                0
              ).getTime();


            return (
              second - first
            );

          }
        )
        .slice(
          0,
          4
        );

    }, [
      bookings,
    ]);


  /* =========================================================
     BOOKED EVENT SLIDER
========================================================= */

  useEffect(() => {

    if (
      bookedEvents.length <= 1
    ) {

      return undefined;

    }


    const timer =
      setInterval(
        () => {

          setBookedEventSlide(
            (current) =>
              (
                current + 1
              ) %
              bookedEvents.length
          );

        },
        5000
      );


    return () =>
      clearInterval(
        timer
      );

  }, [
    bookedEvents.length,
  ]);


  /* =========================================================
     KEEP SLIDER INDEX VALID
========================================================= */

  useEffect(() => {

    setBookedEventSlide(
      (current) => {

        if (
          bookedEvents.length === 0
        ) {

          return 0;

        }


        return Math.min(
          current,
          bookedEvents.length - 1
        );

      }
    );

  }, [
    bookedEvents.length,
  ]);


  /* =========================================================
     SLIDER NAVIGATION
========================================================= */

  const previousBookedEvent =
    () => {

      if (
        bookedEvents.length <= 1
      ) {

        return;

      }


      setBookedEventSlide(
        (current) =>
          current === 0
            ? bookedEvents.length - 1
            : current - 1
      );

    };


  const nextBookedEvent =
    () => {

      if (
        bookedEvents.length <= 1
      ) {

        return;

      }


      setBookedEventSlide(
        (current) =>
          (
            current + 1
          ) %
          bookedEvents.length
      );

    };


  /* =========================================================
     CURRENT BOOKED EVENT
========================================================= */

  const currentBookedEvent =
    bookedEvents[
      bookedEventSlide
    ] ||
    null;


  /* =========================================================
     FORMAT DATE
========================================================= */

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "Date TBA";
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


  /* =========================================================
     FORMAT TIME
========================================================= */

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "";
    }


    const parts =
      String(value).split(
        ":"
      );


    if (
      parts.length < 2
    ) {

      return String(value);

    }


    const hours =
      Number(parts[0]);


    const minutes =
      Number(parts[1]);


    const date =
      new Date();


    date.setHours(
      hours,
      minutes,
      0,
      0
    );


    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  /* =========================================================
     FORMAT STATUS
========================================================= */

  const formatStatus = (
    status
  ) => {

    if (!status) {
      return "Pending";
    }


    return String(status)
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


  /* =========================================================
     PAYMENT BADGE
========================================================= */

  const renderPaymentBadge = (
    payment
  ) => {

    switch (payment) {

      case "submitted":

      case "waiting":

      case "verification_pending":

        return (

          <small
            className="
              dashboard-payment-status
              submitted
            "
          >

            <Clock3
              size={12}
            />

            <span>
              Waiting Verification
            </span>

          </small>

        );


      case "verified":

        return (

          <small
            className="
              dashboard-payment-status
              verified
            "
          >

            <CheckCircle2
              size={12}
            />

            <span>
              Payment Verified
            </span>

          </small>

        );


      case "rejected":

        return (

          <small
            className="
              dashboard-payment-status
              rejected
            "
          >

            <AlertCircle
              size={12}
            />

            <span>
              Payment Rejected
            </span>

          </small>

        );


      case "refunded":

        return (

          <small
            className="
              dashboard-payment-status
              refunded
            "
          >

            <AlertCircle
              size={12}
            />

            <span>
              Payment Refunded
            </span>

          </small>

        );


      default:

        return (

          <small
            className="
              dashboard-payment-status
              pending
            "
          >

            <WalletCards
              size={12}
            />

            <span>
              Payment Pending
            </span>

          </small>

        );

    }

  };


  /* =========================================================
     LOADING
========================================================= */

  if (
    loading &&
    eventsLoading
  ) {

    return (

      <main
        className="
          member-dashboard-page
          dashboard-page-loading
        "
      >

        <div
          className="
            member-dashboard-container
          "
        >

          <div
            className="
              dashboard-loading
          "
          >

            <div
              className="
                dashboard-loading-spinner
              "
            />

            <p>
              Loading your dashboard...
            </p>

          </div>

        </div>

      </main>

    );

  }


  /* =========================================================
     MAIN UI
========================================================= */

  return (

    <main
      className="
        member-dashboard-page
      "
    >

      <div
        className="
          member-dashboard-container
      "
      >


        {/* =================================================
            WELCOME
        ================================================= */}

        <section
          className="
            dashboard-welcome
          "
        >

          <div
            className="
              dashboard-welcome-content
          "
          >

            <span
              className="
                dashboard-eyebrow
              "
            >
              SNICT MEMBER AREA
            </span>


            <h1>

              Welcome back,{" "}

              <span>
                {displayName}
              </span>

            </h1>


            <p>
              Manage your SNICT membership,
              event registrations and bookings
              from one place.
            </p>


            <div
              className="
                dashboard-welcome-actions
              "
            >

              <Link
                to="/events"
                className="
                  dashboard-primary-button
                "
              >

                <CalendarDays
                  size={16}
                />

                Browse Events

                <ArrowRight
                  size={15}
                />

              </Link>


              <Link
                to="/booking-history"
                className="
                  dashboard-secondary-button
                "
              >

                <TicketCheck
                  size={16}
                />

                My Bookings

              </Link>

            </div>

          </div>


          {/* MEMBER CARD */}

          <div
            className="
              dashboard-member-card
            "
          >

            <div
              className="
                dashboard-member-avatar
            "
            >

              {profileImageUrl &&
              !imageError ? (

                <img
                  src={
                    profileImageUrl
                  }
                  alt={
                    `${displayName} profile`
                  }
                  onError={() =>
                    setImageError(
                      true
                    )
                  }
                  loading="eager"
                />

              ) : (

                avatarLetter

              )}

            </div>


            <div
              className="
                dashboard-member-info
              "
            >

              <strong>
                {displayName}
              </strong>


              <span>
                {email}
              </span>


              <small>

                <CheckCircle2
                  size={12}
                />

                Active Member

              </small>

            </div>


            <Link
              to="/profile"
              className="
                dashboard-member-edit
              "
            >
              View Profile
            </Link>

          </div>

        </section>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section
          className="
            dashboard-stats
          "
        >

          <div
            className="
              dashboard-stat-card
            "
          >

            <div
              className="
                dashboard-stat-icon
            "
            >

              <TicketCheck
                size={21}
              />

            </div>


            <div
              className="
                dashboard-stat-content
            "
            >

              <span>
                Total Bookings
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>

          </div>


          <div
            className="
              dashboard-stat-card
            "
          >

            <div
              className="
                dashboard-stat-icon
            "
            >

              <CheckCircle2
                size={21}
              />

            </div>


            <div
              className="
                dashboard-stat-content
            "
            >

              <span>
                Confirmed
              </span>

              <strong>
                {stats.confirmed}
              </strong>

            </div>

          </div>


          <div
            className="
              dashboard-stat-card
              dashboard-stat-pending
            "
          >

            <div
              className="
                dashboard-stat-icon
            "
            >

              <Clock3
                size={21}
              />

            </div>


            <div
              className="
                dashboard-stat-content
            "
            >

              <span>
                Payment Pending
              </span>

              <strong>
                {stats.pending}
              </strong>

            </div>

          </div>


          <div
            className="
              dashboard-stat-card
              dashboard-stat-verification
            "
          >

            <div
              className="
                dashboard-stat-icon
            "
            >

              <Clock3
                size={21}
              />

            </div>


            <div
              className="
                dashboard-stat-content
            "
            >

              <span>
                Waiting Verification
              </span>

              <strong>
                {stats.waitingVerification}
              </strong>

            </div>

          </div>


          <div
            className="
              dashboard-stat-card
            "
          >

            <div
              className="
                dashboard-stat-icon
            "
            >

              <HeartPulse
                size={21}
              />

            </div>


            <div
              className="
                dashboard-stat-content
            "
            >

              <span>
                Completed
              </span>

              <strong>
                {stats.completed}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS + BOOKED EVENTS
        ================================================= */}

        <section
          className="
            dashboard-main-grid
          "
        >


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <article
            className="
              dashboard-card
              dashboard-services-card
            "
          >

            <header
              className="
                dashboard-card-header
            "
            >

              <div>

                <span
                  className="
                    dashboard-section-label
                  "
                >
                  MEMBER SERVICES
                </span>


                <h2>
                  Quick Actions
                </h2>

              </div>


              <WalletCards
                size={22}
                className="
                  dashboard-card-header-icon
                "
              />

            </header>


            <div
              className="
                dashboard-services-list
              "
            >


              {/* EVENTS */}

              <Link
                to="/events"
                className="
                  dashboard-service-link
                "
              >

                <div
                  className="
                    dashboard-service-icon
                  "
                >

                  <CalendarDays
                    size={19}
                  />

                </div>


                <div
                  className="
                    dashboard-service-content
                  "
                >

                  <strong>
                    Browse Events
                  </strong>

                  <span>
                    Find upcoming SNICT events
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="
                    dashboard-service-arrow
                  "
                />

              </Link>


              {/* BOOKINGS */}

              <Link
                to="/booking-history"
                className="
                  dashboard-service-link
                "
              >

                <div
                  className="
                    dashboard-service-icon
                  "
                >

                  <TicketCheck
                    size={19}
                  />

                </div>


                <div
                  className="
                    dashboard-service-content
                  "
                >

                  <strong>
                    My Bookings
                  </strong>

                  <span>
                    View your registrations
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="
                    dashboard-service-arrow
                  "
                />

              </Link>


              {/* PROFILE */}

              <Link
                to="/profile"
                className="
                  dashboard-service-link
                "
              >

                <div
                  className="
                    dashboard-service-icon
                  "
                >

                  <UserCircle
                    size={19}
                  />

                </div>


                <div
                  className="
                    dashboard-service-content
                  "
                >

                  <strong>
                    My Profile
                  </strong>

                  <span>
                    Manage your member profile
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="
                    dashboard-service-arrow
                  "
                />

              </Link>


              {/* SECURITY */}

              <Link
                to="/change-password"
                className="
                  dashboard-service-link
                "
              >

                <div
                  className="
                    dashboard-service-icon
                  "
                >

                  <ShieldCheck
                    size={19}
                  />

                </div>


                <div
                  className="
                    dashboard-service-content
                  "
                >

                  <strong>
                    Account Security
                  </strong>

                  <span>
                    Manage your account security
                  </span>

                </div>


                <ArrowRight
                  size={16}
                  className="
                    dashboard-service-arrow
                  "
                />

              </Link>

            </div>

          </article>


          {/* =================================================
              MY BOOKED EVENTS SLIDER
          ================================================= */}

          <article
            className="
              dashboard-card
              dashboard-booked-events-card
            "
          >

            <header
              className="
                dashboard-card-header
            "
            >

              <div>

                <span
                  className="
                    dashboard-section-label
                  "
                >
                  MY ACTIVITY
                </span>


                <h2>
                  My Booked Events
                </h2>

              </div>


              <div
                className="
                  dashboard-booked-events-controls
                "
              >

                {bookedEvents.length > 1 && (

                  <>

                    <button
                      type="button"
                      onClick={
                        previousBookedEvent
                      }
                      className="
                        dashboard-slider-button
                      "
                      aria-label="
                        Previous booked event
                      "
                    >

                      <ChevronLeft
                        size={17}
                      />

                    </button>


                    <button
                      type="button"
                      onClick={
                        nextBookedEvent
                      }
                      className="
                        dashboard-slider-button
                      "
                      aria-label="
                        Next booked event
                      "
                    >

                      <ChevronRight
                        size={17}
                      />

                    </button>

                  </>

                )}

              </div>

            </header>


            {/* LOADING */}

            {eventsLoading && (

              <div
                className="
                  dashboard-booked-event-loading
                "
              >

                <div
                  className="
                    dashboard-loading-spinner
                  "
                />

                <span>
                  Loading your booked events...
                </span>

              </div>

            )}


            {/* ERROR */}

            {!eventsLoading &&
            eventsError && (

              <div
                className="
                  dashboard-booked-event-error
                "
              >

                <AlertCircle
                  size={24}
                />

                <p>
                  {eventsError}
                </p>

                <Link
                  to="/events"
                  className="
                    dashboard-empty-button
                  "
                >
                  Browse Events
                </Link>

              </div>

            )}


            {/* NO BOOKED EVENTS */}

            {!eventsLoading &&
            !eventsError &&
            bookedEvents.length === 0 && (

              <div
                className="
                  dashboard-no-booked-events
                "
              >

                <div
                  className="
                    dashboard-no-booked-events-icon
                  "
                >

                  <CalendarDays
                    size={34}
                  />

                </div>


                <h3>
                  No booked events yet
                </h3>


                <p>
                  Once you register for an event,
                  it will appear here.
                </p>


                <Link
                  to="/events"
                  className="
                    dashboard-empty-button
                  "
                >

                  Explore Events

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>

            )}


            {/* BOOKED EVENT */}

            {!eventsLoading &&
            !eventsError &&
            currentBookedEvent && (

              <div
                className="
                  dashboard-booked-event-slider
                "
              >

                <div
                  className="
                    dashboard-booked-event-image
                  "
                >

                  {getEventImage(
                    currentBookedEvent
                  ) ? (

                    <img
                      src={
                        getEventImage(
                          currentBookedEvent
                        )
                      }
                      alt={
                        getEventTitle(
                          currentBookedEvent
                        )
                      }
                    />

                  ) : (

                    <div
                      className="
                        dashboard-booked-event-placeholder
                      "
                    >

                      <HeartPulse
                        size={42}
                      />

                    </div>

                  )}


                  <div
                    className="
                      dashboard-booked-event-overlay
                    "
                  />

                  <span
                    className="
                      dashboard-booked-event-badge
                    "
                  >

                    <CheckCircle2
                      size={13}
                    />

                    BOOKED

                  </span>

                </div>


                <div
                  className="
                    dashboard-booked-event-content
                  "
                >

                  <div
                    className="
                      dashboard-booked-event-top
                    "
                  >

                    <span
                      className="
                        dashboard-booked-event-label
                      "
                    >

                      EVENT{" "}

                      {bookedEvents.length > 1 &&
                        `${bookedEventSlide + 1}/${bookedEvents.length}`}

                    </span>


                    <span
                      className="
                        dashboard-booked-event-status
                      "
                    >

                      {formatStatus(
                        getBookingStatus(
                          currentBookedEvent.booking
                        )
                      )}

                    </span>

                  </div>


                  <h3>
                    {getEventTitle(
                      currentBookedEvent
                    )}
                  </h3>


                  {getEventDescription(
                    currentBookedEvent
                  ) && (

                    <p
                      className="
                        dashboard-booked-event-description
                      "
                    >
                      {getEventDescription(
                        currentBookedEvent
                      ).length > 100
                        ? `${getEventDescription(
                            currentBookedEvent
                          ).slice(0, 100)}...`
                        : getEventDescription(
                            currentBookedEvent
                          )}
                    </p>

                  )}


                  <div
                    className="
                      dashboard-booked-event-meta
                    "
                  >

                    <span>

                      <CalendarDays
                        size={14}
                      />

                      {formatDate(
                        getEventDate(
                          currentBookedEvent,
                          currentBookedEvent.booking
                        )
                      )}

                    </span>


                    {getEventTime(
                      currentBookedEvent,
                      currentBookedEvent.booking
                    ) && (

                      <span>

                        <Clock3
                          size={14}
                        />

                        {formatTime(
                          getEventTime(
                            currentBookedEvent,
                            currentBookedEvent.booking
                          )
                        )}

                      </span>

                    )}


                    {getEventLocation(
                      currentBookedEvent,
                      currentBookedEvent.booking
                    ) && (

                      <span>

                        <MapPin
                          size={14}
                        />

                        {getEventLocation(
                          currentBookedEvent,
                          currentBookedEvent.booking
                        )}

                      </span>

                    )}

                  </div>


                  <div
                    className="
                      dashboard-booked-event-bottom
                    "
                  >

                    <div
                      className="
                        dashboard-booked-event-payment
                      "
                    >

                      <span>
                        Booking Amount
                      </span>

                      <strong>
                        ₹
                        {getBookingAmount(
                          currentBookedEvent.booking
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {renderPaymentBadge(
                      getPaymentStatus(
                        currentBookedEvent.booking
                      )
                    )}

                  </div>


                  {/* <Link
                    to={
                      `/booking-history/${
                        currentBookedEvent.booking?.id
                      }`
                    }
                    className="
                      dashboard-booked-event-button
                    "
                  >

                    View Booking

                    <ArrowRight
                      size={15}
                    />

                  </Link> */}

                </div>


                {/* SLIDER DOTS */}

                {bookedEvents.length > 1 && (

                  <div
                    className="
                      dashboard-booked-event-dots
                    "
                  >

                    {bookedEvents.map(
                      (_, index) => (

                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            setBookedEventSlide(
                              index
                            )
                          }
                          className={`
                            dashboard-slider-dot
                            ${
                              index ===
                              bookedEventSlide
                                ? "active"
                                : ""
                            }
                          `}
                          aria-label={
                            `Show booked event ${
                              index + 1
                            }`
                          }
                        />

                      )
                    )}

                  </div>

                )}

              </div>

            )}

          </article>

        </section>


        {/* =================================================
            RECENT BOOKINGS
        ================================================= */}

        <section
          className="
            dashboard-card
            dashboard-recent-card
          "
        >

          <header
            className="
              dashboard-recent-header
            "
          >

            <div>

              <span
                className="
                  dashboard-section-label
                "
              >
                ACTIVITY
              </span>


              <h2>
                Recent Bookings
              </h2>


              <p
                className="
                  dashboard-recent-subtitle
                "
              >
                Your latest event registrations
                and booking activity.
              </p>

            </div>


            <Link
              to="/booking-history"
              className="
                dashboard-view-all
              "
            >

              View All

              <ArrowRight
                size={15}
              />

            </Link>

          </header>


          {/* ERROR */}

          {error && (

            <div
              className="
                dashboard-error
              "
            >

              <AlertCircle
                size={16}
              />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* EMPTY */}

          {recentBookings.length === 0 ? (

            <div
              className="
                dashboard-empty-bookings
              "
            >

              <div
                className="
                  dashboard-empty-icon
                "
              >

                <TicketCheck
                  size={32}
                />

              </div>


              <h3>
                No bookings yet
              </h3>


              <p>
                Register for an upcoming
                SNICT event to see your
                bookings here.
              </p>


              <Link
                to="/events"
                className="
                  dashboard-empty-button
                "
              >

                Browse Events

                <ArrowRight
                  size={16}
                />

              </Link>

            </div>

          ) : (

            <div
              className="
                dashboard-recent-list
              "
            >

              {recentBookings.map(
                (booking) => {

                  const status =
                    getBookingStatus(
                      booking
                    );


                  const payment =
                    getPaymentStatus(
                      booking
                    );


                  const event =
                    findEventForBooking(
                      booking
                    );


                  return (

                    <Link
                      key={
                        booking.id
                      }
                      to={
                        `/booking-history/${
                          booking.id
                        }`
                      }
                      className="
                        dashboard-booking-item
                      "
                    >

                      {/* EVENT */}

                      <div
                        className="
                          dashboard-booking-left
                        "
                      >

                        <div
                          className="
                            dashboard-booking-icon
                          "
                        >

                          <TicketCheck
                            size={18}
                          />

                        </div>


                        <div
                          className="
                            dashboard-booking-info
                          "
                        >

                          <strong>

                            {event
                              ? getEventTitle(
                                  event
                                )
                              : getEventTitle(
                                  booking
                                )}

                          </strong>


                          <span>

                            {booking.booking_code ||
                              booking.bookingCode ||
                              `Booking #${booking.id}`}

                          </span>

                        </div>

                      </div>


                      {/* DATE */}

                      <div
                        className="
                          dashboard-booking-middle
                        "
                      >

                        <span
                          className="
                            booking-data-label
                          "
                        >
                          Event Date
                        </span>


                        <strong>

                          {formatDate(
                            getEventDate(
                              event,
                              booking
                            )
                          )}

                        </strong>

                      </div>


                      {/* AMOUNT */}

                      <div
                        className="
                          dashboard-booking-amount
                        "
                      >

                        <span
                          className="
                            booking-data-label
                          "
                        >
                          Amount
                        </span>


                        <strong>

                          ₹
                          {getBookingAmount(
                            booking
                          ).toLocaleString(
                            "en-IN"
                          )}

                        </strong>

                      </div>


                      {/* STATUS */}

                      <div
                        className="
                          dashboard-booking-right
                        "
                      >

                        <span
                          className={`
                            dashboard-booking-status
                            ${status}
                          `}
                        >

                          {formatStatus(
                            status
                          )}

                        </span>


                        {renderPaymentBadge(
                          payment
                        )}

                      </div>


                      {/* ARROW */}

                      {/* <div
                        className="
                          dashboard-booking-view
                        "
                        aria-hidden="true"
                      >

                        <ArrowRight
                          size={16}
                        />

                      </div> */}

                    </Link>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* =================================================
            BOTTOM CTA
        ================================================= */}

        <section
          className="
            dashboard-bottom-cta
          "
        >

          <div
            className="
              dashboard-bottom-cta-icon
            "
          >

            <Sparkles
              size={21}
            />

          </div>


          <div
            className="
              dashboard-bottom-cta-content
            "
          >

            <strong>
              Discover more SNICT events
            </strong>


            <span>
              Stay connected with conferences,
              academic programs and community
              activities.
            </span>

          </div>


          <Link
            to="/events"
            className="
              dashboard-bottom-cta-button
            "
          >

            Explore Events

            <ArrowRight
              size={16}
            />

          </Link>

        </section>


      </div>

    </main>

  );

}


export default Dashboard;