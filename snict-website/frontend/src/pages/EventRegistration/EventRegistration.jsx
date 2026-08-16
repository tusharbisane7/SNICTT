import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import "./EventRegistration.css";


// =========================================================
// DATE FORMATTER
// =========================================================

const formatDate = (date) => {
  if (!date) {
    return "Date not available";
  }

  const value = String(date).slice(0, 10);

  const [year, month, day] =
    value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString(
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
// TIME FORMATTER
// =========================================================

const formatTime = (time) => {
  if (!time) {
    return "";
  }

  const [h, minute] =
    String(time)
      .slice(0, 5)
      .split(":");

  let hour = Number(h);

  if (Number.isNaN(hour)) {
    return String(time);
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
// FILE SIZE FORMATTER
// =========================================================

const formatSize = (bytes) => {
  if (!bytes) {
    return "";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let value = Number(bytes);
  let index = 0;

  while (
    value >= 1024 &&
    index < units.length - 1
  ) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(
    value >= 10 || index === 0
      ? 0
      : 1
  )} ${units[index]}`;
};


// =========================================================
// COMPONENT
// =========================================================

function EventRegistration() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();


  // =======================================================
  // STATE
  // =======================================================

  const [event, setEvent] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fileError, setFileError] =
    useState("");

  const [
    presentationFile,
    setPresentationFile,
  ] = useState(null);


  // =======================================================
  // LOAD EVENT + USER PROFILE
  // =======================================================

  useEffect(() => {

    if (!id) {

      setError(
        "Invalid event."
      );

      setLoading(false);

      return;
    }

    loadRegistrationData();

  }, [id]);


  // =======================================================
  // LOAD DATA
  // =======================================================

  const loadRegistrationData =
    async () => {

      try {

        setLoading(true);
        setError("");

        const [
          eventResponse,
          profileResponse,
        ] = await Promise.all([

          api.get(
            `/events/${id}`
          ),

          api.get(
            "/auth/profile"
          ),

        ]);


        // =================================================
        // EVENT
        // =================================================

        const eventData =
          eventResponse?.data;

        if (
          !eventData?.success ||
          !eventData?.event
        ) {

          setError(
            "Event not found."
          );

          return;
        }


        // =================================================
        // PROFILE
        // =================================================

        const profileData =
          profileResponse?.data;

        if (
          !profileData?.success ||
          !profileData?.user
        ) {

          navigate(
            "/login",
            {
              state: {
                from:
                  `/events/registration/${id}`,
              },
            }
          );

          return;
        }


        setEvent(
          eventData.event
        );

        setProfile(
          profileData.user
        );

      } catch (err) {

        console.error(
          "Event registration loading error:",
          err
        );


        // =================================================
        // LOGIN REQUIRED
        // =================================================

        if (
          err.response?.status === 401
        ) {

          navigate(
            "/login",
            {
              state: {
                from:
                  `/events/registration/${id}`,
              },
            }
          );

          return;
        }


        setError(
          err.response?.data?.message ||
          "Unable to load registration details."
        );

      } finally {

        setLoading(false);

      }
    };


  // =======================================================
  // USER DETAILS
  // =======================================================

  const name =
    profile?.full_name ||
    profile?.fullName ||
    profile?.name ||
    "Not available";

  const email =
    profile?.email ||
    "Not available";

  const mobile =
    profile?.mobile ||
    profile?.phone ||
    "Not available";

  const username =
    profile?.username ||
    "Not available";


  // =======================================================
  // EVENT PRICE
  // =======================================================

  const price =
    Number(
      event?.price || 0
    );


  // =======================================================
  // AVAILABLE SLOTS
  // =======================================================

  const availableSlots =
    event?.available_slots != null
      ? Number(
          event.available_slots
        )
      : event?.max_slots != null
        ? Number(
            event.max_slots
          )
        : null;


  const isFull =
    availableSlots !== null &&
    !Number.isNaN(
      availableSlots
    ) &&
    availableSlots <= 0;


  // =======================================================
  // REGISTRATION ENABLED
  // =======================================================

  const registrationEnabled =
    event?.booking_enabled === true ||
    event?.booking_enabled === "true" ||
    event?.booking_enabled === 1 ||
    event?.booking_enabled === "1";


  // =======================================================
  // FILE VALIDATION
  // =======================================================

  const handleFileChange =
    (e) => {

      setFileError("");

      const file =
        e.target.files?.[0];


      // ===================================================
      // NO FILE
      // ===================================================

      if (!file) {

        setPresentationFile(
          null
        );

        return;
      }


      // ===================================================
      // ALLOWED EXTENSIONS
      // ===================================================

      const fileName =
        String(file.name || "").toLowerCase();

      const allowedExtensions = [
        ".pdf",
        ".ppt",
        ".pptx",
      ];


      // ===================================================
      // ALLOWED MIME TYPES
      // ===================================================

      const allowedMimeTypes = [

        "application/pdf",

        "application/vnd.ms-powerpoint",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // Some browsers may provide
        // an empty MIME type.
        "",

      ];


      const extensionAllowed =
        allowedExtensions.some(
          (extension) =>
            fileName.endsWith(
              extension
            )
        );


      const mimeAllowed =
        allowedMimeTypes.includes(
          file.type || ""
        );


      if (
        !extensionAllowed ||
        !mimeAllowed
      ) {

        e.target.value = "";

        setPresentationFile(
          null
        );

        setFileError(
          "Only PDF, PPT and PPTX files are allowed."
        );

        return;
      }


      // ===================================================
      // MAXIMUM 20 MB
      // ===================================================

      if (
        file.size >
        20 * 1024 * 1024
      ) {

        e.target.value = "";

        setPresentationFile(
          null
        );

        setFileError(
          "Presentation file must be 20 MB or smaller."
        );

        return;
      }


      setPresentationFile(
        file
      );

    };


  // =======================================================
  // REMOVE PRESENTATION
  // =======================================================

  const removePresentation =
    () => {

      setPresentationFile(
        null
      );

      setFileError("");

    };


  // =======================================================
  // SUBMIT REGISTRATION
  // =======================================================

  const submitRegistration =
    async () => {

      if (
        submitting ||
        !event ||
        isFull
      ) {
        return;
      }


      // ===================================================
      // REQUIRED USER DETAILS
      // ===================================================

      if (
        !name ||
        name === "Not available" ||
        !email ||
        email === "Not available" ||
        !mobile ||
        mobile === "Not available"
      ) {

        setError(
          "Your profile is missing required contact details. Please update your profile before registering."
        );

        return;
      }


      // ===================================================
      // EVENT STATUS
      // ===================================================

      if (
        event.status === "past"
      ) {

        setError(
          "Registration for this event is closed."
        );

        return;
      }


      if (
        event.status === "ongoing"
      ) {

        setError(
          "Registration is closed because this event is currently ongoing."
        );

        return;
      }


      // ===================================================
      // REGISTRATION STATUS
      // =====================================================

      if (
        !registrationEnabled
      ) {

        setError(
          "Registration is currently unavailable for this event."
        );

        return;
      }


      try {

        setSubmitting(true);
        setError("");


        // =================================================
        // FORM DATA
        // =================================================

        const formData =
          new FormData();


        // =================================================
        // USER DETAILS
        //
        // These are taken from the authenticated
        // SNICT profile.
        //
        // Backend should primarily identify the user
        // using req.userId from JWT.
        // =================================================

        formData.append(
          "name",
          String(name).trim()
        );

        formData.append(
          "email",
          String(email).trim()
        );

        formData.append(
          "phone",
          String(mobile).trim()
        );


        // =================================================
        // OPTIONAL PRESENTATION
        // =================================================

        if (
          presentationFile
        ) {

          formData.append(
            "presentation",
            presentationFile,
            presentationFile.name
          );

        }


        // =================================================
        // CREATE EVENT BOOKING
        // =================================================

        const response =
          await api.post(
            `/events/${id}/register`,
            formData,
            {
              withCredentials: true,
            }
          );


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to create registration."
          );

        }


        // =================================================
        // GET BOOKING
        // =================================================

        const booking =
          response.data?.booking ||
          null;


        const bookingId =
          booking?.id ||
          booking?.booking_id ||
          response.data?.bookingId ||
          response.data?.booking_id;


        // =================================================
        // BOOKING ID REQUIRED
        // =================================================

        if (!bookingId) {

          setError(
            "Registration was created, but no booking ID was returned by the server."
          );

          return;
        }


        // =================================================
        // REDIRECT TO EVENT BOOKING / PAYMENT PAGE
        //
        // IMPORTANT:
        //
        // Use BOOKING ID.
        //
        // Example:
        //
        // Event ID  = 6
        // Booking ID = 25
        //
        // Redirect:
        //
        // /events/booking/25
        //
        // =================================================

        navigate(
          `/events/booking/${bookingId}`,
          {
            state: {
              booking,
              event,
              profile,
            },
          }
        );

      } catch (err) {

        console.error(
          "Event registration error:",
          err
        );


        // =================================================
        // LOGIN REQUIRED
        // =================================================

        if (
          err.response?.status === 401
        ) {

          navigate(
            "/login",
            {
              state: {
                from:
                  `/events/registration/${id}`,
              },
            }
          );

          return;
        }


        // =================================================
        // ALREADY REGISTERED
        // =================================================

        if (
          err.response?.status === 409
        ) {

          const existingBooking =
            err.response?.data?.booking;


          if (
            existingBooking?.id
          ) {

            setError(
              "You are already registered for this event. Opening your existing booking..."
            );


            setTimeout(
              () => {

                navigate(
                  `/events/booking/${existingBooking.id}`,
                  {
                    state: {
                      booking:
                        existingBooking,

                      event,

                      profile,
                    },
                  }
                );

              },
              700
            );

            return;
          }

        }


        // =================================================
        // SERVER MESSAGE
        // =================================================

        const serverMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data?.debug;


        setError(
          serverMessage ||
          err.message ||
          "Unable to complete event registration."
        );

      } finally {

        setSubmitting(false);

      }

    };


  // =======================================================
  // LOADING PAGE
  // =======================================================

  if (loading) {

    return (
      <main
        className="event-registration-page"
      >

        <div
          className="event-registration-loading"
        >

          <LoaderCircle
            size={40}
            className="event-registration-loader"
          />

          <h2>
            Loading registration...
          </h2>

          <p>
            Please wait while we
            load your details.
          </p>

        </div>

      </main>
    );

  }


  // =======================================================
  // ERROR / NO DATA
  // =======================================================

  if (
    !event ||
    !profile
  ) {

    return (
      <main
        className="event-registration-page"
      >

        <div
          className="event-registration-error"
        >

          <X
            size={42}
          />

          <h2>
            Unable to continue
          </h2>

          <p>
            {error ||
              "Registration details could not be loaded."}
          </p>


          <Link
            to={`/events/${id}`}
            className="event-registration-back"
          >

            <ArrowLeft
              size={17}
            />

            Back to Event

          </Link>

        </div>

      </main>
    );

  }


  // =======================================================
  // MAIN PAGE
  // =======================================================

  return (
    <main
      className="event-registration-page"
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <header
        className="event-registration-header"
      >

        <Link
          to={`/events/${id}`}
          className="event-registration-back-link"
        >

          <ArrowLeft
            size={17}
          />

          Back to Event

        </Link>


        <div
          className="event-registration-heading"
        >

          <span>
            EVENT REGISTRATION
          </span>

          <h1>
            Preview Your Registration
          </h1>

          <p>
            Review your registered details
            and optionally upload your
            presentation before continuing
            to payment.
          </p>

        </div>

      </header>


      {/* ===================================================
          CONTAINER
      =================================================== */}

      <section
        className="event-registration-container"
      >


        {/* =================================================
            EVENT CARD
        ================================================= */}

        <article
          className="event-registration-event-card"
        >

          <span
            className="event-registration-event-label"
          >
            EVENT
          </span>


          <h2>
            {event.title}
          </h2>


          <div
            className="event-registration-event-meta"
          >

            <span>

              <CalendarDays
                size={17}
              />

              {formatDate(
                event.event_date
              )}

            </span>


            <span>

              <Clock3
                size={17}
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


            <span>

              <MapPin
                size={17}
              />

              {event.venue ||
                event.event_mode ||
                "Venue not specified"}

            </span>

          </div>

        </article>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="event-registration-alert"
          >

            <X
              size={18}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            USER DETAILS
        ================================================= */}

        <section
          className="event-registration-section"
        >

          <div
            className="event-registration-section-heading"
          >

            <div
              className="event-registration-section-icon"
            >

              <UserRound
                size={20}
              />

            </div>


            <div>

              <span>
                YOUR DETAILS
              </span>

              <h2>
                Registration Information
              </h2>

            </div>

          </div>


          <div
            className="event-registration-details-grid"
          >

            <Detail
              label="FULL NAME"
              value={name}
            />


            <Detail
              label="USERNAME"
              value={username}
            />


            <Detail
              label="EMAIL"
              value={email}
            />


            <Detail
              label="MOBILE"
              value={mobile}
            />


            {profile.age != null && (

              <Detail
                label="AGE"
                value={profile.age}
              />

            )}


            {profile.sex && (

              <Detail
                label="SEX"
                value={profile.sex}
              />

            )}


            {profile.blood_group && (

              <Detail
                label="BLOOD GROUP"
                value={
                  profile.blood_group
                }
              />

            )}


            {profile.designation && (

              <Detail
                label="DESIGNATION"
                value={
                  profile.designation
                }
              />

            )}

          </div>

        </section>


        {/* =================================================
            OPTIONAL PRESENTATION
        ================================================= */}

        <section
          className="event-registration-section"
        >

          <div
            className="event-registration-section-heading"
          >

            <div
              className="event-registration-section-icon"
            >

              <FileText
                size={20}
              />

            </div>


            <div>

              <span>
                OPTIONAL
              </span>

              <h2>
                Presentation / Document
              </h2>

            </div>

          </div>


          <p
            className="event-registration-upload-description"
          >
            Upload a presentation if you
            want to share it with the event
            organisers. This is optional.
          </p>


          {!presentationFile ? (

            <label
              className="event-registration-upload-box"
            >

              <input
                type="file"
                accept="
                  .pdf,
                  .ppt,
                  .pptx,
                  application/pdf,
                  application/vnd.ms-powerpoint,
                  application/vnd.openxmlformats-officedocument.presentationml.presentation
                "
                onChange={
                  handleFileChange
                }
              />


              <Upload
                size={30}
              />


              <strong>
                Upload Presentation
              </strong>


              <span>
                PDF, PPT or PPTX
                {" • "}
                Maximum 20 MB
              </span>

            </label>

          ) : (

            <div
              className="event-registration-file"
            >

              <div
                className="event-registration-file-icon"
              >

                <FileText
                  size={22}
                />

              </div>


              <div
                className="event-registration-file-info"
              >

                <strong>
                  {presentationFile.name}
                </strong>

                <span>
                  {formatSize(
                    presentationFile.size
                  )}
                </span>

              </div>


              <button
                type="button"
                className="event-registration-file-remove"
                onClick={
                  removePresentation
                }
                aria-label="Remove presentation"
              >

                <X
                  size={18}
                />

              </button>

            </div>

          )}


          {fileError && (

            <div
              className="event-registration-file-error"
            >

              <X
                size={16}
              />

              {fileError}

            </div>

          )}

        </section>


        {/* =================================================
            REGISTRATION SUMMARY
        ================================================= */}

        <section
          className="event-registration-summary"
        >

          <div>

            <span>
              REGISTRATION FEE
            </span>


            <strong>

              {price > 0 ? (

                <>
                  <IndianRupee
                    size={22}
                  />

                  {price.toLocaleString(
                    "en-IN"
                  )}
                </>

              ) : (

                "FREE"

              )}

            </strong>

          </div>


          <div>

            <span>
              PRESENTATION
            </span>


            <strong>
              {presentationFile
                ? "Attached"
                : "Not attached"}
            </strong>

          </div>


          {availableSlots !== null && (

            <div>

              <span>
                AVAILABLE SLOTS
              </span>

              <strong>
                {availableSlots}
              </strong>

            </div>

          )}

        </section>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="event-registration-actions"
        >

          <Link
            to={`/events/${id}`}
            className="event-registration-cancel"
          >

            <ArrowLeft
              size={17}
            />

            Cancel

          </Link>


          <button
            type="button"
            className="event-registration-submit"
            onClick={
              submitRegistration
            }
            disabled={
              submitting ||
              isFull ||
              !registrationEnabled
            }
          >

            {submitting ? (

              <>

                <LoaderCircle
                  size={18}
                  className="event-registration-loader"
                />

                Creating Registration...

              </>

            ) : (

              <>

                Continue to Payment

                <ArrowRight
                  size={18}
                />

              </>

            )}

          </button>

        </div>


        {/* =================================================
            NOTE
        ================================================= */}

        <div
          className="event-registration-note"
        >

          <CheckCircle2
            size={18}
          />

          <span>
            Your profile details are taken
            from your registered SNICT account.
            Review them carefully before
            continuing to payment.
          </span>

        </div>


      </section>

    </main>
  );
}


// =========================================================
// DETAIL COMPONENT
// =========================================================

function Detail({
  label,
  value,
}) {

  return (

    <div
      className="event-registration-detail"
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );
}


// =========================================================
// EXPORT
// =========================================================

export default EventRegistration;