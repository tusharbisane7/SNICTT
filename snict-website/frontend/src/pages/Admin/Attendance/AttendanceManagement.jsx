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
  CalendarDays,
  MapPin,
  Keyboard,
  Camera,
  CameraOff,
  FileDown,
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

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [scanMessage, setScanMessage] =
    useState("");

  // =======================================================
  // REFS
  // =======================================================

  const scannerInstanceRef =
    useRef(null);

  const scannerProcessingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const selectedEventIdRef =
    useRef("");

  // =======================================================
  // SELECTED EVENT REF
  // =======================================================

  useEffect(() => {
    selectedEventIdRef.current =
      selectedEventId;
  }, [selectedEventId]);

  // =======================================================
  // COMPONENT CLEANUP
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
  // API ERROR MESSAGE
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
            setEvents(safeEvents);
          }

          // Automatically select first event
          if (
            safeEvents.length > 0 &&
            !selectedEventIdRef.current
          ) {
            const firstEventId =
              String(
                safeEvents[0].id
              );

            if (mountedRef.current) {
              setSelectedEventId(
                firstEventId
              );

              selectedEventIdRef.current =
                firstEventId;
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
  // LOAD EVENT ATTENDANCE
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
  // LOAD EVENT STATS
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
                    ? (present / total) * 100
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
  // LOAD SELECTED EVENT ATTENDANCE
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
  // CLEAR SUCCESS MESSAGE
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
  // CLEAR ERROR MESSAGE
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

  const refreshAll =
    async () => {
      if (refreshing) {
        return;
      }

      const eventId =
        selectedEventIdRef.current;

      setRefreshing(true);

      try {
        await loadEvents();

        if (eventId) {
          await Promise.all([
            loadAttendance(
              eventId,
              true
            ),
            loadStats(
              eventId
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
        return {
          ...item,

          attendanceId:
            item.attendance_id ??
            item.attendanceId ??
            item.id ??
            null,

          bookingId:
            item.booking_id ??
            item.bookingId ??
            item.booking?.id ??
            null,

          attendanceCode:
            item.attendance_code ??
            item.attendanceCode ??
            item.attendance?.attendance_code ??
            "N/A",

          attendanceStatus:
            String(
              item.attendance_status ??
                item.attendanceStatus ??
                item.status ??
                "not_present"
            ).toLowerCase(),

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

          eventId:
            item.event_id ??
            item.eventId ??
            item.event?.id ??
            null,

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

          venue:
            item.venue ??
            item.event?.venue ??
            item.event?.location ??
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
  // SEARCH
  // =======================================================

  const filteredAttendance =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return normalizedAttendance;
      }

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

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      normalizedAttendance,
      search,
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

  const formatDate =
    (value) => {
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

  const formatDateTime =
    (value) => {
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
  // GET ACTUAL EVENT ID FROM VERIFICATION RESPONSE
  //
  // IMPORTANT:
  //
  // We do NOT use selectedEventId to verify.
  //
  // The backend decides the actual event.
  // =======================================================

  const getVerifiedEventId =
    (response) => {
      const data =
        response?.data ||
        {};

      const attendance =
        data.attendance ||
        data.data?.attendance ||
        {};

      const event =
        data.event ||
        data.data?.event ||
        {};

      return (
        data.eventId ??
        data.event_id ??
        attendance.event_id ??
        attendance.eventId ??
        event.id ??
        event.eventId ??
        data.data?.eventId ??
        data.data?.event_id ??
        null
      );
    };

  // =======================================================
  // HANDLE VERIFICATION SUCCESS
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

      const verifiedEventId =
        getVerifiedEventId(
          response
        );

      const currentSelectedEventId =
        selectedEventIdRef.current;

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

      // ===================================================
      // REFRESH THE ACTUAL EVENT
      //
      // If backend returned event ID,
      // refresh that event.
      //
      // Otherwise refresh currently selected event.
      // ===================================================

      const eventToRefresh =
        verifiedEventId ||
        currentSelectedEventId;

      if (eventToRefresh) {
        await Promise.all([
          loadAttendance(
            eventToRefresh,
            true
          ),
          loadStats(
            eventToRefresh
          ),
        ]);

        // If the verified event is different
        // from the selected event, don't change
        // the user's selected event automatically.
        //
        // The selected event is only for viewing.
      }

      return true;
    };

  // =======================================================
  // MANUAL VERIFY
  //
  // IMPORTANT:
  //
  // NO EVENT ID IS SENT.
  //
  // The attendance code itself identifies
  // the attendee/event.
  // =======================================================

  const verifyManualCode =
    async (
      event
    ) => {
      if (event) {
        event.preventDefault();
      }

      const code =
        manualCode
          .trim()
          .toUpperCase();

      if (!code) {
        setError(
          "Please enter attendance code."
        );

        return;
      }

      try {
        setError("");

        setScanMessage(
          "Verifying attendance code..."
        );

        // =================================================
        // IMPORTANT:
        //
        // DO NOT SEND selectedEventId.
        //
        // This makes manual verification GLOBAL.
        // =================================================

        const response =
          await api.post(
            "/attendance/verify-code",
            {
              attendanceCode:
                code,
            }
          );

        const successResult =
          await handleAttendanceSuccess(
            response
          );

        if (successResult) {
          setManualCode("");

          if (scanning) {
            await stopScanner();
          }
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
  //
  // IMPORTANT:
  //
  // Scanner is GLOBAL.
  //
  // It does NOT depend on selected event.
  // =======================================================

  const startScanner =
    async () => {
      if (scanning) {
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
              if (
                scannerInstanceRef.current ===
                scanner
              ) {
                scannerProcessingRef.current =
                  false;
              }
            }
          },
          () => {}
        );

        if (mountedRef.current) {
          setScanning(true);

          setScanMessage(
            "Point the camera at any valid attendee QR code."
          );
        }
      } catch (error) {
        console.error(
          "Start QR scanner error:",
          error
        );

        const failedScanner =
          scannerInstanceRef.current;

        scannerInstanceRef.current =
          null;

        scannerProcessingRef.current =
          false;

        if (failedScanner) {
          try {
            await failedScanner.clear();
          } catch {}
        }

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
          setScanMessage("");
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
  //
  // IMPORTANT:
  //
  // NO EVENT ID IS SENT.
  //
  // Any valid event QR can be scanned.
  // =======================================================

  const handleQrResult =
    async (
      decodedText
    ) => {
      if (!decodedText) {
        return;
      }

      try {
        setScanMessage(
          "Verifying QR code..."
        );

        setError("");

        const cleanedQrText =
          String(decodedText)
            .replace(/^\uFEFF/, "")
            .trim();

        if (!cleanedQrText) {
          throw new Error(
            "QR code is empty."
          );
        }

        let qrData =
          cleanedQrText;

        // =================================================
        // TRY JSON
        // =================================================

        try {
          qrData =
            JSON.parse(
              cleanedQrText
            );
        } catch {
          // =================================================
          // PLAIN TEXT QR
          // =================================================

          qrData = {
            attendanceCode:
              cleanedQrText,
          };
        }

        // =================================================
        // NORMALIZE QR OBJECT
        // =================================================

        if (
          qrData &&
          typeof qrData ===
            "object"
        ) {
          if (
            qrData.bookingId !=
            null
          ) {
            qrData.bookingId =
              Number(
                qrData.bookingId
              );
          }

          if (
            qrData.eventId !=
            null
          ) {
            qrData.eventId =
              Number(
                qrData.eventId
              );
          }

          if (
            qrData.passId !=
            null
          ) {
            qrData.passId =
              Number(
                qrData.passId
              );
          }
        }

        // =================================================
        // IMPORTANT:
        //
        // NO selectedEventId
        // NO eventId
        //
        // Backend identifies actual event.
        // =================================================

        const response =
          await api.post(
            "/attendance/verify-qr",
            {
              qrData,
            }
          );

        const successResult =
          await handleAttendanceSuccess(
            response
          );

        if (successResult) {
          await stopScanner();
        } else {
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

      setManualCode("");

      setError("");

      setSuccess("");

      setScanMessage("");
    };

  // =======================================================
  // EXPORT PDF
  // =======================================================

  const exportAttendancePdf =
    () => {
      if (!selectedEventId) {
        setError(
          "Please select an event first."
        );

        return;
      }

      if (
        filteredAttendance.length ===
        0
      ) {
        setError(
          "There are no attendance records to export."
        );

        return;
      }

      window.print();
    };

  // =======================================================
  // SELECTED EVENT DISPLAY
  // =======================================================

  const eventTitle =
    selectedEvent?.title ||
    selectedEvent?.name ||
    selectedEvent?.event_name ||
    `Event #${selectedEventId}`;

  const eventDate =
    selectedEvent?.event_date ||
    selectedEvent?.eventDate ||
    selectedEvent?.date ||
    null;

  const eventVenue =
    selectedEvent?.venue ||
    selectedEvent?.location ||
    "";

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
              Scan any valid attendee QR or
              manually verify an attendance code.
            </p>

          </div>

          <div className="attendance-header-actions">

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

            <button
              type="button"
              className="attendance-pdf-btn"
              onClick={
                exportAttendancePdf
              }
              disabled={
                !selectedEventId ||
                filteredAttendance.length ===
                  0
              }
            >

              <FileDown
                size={17}
              />

              Export PDF

            </button>

          </div>

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
              <X size={15} />
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
              <X size={15} />
            </button>

          </div>
        )}

        {/* =================================================
            EVENT LIST
        ================================================= */}

       
        

             

        {/* =================================================
            GLOBAL VERIFICATION
        ================================================= */}

        <section className="attendance-verification-section">

          <div className="attendance-verification-header">

            <span className="attendance-section-label">
              GLOBAL ATTENDANCE VERIFICATION
            </span>

            <h2>
              Verify Attendee
            </h2>

            <p>
              You can scan a valid QR code or
              enter an attendance code from any event.
              You do not need to select the attendee's
              event before verification.
            </p>

          </div>

          <div className="attendance-verification-grid">

            {/* =============================================
                QR SCANNER
            ============================================= */}

            <div className="attendance-scanner-card">

              <div className="attendance-card-heading">

                <div className="attendance-card-icon">

                  <QrCode
                    size={21}
                  />

                </div>

                <div>

                  <h3>
                    Scan QR Code
                  </h3>

                  <p>
                    Scan any valid attendee
                    event-pass QR.
                  </p>

                </div>

              </div>

              <div className="attendance-camera-wrapper">

                <div
                  id="attendance-qr-reader"
                  className={
                    scanning
                      ? "attendance-camera attendance-camera-active"
                      : "attendance-camera"
                  }
                />

                {!scanning && (
                  <div className="attendance-camera-placeholder">

                    <QrCode
                      size={44}
                    />

                    <strong>
                      QR Scanner Ready
                    </strong>

                    <span>
                      Scan any attendee QR code.
                    </span>

                  </div>
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
                >

                  <Camera
                    size={18}
                  />

                  Scan QR Code

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
                    size={18}
                  />

                  Stop Scanner

                </button>
              )}

              <div className="attendance-security-note">

                <ShieldCheck
                  size={15}
                />

                <span>
                  The backend identifies the
                  attendee and event from the QR.
                </span>

              </div>

            </div>

            {/* =============================================
                MANUAL VERIFY
            ============================================= */}

            <div className="attendance-manual-card">

              <div className="attendance-card-heading">

                <div className="attendance-card-icon">

                  <Keyboard
                    size={21}
                  />

                </div>

                <div>

                  <h3>
                    Manual Verify
                  </h3>

                  <p>
                    Enter an attendance code
                    from any event.
                  </p>

                </div>

              </div>

              <form
                onSubmit={
                  verifyManualCode
                }
                className="attendance-manual-form"
              >

                <label>
                  Attendance Code
                </label>

                <input
                  type="text"
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
                  placeholder="SNICT-ATT-XXXXXXXXXX"
                  autoComplete="off"
                  spellCheck="false"
                />

                <button
                  type="submit"
                  disabled={
                    !manualCode.trim()
                  }
                >

                  <CheckCircle2
                    size={18}
                  />

                  Verify Attendance

                </button>

              </form>

              <div className="attendance-manual-info">

                <CheckCircle2
                  size={16}
                />

                <span>
                  No event selection is required
                  for manual verification.
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            EVENT ATTENDANCE
        ================================================= */}

        <section
          className="attendance-list-section"
          id="attendance-print-area"
        >

          <div className="attendance-list-header">

            

             

            {selectedEventId && (
              <div className="attendance-list-count">
                {filteredAttendance.length}
                {" "}
                attendees
              </div>
            )}

          </div>

          {/* =================================================
              STATS
          ================================================= */}

          {selectedEventId && (
            <div className="attendance-stats-grid">

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

            </div>
          )}

          {/* =================================================
              SEARCH
          ================================================= */}

          {selectedEventId && (
            <div className="attendance-list-toolbar">

              <div className="attendance-search">

                <Search
                  size={17}
                />

                <input
                  type="text"
                  placeholder="Search attendee, email, booking or code..."
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

            </div>
          )}

          {/* =================================================
              ATTENDANCE TABLE
          ================================================= */}

          {!selectedEventId ? (
            <div className="attendance-empty">

              <CalendarDays
                size={42}
              />

              <h3>
                Select an event
              </h3>

              <p>
                Select an event above to
                view its attendance.
              </p>

            </div>
          ) : loading ? (
            <div className="attendance-empty">

              <div className="attendance-loading-spinner" />

              <h3>
                Loading attendance...
              </h3>

            </div>
          ) : filteredAttendance.length ===
            0 ? (
            <div className="attendance-empty">

              <UserX
                size={42}
              />

              <h3>
                No attendance records
              </h3>

              <p>
                No attendees were found
                for this event.
              </p>

            </div>
          ) : (
            <div className="attendance-table-wrapper">

              <div className="attendance-table-scroll">

                <table className="attendance-table">

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

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

                    </tr>

                  </thead>

                  <tbody>

                    {filteredAttendance.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            item.attendanceId ||
                            `${item.bookingId}-${index}`
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

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

                          <td>

                            <code>
                              {
                                item.attendanceCode
                              }
                            </code>

                          </td>

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

                          <td>

                            {item.markedAt
                              ? formatDateTime(
                                  item.markedAt
                                )
                              : "—"}

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

    </main>
  );
}

// =========================================================
// EXPORT
// =========================================================

export default AttendanceManagement;