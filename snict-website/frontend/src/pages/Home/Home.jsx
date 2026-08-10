import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  MapPin,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  Video,
  BrainCircuit,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import "./Home.css";

// =========================================================
// LOOPING TYPING TEXT COMPONENT
// =========================================================

function TypingText({
  text,
  speed = 85,
  deleteSpeed = 45,
  pause = 1800,
}) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;

    if (!isDeleting) {
      // =====================================================
      // TYPING
      // =====================================================

      if (displayText.length < text.length) {
        timer = setTimeout(() => {
          setDisplayText(
            text.substring(
              0,
              displayText.length + 1
            )
          );
        }, speed);
      } else {
        // ===================================================
        // PAUSE AFTER COMPLETE TEXT
        // ===================================================

        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pause);
      }
    } else {
      // =====================================================
      // DELETING
      // =====================================================

      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(
            text.substring(
              0,
              displayText.length - 1
            )
          );
        }, deleteSpeed);
      } else {
        // ===================================================
        // START TYPING AGAIN
        // ===================================================

        timer = setTimeout(() => {
          setIsDeleting(false);
        }, 350);
      }
    }

    return () => {
      clearTimeout(timer);
    };
  }, [
    displayText,
    isDeleting,
    text,
    speed,
    deleteSpeed,
    pause,
  ]);

  return (
    <span className="typing-wrapper">
      <span className="typing-text">
        {displayText}
      </span>

      <span
        className="typing-cursor"
        aria-hidden="true"
      >
        |
      </span>
    </span>
  );
}

// =========================================================
// DATE HELPERS
// =========================================================

const getDateString = (value) => {
  if (!value) return "";

  const valueString = String(value).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    return valueString;
  }

  // ISO date
  if (valueString.includes("T")) {
    return valueString.substring(0, 10);
  }

  // PostgreSQL timestamp with space
  if (valueString.includes(" ")) {
    return valueString.split(" ")[0];
  }

  return valueString.substring(0, 10);
};

// =========================================================
// TIME HELPERS
// =========================================================

const getTimeString = (value) => {
  if (!value) return "";

  const valueString = String(value).trim();

  // HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}/.test(valueString)) {
    return valueString.substring(0, 8);
  }

  if (valueString.includes("T")) {
    const time = valueString.split("T")[1];

    return time ? time.substring(0, 8) : "";
  }

  return "";
};

// =========================================================
// EVENT DATE OBJECT
// =========================================================

const createEventDate = (
  eventDate,
  eventTime,
  defaultTime
) => {
  const date = getDateString(eventDate);

  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return null;
  }

  let time = getTimeString(eventTime);

  if (!time) {
    time = defaultTime;
  }

  if (/^\d{1,2}:\d{2}$/.test(time)) {
    time = `${time}:00`;
  }

  const result = new Date(
    `${date}T${time}+05:30`
  );

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result;
};

// =========================================================
// EVENT STATUS
// =========================================================

const getEventStatus = (
  eventDate,
  startTime,
  endTime
) => {
  const start = createEventDate(
    eventDate,
    startTime,
    "00:00:00"
  );

  const end = createEventDate(
    eventDate,
    endTime,
    "23:59:59"
  );

  if (!start || !end) {
    return "upcoming";
  }

  const now = new Date();

  if (now < start) {
    return "upcoming";
  }

  if (now >= start && now <= end) {
    return "ongoing";
  }

  return "past";
};

// =========================================================
// EVENT STATUS LABEL
// =========================================================

const getStatusLabel = (status) => {
  if (status === "ongoing") {
    return "Ongoing";
  }

  if (status === "past") {
    return "Completed";
  }

  return "Upcoming";
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (value) => {
  const date = getDateString(value);

  if (!date) {
    return "Date unavailable";
  }

  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return "Date unavailable";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "Date unavailable";
  }

  const months = [
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

  return `${String(day).padStart(
    2,
    "0"
  )} ${months[month - 1]} ${year}`;
};

// =========================================================
// FORMAT TIME
// =========================================================

const formatTime = (value) => {
  const time = getTimeString(value);

  if (!time) {
    return "";
  }

  const match = time.match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return time;
  }

  let hour = Number(match[1]);

  const minute = match[2];

  if (
    Number.isNaN(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    return time;
  }

  const period =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
};

// =========================================================
// GET COMMITTEE IMAGE
// =========================================================

const getCommitteeImage = (member) => {
  return (
    member?.image_url ||
    member?.image ||
    member?.photo_url ||
    member?.photo ||
    ""
  );
};

// =========================================================
// GET EVENT IMAGE
// =========================================================

const getEventImage = (event) => {
  return (
    event?.image_url ||
    event?.image ||
    event?.banner_url ||
    event?.banner ||
    ""
  );
};

// =========================================================
// HOME COMPONENT
// =========================================================

function Home() {

  // =========================================================
  // USER AUTHENTICATION
  // =========================================================

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // =========================================================
  // COMMITTEE
  // =========================================================

  const [committeeMembers, setCommitteeMembers] =
    useState([]);

  const [committeeLoading, setCommitteeLoading] =
    useState(true);

  const [committeeError, setCommitteeError] =
    useState("");

  const [committeeIndex, setCommitteeIndex] =
    useState(0);

  // =========================================================
  // EVENTS
  // =========================================================

  const [events, setEvents] =
    useState([]);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [eventsError, setEventsError] =
    useState("");

  // =========================================================
  // CHECK USER LOGIN STATUS
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const checkUser = async () => {

      try {

        setAuthLoading(true);

        const response =
          await api.get(
            "/auth/profile"
          );

        if (!mounted) {
          return;
        }

        if (
          response.data?.success &&
          response.data?.user
        ) {

          setUser(
            response.data.user
          );

        } else {

          setUser(null);

        }

      } catch (error) {

        // 401 / 403 simply means
        // visitor is logged out.

        if (
          error.response?.status !== 401 &&
          error.response?.status !== 403
        ) {

          console.error(
            "Authentication check error:",
            error
          );

        }

        if (mounted) {
          setUser(null);
        }

      } finally {

        if (mounted) {
          setAuthLoading(false);
        }

      }

    };

    checkUser();

    return () => {
      mounted = false;
    };

  }, []);

  // =========================================================
  // LOAD COMMITTEE
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const loadCommittee = async () => {

      try {

        setCommitteeLoading(true);

        setCommitteeError("");

        const response =
          await api.get(
            "/committees"
          );

        if (!mounted) {
          return;
        }

        const data =
          response.data;

        let members = [];

        if (
          Array.isArray(
            data?.members
          )
        ) {

          members =
            data.members;

        } else if (
          Array.isArray(
            data?.data
          )
        ) {

          members =
            data.data;

        } else if (
          Array.isArray(data)
        ) {

          members = data;

        }

        setCommitteeMembers(
          members
        );

      } catch (error) {

        console.error(
          "Committee loading error:",
          error
        );

        if (mounted) {

          setCommitteeError(
            error.response?.data?.message ||
              "Unable to load committee members."
          );

        }

      } finally {

        if (mounted) {
          setCommitteeLoading(false);
        }

      }

    };

    loadCommittee();

    return () => {
      mounted = false;
    };

  }, []);

  // =========================================================
  // LOAD EVENTS
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const loadEvents = async () => {

      try {

        setEventsLoading(true);

        setEventsError("");

        const response =
          await api.get(
            "/events"
          );

        if (!mounted) {
          return;
        }

        const data =
          response.data;

        let eventList = [];

        if (
          Array.isArray(
            data?.events
          )
        ) {

          eventList =
            data.events;

        } else if (
          Array.isArray(
            data?.data
          )
        ) {

          eventList =
            data.data;

        } else if (
          Array.isArray(data)
        ) {

          eventList = data;

        }

        const normalizedEvents =
          eventList.map(
            (event) => ({
              ...event,

              status:
                getEventStatus(
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

        if (mounted) {

          setEventsError(
            error.response?.data?.message ||
              "Unable to load events."
          );

        }

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

  // =========================================================
  // AUTO COMMITTEE SLIDER
  // =========================================================

  useEffect(() => {

    if (
      committeeMembers.length <= 1
    ) {
      return undefined;
    }

    const interval =
      setInterval(() => {

        setCommitteeIndex(
          (previous) =>
            (previous + 1) %
            committeeMembers.length
        );

      }, 3500);

    return () => {
      clearInterval(interval);
    };

  }, [
    committeeMembers.length,
  ]);

  // =========================================================
  // COMMITTEE NAVIGATION
  // =========================================================

  const previousCommittee = () => {

    if (
      committeeMembers.length === 0
    ) {
      return;
    }

    setCommitteeIndex(
      (previous) => {

        if (previous === 0) {
          return (
            committeeMembers.length -
            1
          );
        }

        return previous - 1;

      }
    );

  };

  const nextCommittee = () => {

    if (
      committeeMembers.length === 0
    ) {
      return;
    }

    setCommitteeIndex(
      (previous) =>
        (previous + 1) %
        committeeMembers.length
    );

  };

  // =========================================================
  // CURRENT COMMITTEE MEMBER
  // =========================================================

  const currentCommittee =
    committeeMembers.length > 0
      ? committeeMembers[
          committeeIndex %
            committeeMembers.length
        ]
      : null;

  // =========================================================
  // HOME EVENTS
  // =========================================================

  const homeEvents = useMemo(() => {

    const upcoming =
      events.filter(
        (event) =>
          event.status !== "past"
      );

    upcoming.sort((a, b) => {

      const dateA =
        createEventDate(
          a.event_date,
          a.start_time,
          "00:00:00"
        );

      const dateB =
        createEventDate(
          b.event_date,
          b.start_time,
          "00:00:00"
        );

      if (!dateA && !dateB) {
        return 0;
      }

      if (!dateA) {
        return 1;
      }

      if (!dateB) {
        return -1;
      }

      return (
        dateA.getTime() -
        dateB.getTime()
      );

    });

    return upcoming.slice(0, 3);

  }, [events]);

  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="home-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-section">

        <div className="hero-background">

          <div className="hero-grid" />

          <div className="hero-glow hero-glow-one" />

          <div className="hero-glow hero-glow-two" />

        </div>

        <div className="hero-container">

          <div className="hero-content">

            <div className="hero-badge">

              <span className="badge-pulse" />

              Society of Neo Interventional
              Cardiovascular Technologists

            </div>

            <h1>

              Advancing

              <span>
                {" "}Cardiovascular Care
              </span>

              Through Innovation.

            </h1>

            <p className="hero-description">

              SNICT is dedicated to learning,
              education and professional
              collaboration, helping cardiovascular
              technologists stay connected with
              newer advances in the field of
              cardiology.

            </p>

            {/* =================================================
                HERO ACTIONS
            ================================================= */}

            <div className="hero-actions">

              {/* =================================================
                  BECOME MEMBER
                  ONLY FOR LOGGED OUT USERS

                  GOES TO SIGNUP
              ================================================= */}

              {!authLoading && !user && (

                <Link
                  to="/signup"
                  className="hero-primary-btn"
                >

                  Become a Member

                  <ArrowRight size={18} />

                </Link>

              )}

              <Link
                to="/about"
                className="hero-secondary-btn"
              >

                Discover SNICT

              </Link>

            </div>

            <div className="hero-meta">

              <div className="meta-item">

                <Activity size={17} />

                <span>
                  Innovation
                </span>

              </div>

              <div className="meta-divider" />

              <div className="meta-item">

                <GraduationCap size={17} />

                <span>
                  Education
                </span>

              </div>

              <div className="meta-divider" />

              <div className="meta-item">

                <Users size={17} />

                <span>
                  Collaboration
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="hero-visual">

            <div className="visual-orbit orbit-one" />

            <div className="visual-orbit orbit-two" />

            <div className="visual-orbit orbit-three" />

            <div className="medical-core">

              <div className="core-ring" />

              <div className="core-icon">

                <HeartPulse
                  size={105}
                  strokeWidth={1.25}
                />

              </div>

              <div className="core-pulse" />

            </div>

            <div className="medical-card medical-card-one">

              <div className="medical-card-icon">

                <HeartPulse size={19} />

              </div>

              <div>

                <strong>
                  Cardiovascular
                </strong>

                <span>
                  Technology
                </span>

              </div>

            </div>

            <div className="medical-card medical-card-two">

              <div className="medical-card-icon">

                <BrainCircuit size={19} />

              </div>

              <div>

                <strong>
                  Knowledge
                </strong>

                <span>
                  Sharing
                </span>

              </div>

            </div>

            <div className="medical-card medical-card-three">

              <Sparkles size={17} />

              <span>
                Innovation
              </span>

            </div>

          </div>

        </div>

        {/* =====================================================
            ECG
        ===================================================== */}

        <div className="hero-ecg">

          <svg
            viewBox="0 0 1600 150"
            preserveAspectRatio="none"
          >

            <polyline
              points="
                0,90
                160,90
                210,90
                240,90
                270,35
                300,125
                335,90
                480,90
                620,90
                660,90
                690,45
                720,120
                750,90
                900,90
                1040,90
                1080,90
                1110,30
                1140,130
                1170,90
                1320,90
                1460,90
                1600,90
              "
            />

          </svg>

        </div>

      </section>

      {/* =====================================================
          INTRO
      ===================================================== */}

      <section className="intro-section">

        <div className="section-container">

          <div className="section-heading">

            <span className="section-label">
              ABOUT SNICT
            </span>

            <h2>

              A community built around

              <span>
                {" "}cardiovascular excellence.
              </span>

            </h2>

            <p>

              SNICT was formed with the intention
              of learning and improving the knowledge
              of cardiovascular technologists in line
              with newer advances in cardiology.

            </p>

          </div>

          <div className="intro-highlight">

            <div className="highlight-line" />

            <p>

              Connecting professionals to discuss
              complicated procedures, techniques and
              experiences while creating opportunities
              to exchange ideas.

            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOCUS
      ===================================================== */}

      <section className="focus-section">

        <div className="section-container">

          <div className="focus-header">

            <div>

              <span className="section-label">
                OUR FOCUS
              </span>

              {/* =================================================
                  LOOPING TYPING ANIMATION
              ================================================= */}

              <h2 className="typing-heading">

                <TypingText
                  text="Learn. Innovate. Collaborate."
                  speed={85}
                  deleteSpeed={45}
                  pause={1800}
                />

              </h2>

            </div>

           

          </div>

          <div className="focus-grid">

            <article className="focus-card">

              <div className="focus-card-top">

                <div className="focus-icon">

                  <GraduationCap size={27} />

                </div>

                <span>
                  01
                </span>

              </div>

              <h3>
                Education
              </h3>

              <p>

                Supporting continuous learning and
                helping cardiovascular technologists
                understand newer treatment options
                and developments.

              </p>

              <Link to="/about">

                Explore education

                <ArrowRight size={16} />

              </Link>

            </article>

          

            <article className="focus-card">

              <div className="focus-card-top">

                <div className="focus-icon">

                  <Users size={27} />

                </div>

                <span>
                  02
                </span>

              </div>

              <h3>
                Collaboration
              </h3>

              <p>

                Bringing professionals together to
                discuss procedures, techniques and
                experiences while exchanging ideas.

              </p>

              <Link to="/team">

                Meet the community

                <ArrowRight size={16} />

              </Link>

            </article>

          </div>

        </div>

      </section>

      {/* =====================================================
          VISION
      ===================================================== */}

      <section className="vision-section">

        <div className="vision-glow" />

        <div className="section-container vision-container">

          <div className="vision-content">

            <span className="section-label">
              OUR VISION
            </span>

            <h2>

              Transforming cardiovascular care
              through

              <span>
                {" "}innovation, collaboration
                and excellence.
              </span>

            </h2>

            <p>

              Personalized, compassionate and
              cutting-edge interventions, supported
              by professional education and
              collaborative knowledge sharing.

            </p>

            <Link
              to="/about"
              className="vision-btn"
            >

              Explore Our Vision

              <ArrowRight size={18} />

            </Link>

          </div>

          <div className="vision-visual">

            <div className="vision-circle vision-circle-one" />

            <div className="vision-circle vision-circle-two" />

            <div className="vision-center">

              <Stethoscope size={55} />

              <span>
                SNICT
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          MISSION
      ===================================================== */}

      <section className="mission-section">

        <div className="section-container mission-container">

          <div className="mission-title">

            <span className="section-label">
              OUR MISSION
            </span>

            <h2>

              Advancing the field through

              <span>
                {" "}education & collaboration.
              </span>

            </h2>

          </div>

          <div className="mission-content">

            <p>

              To advance the field of cardiovascular
              interventions through innovation,
              education and collaboration, with a
              focus on improving patient outcomes
              and quality of life.

            </p>

            <Link
              to="/about"
              className="text-link"
            >

              Read our mission

              <ArrowRight size={17} />

            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          EVENTS
      ===================================================== */}

      <section className="home-events-section">

        <div className="section-container">

          <div className="home-events-header">

            <div>

              <span className="section-label">
                EVENTS & CME
              </span>

              {/* =================================================
                  LOOPING TYPING ANIMATION
              ================================================= */}

              <h2 className="typing-heading">

                <TypingText
                  text="Upcoming Events."
                  speed={85}
                  deleteSpeed={45}
                  pause={1800}
                />

              </h2>

              <p>

                Participate in professional meetings,
                educational programs and expert-led
                cardiovascular learning opportunities.

              </p>

            </div>

            <Link
              to="/events"
              className="home-events-view-all"
            >

              View All Events

              <ArrowRight size={17} />

            </Link>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {eventsLoading && (

            <div className="home-events-state">

              <CalendarDays size={32} />

              <p>
                Loading events...
              </p>

            </div>

          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!eventsLoading &&
            eventsError && (

              <div className="home-events-state error">

                <CalendarDays size={32} />

                <p>
                  {eventsError}
                </p>

              </div>

            )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!eventsLoading &&
            !eventsError &&
            homeEvents.length === 0 && (

              <div className="home-events-empty">

                <div className="home-events-empty-icon">

                  <CalendarDays size={35} />

                </div>

                <h3>
                  No upcoming events
                </h3>

                <p>

                  New SNICT events will appear
                  here when they are published.

                </p>

                <Link
                  to="/events"
                  className="home-events-empty-btn"
                >

                  Explore Events

                  <ArrowRight size={16} />

                </Link>

              </div>

            )}

          {/* =================================================
              EVENT CARDS
          ================================================= */}

          {!eventsLoading &&
            !eventsError &&
            homeEvents.length > 0 && (

              <div className="home-events-grid">

                {homeEvents.map((event) => {

                  const image =
                    getEventImage(event);

                  return (

                    <article
                      key={event.id}
                      className="home-event-card"
                    >

                      {/* IMAGE */}

                      <div className="home-event-image">

                        {image ? (

                          <img
                            src={image}
                            alt={
                              event.title ||
                              "SNICT Event"
                            }
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <div className="home-event-image-placeholder">

                            <CalendarDays size={42} />

                          </div>

                        )}

                        <span
                          className={`home-event-status ${event.status}`}
                        >

                          <span />

                          {getStatusLabel(
                            event.status
                          )}

                        </span>

                      </div>

                      {/* CONTENT */}

                      <div className="home-event-content">

                        <span className="home-event-type">

                          {event.event_type ||
                            "SNICT EVENT"}

                        </span>

                        <h3>

                          {event.title ||
                            "SNICT Event"}

                        </h3>

                        {event.doctor_name && (

                          <div className="home-event-doctor">

                            <UserRound size={15} />

                            <span>

                              {event.doctor_name}

                              {event.specialization
                                ? ` • ${event.specialization}`
                                : ""}

                            </span>

                          </div>

                        )}

                        <p>

                          {event.description ||
                            "Professional learning opportunity organised by SNICT."}

                        </p>

                        <div className="home-event-meta">

                          <span>

                            <CalendarDays size={15} />

                            {formatDate(
                              event.event_date
                            )}

                          </span>

                          {event.start_time && (

                            <span>

                              <Clock3 size={15} />

                              {formatTime(
                                event.start_time
                              )}

                              {event.end_time
                                ? ` - ${formatTime(
                                    event.end_time
                                  )}`
                                : ""}

                            </span>

                          )}

                          {event.venue && (

                            <span>

                              {event.event_mode ===
                              "online" ? (
                                <Video size={15} />
                              ) : (
                                <MapPin size={15} />
                              )}

                              {event.venue}

                            </span>

                          )}

                        </div>

                        <div className="home-event-bottom">

                          <div className="home-event-price">

                            {Number(event.price || 0) >
                            0 ? (
                              <>

                                <IndianRupee size={15} />

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

                          <Link
                            to={`/events/${event.id}`}
                            className="home-event-link"
                          >

                            View Event

                            <ArrowRight size={15} />

                          </Link>

                        </div>

                      </div>

                    </article>

                  );

                })}

              </div>

            )}

        </div>

      </section>

      {/* =====================================================
          COMMITTEE
      ===================================================== */}

      <section className="home-committee-section">

        <div className="section-container">

          <div className="home-committee-header">

            <div>

              <span className="section-label">
                OUR PEOPLE
              </span>

              {/* =================================================
                  LOOPING TYPING ANIMATION
              ================================================= */}

              <h2 className="typing-heading">

                <TypingText
                  text="Meet Our Committee."
                  speed={85}
                  deleteSpeed={45}
                  pause={1800}
                />

              </h2>

              <p>

                Meet the professionals working
                together to strengthen SNICT
                through education, innovation
                and collaboration.

              </p>

            </div>

            <Link
              to="/committees"
              className="home-committee-view-all"
            >

              View All Members

              <ArrowRight size={17} />

            </Link>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {committeeLoading && (

            <div className="home-committee-loading">

              <div className="home-loading-spinner" />

              <span>
                Loading committee members...
              </span>

            </div>

          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!committeeLoading &&
            committeeError && (

              <div className="home-committee-message">

                <Users size={30} />

                <p>
                  {committeeError}
                </p>

              </div>

            )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!committeeLoading &&
            !committeeError &&
            committeeMembers.length === 0 && (

              <div className="home-committee-message">

                <Users size={34} />

                <p>

                  Committee members will be
                  displayed here soon.

                </p>

              </div>

            )}

          {/* =================================================
              COMMITTEE SLIDER
          ================================================= */}

          {!committeeLoading &&
            !committeeError &&
            currentCommittee && (

              <div className="home-committee-slider">

                <button
                  type="button"
                  className="home-committee-arrow"
                  onClick={
                    previousCommittee
                  }
                  aria-label="Previous committee member"
                >

                  <ChevronLeft size={20} />

                </button>

                <article
                  className="home-committee-slide-card"
                  key={
                    currentCommittee.id ||
                    committeeIndex
                  }
                >

                  {/* IMAGE */}

                  <div className="home-committee-image">

                    {getCommitteeImage(
                      currentCommittee
                    ) ? (

                      <img
                        src={getCommitteeImage(
                          currentCommittee
                        )}
                        alt={
                          currentCommittee.name ||
                          "Committee member"
                        }
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />

                    ) : (

                      <div className="home-committee-placeholder">

                        <Users size={55} />

                      </div>

                    )}

                  </div>

                  {/* MEMBER CONTENT */}

                  <div className="home-committee-content">

                    <span className="home-committee-position">

                      {currentCommittee.position ||
                        currentCommittee.designation ||
                        currentCommittee.role ||
                        "Committee Member"}

                    </span>

                    <h3>

                      {currentCommittee.name ||
                        "Committee Member"}

                    </h3>

                    {currentCommittee.bio && (

                      <p>
                        {currentCommittee.bio}
                      </p>

                    )}

                    <Link
                      to="/committees"
                      className="home-committee-member-link"
                    >

                      View Committee

                      <ArrowRight size={16} />

                    </Link>

                  </div>

                </article>

                <button
                  type="button"
                  className="home-committee-arrow"
                  onClick={
                    nextCommittee
                  }
                  aria-label="Next committee member"
                >

                  <ChevronRight size={20} />

                </button>

              </div>

            )}

          {/* =================================================
              DOTS
          ================================================= */}

          {!committeeLoading &&
            committeeMembers.length > 1 && (

              <div className="home-committee-dots">

                {committeeMembers.map(
                  (member, index) => (

                    <button
                      key={
                        member.id ||
                        index
                      }
                      type="button"
                      className={
                        index ===
                        committeeIndex %
                          committeeMembers.length
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCommitteeIndex(
                          index
                        )
                      }
                      aria-label={`Committee member ${
                        index + 1
                      }`}
                    />

                  )
                )}

              </div>

            )}

          {/* =================================================
              BOTTOM
          ================================================= */}

          {!committeeLoading &&
            committeeMembers.length > 0 && (

              <div className="home-committee-bottom">

                <Link
                  to="/committees"
                  className="home-committee-button"
                >

                  View Complete Committee

                  <ArrowRight size={17} />

                </Link>

              </div>

            )}

        </div>

      </section>

      {/* =====================================================
          EVENTS CTA
      ===================================================== */}

      <section className="events-section">

        <div className="events-background">

          <div />
          <div />

        </div>

        <div className="section-container events-container">

          <div>

            <span className="section-label">
              EVENTS & CME
            </span>

            <h2>

              Connect.

              <span>
                {" "}Learn.
              </span>

              Advance.

            </h2>

            <p>

              Participate in meetings and professional
              learning opportunities designed around
              knowledge exchange and cardiovascular
              technology.

            </p>

          </div>

          <Link
            to="/events"
            className="events-btn"
          >

            Explore Events

            <ArrowRight size={18} />

          </Link>

        </div>

      </section>

      {/* =====================================================
          MEMBERSHIP CTA
      ===================================================== */}

      <section className="membership-cta">

        <div className="section-container membership-container">

          <div className="membership-content">

            <span className="section-label">
              JOIN SNICT
            </span>

            <h2>

              Be part of the

              <span>
                {" "}professional community.
              </span>

            </h2>

            <p>

              Connect with cardiovascular
              technologists and contribute to
              a community focused on learning,
              collaboration and advancing
              cardiovascular care.

            </p>

          </div>

          {/* =================================================
              CREATE ACCOUNT
              ONLY FOR LOGGED OUT USERS
          ================================================= */}

          {!authLoading && !user && (

            <Link
              to="/signup"
              className="membership-btn"
            >

              Create Your Account

              <ArrowRight size={18} />

            </Link>

          )}

        </div>

      </section>

    </main>

  );
}

export default Home;