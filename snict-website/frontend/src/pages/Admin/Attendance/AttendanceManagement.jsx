import {
  useCallback,
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

  const [events, setEvents] = useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [attendance, setAttendance] =
    useState([]);

  const [stats, setStats] = useState({
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

  // =======================================================
  // REFS
  // =======================================================

  const scannerRef =
    useRef(null);

  const scannerInstanceRef =
    useRef(null);

  const scannerProcessingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const selectedEventIdRef =
    useRef("");

  // =======================================================
  // KEEP EVENT REF UPDATED
  // =======================================================

  useEffect(() => {
    selectedEventIdRef.current =
      selectedEventId;
  }, [selectedEventId]);


  // =======================================================
  // COMPONENT MOUNT / UNMOUNT
  // =======================================================

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      const scanner =
        scannerInstanceRef.current;

      if (scanner) {

        scanner
          .stop()
          .catch(() => {})
          .finally(() => {

            scanner
              .clear()
              .catch(() => {});

          });

      }

      scannerInstanceRef.current =
        null;

      scannerProcessingRef.current =
        false;

    };

  }, []);


  // =======================================================
  // SAFE ERROR MESSAGE
  // =======================================================

  const getApiErrorMessage = useCallback(
    (
      error,
      fallback = "Something went wrong."
    ) => {

      return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
      );

    },
    []
  );


  // =======================================================
  // LOAD EVENTS
  // =======================================================

  const loadEvents = useCallback(
    async () => {

      try {

        const response =
          await api.get(
            "/events/admin/all"
          );

        if (
          response?.data?.success
        ) {

          const eventList =
            response.data.events ||
            response.data.data ||
            [];

          const safeEvents =
            Array.isArray(eventList)
              ? eventList
              : [];

          if (mountedRef.current) {

            setEvents(
              safeEvents
            );

          }

          /*
           * Automatically select first event
           * only when no event is selected.
           */

          if (
            safeEvents.length > 0 &&
            !selectedEventIdRef.current
          ) {

            if (mountedRef.current) {

              setSelectedEventId(
                String(
                  safeEvents[0].id
                )
              );

            }

          }

          return safeEvents;

        }

        if (mountedRef.current) {

          setEvents([]);

          setError(
            response?.data?.message ||
            "Unable to load events."
          );

        }

        return [];

      } catch (error) {

        console.error(
          "Load events error:",
          error
        );

        if (mountedRef.current) {

          setEvents([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load events."
            )
          );

        }

        return [];

      }

    },
    [getApiErrorMessage]
  );


  // =======================================================
  // LOAD ATTENDANCE
  // =======================================================

  const loadAttendance = useCallback(
    async (
      eventId = selectedEventIdRef.current,
      showRefresh = false
    ) => {

      if (!eventId) {

        if (mountedRef.current) {

          setAttendance([]);

        }

        return [];

      }

      try {

        if (showRefresh) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }

        const response =
          await api.get(
            `/attendance/event/${eventId}`
          );

        if (
          response?.data?.success
        ) {

          const records =
            response.data.attendance ||
            response.data.data ||
            [];

          const safeRecords =
            Array.isArray(records)
              ? records
              : [];

          if (mountedRef.current) {

            setAttendance(
              safeRecords
            );

          }

          return safeRecords;

        }

        if (mountedRef.current) {

          setAttendance([]);

          setError(
            response?.data?.message ||
            "Unable to load attendance."
          );

        }

        return [];

      } catch (error) {

        console.error(
          "Load attendance error:",
          error
        );

        if (mountedRef.current) {

          setAttendance([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load attendance."
            )
          );

        }

        return [];

      } finally {

        if (mountedRef.current) {

          setLoading(false);

          if (showRefresh) {
            setRefreshing(false);
          }

        }

      }

    },
    [getApiErrorMessage]
  );


  // =======================================================
  // LOAD STATS
  // =======================================================

  const loadStats = useCallback(
    async (
      eventId = selectedEventIdRef.current
    ) => {

      if (!eventId) {

        if (mountedRef.current) {

          setStats({
            total: 0,
            present: 0,
            notPresent: 0,
            attendancePercentage: 0,
          });

        }

        return;

      }

      try {

        const response =
          await api.get(
            `/attendance/event/${eventId}/stats`
          );

        if (
          response?.data?.success
        ) {

          const serverStats =
            response.data.stats ||
            response.data.data ||
            {};

          const total =
            Number(
              serverStats.total ??
              serverStats.totalBookings ??
              serverStats.total_attendees ??
              0
            );

          const present =
            Number(
              serverStats.present ??
              serverStats.presentCount ??
              serverStats.present_attendance ??
              0
            );

          const notPresent =
            Number(
              serverStats.notPresent ??
              serverStats.not_present ??
              serverStats.notPresentCount ??
              Math.max(
                total - present,
                0
              )
            );

          const percentage =
            Number(
              serverStats.attendancePercentage ??
              serverStats.attendance_percentage ??
              (
                total > 0
                  ? (
                      present /
                      total
                    ) *
                    100
                  : 0
              )
            );

          if (mountedRef.current) {

            setStats({
              total,
              present,
              notPresent,
              attendancePercentage:
                Number.isFinite(
                  percentage
                )
                  ? percentage
                  : 0,
            });

          }

        }

      } catch (error) {

        console.error(
          "Load attendance stats error:",
          error
        );

        /*
         * Stats failure should not
         * destroy attendance records.
         */

      }

    },
    []
  );


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadEvents();

  }, [loadEvents]);


  // =======================================================
  // EVENT CHANGE
  // =======================================================

  useEffect(() => {

    if (!selectedEventId) {

      setAttendance([]);

      setStats({
        total: 0,
        present: 0,
        notPresent: 0,
        attendancePercentage: 0,
      });

      return;

    }

    loadAttendance(
      selectedEventId
    );

    loadStats(
      selectedEventId
    );

  }, [
    selectedEventId,
    loadAttendance,
    loadStats,
  ]);


  // =======================================================
  // SUCCESS AUTO CLEAR
  // =======================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {

        if (mountedRef.current) {
          setSuccess("");
        }

      }, 4000);

    return () =>
      clearTimeout(timer);

  }, [success]);


  // =======================================================
  // ERROR AUTO CLEAR
  // =======================================================

  useEffect(() => {

    if (!error) {
      return;
    }

    const timer =
      setTimeout(() => {

        if (mountedRef.current) {
          setError("");
        }

      }, 6000);

    return () =>
      clearTimeout(timer);

  }, [error]);


  // =======================================================
  // REFRESH
  // =======================================================

  const refreshAll = async () => {

    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {

      const currentEventId =
        selectedEventIdRef.current;

      await loadEvents();

      if (currentEventId) {

        await Promise.all([
          loadAttendance(
            currentEventId,
            true
          ),
          loadStats(
            currentEventId
          ),
        ]);

      }

    } finally {

      if (mountedRef.current) {
        setRefreshing(false);
      }

    }

  };


  // =======================================================
  // NORMALIZE ATTENDANCE
  // =======================================================

  const normalizeAttendance =
    useCallback(
      (item = {}) => {

        const bookingId =
          item.booking_id ??
          item.bookingId ??
          item.booking?.id ??
          null;

        const eventId =
          item.event_id ??
          item.eventId ??
          item.event?.id ??
          null;

        const attendanceStatus =
          String(
            item.attendance_status ??
            item.attendanceStatus ??
            item.status ??
            "not_present"
          ).toLowerCase();

        return {

          ...item,

          attendanceId:
            item.attendance_id ??
            item.attendanceId ??
            item.id ??
            null,

          bookingId,

          eventId,

          attendanceCode:
            item.attendance_code ??
            item.attendanceCode ??
            item.attendance?.attendance_code ??
            "N/A",

          attendanceStatus,

          markedAt:
            item.marked_at ??
            item.markedAt ??
            item.attendance?.marked_at ??
            null,

          markedBy:
            item.marked_by ??
            item.markedBy ??
            item.attendance?.marked_by ??
            null,

          bookingCode:
            item.booking_code ??
            item.bookingCode ??
            item.booking?.booking_code ??
            "N/A",

          bookingStatus:
            item.booking_status ??
            item.bookingStatus ??
            item.booking?.status ??
            "pending",

          fullName:
            item.full_name ??
            item.fullName ??
            item.user_name ??
            item.name ??
            item.username ??
            "Unknown User",

          username:
            item.username ??
            item.user?.username ??
            "",

          email:
            item.email ??
            item.user?.email ??
            "",

          mobile:
            item.mobile ??
            item.phone ??
            item.user?.mobile ??
            item.user?.phone ??
            "",

          profileImageUrl:
            item.profile_image_url ??
            item.profileImageUrl ??
            item.user?.profile_image_url ??
            "",

          eventName:
            item.event_name ??
            item.eventName ??
            item.event?.title ??
            item.event?.name ??
            "Event",

          eventDate:
            item.event_date ??
            item.eventDate ??
            item.event?.event_date ??
            item.event?.date ??
            null,

          startTime:
            item.start_time ??
            item.startTime ??
            item.event?.start_time ??
            null,

          endTime:
            item.end_time ??
            item.endTime ??
            item.event?.end_time ??
            null,

          venue:
            item.venue ??
            item.event?.venue ??
            item.event?.location ??
            "",

          eventMode:
            item.event_mode ??
            item.eventMode ??
            item.event?.mode ??
            "",
        };

      },
      []
    );


  // =======================================================
  // NORMALIZED ATTENDANCE
  // =======================================================

  const normalizedAttendance =
    useMemo(
      () =>
        attendance.map(
          normalizeAttendance
        ),
      [
        attendance,
        normalizeAttendance,
      ]
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

          const searchableText = [
            item.fullName,
            item.username,
            item.email,
            item.mobile,
            item.bookingCode,
            item.attendanceCode,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          const matchesStatus =
            statusFilter === "all" ||
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
          String(event.id) ===
          String(selectedEventId)
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
  // COPY CODE
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

        if (mountedRef.current) {
          setCopiedCode("");
        }

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

  const handleAttendanceSuccess =
    async (
      response
    ) => {

      const data =
        response?.data ||
        {};

      if (!data.success) {

        setError(
          data.message ||
          "Unable to process attendance."
        );

        return false;

      }

      if (
        data.alreadyPresent
      ) {

        setSuccess(
          data.message ||
          "This attendee is already marked present."
        );

      } else {

        setSuccess(
          data.message ||
          "Attendance marked present successfully."
        );

      }

      setScanMessage("");

      const currentEventId =
        selectedEventIdRef.current;

      await Promise.all([
        loadAttendance(
          currentEventId,
          true
        ),
        loadStats(
          currentEventId
        ),
      ]);

      if (
        data.attendance &&
        mountedRef.current
      ) {

        setSelectedAttendance(
          normalizeAttendance(
            data.attendance
          )
        );

      }

      return true;

    };


  // =======================================================
  // VERIFY MANUAL CODE
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

        setError("");

        setScanMessage(
          "Verifying attendance code..."
        );

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

        if (successResult) {

          setManualCode("");

          await stopScanner();

        }

      } catch (error) {

        console.error(
          "Verify attendance code error:",
          error
        );

        setScanMessage("");

        setError(
          getApiErrorMessage(
            error,
            "Invalid or expired attendance code."
          )
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

        scannerProcessingRef.current =
          false;

        const module =
          await import(
            "html5-qrcode"
          );

        const Html5Qrcode =
          module.Html5Qrcode ||
          module.default;

        if (!Html5Qrcode) {

          throw new Error(
            "QR scanner library is unavailable."
          );

        }

        /*
         * Make sure an old scanner
         * instance does not remain alive.
         */

        if (
          scannerInstanceRef.current
        ) {

          await stopScanner();

        }

        const scanner =
          new Html5Qrcode(
            "attendance-qr-reader"
          );

        scannerInstanceRef.current =
          scanner;

        if (mountedRef.current) {
          setScanning(true);
        }

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

            aspectRatio: 1.0,

          },

          async (
            decodedText
          ) => {

            /*
             * html5-qrcode can call the
             * success callback multiple times
             * for the same QR.
             *
             * Lock processing until the
             * current request finishes.
             */

            if (
              scannerProcessingRef.current
            ) {

              return;

            }

            scannerProcessingRef.current =
              true;

            try {

              await handleQrResult(
                decodedText
              );

            } finally {

              /*
               * Unlock only when QR
               * verification failed.
               *
               * On success the scanner
               * is stopped.
               */

              if (
                scannerInstanceRef.current ===
                scanner
              ) {

                scannerProcessingRef.current =
                  false;

              }

            }

          },

          () => {
            /*
             * Frame-level scan errors are
             * intentionally ignored.
             */
          }

        );

        if (mountedRef.current) {

          setScanMessage(
            "Point the camera at the attendee QR code."
          );

        }

      } catch (error) {

        console.error(
          "Start QR scanner error:",
          error
        );

        scannerInstanceRef.current =
          null;

        scannerProcessingRef.current =
          false;

        if (mountedRef.current) {

          setScanning(false);

          setScanMessage("");

          setError(
            getApiErrorMessage(
              error,
              "Unable to start QR scanner. Please allow camera access."
            )
          );

        }

      }

    };


  // =======================================================
  // STOP QR SCANNER
  // =======================================================

  const stopScanner =
    async () => {

      const scanner =
        scannerInstanceRef.current;

      scannerInstanceRef.current =
        null;

      scannerProcessingRef.current =
        false;

      if (!scanner) {

        if (mountedRef.current) {
          setScanning(false);
        }

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

      if (mountedRef.current) {

        setScanning(false);

        setScanMessage("");

      }

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

      const eventId =
        selectedEventIdRef.current;

      if (!eventId) {

        setError(
          "Please select an event first."
        );

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
         * Event pass QR normally contains JSON.
         *
         * Example:
         *
         * {
         *   type: "SNICT_EVENT_PASS",
         *   bookingId: 21,
         *   eventId: 5,
         *   passCode: "...",
         *   passToken: "..."
         * }
         */

        try {

          qrData =
            JSON.parse(
              decodedText
            );

        } catch {
          /*
           * If QR only contains a string,
           * treat it as attendance code.
           */

          qrData = {
            attendanceCode:
              decodedText.trim(),
          };

        }

        const response =
          await api.post(
            "/attendance/verify-qr",
            {
              qrData,

              eventId:
                Number(eventId),
            }
          );

        const successResult =
          await handleAttendanceSuccess(
            response
          );

        if (successResult) {

          await stopScanner();

        } else {

          /*
           * Allow another scan if
           * backend rejected the QR.
           */

          scannerProcessingRef.current =
            false;

        }

      } catch (error) {

        console.error(
          "QR verification error:",
          error
        );

        setScanMessage("");

        scannerProcessingRef.current =
          false;

        setError(
          getApiErrorMessage(
            error,
            "Unable to verify QR code."
          )
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

      const bookingId =
        item?.bookingId ??
        item?.booking_id;

      if (!bookingId) {

        setError(
          "Booking ID is missing."
        );

        return false;

      }

      const eventId =
        selectedEventIdRef.current;

      if (!eventId) {

        setError(
          "Please select an event."
        );

        return false;

      }

      try {

        setError("");

        setScanMessage(
          "Marking attendance..."
        );

        const response =
          await api.post(
            `/attendance/${bookingId}/mark-present`,
            {
              eventId:
                Number(eventId),
            }
          );

        const result =
          await handleAttendanceSuccess(
            response
          );

        return result;

      } catch (error) {

        console.error(
          "Mark attendance error:",
          error
        );

        setScanMessage("");

        setError(
          getApiErrorMessage(
            error,
            "Unable to mark attendance."
          )
        );

        return false;

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
  // EVENT CHANGE
  // =======================================================

  const handleEventChange =
    async (
      event
    ) => {

      await stopScanner();

      const value =
        event.target.value;

      setSelectedEventId(
        value
      );

      selectedEventIdRef.current =
        value;

      setSearch("");

      setStatusFilter(
        "all"
      );

      setManualCode("");

      setSelectedAttendance(
        null
      );

      setError("");

      setSuccess("");

      setScanMessage("");

    };


  // =======================================================
  // LOADING SCREEN
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
            ERROR
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


        {/* =================================================
            SUCCESS
        ================================================= */}

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
              onChange={
                handleEventChange
              }
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

                    {event.title ||
                      event.name ||
                      event.event_name ||
                      `Event #${event.id}`}

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
                  selectedEvent.name ||
                  selectedEvent.event_name ||
                  "Event"
                }
              </strong>


              {(
                selectedEvent.event_date ||
                selectedEvent.eventDate ||
                selectedEvent.date
              ) && (

                <span>

                  <CalendarDays
                    size={13}
                  />

                  {formatDate(
                    selectedEvent.event_date ||
                    selectedEvent.eventDate ||
                    selectedEvent.date
                  )}

                </span>

              )}


              {(
                selectedEvent.venue ||
                selectedEvent.location
              ) && (

                <span>

                  <MapPin
                    size={13}
                  />

                  {
                    selectedEvent.venue ||
                    selectedEvent.location
                  }

                </span>

              )}

            </div>

          )}

        </section>


        {/* =================================================
            SCANNER
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

            {/* =================================================
                CAMERA
            ================================================= */}

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


            {/* =================================================
                CONTROLS
            ================================================= */}

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


              {/* =================================================
                  OR
              ================================================= */}

              <div className="attendance-scanner-divider">

                <span>
                  OR
                </span>

              </div>


              {/* =================================================
                  MANUAL CODE
              ================================================= */}

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
                          .toUpperCase()
                          .replace(
                            /\s/g,
                            ""
                          )
                      )
                    }
                    autoComplete="off"
                    spellCheck="false"
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

          {/* TOTAL */}

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


          {/* PRESENT */}

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


          {/* NOT PRESENT */}

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


          {/* PERCENTAGE */}

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
            ATTENDANCE LIST
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


          {/* =================================================
              FILTERS
          ================================================= */}

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


          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (

            <div className="attendance-empty">

              <div className="attendance-loading-spinner" />

              <h3>
                Loading attendance...
              </h3>

            </div>

          ) : filteredAttendance.length === 0 ? (

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
                                    String(
                                      item.attendanceCode
                                    ) ? (

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
          DETAILS MODAL
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

            {/* =================================================
                MODAL HEADER
            ================================================= */}

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
                aria-label="Close"
              >

                <X
                  size={19}
                />

              </button>

            </header>


            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="attendance-modal-body">

              {/* STATUS */}

              <div
                className={
                  String(
                    selectedAttendance.attendanceStatus ||
                    selectedAttendance.attendance_status ||
                    "not_present"
                  ).toLowerCase() ===
                  "present"
                    ? "attendance-modal-status present"
                    : "attendance-modal-status absent"
                }
              >

                {String(
                  selectedAttendance.attendanceStatus ||
                  selectedAttendance.attendance_status ||
                  "not_present"
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


              {/* =================================================
                  ATTENDEE INFORMATION
              ================================================= */}

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


              {/* =================================================
                  BOOKING INFORMATION
              ================================================= */}

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


              {/* =================================================
                  ATTENDANCE VERIFICATION
              ================================================= */}

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


              {/* =================================================
                  EVENT INFORMATION
              ================================================= */}

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


              {/* =================================================
                  MARK PRESENT FROM MODAL
              ================================================= */}

              {String(
                selectedAttendance.attendanceStatus ||
                selectedAttendance.attendance_status ||
                "not_present"
              ).toLowerCase() !==
                "present" && (

                <button
                  type="button"
                  className="attendance-modal-mark-btn"
                  onClick={async () => {

                    const result =
                      await markPresent(
                        selectedAttendance
                      );

                    if (result) {

                      closeDetails();

                    }

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


// =========================================================
// EXPORT
// =========================================================

export default AttendanceManagement;