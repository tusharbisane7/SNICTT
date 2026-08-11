import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Cpu,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  MapPin,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  Video,
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
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pause);
      }
    } else {
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

  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    return valueString;
  }

  if (valueString.includes("T")) {
    return valueString.substring(0, 10);
  }

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

  if (/^\d{1,2}:\d{2}/.test(valueString)) {
    return valueString.substring(0, 8);
  }

  if (valueString.includes("T")) {
    const time = valueString.split("T")[1];

    return time
      ? time.substring(0, 8)
      : "";
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
  const date =
    getDateString(eventDate);

  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    return null;
  }

  let time =
    getTimeString(eventTime);

  if (!time) {
    time = defaultTime;
  }

  if (
    /^\d{1,2}:\d{2}$/.test(time)
  ) {
    time = `${time}:00`;
  }

  const result =
    new Date(
      `${date}T${time}+05:30`
    );

  if (
    Number.isNaN(
      result.getTime()
    )
  ) {
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
  const start =
    createEventDate(
      eventDate,
      startTime,
      "00:00:00"
    );

  const end =
    createEventDate(
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

  if (
    now >= start &&
    now <= end
  ) {
    return "ongoing";
  }

  return "past";
};

// =========================================================
// EVENT STATUS LABEL
// =========================================================

const getStatusLabel = (
  status
) => {
  if (
    status === "ongoing"
  ) {
    return "Ongoing";
  }

  if (
    status === "past"
  ) {
    return "Completed";
  }

  return "Upcoming";
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (
  value
) => {
  const date =
    getDateString(value);

  if (!date) {
    return "Date unavailable";
  }

  const match =
    date.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return "Date unavailable";
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

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

const formatTime = (
  value
) => {
  const time =
    getTimeString(value);

  if (!time) {
    return "";
  }

  const match =
    time.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return time;
  }

  let hour =
    Number(match[1]);

  const minute =
    match[2];

  if (
    Number.isNaN(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    return time;
  }

  const period =
    hour >= 12
      ? "PM"
      : "AM";

  hour =
    hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
};

// =========================================================
// GET COMMITTEE IMAGE
// =========================================================
// Backend returns photoUrl
// Example:
// /uploads/committee/committee-123.jpg
// =========================================================

const getCommitteeImage = (member) => {
  const rawImage =
    member?.photoUrl ||
    member?.photo_url ||
    member?.image ||
    member?.image_url ||
    "";

  if (!rawImage) {
    return "";
  }

  // Backend already returned a complete URL
  if (
    rawImage.startsWith("http://") ||
    rawImage.startsWith("https://") ||
    rawImage.startsWith("data:")
  ) {
    return rawImage;
  }

  // Your API URL
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snict-backend.onrender.com/api";

  // Safely remove /api from the backend URL.
  // No regex required.
  let backendOrigin = apiUrl;

  if (backendOrigin.endsWith("/api")) {
    backendOrigin =
      backendOrigin.slice(
        0,
        backendOrigin.length - 4
      );
  }

  backendOrigin =
    backendOrigin.replace(/\/$/, "");

  // Make sure image path starts with /
  const cleanPath =
    rawImage.startsWith("/")
      ? rawImage
      : `/${rawImage}`;

  return `${backendOrigin}${cleanPath}`;
};

// =========================================================
// GET COMMITTEE NAME
// =========================================================
// IMPORTANT:
// Backend returns memberName
// =========================================================

const getCommitteeName = (
  member
) => {
  return (
    member?.committeeName ||
    member?.committee_name ||
    "SNICT Committee"
  );
};

// =========================================================
// GET MEMBER NAME
// Backend returns: memberName
// =========================================================

const getMemberName = (
  member
) => {
  return (
    member?.memberName ||
    member?.member_name ||
    member?.name ||
    "Committee Member"
  );
};

// =========================================================
// GET COMMITTEE DESIGNATION
// =========================================================

const getCommitteeDesignation = (
  member
) => {
  return (
    member?.designation ||
    member?.position ||
    member?.role ||
    "Committee Member"
  );
};

// =========================================================
// GET EVENT IMAGE
// =========================================================

const getEventImage = (
  event
) => {
  return (
    event?.image_url ||
    event?.image ||
    event?.banner_url ||
    event?.banner ||
    ""
  );
};


// =========================================================
// GET SLIDER IMAGE
// =========================================================
// Supports the upload response field used by the backend.
// Falls back to older field names so existing slider records
// continue to work.
// =========================================================

const getSliderImage = (slider) => {
  return (
    slider?.imageUrl ||
    slider?.image_url ||
    slider?.image ||
    slider?.url ||
    ""
  );
};

// =========================================================
// FORMAT SLIDER DATE
// =========================================================

const formatSliderDate = (value) => {
  if (!value) return "";

  const dateString = getDateString(value);

  if (!dateString) return "";

  const match = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =========================================================
// HOME COMPONENT
// =========================================================

function Home() {

  // =========================================================
  // USER AUTHENTICATION
  // =========================================================

  const [user, setUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // =========================================================
  // COMMITTEE
  // =========================================================

  const [
    committeeMembers,
    setCommitteeMembers,
  ] = useState([]);

  const [
    committeeLoading,
    setCommitteeLoading,
  ] = useState(true);

  const [
    committeeError,
    setCommitteeError,
  ] = useState("");

  // =========================================================
  // EVENTS
  // =========================================================

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    eventsLoading,
    setEventsLoading,
  ] = useState(true);

  const [
    eventsError,
    setEventsError,
  ] = useState("");

  // =========================================================
  // HOME SLIDER
  // =========================================================

  const [
    sliders,
    setSliders,
  ] = useState([]);

  const [
    slidersLoading,
    setSlidersLoading,
  ] = useState(true);

  const [
    slidersError,
    setSlidersError,
  ] = useState("");

  // =========================================================
  // CHECK USER LOGIN STATUS
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const checkUser =
      async () => {

        try {

          setAuthLoading(
            true
          );

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

          if (
            error.response?.status !==
              401 &&
            error.response?.status !==
              403
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
            setAuthLoading(
              false
            );
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

    const loadCommittee =
      async () => {

        try {

          setCommitteeLoading(
            true
          );

          setCommitteeError(
            ""
          );

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

            members =
              data;

          }

          // =================================================
          // ONLY ACTIVE MEMBERS ARE EXPECTED FROM API
          // SORT AGAIN SAFELY ON FRONTEND
          // =================================================

          const activeMembers =
            members.filter(
              (member) =>
                member?.isActive !== false
            );

          activeMembers.sort(
            (a, b) => {

              const orderA =
                Number(
                  a?.displayOrder ??
                    a?.display_order ??
                    0
                );

              const orderB =
                Number(
                  b?.displayOrder ??
                    b?.display_order ??
                    0
                );

              if (
                orderA !==
                orderB
              ) {
                return (
                  orderA -
                  orderB
                );
              }

              return (
                Number(
                  a?.id || 0
                ) -
                Number(
                  b?.id || 0
                )
              );

            }
          );

          setCommitteeMembers(
            activeMembers
          );

        } catch (error) {

          console.error(
            "Committee loading error:",
            error
          );

          if (mounted) {

            setCommitteeError(
              error.response?.data
                ?.message ||
                "Unable to load committee members."
            );

          }

        } finally {

          if (mounted) {
            setCommitteeLoading(
              false
            );
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

    const loadEvents =
      async () => {

        try {

          setEventsLoading(
            true
          );

          setEventsError(
            ""
          );

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

            eventList =
              data;

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
              error.response?.data
                ?.message ||
                "Unable to load events."
            );

          }

        } finally {

          if (mounted) {
            setEventsLoading(
              false
            );
          }

        }

      };

    loadEvents();

    return () => {
      mounted = false;
    };

  }, []);

  // =========================================================
  // LOAD HOME SLIDERS
  // =========================================================
  // Public endpoint: GET /sliders
  // Only published sliders should be returned by the backend.
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const loadSliders = async () => {

      try {

        setSlidersLoading(true);
        setSlidersError("");

        const response = await api.get("/sliders");

        if (!mounted) {
          return;
        }

        const data = response.data;

        let sliderList = [];

        if (Array.isArray(data?.sliders)) {
          sliderList = data.sliders;
        } else if (Array.isArray(data?.data)) {
          sliderList = data.data;
        } else if (Array.isArray(data)) {
          sliderList = data;
        }

        // Keep only published slides on the frontend as a safety check.
        const publishedSliders = sliderList
          .filter((slider) => slider?.published !== false)
          .sort((a, b) => {
            const orderA = Number(
              a?.displayOrder ??
                a?.display_order ??
                0
            );

            const orderB = Number(
              b?.displayOrder ??
                b?.display_order ??
                0
            );

            if (orderA !== orderB) {
              return orderA - orderB;
            }

            return (
              Number(a?.id || 0) -
              Number(b?.id || 0)
            );
          });

        setSliders(publishedSliders);

      } catch (error) {

        console.error(
          "Slider loading error:",
          error
        );

        if (mounted) {
          setSlidersError(
            error.response?.data?.message ||
            "Unable to load homepage slider."
          );
        }

      } finally {

        if (mounted) {
          setSlidersLoading(false);
        }

      }

    };

    loadSliders();

    return () => {
      mounted = false;
    };

  }, []);

  // =========================================================
  // HOME EVENTS
  // =========================================================

  const homeEvents =
    useMemo(() => {

      const upcoming =
        events.filter(
          (event) =>
            event.status !==
            "past"
        );

      upcoming.sort(
        (a, b) => {

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

          if (
            !dateA &&
            !dateB
          ) {
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

        }
      );

      return upcoming.slice(
        0,
        3
      );

    }, [events]);

  // =========================================================
  // HOME SLIDER CAROUSEL DATA
  // =========================================================
  // Duplicate the slides for a seamless CSS marquee loop.
  // =========================================================

  const sliderCarouselItems =
    useMemo(() => {

      if (sliders.length === 0) {
        return [];
      }

      // Two copies are enough for the continuous track.
      return [
        ...sliders,
        ...sliders,
      ];

    }, [sliders]);

  // =========================================================
  // COMMITTEE CAROUSEL DATA
  // =========================================================
  // Duplicate the members so CSS can create a seamless
  // infinite scrolling effect.
  // =========================================================

  const committeeCarouselMembers =
    useMemo(() => {

      if (
        committeeMembers.length ===
        0
      ) {
        return [];
      }

      return [
        ...committeeMembers,
        ...committeeMembers,
      ];

    }, [
      committeeMembers,
    ]);

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

            <div className="hero-actions">

              {!authLoading &&
                !user && (

                  <Link
                    to="/signup"
                    className="hero-primary-btn"
                  >

                    Become a Member

                    <ArrowRight
                      size={18}
                    />

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

                <GraduationCap
                  size={17}
                />

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

          {/* HERO VISUAL */}

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

            <div className="medical-orbit">

              <div className="medical-card medical-card-one">

                <div className="medical-card-icon">
                  <Sparkles size={19} />
                </div>

                <div>

                  <strong>
                    New Generation
                  </strong>

                  <span>
                    Healthcare
                  </span>

                </div>

              </div>

              <div className="medical-card medical-card-two">

                <div className="medical-card-icon">
                  <Award size={19} />
                </div>

                <div>

                  <strong>
                    Excellence
                  </strong>

                  <span>
                    In Practice
                  </span>

                </div>

              </div>

              <div className="medical-card medical-card-three">

                <div className="medical-card-icon">
                  <BriefcaseBusiness
                    size={19}
                  />
                </div>

                <div>

                  <strong>
                    Opportunity
                  </strong>

                  <span>
                    To Grow
                  </span>

                </div>

              </div>

              <div className="medical-card medical-card-four">

                <div className="medical-card-icon">
                  <Cpu size={19} />
                </div>

                <div>

                  <strong>
                    Technology
                  </strong>

                  <span>
                    For Tomorrow
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

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

                  <GraduationCap
                    size={27}
                  />

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

      {/* <section className="vision-section">

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

      </section> */}

      {/* =====================================================
          HOME PAGE SLIDER
          Loaded from backend and continuously auto-scrolling
          ===================================================== */}

      {!slidersLoading &&
        !slidersError &&
        sliders.length > 0 && (

          <section className="home-slider-section">

            <div className="section-container">

              <div className="home-slider-header">

                <div>

                  <span className="section-label">
                    SNICT UPDATES
                  </span>

                  <h2>
                    Latest Updates & Highlights.
                  </h2>

                  <p>
                    Stay updated with the latest
                    announcements, programs and
                    activities from SNICT.
                  </p>

                </div>

              </div>

              <div className="home-slider-wrapper">

                <div className="home-slider-track">

                  {sliderCarouselItems.map(
                    (slider, index) => {

                      const image =
                        getSliderImage(slider);

                      const date =
                        formatSliderDate(
                          slider?.slideDate ||
                          slider?.slide_date
                        );

                      return (

                        <article
                          className="home-slider-card"
                          key={`${slider.id || "slider"}-${index}`}
                        >

                          <div className="home-slider-image">

                            {image ? (

                              <img
                                src={image}
                                alt={
                                  slider.title ||
                                  "SNICT Update"
                                }
                                loading={
                                  index < 2
                                    ? "eager"
                                    : "lazy"
                                }
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  const parent =
                                    event.currentTarget
                                      .parentElement;

                                  if (parent) {
                                    parent.classList.add(
                                      "home-slider-image-error"
                                    );
                                  }
                                }}
                              />

                            ) : (

                              <div className="home-slider-image-placeholder">
                                <Activity size={48} />
                              </div>

                            )}

                          </div>

                          <div className="home-slider-content">

                            {date && (

                              <span className="home-slider-date">

                                <CalendarDays
                                  size={14}
                                />

                                {date}

                              </span>

                            )}

                            <h3>
                              {slider.title ||
                                "SNICT Update"}
                            </h3>

                            {slider.description && (

                              <p>
                                {slider.description}
                              </p>

                            )}

                          </div>

                        </article>

                      );

                    }
                  )}

                </div>

              </div>

            </div>

          </section>

        )}

      {!slidersLoading &&
        slidersError && (

          <section className="home-slider-section">

            <div className="section-container">

              <div className="home-slider-message">

                <Activity size={25} />

                <span>
                  {slidersError}
                </span>

              </div>

            </div>

          </section>

        )}

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

          {eventsLoading && (

            <div className="home-events-state">

              <CalendarDays size={32} />

              <p>
                Loading events...
              </p>

            </div>

          )}

          {!eventsLoading &&
            eventsError && (

              <div className="home-events-state error">

                <CalendarDays size={32} />

                <p>
                  {eventsError}
                </p>

              </div>

            )}

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

          {!eventsLoading &&
            !eventsError &&
            homeEvents.length > 0 && (

              <div className="home-events-grid">

                {homeEvents.map(
                  (event) => {

                    const image =
                      getEventImage(
                        event
                      );

                    return (

                      <article
                        key={event.id}
                        className="home-event-card"
                      >

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

                              <CalendarDays
                                size={42}
                              />

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

                              <UserRound
                                size={15}
                              />

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

                              <CalendarDays
                                size={15}
                              />

                              {formatDate(
                                event.event_date
                              )}

                            </span>

                            {event.start_time && (

                              <span>

                                <Clock3
                                  size={15}
                                />

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
                                  <Video
                                    size={15}
                                  />
                                ) : (
                                  <MapPin
                                    size={15}
                                  />
                                )}

                                {event.venue}

                              </span>

                            )}

                          </div>

                          <div className="home-event-bottom">

                            <div className="home-event-price">

                              {Number(
                                event.price ||
                                  0
                              ) > 0 ? (
                                <>

                                  <IndianRupee
                                    size={15}
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

                            <Link
                              to={`/events/${event.id}`}
                              className="home-event-link"
                            >

                              View Event

                              <ArrowRight
                                size={15}
                              />

                            </Link>

                          </div>

                        </div>

                      </article>

                    );

                  }
                )}

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

            {/* <Link
              to="/committees"
              className="home-committee-view-all"
            >

              View All Members

              <ArrowRight size={17} />

            </Link> */}

          </div>

          {/* =================================================
              COMMITTEE LOADING
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
              COMMITTEE ERROR
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
              COMMITTEE EMPTY
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
              CONTINUOUS COMMITTEE CAROUSEL
          ================================================= */}

          {!committeeLoading &&
            !committeeError &&
            committeeMembers.length > 0 && (

              <div className="committee-carousel-wrapper">

                <div className="committee-carousel">

                  <div className="committee-track">

                    {committeeCarouselMembers.map(
                      (
                        member,
                        index
                      ) => {

                        const image =
                          getCommitteeImage(
                            member
                          );

                        const committeeName =
                          getCommitteeName(
                            member
                          );

                        const memberName =
                          getMemberName(
                            member
                          );

                        const designation =
                          getCommitteeDesignation(
                            member
                          );

                        return (

                          <article
                            className="committee-member-card"
                            key={`${member.id || "member"}-${index}`}
                          >

                            {/* PROFILE IMAGE */}

                            <div className="committee-member-image">

                              {image ? (

                                <img
                                  src={image}
                                  alt={memberName}
                                  loading="lazy"
                                  onError={(
                                    e
                                  ) => {
                                    console.warn(
                                      "Committee image failed to load:",
                                      image
                                    );

                                    e.currentTarget.style.display =
                                      "none";

                                    const parent =
                                      e.currentTarget.parentElement;

                                    if (parent) {
                                      parent.classList.add(
                                        "committee-member-image-error"
                                      );
                                    }
                                  }}
                                />

                              ) : (

                                <div className="committee-member-image-placeholder">

                                  <Users
                                    size={55}
                                  />

                                </div>

                              )}

                            </div>

                            {/* MEMBER INFORMATION */}

                            <div className="committee-member-info">

                              {/* COMMITTEE NAME */}

                              <span className="committee-member-committee">

                                {committeeName}

                              </span>

                              {/* DESIGNATION */}

                              <span className="committee-member-designation">

                                {designation}

                              </span>

                              {/* MEMBER NAME */}

                              <h3>

                                {memberName}

                              </h3>

                            </div>

                          </article>

                        );

                      }
                    )}

                  </div>

                </div>

              </div>

            )}

          {/* =================================================
              COMMITTEE BOTTOM
          ================================================= */}

          {!committeeLoading &&
            !committeeError &&
            committeeMembers.length > 0 && (

              <div className="home-committee-bottom">

                {/* <Link
                  to="/committees"
                  className="home-committee-button"
                >

                  View Complete Committee

                  <ArrowRight size={17} />

                </Link> */}

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

          {!authLoading &&
            !user && (

              <Link
                to="/signup"
                className="membership-btn"
              >

                Create Your Account

                <ArrowRight
                  size={18}
                />

              </Link>

            )}

        </div>

      </section>

    </main>

  );
}

export default Home;