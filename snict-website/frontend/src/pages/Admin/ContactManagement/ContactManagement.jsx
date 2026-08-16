import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";

import api from "../../../services/api";

import "./ContactManagement.css";


// =========================================================
// CONSTANTS
// =========================================================

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Enquiries",
  },
  {
    value: "new",
    label: "New",
  },
  {
    value: "read",
    label: "Read",
  },
  {
    value: "replied",
    label: "Replied",
  },
  {
    value: "closed",
    label: "Closed",
  },
];


// =========================================================
// HELPERS
// =========================================================

const formatStatus = (status) => {
  if (!status) {
    return "New";
  }

  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
};


const getStatusClass = (status) => {
  switch (status) {
    case "new":
      return "new";

    case "read":
      return "read";

    case "replied":
      return "replied";

    case "closed":
      return "closed";

    default:
      return "new";
  }
};


const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
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


const truncate = (
  value,
  length = 80
) => {
  if (!value) {
    return "—";
  }

  if (
    value.length <= length
  ) {
    return value;
  }

  return (
    value.slice(0, length) +
    "..."
  );
};


// =========================================================
// COMPONENT
// =========================================================

function ContactManagement() {

  // =======================================================
  // STATE
  // =======================================================

  const [
    enquiries,
    setEnquiries,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    selectedEnquiry,
    setSelectedEnquiry,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  const [
    enquiryToDelete,
    setEnquiryToDelete,
  ] = useState(null);


  // =======================================================
  // LOAD ENQUIRIES
  // =======================================================

  const loadEnquiries = useCallback(
    async (
      isRefresh = false
    ) => {

      try {

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get(
            "/contact/admin"
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Unable to load contact enquiries."
          );
        }

        setEnquiries(
          Array.isArray(
            response.data?.enquiries
          )
            ? response.data.enquiries
            : []
        );

      } catch (err) {

        console.error(
          "Load contact enquiries error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to load contact enquiries."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);


  // =======================================================
  // AUTO CLEAR SUCCESS
  // =======================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess("");
      }, 4000);

    return () => {
      clearTimeout(timer);
    };

  }, [success]);


  // =======================================================
  // STATISTICS
  // =======================================================

  const statistics =
    useMemo(() => {

      const total =
        enquiries.length;

      const newCount =
        enquiries.filter(
          (item) =>
            item.status === "new"
        ).length;

      const readCount =
        enquiries.filter(
          (item) =>
            item.status === "read"
        ).length;

      const repliedCount =
        enquiries.filter(
          (item) =>
            item.status === "replied"
        ).length;

      const closedCount =
        enquiries.filter(
          (item) =>
            item.status === "closed"
        ).length;

      return {
        total,
        newCount,
        readCount,
        repliedCount,
        closedCount,
      };

    }, [enquiries]);


  // =======================================================
  // FILTERED ENQUIRIES
  // =======================================================

  const filteredEnquiries =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return enquiries.filter(
        (enquiry) => {

          // -------------------------------------------------
          // STATUS
          // -------------------------------------------------

          if (
            statusFilter !==
              "all" &&
            enquiry.status !==
              statusFilter
          ) {
            return false;
          }


          // -------------------------------------------------
          // SEARCH
          // -------------------------------------------------

          if (!query) {
            return true;
          }

          const searchableText = [
            enquiry.name,
            enquiry.email,
            enquiry.phone,
            enquiry.subject,
            enquiry.message,
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
      enquiries,
      search,
      statusFilter,
    ]);


  // =======================================================
  // VIEW ENQUIRY
  // =======================================================

  const viewEnquiry = async (
    enquiry
  ) => {

    setSelectedEnquiry(
      enquiry
    );

    // -----------------------------------------------------
    // Automatically mark NEW enquiry as READ
    // -----------------------------------------------------

    if (
      enquiry.status !== "new"
    ) {
      return;
    }

    try {

      const response =
        await api.put(
          `/contact/admin/${enquiry.id}/status`,
          {
            status: "read",
          }
        );

      if (
        response.data?.success
      ) {

        const updated =
          response.data.enquiry;

        setEnquiries(
          (previous) =>
            previous.map(
              (item) =>
                String(item.id) ===
                String(enquiry.id)
                  ? updated
                  : item
            )
        );

        setSelectedEnquiry(
          updated
        );
      }

    } catch (err) {

      console.error(
        "Mark enquiry as read error:",
        err
      );

    }

  };


  // =======================================================
  // UPDATE STATUS
  // =======================================================

  const updateStatus = async (
    enquiry,
    status
  ) => {

    if (
      actionLoading
    ) {
      return;
    }

    if (
      !enquiry?.id
    ) {
      return;
    }

    try {

      setActionLoading(
        true
      );

      setError("");

      const response =
        await api.put(
          `/contact/admin/${enquiry.id}/status`,
          {
            status,
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to update enquiry status."
        );
      }

      const updated =
        response.data.enquiry;

      setEnquiries(
        (previous) =>
          previous.map(
            (item) =>
              String(item.id) ===
              String(enquiry.id)
                ? updated
                : item
          )
      );

      setSelectedEnquiry(
        (previous) => {

          if (
            !previous
          ) {
            return previous;
          }

          if (
            String(
              previous.id
            ) !==
            String(enquiry.id)
          ) {
            return previous;
          }

          return updated;

        }
      );

      setSuccess(
        `Enquiry marked as ${formatStatus(
          status
        )}.`
      );

    } catch (err) {

      console.error(
        "Update enquiry status error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Unable to update enquiry status."
      );

    } finally {

      setActionLoading(
        false
      );

    }

  };


  // =======================================================
  // DELETE
  // =======================================================

  const openDeleteConfirm = (
    enquiry
  ) => {

    setEnquiryToDelete(
      enquiry
    );

    setShowDeleteConfirm(
      true
    );

  };


  const closeDeleteConfirm = () => {

    if (
      actionLoading
    ) {
      return;
    }

    setShowDeleteConfirm(
      false
    );

    setEnquiryToDelete(
      null
    );

  };


  const deleteEnquiry = async () => {

    if (
      actionLoading ||
      !enquiryToDelete?.id
    ) {
      return;
    }

    try {

      setActionLoading(
        true
      );

      setError("");

      const response =
        await api.delete(
          `/contact/admin/${enquiryToDelete.id}`
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to delete enquiry."
        );
      }

      setEnquiries(
        (previous) =>
          previous.filter(
            (item) =>
              String(item.id) !==
              String(
                enquiryToDelete.id
              )
          )
      );

      if (
        selectedEnquiry &&
        String(
          selectedEnquiry.id
        ) ===
          String(
            enquiryToDelete.id
          )
      ) {
        setSelectedEnquiry(
          null
        );
      }

      setSuccess(
        "Contact enquiry deleted successfully."
      );

      closeDeleteConfirm();

    } catch (err) {

      console.error(
        "Delete contact enquiry error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Unable to delete enquiry."
      );

    } finally {

      setActionLoading(
        false
      );

    }

  };


  // =======================================================
  // CLEAR FILTERS
  // =======================================================

  const clearFilters = () => {

    setSearch("");

    setStatusFilter(
      "all"
    );

  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (
      <main className="contact-management-page">

        <div className="contact-management-loading">

          <div className="contact-loading-spinner" />

          <p>
            Loading contact enquiries...
          </p>

        </div>

      </main>
    );

  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <main className="contact-management-page">

      <div className="contact-management-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="contact-management-header">

          <div>

            <span className="contact-management-label">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Contact Management
            </h1>

            <p>
              View and manage enquiries
              submitted through the
              SNICT contact form.
            </p>

          </div>


          <button
            type="button"
            className="contact-refresh-btn"
            onClick={() =>
              loadEnquiries(true)
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "contact-spin"
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
          <div className="contact-management-alert error">

            <AlertCircle
              size={18}
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
              <X size={16} />
            </button>

          </div>
        )}


        {success && (
          <div className="contact-management-alert success">

            <CheckCircle2
              size={18}
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
              <X size={16} />
            </button>

          </div>
        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="contact-stat-grid">

          <div className="contact-stat-card">

            <div className="contact-stat-icon total">
              <MessageCircle
                size={21}
              />
            </div>

            <div>

              <span>
                Total Enquiries
              </span>

              <strong>
                {statistics.total}
              </strong>

            </div>

          </div>


          <div className="contact-stat-card">

            <div className="contact-stat-icon new">
              <Clock3
                size={21}
              />
            </div>

            <div>

              <span>
                New
              </span>

              <strong>
                {statistics.newCount}
              </strong>

            </div>

          </div>


          <div className="contact-stat-card">

            <div className="contact-stat-icon read">
              <Eye
                size={21}
              />
            </div>

            <div>

              <span>
                Read
              </span>

              <strong>
                {statistics.readCount}
              </strong>

            </div>

          </div>


          <div className="contact-stat-card">

            <div className="contact-stat-icon replied">
              <Check
                size={21}
              />
            </div>

            <div>

              <span>
                Replied
              </span>

              <strong>
                {statistics.repliedCount}
              </strong>

            </div>

          </div>


          <div className="contact-stat-card">

            <div className="contact-stat-icon closed">
              <XCircle
                size={21}
              />
            </div>

            <div>

              <span>
                Closed
              </span>

              <strong>
                {statistics.closedCount}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        <section className="contact-filter-card">

          <div className="contact-search-box">

            <Search
              size={18}
            />

            <input
              type="text"
              placeholder="Search by name, email, phone, subject..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={16} />
              </button>
            )}

          </div>


          <div className="contact-status-filter">

            {STATUS_OPTIONS.map(
              (option) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  className={
                    statusFilter ===
                    option.value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      option.value
                    )
                  }
                >
                  {option.label}
                </button>
              )
            )}

          </div>


          {(search ||
            statusFilter !==
              "all") && (
            <button
              type="button"
              className="contact-clear-filter"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>
          )}

        </section>


        {/* =================================================
            TABLE
        ================================================= */}

        <section className="contact-table-card">

          <div className="contact-table-header">

            <div>

              <h2>
                Contact Enquiries
              </h2>

              <p>
                Showing{" "}
                <strong>
                  {
                    filteredEnquiries.length
                  }
                </strong>{" "}
                of{" "}
                <strong>
                  {enquiries.length}
                </strong>{" "}
                enquiries
              </p>

            </div>

          </div>


          {filteredEnquiries.length ===
          0 ? (

            <div className="contact-empty-state">

              <div className="contact-empty-icon">
                <MessageCircle
                  size={28}
                />
              </div>

              <h3>
                No enquiries found
              </h3>

              <p>
                {search ||
                statusFilter !==
                  "all"
                  ? "Try changing your search or filter."
                  : "No contact enquiries have been submitted yet."}
              </p>

              {(search ||
                statusFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            <div className="contact-table-wrapper">

              <table className="contact-management-table">

                <thead>

                  <tr>

                    <th>
                      Enquiry
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Subject
                    </th>

                    <th>
                      Message
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredEnquiries.map(
                    (enquiry) => (

                      <tr
                        key={
                          enquiry.id
                        }
                      >

                        {/* ENQUIRY */}

                        <td>

                          <div className="contact-person-cell">

                            <div className="contact-person-avatar">

                              <User
                                size={17}
                              />

                            </div>

                            <div>

                              <strong>
                                {enquiry.name ||
                                  "Unknown"}
                              </strong>

                              <small>
                                #
                                {
                                  enquiry.id
                                }
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* CONTACT */}

                        <td>

                          <div className="contact-details-cell">

                            {enquiry.email && (
                              <a
                                href={`mailto:${enquiry.email}`}
                              >
                                <Mail
                                  size={14}
                                />

                                <span>
                                  {
                                    enquiry.email
                                  }
                                </span>
                              </a>
                            )}

                            {enquiry.phone && (
                              <a
                                href={`tel:${enquiry.phone}`}
                              >
                                <Phone
                                  size={14}
                                />

                                <span>
                                  {
                                    enquiry.phone
                                  }
                                </span>
                              </a>
                            )}

                          </div>

                        </td>


                        {/* SUBJECT */}

                        <td>

                          <span className="contact-subject">
                            {enquiry.subject ||
                              "General Enquiry"}
                          </span>

                        </td>


                        {/* MESSAGE */}

                        <td>

                          <p className="contact-message-preview">
                            {truncate(
                              enquiry.message,
                              70
                            )}
                          </p>

                        </td>


                        {/* DATE */}

                        <td>

                          <span className="contact-date">
                            {formatDate(
                              enquiry.created_at
                            )}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`contact-status-badge ${getStatusClass(
                              enquiry.status
                            )}`}
                          >

                            <span className="contact-status-dot" />

                            {formatStatus(
                              enquiry.status
                            )}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td>

                          <div className="contact-row-actions">

                            <button
                              type="button"
                              className="contact-action-view"
                              title="View enquiry"
                              onClick={() =>
                                viewEnquiry(
                                  enquiry
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>


                            {enquiry.status !==
                              "replied" &&
                              enquiry.status !==
                                "closed" && (
                                <button
                                  type="button"
                                  className="contact-action-reply"
                                  title="Mark as replied"
                                  onClick={() =>
                                    updateStatus(
                                      enquiry,
                                      "replied"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  <Check
                                    size={16}
                                  />
                                </button>
                              )}


                            <button
                              type="button"
                              className="contact-action-delete"
                              title="Delete enquiry"
                              onClick={() =>
                                openDeleteConfirm(
                                  enquiry
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          VIEW ENQUIRY MODAL
      ===================================================== */}

      {selectedEnquiry && (

        <div
          className="contact-modal-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedEnquiry(
                null
              );
            }

          }}
        >

          <div className="contact-enquiry-modal">

            {/* MODAL HEADER */}

            <div className="contact-modal-header">

              <div>

                <span>
                  CONTACT ENQUIRY
                </span>

                <h2>
                  {selectedEnquiry.name ||
                    "Unknown User"}
                </h2>

              </div>


              <button
                type="button"
                className="contact-modal-close"
                onClick={() =>
                  setSelectedEnquiry(
                    null
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="contact-modal-body">

              {/* CONTACT INFO */}

              <div className="contact-modal-contact-grid">

                <a
                  href={`mailto:${selectedEnquiry.email}`}
                  className="contact-modal-info-card"
                >

                  <Mail
                    size={18}
                  />

                  <div>

                    <span>
                      EMAIL
                    </span>

                    <strong>
                      {
                        selectedEnquiry.email ||
                        "—"
                      }
                    </strong>

                  </div>

                </a>


                <a
                  href={`tel:${selectedEnquiry.phone}`}
                  className="contact-modal-info-card"
                >

                  <Phone
                    size={18}
                  />

                  <div>

                    <span>
                      PHONE
                    </span>

                    <strong>
                      {
                        selectedEnquiry.phone ||
                        "—"
                      }
                    </strong>

                  </div>

                </a>

              </div>


              {/* SUBJECT */}

              <div className="contact-modal-field">

                <label>
                  Subject
                </label>

                <div className="contact-modal-subject">
                  {
                    selectedEnquiry.subject ||
                    "General Enquiry"
                  }
                </div>

              </div>


              {/* MESSAGE */}

              <div className="contact-modal-field">

                <label>
                  Message
                </label>

                <div className="contact-modal-message">
                  {
                    selectedEnquiry.message ||
                    "No message provided."
                  }
                </div>

              </div>


              {/* DATE */}

              <div className="contact-modal-meta">

                <span>
                  Submitted
                </span>

                <strong>
                  {formatDate(
                    selectedEnquiry.created_at
                  )}
                </strong>

              </div>


              {/* STATUS */}

              <div className="contact-modal-status-section">

                <label>
                  Enquiry Status
                </label>

                <div className="contact-status-buttons">

                  {[
                    "new",
                    "read",
                    "replied",
                    "closed",
                  ].map(
                    (status) => (

                      <button
                        key={
                          status
                        }
                        type="button"
                        className={
                          selectedEnquiry.status ===
                          status
                            ? `active ${getStatusClass(
                                status
                              )}`
                            : ""
                        }
                        onClick={() =>
                          updateStatus(
                            selectedEnquiry,
                            status
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        {formatStatus(
                          status
                        )}
                      </button>

                    )
                  )}

                </div>

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="contact-modal-footer">

              <button
                type="button"
                className="contact-modal-secondary-btn"
                onClick={() =>
                  setSelectedEnquiry(
                    null
                  )
                }
              >
                Close
              </button>


              {selectedEnquiry.status !==
                "replied" &&
                selectedEnquiry.status !==
                  "closed" && (

                <button
                  type="button"
                  className="contact-modal-primary-btn"
                  onClick={() =>
                    updateStatus(
                      selectedEnquiry,
                      "replied"
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >

                  <CheckCircle2
                    size={17}
                  />

                  Mark as Replied

                </button>

              )}


              <button
                type="button"
                className="contact-modal-danger-btn"
                onClick={() =>
                  openDeleteConfirm(
                    selectedEnquiry
                  )
                }
                disabled={
                  actionLoading
                }
              >

                <Trash2
                  size={17}
                />

                Delete

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {showDeleteConfirm && (

        <div
          className="contact-modal-backdrop contact-delete-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteConfirm();
            }

          }}
        >

          <div className="contact-delete-modal">

            <div className="contact-delete-icon">

              <Trash2
                size={24}
              />

            </div>


            <h3>
              Delete Enquiry?
            </h3>

            <p>
              Are you sure you want to
              permanently delete this
              contact enquiry?
            </p>


            <div className="contact-delete-actions">

              <button
                type="button"
                className="contact-delete-cancel"
                onClick={
                  closeDeleteConfirm
                }
                disabled={
                  actionLoading
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="contact-delete-confirm"
                onClick={
                  deleteEnquiry
                }
                disabled={
                  actionLoading
                }
              >

                {actionLoading ? (
                  <>
                    <span className="contact-small-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={16}
                    />
                    Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}


export default ContactManagement;