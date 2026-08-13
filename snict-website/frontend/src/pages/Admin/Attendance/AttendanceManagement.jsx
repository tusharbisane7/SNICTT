import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  QrCode,
  ScanLine,
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  TicketCheck,
  Keyboard,
  Camera,
  CameraOff,
  ShieldCheck,
} from "lucide-react";

import api from "../../../services/api";

import "./AttendanceManagement.css";


// =========================================================
// ATTENDANCE MANAGEMENT
// =========================================================

function AttendanceManagement() {

  // =======================================================
  // STATE
  // =======================================================

  const [events, setEvents] =
    useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [attendance, setAttendance] =
    useState([]);

  const [stats, setStats] =
    useState({
      total: 0,
      present: 0,
      notPresent: 0,
      attendancePercentage: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [manualCode, setManualCode] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedAttendance, setSelectedAttendance] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [scanMessage, setScanMessage] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState("");

  const scannerRef =
    useRef(null);

  const scannerInstanceRef =
    useRef(null);


  // =======================================================
  // CLEANUP SCANNER
  // =======================================================

  useEffect(() => {

    return () => {

      stopScanner();

    };

  }, []);


  // =======================================================
  // LOAD EVENTS
  // =======================================================

  const loadEvents = async () => {

    try {

      const response =
        await api.get(
          "/events/admin/all"
        );

      if (
        response.data?.success
      ) {

        const eventList =
          response.data.events ||
          response.data.data ||
          [];

        setEvents(
          eventList
        );

        if (
          eventList.length > 0 &&
          !selectedEventId
        ) {

          setSelectedEventId(
            String(
              eventList[0].id
            )
          );
        }

      } else {

        setEvents([]);

        setError(
          response.data?.message ||
          "Unable to load events."
        );
      }

    } catch (error) {

      console.error(
        "Load events error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load events."
      );

    }
  };


  // =======================================================
  // LOAD ATTENDANCE
  // =======================================================

  const loadAttendance = async (
    showRefresh = false
  ) => {

    if (!selectedEventId) {

      setAttendance([]);

      setStats({
        total: 0,
        present: 0,
        notPresent: 0,
        attendancePercentage: 0,
      });

      setLoading(false);

      return;
    }

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get(
          `/attendance/event/${selectedEventId}`
        );

      if (
        response.data?.success
      ) {

        setAttendance(
          response.data.attendance ||
          []
        );

      } else {

        setAttendance([]);

        setError(
          response.data?.message ||
          "Unable to load attendance."
        );
      }

    } catch (error) {

      console.error(
        "Load attendance error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load attendance."
      );

      setAttendance([]);

    } finally {

      setLoading(false);

      setRefreshing(false);
    }
  };


  // =======================================================
  // LOAD STATS
  // =======================================================

  const loadStats = async () => {

    if (!selectedEventId) {
      return;
    }

    try {

      const response =
        await api.get(
          `/attendance/event/${selectedEventId}/stats`
        );

      if (
        response.data?.success
      ) {

        setStats(
          response.data.stats || {
            total: 0,
            present: 0,
            notPresent: 0,
            attendancePercentage: 0,
          }
        );
      }

    } catch (error) {

      console.error(
        "Load attendance stats error:",
        error
      );

    }
  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadEvents();

  }, []);


  // =======================================================
  // EVENT CHANGE
  // =======================================================

  useEffect(() => {

    if (!selectedEventId) {
      return;
    }

    loadAttendance();

    loadStats();

  }, [selectedEventId]);


  // =======================================================
  // SUCCESS MESSAGE AUTO CLEAR
  // =======================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess("");
      }, 4000);

    return () =>
      clearTimeout(timer);

  }, [success]);


  // =======================================================
  // ERROR MESSAGE AUTO CLEAR
  // =======================================================

  useEffect(() => {

    if (!error) {
      return;
    }

    const timer =
      setTimeout(() => {
        setError("");
      }, 6000);

    return () =>
      clearTimeout(timer);

  }, [error]);


  // =======================================================
  // REFRESH
  // =======================================================

  const refreshAll = async () => {

    setRefreshing(true);

    try {

      await loadEvents();

      if (selectedEventId) {

        await Promise.all([
          loadAttendance(true),
          loadStats(),
        ]);

      }

    } finally {

      setRefreshing(false);

    }
  };


  // =======================================================
  // NORMALIZE ATTENDANCE
  // =======================================================

  const normalizeAttendance =
    (item) => {

      return {

        ...item,

        attendanceId:
          item.attendance_id ||
          item.id,

        bookingId:
          item.booking_id,

        eventId:
          item.event_id,

        attendanceCode:
          item.attendance_code ||
          item.attendanceCode ||
          "N/A",

        attendanceStatus:
          String(
            item.attendance_status ||
            item.attendanceStatus ||
            "not_present"
          ).toLowerCase(),

        markedAt:
          item.marked_at ||
          item.markedAt ||
          null,

        markedBy:
          item.marked_by ||
          item.markedBy ||
          null,

        bookingCode:
          item.booking_code ||
          item.bookingCode ||
          "N/A",

        bookingStatus:
          item.booking_status ||
          item.bookingStatus ||
          "pending",

        fullName:
          item.full_name ||
          item.fullName ||
          item.username ||
          "Unknown User",

        username:
          item.username ||
          "",

        email:
          item.email ||
          "",

        mobile:
          item.mobile ||
          item.phone ||
          "",

        profileImageUrl:
          item.profile_image_url ||
          item.profileImageUrl ||
          "",

        eventName:
          item.event_name ||
          item.eventName ||
          "Event",

        eventDate:
          item.event_date ||
          item.eventDate ||
          null,

        startTime:
          item.start_time ||
          item.startTime ||
          null,

        endTime:
          item.end_time ||
          item.endTime ||
          null,

        venue:
          item.venue ||
          "",

        eventMode:
          item.event_mode ||
          item.eventMode ||
          "",
      };

    };


  // =======================================================
  // NORMALIZED DATA
  // =======================================================

  const normalizedAttendance =
    useMemo(
      () =>
        attendance.map(
          normalizeAttendance
        ),
      [attendance]
    );


  // =======================================================
  // FILTER
  // =======================================================

  const filteredAttendance =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return normalizedAttendance.filter(
        (item) => {

          const matchesSearch =
            !query ||
            String(
              item.fullName
            )
              .toLowerCase()
              .includes(query) ||

            String(
              item.username
            )
              .toLowerCase()
              .includes(query) ||

            String(
              item.email
            )
              .toLowerCase()
              .includes(query) ||

            String(
              item.mobile
            )
              .toLowerCase()
              .includes(query) ||

            String(
              item.bookingCode
            )
              .toLowerCase()
              .includes(query) ||

            String(
              item.attendanceCode
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            item.attendanceStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      normalizedAttendance,
      search,
      statusFilter,
    ]);


  // =======================================================
  // SELECTED EVENT
  // =======================================================

  const selectedEvent =
    useMemo(() => {

      return events.find(
        (event) =>
          String(
            event.id
          ) ===
          String(
            selectedEventId
          )
      );

    }, [
      events,
      selectedEventId,
    ]);


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "—";
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


  // =======================================================
  // FORMAT DATE TIME
  // =======================================================

  const formatDateTime = (
    value
  ) => {

    if (!value) {
      return "—";
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

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // =======================================================
  // FORMAT TIME
  // =======================================================

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "";
    }

    return String(
      value
    ).slice(
      0,
      5
    );
  };


  // =======================================================
  // COPY ATTENDANCE CODE
  // =======================================================

  const copyCode = async (
    code
  ) => {

    if (
      !code ||
      code === "N/A"
    ) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        String(code)
      );

      setCopiedCode(
        String(code)
      );

      setTimeout(() => {
        setCopiedCode("");
      }, 1800);

    } catch (error) {

      console.error(
        "Copy code error:",
        error
      );

      setError(
        "Unable to copy attendance code."
      );
    }
  };


  // =======================================================
  // HANDLE ATTENDANCE SUCCESS
  // =======================================================

  const handleAttendanceSuccess = async (
    response
  ) => {

    const data =
      response?.data || {};

    if (
      data.success
    ) {

      if (
        data.alreadyPresent
      ) {

        setSuccess(
          "This attendee is already marked present."
        );

      } else {

        setSuccess(
          data.message ||
          "Attendance marked present successfully."
        );
      }

      setScanMessage("");

      await Promise.all([
        loadAttendance(true),
        loadStats(),
      ]);

      if (
        data.attendance
      ) {

        setSelectedAttendance(
          data.attendance
        );
      }

      return true;
    }

    setError(
      data.message ||
      "Unable to process attendance."
    );

    return false;
  };


  // =======================================================
  // MANUAL CODE VERIFY
  // =======================================================

  const verifyManualCode =
    async (
      event
    ) => {

      if (event) {
        event.preventDefault();
      }

      const code =
        manualCode.trim();

      if (!code) {

        setError(
          "Please enter attendance code."
        );

        return;
      }

      if (!selectedEventId) {

        setError(
          "Please select an event first."
        );

        return;
      }

      try {

        setScanMessage(
          "Verifying attendance code..."
        );

        setError("");

        const response =
          await api.post(
            "/attendance/verify-code",
            {
              attendanceCode:
                code,

              eventId:
                Number(
                  selectedEventId
                ),
            }
          );

        const successResult =
          await handleAttendanceSuccess(
            response
          );

        if (
          successResult
        ) {

          setManualCode("");

          stopScanner();
        }

      } catch (error) {

        console.error(
          "Verify attendance code error:",
          error
        );

        setScanMessage("");

        setError(
          error.response?.data
            ?.message ||
          "Invalid or expired attendance code."
        );
      }
    };


  // =======================================================
  // START QR SCANNER
  // =======================================================

  const startScanner =
    async () => {

      if (scanning) {
        return;
      }

      if (!selectedEventId) {

        setError(
          "Please select an event before scanning."
        );

        return;
      }

      try {

        setError("");

        setScanMessage(
          "Starting camera..."
        );

        /*
        -----------------------------------------------------
        DYNAMIC IMPORT
        -----------------------------------------------------

        Install:

        npm install html5-qrcode

        -----------------------------------------------------
        */

        const module =
          await import(
            "html5-qrcode"
          );

        const Html5Qrcode =
          module.Html5Qrcode ||
          module.default;

        if (
          !Html5Qrcode
        ) {

          throw new Error(
            "QR scanner library is unavailable."
          );
        }

        if (
          !scannerRef.current
        ) {

          throw new Error(
            "QR scanner container not found."
          );
        }

        const scanner =
          new Html5Qrcode(
            "attendance-qr-reader"
          );

        scannerInstanceRef.current =
          scanner;

        setScanning(true);

        setScanMessage(
          "Point the camera at the attendee QR code."
        );


        await scanner.start(

          {
            facingMode:
              "environment",
          },

          {
            fps: 10,

            qrbox: {
              width: 250,
              height: 250,
            },

            aspectRatio:
              1.0,
          },

          async (
            decodedText
          ) => {

            /*
            -------------------------------------------------
            QR DETECTED
            -------------------------------------------------
            */

            await handleQrResult(
              decodedText
            );

          },

          () => {
            /*
            QR scan frame errors are ignored.
            */
          }

        );

      } catch (error) {

        console.error(
          "Start QR scanner error:",
          error
        );

        setScanning(false);

        scannerInstanceRef.current =
          null;

        setScanMessage("");

        setError(
          error.message ||
          "Unable to start QR scanner. Please allow camera access."
        );
      }
    };


  // =======================================================
  // STOP QR SCANNER
  // =======================================================

  const stopScanner =
    async () => {

      const scanner =
        scannerInstanceRef.current;

      if (!scanner) {

        setScanning(false);

        return;
      }

      try {

        await scanner.stop();

      } catch (error) {

        console.warn(
          "QR scanner stop warning:",
          error
        );

      }

      try {

        await scanner.clear();

      } catch (error) {

        console.warn(
          "QR scanner clear warning:",
          error
        );
      }

      scannerInstanceRef.current =
        null;

      setScanning(false);

      setScanMessage("");
    };


  // =======================================================
  // HANDLE QR RESULT
  // =======================================================

  const handleQrResult =
    async (
      decodedText
    ) => {

      if (!decodedText) {
        return;
      }

      /*
      Prevent repeated QR callback
      while request is processing.
      */

      if (
        scanMessage ===
        "Verifying QR..."
      ) {
        return;
      }

      try {

        setScanMessage(
          "Verifying QR..."
        );

        setError("");

        let qrData =
          decodedText;

        /*
        -----------------------------------------------------
        TRY PARSE JSON
        -----------------------------------------------------
        */

        try {

          qrData =
            JSON.parse(
              decodedText
            );

        } catch (
          parseError
        ) {

          /*
          QR may contain direct
          attendance code.
          */

          qrData = {
            attendanceCode:
              decodedText,
          };
        }


        /*
        -----------------------------------------------------
        SEND TO BACKEND
        -----------------------------------------------------
        */

        const response =
          await api.post(
            "/attendance/verify-qr",
            {
              qrData,

              eventId:
                Number(
                  selectedEventId
                ),
            }
          );


        const successResult =
          await handleAttendanceSuccess(
            response
          );


        if (
          successResult
        ) {

          await stopScanner();

        }

      } catch (error) {

        console.error(
          "QR verification error:",
          error
        );

        setScanMessage("");

        setError(
          error.response?.data
            ?.message ||
          "Unable to verify QR code."
        );
      }
    };


  // =======================================================
  // MANUAL MARK PRESENT
  // =======================================================

  const markPresent =
    async (
      item
    ) => {

      if (!item.bookingId) {

        setError(
          "Booking ID is missing."
        );

        return;
      }

      if (!selectedEventId) {

        setError(
          "Please select an event."
        );

        return;
      }

      try {

        setError("");

        setScanMessage(
          "Marking attendance..."
        );

        const response =
          await api.post(
            `/attendance/${item.bookingId}/mark-present`,
            {
              eventId:
                Number(
                  selectedEventId
                ),
            }
          );

        await handleAttendanceSuccess(
          response
        );

      } catch (error) {

        console.error(
          "Mark attendance error:",
          error
        );

        setScanMessage("");

        setError(
          error.response?.data
            ?.message ||
          "Unable to mark attendance."
        );
      }
    };


  // =======================================================
  // CLOSE DETAILS
  // =======================================================

  const closeDetails = () => {

    setSelectedAttendance(
      null
    );
  };


  // =======================================================
  // LOADING
  // =======================================================

  if (
    loading &&
    !selectedEventId
  ) {

    return (
      <main className="attendance-management-page">

        <div className="attendance-loading">

          <div className="attendance-loading-spinner" />

          <p>
            Loading attendance management...
          </p>

        </div>

      </main>
    );
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <main className="attendance-management-page">

      <div className="attendance-management-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="attendance-header">

          <div>

            <span className="attendance-eyebrow">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Attendance Management
            </h1>

            <p>
              Scan event passes, verify
              attendance codes and manage
              event attendance.
            </p>

          </div>


          <button
            type="button"
            className="attendance-refresh-btn"
            onClick={
              refreshAll
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "attendance-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </header>


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (

          <div className="attendance-alert attendance-alert-error">

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

          <div className="attendance-alert attendance-alert-success">

            <CheckCircle2
              size={17}
            />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >

              <X
                size={15}
              />

            </button>

          </div>

        )}


        {/* =================================================
            EVENT SELECTOR
        ================================================= */}

        <section className="attendance-event-selector">

          <div className="attendance-event-selector-icon">

            <CalendarDays
              size={20}
            />

          </div>

          <div className="attendance-event-selector-content">

            <label htmlFor="attendance-event">
              Select Event
            </label>

            <select
              id="attendance-event"
              value={
                selectedEventId
              }
              onChange={(event) => {

                stopScanner();

                setSelectedEventId(
                  event.target.value
                );

                setSearch("");

                setStatusFilter(
                  "all"
                );

                setSelectedAttendance(
                  null
                );

              }}
            >

              <option value="">
                Select an event
              </option>

              {events.map(
                (event) => (

                  <option
                    key={
                      event.id
                    }
                    value={
                      event.id
                    }
                  >
                    {
                      event.title ||
                      event.name
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {selectedEvent && (

            <div className="attendance-selected-event-info">

              <strong>
                {
                  selectedEvent.title ||
                  selectedEvent.name
                }
              </strong>

              {selectedEvent.event_date && (

                <span>

                  <CalendarDays
                    size={13}
                  />

                  {formatDate(
                    selectedEvent.event_date
                  )}

                </span>

              )}

              {selectedEvent.venue && (

                <span>

                  <MapPin
                    size={13}
                  />

                  {
                    selectedEvent.venue
                  }

                </span>

              )}

            </div>

          )}

        </section>


        {/* =================================================
            SCANNER SECTION
        ================================================= */}

        <section className="attendance-scanner-section">

          <div className="attendance-scanner-heading">

            <div>

              <span className="attendance-section-label">
                EVENT CHECK-IN
              </span>

              <h2>
                Scan Attendee QR
              </h2>

              <p>
                Scan the QR code displayed
                on the attendee's event pass.
              </p>

            </div>

            <div className="attendance-scanner-status">

              <ShieldCheck
                size={17}
              />

              Admin verified

            </div>

          </div>


          <div className="attendance-scanner-content">

            {/* QR CAMERA */}

            <div className="attendance-camera-wrapper">

              <div
                id="attendance-qr-reader"
                ref={scannerRef}
                className={
                  scanning
                    ? "attendance-camera attendance-camera-active"
                    : "attendance-camera"
                }
              />

              {!scanning && (

                <div className="attendance-camera-placeholder">

                  <div className="attendance-camera-icon">

                    <QrCode
                      size={42}
                    />

                  </div>

                  <h3>
                    QR Scanner Ready
                  </h3>

                  <p>
                    Start the camera and
                    point it at an event pass QR.
                  </p>

                </div>

              )}

            </div>


            {/* SCANNER CONTROLS */}

            <div className="attendance-scanner-controls">

              <div className="attendance-scanner-control-title">

                {scanning ? (

                  <>

                    <Camera
                      size={19}
                    />

                    <strong>
                      Camera is active
                    </strong>

                  </>

                ) : (

                  <>

                    <CameraOff
                      size={19}
                    />

                    <strong>
                      Camera is inactive
                    </strong>

                  </>

                )}

              </div>


              {scanMessage && (

                <div className="attendance-scan-message">

                  <ScanLine
                    size={16}
                  />

                  {scanMessage}

                </div>

              )}


              {!scanning ? (

                <button
                  type="button"
                  className="attendance-start-scan-btn"
                  onClick={
                    startScanner
                  }
                  disabled={
                    !selectedEventId
                  }
                >

                  <ScanLine
                    size={19}
                  />

                  Start QR Scanner

                </button>

              ) : (

                <button
                  type="button"
                  className="attendance-stop-scan-btn"
                  onClick={
                    stopScanner
                  }
                >

                  <CameraOff
                    size={19}
                  />

                  Stop Scanner

                </button>

              )}


              <div className="attendance-scanner-divider">

                <span>
                  OR
                </span>

              </div>


              {/* MANUAL CODE */}

              <form
                className="attendance-manual-form"
                onSubmit={
                  verifyManualCode
                }
              >

                <div className="attendance-manual-heading">

                  <Keyboard
                    size={17}
                  />

                  <div>

                    <strong>
                      Manual Attendance
                    </strong>

                    <span>
                      Use the unique code below the QR.
                    </span>

                  </div>

                </div>


                <div className="attendance-manual-input-row">

                  <input
                    type="text"
                    placeholder="SNICT-ATT-XXXXXXXXXX"
                    value={
                      manualCode
                    }
                    onChange={(
                      event
                    ) =>
                      setManualCode(
                        event.target.value
                      )
                    }
                    autoComplete="off"
                  />

                  <button
                    type="submit"
                    disabled={
                      !selectedEventId ||
                      !manualCode.trim()
                    }
                  >

                    <CheckCircle2
                      size={17}
                    />

                    Verify

                  </button>

                </div>

              </form>


              <div className="attendance-scanner-note">

                <AlertCircle
                  size={15}
                />

                <span>
                  Only confirmed bookings
                  can be marked present.
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="attendance-stats-grid">

          <div className="attendance-stat-card">

            <div className="attendance-stat-icon">

              <Users
                size={21}
              />

            </div>

            <div>

              <span>
                Total
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>

          </div>


          <div className="attendance-stat-card attendance-stat-present">

            <div className="attendance-stat-icon">

              <UserCheck
                size={21}
              />

            </div>

            <div>

              <span>
                Present
              </span>

              <strong>
                {stats.present}
              </strong>

            </div>

          </div>


          <div className="attendance-stat-card attendance-stat-absent">

            <div className="attendance-stat-icon">

              <UserX
                size={21}
              />

            </div>

            <div>

              <span>
                Not Present
              </span>

              <strong>
                {stats.notPresent}
              </strong>

            </div>

          </div>


          <div className="attendance-stat-card attendance-stat-percentage">

            <div className="attendance-stat-icon">

              <Percent
                size={21}
              />

            </div>

            <div>

              <span>
                Attendance
              </span>

              <strong>
                {Number(
                  stats.attendancePercentage ||
                  0
                ).toFixed(2)}
                %
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            ATTENDANCE TABLE
        ================================================= */}

        <section className="attendance-list-section">

          <div className="attendance-list-header">

            <div>

              <span className="attendance-section-label">
                ATTENDANCE RECORDS
              </span>

              <h2>
                Event Attendees
              </h2>

            </div>


            <div className="attendance-list-count">

              {filteredAttendance.length}

              {" "}

              records

            </div>

          </div>


          {/* FILTERS */}

          <div className="attendance-list-toolbar">

            <div className="attendance-search">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search name, email, booking or attendance code..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Attendance
              </option>

              <option value="present">
                Present
              </option>

              <option value="not_present">
                Not Present
              </option>

            </select>

          </div>


          {filteredAttendance.length ===
          0 ? (

            <div className="attendance-empty">

              <UserCheck
                size={38}
              />

              <h3>
                No attendance records
              </h3>

              <p>
                No attendance records
                match the selected event
                and filters.
              </p>

            </div>

          ) : (

            <div className="attendance-table-wrapper">

              <div className="attendance-table-scroll">

                <table className="attendance-table">

                  <thead>

                    <tr>

                      <th>
                        Attendee
                      </th>

                      <th>
                        Booking
                      </th>

                      <th>
                        Attendance Code
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Marked At
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredAttendance.map(
                      (item) => (

                        <tr
                          key={
                            item.attendanceId ||
                            `${item.bookingId}-${item.attendanceCode}`
                          }
                        >

                          {/* ATTENDEE */}

                          <td>

                            <div className="attendance-user-cell">

                              <div className="attendance-user-avatar">

                                {item.profileImageUrl ? (

                                  <img
                                    src={
                                      item.profileImageUrl
                                    }
                                    alt={
                                      item.fullName
                                    }
                                  />

                                ) : (

                                  <UserCheck
                                    size={16}
                                  />

                                )}

                              </div>

                              <div>

                                <strong>
                                  {
                                    item.fullName
                                  }
                                </strong>

                                <span>
                                  {
                                    item.email ||
                                    item.username ||
                                    "—"
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* BOOKING */}

                          <td>

                            <div className="attendance-booking-cell">

                              <strong>
                                {
                                  item.bookingCode
                                }
                              </strong>

                              <span>
                                {
                                  item.bookingStatus
                                }
                              </span>

                            </div>

                          </td>


                          {/* CODE */}

                          <td>

                            <div className="attendance-code-cell">

                              <code>
                                {
                                  item.attendanceCode
                                }
                              </code>

                              {item.attendanceCode !==
                                "N/A" && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyCode(
                                      item.attendanceCode
                                    )
                                  }
                                  title="Copy attendance code"
                                >

                                  {copiedCode ===
                                  item.attendanceCode ? (

                                    <Check
                                      size={14}
                                    />

                                  ) : (

                                    <Copy
                                      size={14}
                                    />

                                  )}

                                </button>

                              )}

                            </div>

                          </td>


                          {/* STATUS */}

                          <td>

                            {item.attendanceStatus ===
                            "present" ? (

                              <span className="attendance-status-badge attendance-status-present">

                                <UserCheck
                                  size={13}
                                />

                                Present

                              </span>

                            ) : (

                              <span className="attendance-status-badge attendance-status-absent">

                                <UserX
                                  size={13}
                                />

                                Not Present

                              </span>

                            )}

                          </td>


                          {/* MARKED */}

                          <td>

                            <span className="attendance-marked-time">

                              {item.markedAt
                                ? formatDateTime(
                                    item.markedAt
                                  )
                                : "—"}

                            </span>

                          </td>


                          {/* ACTION */}

                          <td>

                            <div className="attendance-row-actions">

                              <button
                                type="button"
                                className="attendance-view-btn"
                                onClick={() =>
                                  setSelectedAttendance(
                                    item
                                  )
                                }
                              >
                                View
                              </button>


                              {item.attendanceStatus !==
                                "present" && (

                                <button
                                  type="button"
                                  className="attendance-mark-btn"
                                  onClick={() =>
                                    markPresent(
                                      item
                                    )
                                  }
                                >

                                  <UserCheck
                                    size={14}
                                  />

                                  Mark Present

                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          ATTENDANCE DETAILS MODAL
      ===================================================== */}

      {selectedAttendance && (

        <div
          className="attendance-modal-overlay"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeDetails();

            }

          }}
        >

          <section
            className="attendance-details-modal"
            role="dialog"
            aria-modal="true"
          >

            {/* HEADER */}

            <header className="attendance-modal-header">

              <div>

                <span>
                  ATTENDANCE DETAILS
                </span>

                <h2>
                  {
                    selectedAttendance.fullName ||
                    selectedAttendance.full_name ||
                    "Attendee"
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeDetails
                }
              >

                <X
                  size={19}
                />

              </button>

            </header>


            {/* BODY */}

            <div className="attendance-modal-body">

              {/* STATUS */}

              <div
                className={
                  String(
                    selectedAttendance.attendanceStatus ||
                    selectedAttendance.attendance_status
                  ).toLowerCase() ===
                  "present"
                    ? "attendance-modal-status present"
                    : "attendance-modal-status absent"
                }
              >

                {String(
                  selectedAttendance.attendanceStatus ||
                  selectedAttendance.attendance_status
                ).toLowerCase() ===
                "present" ? (

                  <>

                    <UserCheck
                      size={22}
                    />

                    <div>

                      <strong>
                        Present
                      </strong>

                      <span>
                        Attendance has been successfully marked.
                      </span>

                    </div>

                  </>

                ) : (

                  <>

                    <UserX
                      size={22}
                    />

                    <div>

                      <strong>
                        Not Present
                      </strong>

                      <span>
                        This attendee has not checked in yet.
                      </span>

                    </div>

                  </>

                )}

              </div>


              {/* USER */}

              <div className="attendance-modal-section">

                <div className="attendance-modal-section-title">

                  <Users
                    size={17}
                  />

                  Attendee Information

                </div>


                <div className="attendance-modal-grid">

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {
                        selectedAttendance.fullName ||
                        selectedAttendance.full_name ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Username
                    </span>

                    <strong>
                      {
                        selectedAttendance.username ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Email
                    </span>

                    <strong>

                      <Mail
                        size={14}
                      />

                      {
                        selectedAttendance.email ||
                        "—"
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Mobile
                    </span>

                    <strong>

                      <Phone
                        size={14}
                      />

                      {
                        selectedAttendance.mobile ||
                        "—"
                      }

                    </strong>

                  </div>

                </div>

              </div>


              {/* BOOKING */}

              <div className="attendance-modal-section">

                <div className="attendance-modal-section-title">

                  <TicketCheck
                    size={17}
                  />

                  Booking Information

                </div>


                <div className="attendance-modal-grid">

                  <div>

                    <span>
                      Booking Code
                    </span>

                    <strong>
                      {
                        selectedAttendance.bookingCode ||
                        selectedAttendance.booking_code ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Booking ID
                    </span>

                    <strong>
                      {
                        selectedAttendance.bookingId ||
                        selectedAttendance.booking_id ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Booking Status
                    </span>

                    <strong>
                      {
                        selectedAttendance.bookingStatus ||
                        selectedAttendance.booking_status ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* ATTENDANCE */}

              <div className="attendance-modal-section">

                <div className="attendance-modal-section-title">

                  <QrCode
                    size={17}
                  />

                  Attendance Verification

                </div>


                <div className="attendance-modal-grid">

                  <div>

                    <span>
                      Attendance Code
                    </span>

                    <strong className="attendance-modal-code">

                      {
                        selectedAttendance.attendanceCode ||
                        selectedAttendance.attendance_code ||
                        "—"
                      }

                      {(selectedAttendance.attendanceCode ||
                        selectedAttendance.attendance_code) && (

                        <button
                          type="button"
                          onClick={() =>
                            copyCode(
                              selectedAttendance.attendanceCode ||
                              selectedAttendance.attendance_code
                            )
                          }
                        >

                          {copiedCode ===
                          String(
                            selectedAttendance.attendanceCode ||
                            selectedAttendance.attendance_code
                          ) ? (

                            <Check
                              size={13}
                            />

                          ) : (

                            <Copy
                              size={13}
                            />

                          )}

                        </button>

                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Marked At
                    </span>

                    <strong>
                      {
                        selectedAttendance.markedAt ||
                        selectedAttendance.marked_at
                          ? formatDateTime(
                              selectedAttendance.markedAt ||
                              selectedAttendance.marked_at
                            )
                          : "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Marked By
                    </span>

                    <strong>
                      {
                        selectedAttendance.markedBy ||
                        selectedAttendance.marked_by ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* EVENT */}

              <div className="attendance-modal-section">

                <div className="attendance-modal-section-title">

                  <CalendarDays
                    size={17}
                  />

                  Event Information

                </div>


                <div className="attendance-modal-grid">

                  <div>

                    <span>
                      Event
                    </span>

                    <strong>
                      {
                        selectedAttendance.eventName ||
                        selectedAttendance.event_name ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Date
                    </span>

                    <strong>
                      {
                        selectedAttendance.eventDate ||
                        selectedAttendance.event_date
                          ? formatDate(
                              selectedAttendance.eventDate ||
                              selectedAttendance.event_date
                            )
                          : "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Venue
                    </span>

                    <strong>

                      <MapPin
                        size={14}
                      />

                      {
                        selectedAttendance.venue ||
                        "—"
                      }

                    </strong>

                  </div>

                </div>

              </div>


              {/* ACTION */}

              {String(
                selectedAttendance.attendanceStatus ||
                selectedAttendance.attendance_status
              ).toLowerCase() !==
                "present" && (

                <button
                  type="button"
                  className="attendance-modal-mark-btn"
                  onClick={async () => {

                    await markPresent(
                      normalizeAttendance(
                        selectedAttendance
                      )
                    );

                    closeDetails();

                  }}
                >

                  <UserCheck
                    size={17}
                  />

                  Mark Present

                </button>

              )}

            </div>

          </section>

        </div>

      )}

    </main>
  );
}


export default AttendanceManagement;