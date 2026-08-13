import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../../services/api";
import "./AttendanceManagement.css";

// =========================================================
// OPTIONAL QR SCANNER
// =========================================================
//
// Install:
//
// npm install html5-qrcode
//
// This component uses Html5Qrcode when available.
//
// =========================================================

let Html5Qrcode = null;

try {
  // eslint-disable-next-line global-require
  Html5Qrcode =
    require("html5-qrcode").Html5Qrcode;
} catch (error) {
  Html5Qrcode = null;
}


// =========================================================
// COMPONENT
// =========================================================

const AttendanceManagement = () => {

  // =======================================================
  // EVENTS
  // =======================================================

  const [events, setEvents] =
    useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");


  const [eventsLoading, setEventsLoading] =
    useState(false);


  // =======================================================
  // ATTENDANCE
  // =======================================================

  const [attendance, setAttendance] =
    useState([]);

  const [loading, setLoading] =
    useState(false);


  const [stats, setStats] =
    useState({
      total: 0,
      present: 0,
      notPresent: 0,
      attendancePercentage: 0,
      attendanceRecords: 0,
    });


  // =======================================================
  // SEARCH / FILTER
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");


  // =======================================================
  // QR SCANNER
  // =======================================================

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [scannerLoading, setScannerLoading] =
    useState(false);


  const [scanResult, setScanResult] =
    useState(null);


  const [scanError, setScanError] =
    useState("");


  const scannerRef =
    useRef(null);


  const scannerStartedRef =
    useRef(false);


  // =======================================================
  // MANUAL CODE
  // =======================================================

  const [attendanceCode, setAttendanceCode] =
    useState("");

  const [codeLoading, setCodeLoading] =
    useState(false);


  // =======================================================
  // GENERAL MESSAGE
  // =======================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =======================================================
  // SELECTED ATTENDEE
  // =======================================================

  const [selectedAttendance, setSelectedAttendance] =
    useState(null);


  // =======================================================
  // LOAD EVENTS
  // =======================================================

  const loadEvents = async () => {

    try {

      setEventsLoading(true);
      setError("");

      const response =
        await api.get("/events");

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

      setEvents(eventList);

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

    } catch (err) {

      console.error(
        "Load events error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load events"
      );

    } finally {

      setEventsLoading(false);

    }
  };


  // =======================================================
  // LOAD ATTENDANCE
  // =======================================================

  const loadAttendance = async () => {

    if (!selectedEventId) {
      setAttendance([]);
      return;
    }

    try {

      setLoading(true);
      setError("");

      const params = {};

      if (
        search.trim()
      ) {
        params.search =
          search.trim();
      }

      if (
        statusFilter !== "all"
      ) {
        params.status =
          statusFilter;
      }

      const response =
        await api.get(
          `/attendance/event/${selectedEventId}`,
          {
            params,
          }
        );

      const data =
        response.data;

      setAttendance(
        Array.isArray(
          data?.attendance
        )
          ? data.attendance
          : []
      );

    } catch (err) {

      console.error(
        "Load attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load attendance"
      );

    } finally {

      setLoading(false);

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

      const data =
        response.data;

      if (
        data?.stats
      ) {

        setStats({
          total:
            Number(
              data.stats.total || 0
            ),

          present:
            Number(
              data.stats.present || 0
            ),

          notPresent:
            Number(
              data.stats.notPresent || 0
            ),

          attendancePercentage:
            Number(
              data.stats
                .attendancePercentage ||
              0
            ),

          attendanceRecords:
            Number(
              data.stats
                .attendanceRecords ||
              0
            ),
        });

      }

    } catch (err) {

      console.error(
        "Load attendance stats error:",
        err
      );

    }
  };


  // =======================================================
  // INITIAL EVENTS
  // =======================================================

  useEffect(() => {

    loadEvents();

  }, []);


  // =======================================================
  // LOAD ATTENDANCE WHEN EVENT CHANGES
  // =======================================================

  useEffect(() => {

    if (!selectedEventId) {
      return;
    }

    loadAttendance();
    loadStats();

  }, [
    selectedEventId,
    statusFilter,
  ]);


  // =======================================================
  // SEARCH DEBOUNCE
  // =======================================================

  useEffect(() => {

    if (!selectedEventId) {
      return;
    }

    const timer =
      setTimeout(() => {
        loadAttendance();
      }, 400);

    return () => {
      clearTimeout(timer);
    };

  }, [search]);


  // =======================================================
  // REFRESH
  // =======================================================

  const refreshAttendance = async () => {

    setSuccess("");

    await Promise.all([
      loadAttendance(),
      loadStats(),
    ]);

  };


  // =======================================================
  // STOP QR SCANNER
  // =======================================================

  const stopScanner = async () => {

    try {

      if (
        scannerRef.current &&
        scannerStartedRef.current
      ) {

        await scannerRef.current.stop();

        try {
          await scannerRef.current.clear();
        } catch (clearError) {
          // Ignore clear errors.
        }

      }

    } catch (err) {

      console.error(
        "Stop scanner error:",
        err
      );

    } finally {

      scannerStartedRef.current =
        false;

      scannerRef.current =
        null;

    }
  };


  // =======================================================
  // CLOSE SCANNER
  // =======================================================

  const closeScanner = async () => {

    await stopScanner();

    setScannerOpen(false);

    setScannerLoading(false);

  };


  // =======================================================
  // PROCESS QR DATA
  // =======================================================

  const processQrCode = async (
    decodedText
  ) => {

    if (
      !decodedText ||
      scannerLoading
    ) {
      return;
    }

    try {

      setScannerLoading(true);
      setScanError("");
      setSuccess("");

      const response =
        await api.post(
          "/attendance/verify-qr",
          {
            qrData:
              decodedText,

            eventId:
              Number(
                selectedEventId
              ),
          }
        );

      const data =
        response.data;

      if (
        data?.success
      ) {

        setScanResult(
          data
        );

        setSuccess(
          data.message ||
          "Attendance marked successfully"
        );

        await stopScanner();

        setScannerOpen(false);

        await Promise.all([
          loadAttendance(),
          loadStats(),
        ]);

      } else {

        setScanError(
          data?.message ||
          "QR verification failed"
        );

      }

    } catch (err) {

      console.error(
        "QR verification error:",
        err
      );

      const responseData =
        err.response?.data;

      if (
        responseData?.alreadyPresent
      ) {

        setScanResult(
          responseData
        );

        setScanError(
          responseData.message ||
          "Attendance already marked"
        );

      } else {

        setScanError(
          responseData?.message ||
          "Unable to verify QR code"
        );

      }

    } finally {

      setScannerLoading(false);

    }
  };


  // =======================================================
  // START QR SCANNER
  // =======================================================

  const startScanner = async () => {

    setScanError("");
    setScanResult(null);
    setSuccess("");

    if (!selectedEventId) {

      setScanError(
        "Please select an event first."
      );

      return;
    }

    if (!Html5Qrcode) {

      setScanError(
        "QR scanner package is not installed. Run: npm install html5-qrcode"
      );

      return;
    }

    setScannerOpen(true);

    // Give DOM time to render scanner container.
    setTimeout(
      async () => {

        try {

          const scanner =
            new Html5Qrcode(
              "snict-attendance-qr-reader"
            );

          scannerRef.current =
            scanner;

          await scanner.start(

            {
              facingMode:
                "environment",
            },

            {
              fps: 10,

              qrbox: {
                width: 280,
                height: 280,
              },

              aspectRatio:
                1,
            },

            async (
              decodedText
            ) => {

              await processQrCode(
                decodedText
              );

            },

            () => {
              // Ignore continuous QR scan errors.
            }

          );

          scannerStartedRef.current =
            true;

        } catch (err) {

          console.error(
            "Start scanner error:",
            err
          );

          setScanError(
            "Unable to start camera. Please allow camera permission and try again."
          );

          setScannerOpen(false);

        }

      },
      150
    );
  };


  // =======================================================
  // MANUAL ATTENDANCE CODE
  // =======================================================

  const verifyManualCode =
    async () => {

      if (
        !selectedEventId
      ) {

        setError(
          "Please select an event first."
        );

        return;
      }

      if (
        !attendanceCode.trim()
      ) {

        setError(
          "Please enter attendance code."
        );

        return;
      }

      try {

        setCodeLoading(true);

        setError("");
        setSuccess("");
        setScanResult(null);

        const response =
          await api.post(
            "/attendance/verify-code",
            {
              attendanceCode:
                attendanceCode
                  .trim()
                  .toUpperCase(),

              eventId:
                Number(
                  selectedEventId
                ),
            }
          );

        const data =
          response.data;

        if (
          data?.success
        ) {

          setScanResult(
            data
          );

          setSuccess(
            data.message ||
            "Attendance marked successfully"
          );

          setAttendanceCode("");

          await Promise.all([
            loadAttendance(),
            loadStats(),
          ]);

        }

      } catch (err) {

        console.error(
          "Verify attendance code error:",
          err
        );

        const responseData =
          err.response?.data;

        if (
          responseData?.alreadyPresent
        ) {

          setScanResult(
            responseData
          );

        }

        setError(
          responseData?.message ||
          "Unable to verify attendance code"
        );

      } finally {

        setCodeLoading(false);

      }
    };


  // =======================================================
  // MANUAL MARK PRESENT
  // =======================================================

  const markPresent =
    async (
      bookingId
    ) => {

      if (
        !selectedEventId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Mark this attendee as present?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/attendance/${bookingId}/mark-present`,
            {
              eventId:
                Number(
                  selectedEventId
                ),
            }
          );

        const data =
          response.data;

        if (
          data?.success
        ) {

          setSuccess(
            data.message ||
            "Attendance marked successfully"
          );

          await Promise.all([
            loadAttendance(),
            loadStats(),
          ]);

        }

      } catch (err) {

        console.error(
          "Mark present error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to mark attendance"
        );

      }
    };


  // =======================================================
  // CLEANUP
  // =======================================================

  useEffect(() => {

    return () => {

      stopScanner();

    };

  }, []);


  // =======================================================
  // SELECTED EVENT
  // =======================================================

  const selectedEvent =
    events.find(
      (event) =>
        String(event.id) ===
        String(selectedEventId)
    );


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "-";
    }

    try {

      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    } catch {
      return date;
    }
  };


  // =======================================================
  // FORMAT DATE TIME
  // =======================================================

  const formatDateTime = (
    date
  ) => {

    if (!date) {
      return "-";
    }

    try {

      return new Date(
        date
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    } catch {
      return date;
    }
  };


  // =======================================================
  // GET USER IMAGE
  // =======================================================

  const getUserImage = (
    item
  ) => {

    return (
      item?.user?.profileImageUrl ||
      ""
    );
  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="attendance-management">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="attendance-header">

        <div>

          <h1>
            Attendance Management
          </h1>

          <p>
            Scan event passes, verify attendance
            codes and manage event attendance.
          </p>

        </div>


        <button
          type="button"
          className="attendance-refresh-btn"
          onClick={
            refreshAttendance
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="attendance-alert attendance-alert-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}


      {success && (
        <div className="attendance-alert attendance-alert-success">

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}


      {/* =================================================
          EVENT SELECTOR
      ================================================= */}

      <div className="attendance-card">

        <div className="attendance-card-header">

          <div>

            <h2>
              Select Event
            </h2>

            <p>
              Choose an event to manage its
              attendance.
            </p>

          </div>

        </div>


        <select
          value={
            selectedEventId
          }
          onChange={(e) => {

            setSelectedEventId(
              e.target.value
            );

            setAttendance([]);
            setScanResult(null);
            setSuccess("");
            setError("");

          }}
          disabled={
            eventsLoading
          }
          className="attendance-event-select"
        >

          <option value="">
            {eventsLoading
              ? "Loading events..."
              : "Select Event"}
          </option>

          {events.map(
            (event) => (

              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
                {" - "}
                {formatDate(
                  event.event_date ||
                  event.eventDate
                )}
              </option>

            )
          )}

        </select>


        {selectedEvent && (
          <div className="selected-event-info">

            <strong>
              {selectedEvent.title}
            </strong>

            <span>
              {formatDate(
                selectedEvent.event_date ||
                selectedEvent.eventDate
              )}
            </span>

            {(
              selectedEvent.venue
            ) && (
              <span>
                {selectedEvent.venue}
              </span>
            )}

          </div>
        )}

      </div>


      {selectedEventId && (
        <>

          {/* ===============================================
              STATISTICS
          =============================================== */}

          <div className="attendance-stats-grid">

            <div className="attendance-stat-card">

              <span>
                Total Bookings
              </span>

              <strong>
                {stats.total}
              </strong>

            </div>


            <div className="attendance-stat-card">

              <span>
                Present
              </span>

              <strong>
                {stats.present}
              </strong>

            </div>


            <div className="attendance-stat-card">

              <span>
                Not Present
              </span>

              <strong>
                {stats.notPresent}
              </strong>

            </div>


            <div className="attendance-stat-card">

              <span>
                Attendance
              </span>

              <strong>
                {stats.attendancePercentage}%
              </strong>

            </div>

          </div>


          {/* ===============================================
              SCAN + MANUAL CODE
          =============================================== */}

          <div className="attendance-actions-grid">

            {/* QR SCANNER */}

            <div className="attendance-card">

              <div className="attendance-card-header">

                <div>

                  <h2>
                    Scan QR Pass
                  </h2>

                  <p>
                    Scan the QR code shown on
                    the user's event pass.
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="attendance-primary-btn"
                onClick={
                  startScanner
                }
                disabled={
                  scannerOpen ||
                  scannerLoading
                }
              >
                {scannerOpen
                  ? "Scanner Open"
                  : "Open QR Scanner"}
              </button>

            </div>


            {/* MANUAL CODE */}

            <div className="attendance-card">

              <div className="attendance-card-header">

                <div>

                  <h2>
                    Manual Attendance
                  </h2>

                  <p>
                    Use the unique code below
                    the QR when scanning is not
                    possible.
                  </p>

                </div>

              </div>


              <div className="attendance-code-row">

                <input
                  type="text"
                  value={
                    attendanceCode
                  }
                  onChange={(e) =>
                    setAttendanceCode(
                      e.target.value
                        .toUpperCase()
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key ===
                      "Enter"
                    ) {
                      verifyManualCode();
                    }

                  }}
                  placeholder="SNICT-ATT-XXXXXXXXXX"
                  className="attendance-code-input"
                />


                <button
                  type="button"
                  className="attendance-secondary-btn"
                  onClick={
                    verifyManualCode
                  }
                  disabled={
                    codeLoading ||
                    !attendanceCode.trim()
                  }
                >
                  {codeLoading
                    ? "Checking..."
                    : "Verify Code"}
                </button>

              </div>

            </div>

          </div>


          {/* ===============================================
              SCAN RESULT
          =============================================== */}

          {scanResult && (
            <div className="attendance-card attendance-scan-result">

              <div className="attendance-card-header">

                <div>

                  <h2>
                    Verification Result
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setScanResult(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="scan-result-content">

                {scanResult.user && (

                  <div className="scan-user">

                    {getUserImage(
                      scanResult
                    ) ? (

                      <img
                        src={getUserImage(
                          scanResult
                        )}
                        alt={
                          scanResult.user
                            .fullName
                        }
                      />

                    ) : (

                      <div className="scan-user-placeholder">
                        {(
                          scanResult.user
                            .fullName ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                    )}


                    <div>

                      <h3>
                        {
                          scanResult.user
                            .fullName
                        }
                      </h3>

                      <p>
                        {
                          scanResult.user
                            .email
                        }
                      </p>

                      <p>
                        {
                          scanResult.user
                            .mobile
                        }
                      </p>

                    </div>

                  </div>

                )}


                {scanResult.attendance && (

                  <div className="scan-attendance-info">

                    <div>

                      <span>
                        Status
                      </span>

                      <strong>
                        {
                          scanResult
                            .attendance
                            .attendance_status ||
                          scanResult
                            .attendance
                            .attendanceStatus ||
                          "Present"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Attendance Code
                      </span>

                      <strong>
                        {
                          scanResult
                            .attendance
                            .attendance_code ||
                          scanResult
                            .attendance
                            .attendanceCode ||
                          "-"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Marked At
                      </span>

                      <strong>
                        {formatDateTime(
                          scanResult
                            .attendance
                            .marked_at ||
                          scanResult
                            .attendance
                            .markedAt
                        )}
                      </strong>

                    </div>

                  </div>

                )}

              </div>

            </div>
          )}


          {/* ===============================================
              FILTERS
          =============================================== */}

          <div className="attendance-card">

            <div className="attendance-filters">

              <div className="attendance-search">

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search name, email, mobile, booking code..."
                />

              </div>


              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All
                </option>

                <option value="present">
                  Present
                </option>

                <option value="not_present">
                  Not Present
                </option>

              </select>

            </div>

          </div>


          {/* ===============================================
              ATTENDANCE TABLE
          =============================================== */}

          <div className="attendance-card">

            <div className="attendance-card-header">

              <div>

                <h2>
                  Attendance Records
                </h2>

                <p>
                  {attendance.length}
                  {" "}
                  attendance records
                </p>

              </div>

            </div>


            {loading ? (

              <div className="attendance-loading">
                Loading attendance...
              </div>

            ) : attendance.length === 0 ? (

              <div className="attendance-empty">

                <div className="attendance-empty-icon">
                  ✓
                </div>

                <h3>
                  No attendance records
                </h3>

                <p>
                  No attendance data was found
                  for this event.
                </p>

              </div>

            ) : (

              <div className="attendance-table-wrapper">

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

                    {attendance.map(
                      (item) => {

                        const isPresent =
                          item.attendanceStatus ===
                          "present";


                        return (

                          <tr
                            key={
                              item.id ||
                              item.bookingId
                            }
                          >

                            <td>

                              <div className="attendee-cell">

                                {item.user
                                  ?.profileImageUrl ? (

                                  <img
                                    src={
                                      item.user
                                        .profileImageUrl
                                    }
                                    alt={
                                      item.user
                                        .fullName
                                    }
                                  />

                                ) : (

                                  <div className="attendee-avatar">
                                    {(
                                      item.user
                                        ?.fullName ||
                                      "U"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                )}


                                <div>

                                  <strong>
                                    {
                                      item.user
                                        ?.fullName ||
                                      "-"
                                    }
                                  </strong>

                                  <span>
                                    {
                                      item.user
                                        ?.email ||
                                      "-"
                                    }
                                  </span>

                                  <span>
                                    {
                                      item.user
                                        ?.mobile ||
                                      "-"
                                    }
                                  </span>

                                </div>

                              </div>

                            </td>


                            <td>

                              <strong>
                                {
                                  item.booking
                                    ?.bookingCode ||
                                  "-"
                                }
                              </strong>

                              <small>
                                ₹
                                {Number(
                                  item.booking
                                    ?.amount ||
                                  0
                                ).toFixed(2)}
                              </small>

                            </td>


                            <td>

                              <code>
                                {
                                  item.attendanceCode ||
                                  "-"
                                }
                              </code>

                            </td>


                            <td>

                              <span
                                className={
                                  isPresent
                                    ? "attendance-status attendance-status-present"
                                    : "attendance-status attendance-status-not-present"
                                }
                              >

                                {isPresent
                                  ? "Present"
                                  : "Not Present"}

                              </span>

                            </td>


                            <td>

                              {formatDateTime(
                                item.markedAt
                              )}

                            </td>


                            <td>

                              <div className="attendance-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedAttendance(
                                      item
                                    )
                                  }
                                >
                                  View
                                </button>


                                {!isPresent && (

                                  <button
                                    type="button"
                                    className="mark-present-btn"
                                    onClick={() =>
                                      markPresent(
                                        item.bookingId
                                      )
                                    }
                                  >
                                    Mark Present
                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </>
      )}


      {/* =================================================
          QR SCANNER MODAL
      ================================================= */}

      {scannerOpen && (

        <div className="attendance-modal-overlay">

          <div className="attendance-modal">

            <div className="attendance-modal-header">

              <div>

                <h2>
                  Scan Event Pass
                </h2>

                <p>
                  Point the camera at the
                  user's QR code.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeScanner
                }
              >
                ×
              </button>

            </div>


            <div
              id="snict-attendance-qr-reader"
              className="attendance-qr-reader"
            />


            {scannerLoading && (

              <div className="scanner-processing">
                Verifying attendance...
              </div>

            )}


            {scanError && (

              <div className="attendance-alert attendance-alert-error">
                {scanError}
              </div>

            )}


            <button
              type="button"
              className="attendance-secondary-btn scanner-close-btn"
              onClick={
                closeScanner
              }
            >
              Close Scanner
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          ATTENDEE DETAILS MODAL
      ================================================= */}

      {selectedAttendance && (

        <div className="attendance-modal-overlay">

          <div className="attendance-modal attendance-details-modal">

            <div className="attendance-modal-header">

              <div>

                <h2>
                  Attendee Details
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedAttendance(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="attendee-details">

              <div className="attendee-details-profile">

                {selectedAttendance.user
                  ?.profileImageUrl ? (

                  <img
                    src={
                      selectedAttendance
                        .user
                        .profileImageUrl
                    }
                    alt={
                      selectedAttendance
                        .user
                        .fullName
                    }
                  />

                ) : (

                  <div className="large-avatar">
                    {(
                      selectedAttendance
                        .user
                        ?.fullName ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                )}


                <div>

                  <h3>
                    {
                      selectedAttendance
                        .user
                        ?.fullName
                  }
                  </h3>

                  <p>
                    @
                    {
                      selectedAttendance
                        .user
                        ?.username ||
                      "-"
                    }
                  </p>

                </div>

              </div>


              <div className="details-grid">

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .user
                        ?.email ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Mobile
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .user
                        ?.mobile ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Age
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .user
                        ?.age ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Blood Group
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .user
                        ?.bloodGroup ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Booking Code
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .booking
                        ?.bookingCode ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Attendance Code
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .attendanceCode ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedAttendance
                        .attendanceStatus ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Marked At
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedAttendance
                        .markedAt
                    )}
                  </strong>
                </div>

              </div>


              {selectedAttendance
                .attendanceStatus !==
                "present" && (

                <button
                  type="button"
                  className="attendance-primary-btn"
                  onClick={() => {

                    setSelectedAttendance(
                      null
                    );

                    markPresent(
                      selectedAttendance
                        .bookingId
                    );

                  }}
                >
                  Mark Present
                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


export default AttendanceManagement;
