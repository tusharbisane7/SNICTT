import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";

import api from "../../../services/api";

import "./MembershipManagement.css";

function MembershipManagement() {
  const [memberships, setMemberships] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedMembership, setSelectedMembership] =
    useState(null);

  const [rejectModal, setRejectModal] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  // =========================================================
  // LOAD MEMBERSHIPS
  // =========================================================

  const loadMemberships = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get("/membership/admin");

      if (response.data?.success) {
        setMemberships(
          response.data.memberships || []
        );
      } else {
        setError(
          response.data?.message ||
            "Unable to load memberships."
        );
      }
    } catch (error) {
      console.error(
        "Load memberships error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setError(
          "Admin authentication expired. Please login again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load memberships."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadMemberships();
  }, []);

  // =========================================================
  // SUCCESS MESSAGE
  // =========================================================

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getUserName = (membership) => {
    return (
      membership.user?.fullName ||
      "Unknown Member"
    );
  };

  const getUsername = (membership) => {
    return (
      membership.user?.username ||
      "—"
    );
  };

  const getEmail = (membership) => {
    return (
      membership.user?.email ||
      "—"
    );
  };

  const getMobile = (membership) => {
    return (
      membership.user?.mobile ||
      "—"
    );
  };

  const getStatus = (membership) => {
    return String(
      membership.status || "pending"
    ).toLowerCase();
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    return {
      total: memberships.length,

      pending:
        memberships.filter(
          (item) =>
            getStatus(item) ===
            "pending"
        ).length,

      approved:
        memberships.filter(
          (item) =>
            getStatus(item) ===
            "approved"
        ).length,

      rejected:
        memberships.filter(
          (item) =>
            getStatus(item) ===
            "rejected"
        ).length,
    };
  }, [memberships]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredMemberships =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return memberships.filter(
        (membership) => {
          const name =
            getUserName(
              membership
            ).toLowerCase();

          const username =
            getUsername(
              membership
            ).toLowerCase();

          const email =
            getEmail(
              membership
            ).toLowerCase();

          const number =
            String(
              membership.membershipNumber ||
                ""
            ).toLowerCase();

          const status =
            getStatus(
              membership
            );

          const matchesSearch =
            !query ||
            name.includes(query) ||
            username.includes(query) ||
            email.includes(query) ||
            number.includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            status === statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      memberships,
      search,
      statusFilter,
    ]);

  // =========================================================
  // APPROVE
  // =========================================================

  const approveMembership = async (
    membership
  ) => {
    if (actionLoading) return;

    const confirmed =
      window.confirm(
        `Approve membership application for ${getUserName(
          membership
        )}?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const response =
        await api.put(
          `/membership/admin/${membership.id}/approve`
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to approve membership."
        );
      }

      setSuccess(
        "Membership approved successfully."
      );

      setSelectedMembership(
        response.data.membership ||
          null
      );

      await loadMemberships(true);
    } catch (error) {
      console.error(
        "Approve membership error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          "Unable to approve membership."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const openRejectModal = (
    membership
  ) => {
    setRejectModal(membership);
    setRejectionReason("");
    setError("");
  };

  // =========================================================
  // REJECT
  // =========================================================

  const rejectMembership = async () => {
    if (actionLoading) return;

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Please enter a rejection reason."
      );

      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await api.put(
          `/membership/admin/${rejectModal.id}/reject`,
          {
            reason,
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to reject membership."
        );
      }

      setRejectModal(null);
      setRejectionReason("");

      setSuccess(
        "Membership rejected successfully."
      );

      await loadMemberships(true);
    } catch (error) {
      console.error(
        "Reject membership error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          "Unable to reject membership."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="membership-management-page">
        <div className="membership-management-loading">
          <div className="membership-loading-spinner" />

          <p>
            Loading membership applications...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="membership-management-page">

      <div className="membership-management-container">

        {/* HEADER */}

        <header className="membership-management-header">

          <div>

            <span className="membership-management-label">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Membership Management
            </h1>

            <p>
              Review, approve and reject
              SNICT membership applications.
            </p>

          </div>

          <button
            type="button"
            className="membership-refresh-btn"
            onClick={() =>
              loadMemberships(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "membership-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div className="membership-alert error">

            <XCircle size={17} />

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


        {/* SUCCESS */}

        {success && (
          <div className="membership-alert success">

            <CheckCircle2 size={17} />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* STATS */}

        <section className="membership-stats">

          <div className="membership-stat-card">

            <div className="membership-stat-icon">
              <User size={20} />
            </div>

            <div>
              <span>
                Total Applications
              </span>

              <strong>
                {stats.total}
              </strong>
            </div>

          </div>


          <div className="membership-stat-card pending">

            <div className="membership-stat-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {stats.pending}
              </strong>
            </div>

          </div>


          <div className="membership-stat-card approved">

            <div className="membership-stat-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>
                Approved
              </span>

              <strong>
                {stats.approved}
              </strong>
            </div>

          </div>


          <div className="membership-stat-card rejected">

            <div className="membership-stat-icon">
              <XCircle size={20} />
            </div>

            <div>
              <span>
                Rejected
              </span>

              <strong>
                {stats.rejected}
              </strong>
            </div>

          </div>

        </section>


        {/* TOOLBAR */}

        <section className="membership-toolbar">

          <div className="membership-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search member, email or membership number..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </section>


        {/* TABLE */}

        {filteredMemberships.length ===
        0 ? (

          <div className="membership-empty">

            <ShieldCheck size={44} />

            <h2>
              No Membership Applications
            </h2>

            <p>
              No membership applications
              match your current filters.
            </p>

          </div>

        ) : (

          <section className="membership-table-wrapper">

            <div className="membership-table-scroll">

              <table className="membership-table">

                <thead>

                  <tr>

                    <th>
                      Member
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Membership
                    </th>

                    <th>
                      Applied
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredMemberships.map(
                    (membership) => {

                      const status =
                        getStatus(
                          membership
                        );

                      return (
                        <tr
                          key={
                            membership.id
                          }
                        >

                          {/* MEMBER */}

                          <td>

                            <div className="membership-member">

                              <div className="membership-avatar">
                                {getUserName(
                                  membership
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <strong>
                                  {
                                    getUserName(
                                      membership
                                    )
                                  }
                                </strong>

                                <span>
                                  @
                                  {
                                    getUsername(
                                      membership
                                    )
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* CONTACT */}

                          <td>

                            <div className="membership-contact">

                              <span>
                                <Mail
                                  size={13}
                                />

                                {
                                  getEmail(
                                    membership
                                  )
                                }
                              </span>

                              <span>
                                <Phone
                                  size={13}
                                />

                                {
                                  getMobile(
                                    membership
                                  )
                                }
                              </span>

                            </div>

                          </td>


                          {/* MEMBERSHIP */}

                          <td>

                            <div className="membership-number-cell">

                              <strong>
                                {
                                  membership.membershipNumber ||
                                  "Not Assigned"
                                }
                              </strong>

                              <span>
                                {
                                  membership.membershipType ||
                                  "Regular"
                                }
                              </span>

                            </div>

                          </td>


                          {/* APPLIED */}

                          <td>
                            <span className="membership-date">
                              {formatDate(
                                membership.appliedAt
                              )}
                            </span>
                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={`membership-status ${status}`}
                            >
                              {status}
                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="membership-actions">

                              {/* VIEW */}

                              <button
                                type="button"
                                className="membership-view-btn"
                                onClick={() =>
                                  setSelectedMembership(
                                    membership
                                  )
                                }
                                title="View"
                              >
                                <Eye
                                  size={15}
                                />
                              </button>


                              {/* APPROVE */}

                              {status ===
                                "pending" && (

                                <button
                                  type="button"
                                  className="membership-approve-btn"
                                  onClick={() =>
                                    approveMembership(
                                      membership
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Approve"
                                >
                                  <CheckCircle2
                                    size={15}
                                  />
                                </button>

                              )}


                              {/* REJECT */}

                              {status ===
                                "pending" && (

                                <button
                                  type="button"
                                  className="membership-reject-btn"
                                  onClick={() =>
                                    openRejectModal(
                                      membership
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  title="Reject"
                                >
                                  <XCircle
                                    size={15}
                                  />
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

          </section>

        )}

      </div>


      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedMembership && (

        <div
          className="membership-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedMembership(
                null
              );
            }
          }}
        >

          <section className="membership-details-modal">

            <header className="membership-modal-header">

              <div>

                <span>
                  MEMBERSHIP APPLICATION
                </span>

                <h2>
                  {getUserName(
                    selectedMembership
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedMembership(
                    null
                  )
                }
              >
                <X size={19} />
              </button>

            </header>


            <div className="membership-modal-body">

              {/* PROFILE */}

              <div className="membership-profile-block">

                <div className="membership-large-avatar">

                  {getUserName(
                    selectedMembership
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>

                <div>

                  <strong>
                    {getUserName(
                      selectedMembership
                    )}
                  </strong>

                  <span>
                    @
                    {getUsername(
                      selectedMembership
                    )}
                  </span>

                </div>

              </div>


              {/* INFORMATION */}

              <div className="membership-detail-grid">

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {getEmail(
                      selectedMembership
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Mobile
                  </span>

                  <strong>
                    {getMobile(
                      selectedMembership
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Age
                  </span>

                  <strong>
                    {
                      selectedMembership
                        .user
                        ?.age || "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Sex
                  </span>

                  <strong>
                    {
                      selectedMembership
                        .user
                        ?.sex || "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Blood Group
                  </span>

                  <strong>
                    {
                      selectedMembership
                        .user
                        ?.bloodGroup ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Membership Type
                  </span>

                  <strong>
                    {
                      selectedMembership
                        .membershipType ||
                      "Regular"
                    }
                  </strong>
                </div>

              </div>


              {/* ADDRESS */}

              <div className="membership-address">

                <span>
                  Address
                </span>

                <strong>
                  {
                    selectedMembership
                      .user
                      ?.address ||
                    "—"
                  }
                </strong>

              </div>


              {/* STATUS */}

              <div className="membership-detail-status">

                <span>
                  Current Status
                </span>

                <strong
                  className={`membership-status ${getStatus(
                    selectedMembership
                  )}`}
                >
                  {getStatus(
                    selectedMembership
                  )}
                </strong>

              </div>


              {/* REJECTION */}

              {selectedMembership.rejectionReason && (

                <div className="membership-rejection-box">

                  <span>
                    Rejection Reason
                  </span>

                  <p>
                    {
                      selectedMembership.rejectionReason
                    }
                  </p>

                </div>

              )}


              {/* APPROVED QR */}

              {selectedMembership.status ===
                "approved" &&
                selectedMembership.qrCode && (

                <div className="membership-qr-box">

                  <span>
                    MEMBERSHIP QR
                  </span>

                  <img
                    src={
                      selectedMembership.qrCode
                    }
                    alt="Membership QR"
                  />

                  <strong>
                    {
                      selectedMembership.membershipNumber
                    }
                  </strong>

                </div>

              )}


              {/* ACTIONS */}

              {getStatus(
                selectedMembership
              ) === "pending" && (

                <div className="membership-modal-actions">

                  <button
                    type="button"
                    className="membership-modal-approve"
                    onClick={() =>
                      approveMembership(
                        selectedMembership
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >

                    <CheckCircle2
                      size={16}
                    />

                    Approve Membership

                  </button>


                  <button
                    type="button"
                    className="membership-modal-reject"
                    onClick={() => {
                      setSelectedMembership(
                        null
                      );

                      openRejectModal(
                        selectedMembership
                      );
                    }}
                    disabled={
                      actionLoading
                    }
                  >

                    <XCircle
                      size={16}
                    />

                    Reject Membership

                  </button>

                </div>

              )}

            </div>

          </section>

        </div>

      )}


      {/* =====================================================
          REJECT MODAL
      ===================================================== */}

      {rejectModal && (

        <div className="membership-modal-overlay">

          <section className="membership-reject-modal">

            <header className="membership-modal-header">

              <div>

                <span>
                  REJECT APPLICATION
                </span>

                <h2>
                  {getUserName(
                    rejectModal
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setRejectModal(null)
                }
              >
                <X size={19} />
              </button>

            </header>


            <div className="membership-reject-body">

              <label>
                Rejection Reason
              </label>

              <textarea
                value={
                  rejectionReason
                }
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                placeholder="Enter the reason for rejecting this membership application..."
                rows={5}
                maxLength={500}
              />

              <div className="membership-character-count">
                {rejectionReason.length}/500
              </div>


              <div className="membership-reject-actions">

                <button
                  type="button"
                  onClick={() =>
                    setRejectModal(null)
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="membership-confirm-reject"
                  onClick={
                    rejectMembership
                  }
                  disabled={
                    actionLoading
                  }
                >

                  <XCircle
                    size={16}
                  />

                  {actionLoading
                    ? "Rejecting..."
                    : "Reject Membership"}

                </button>

              </div>

            </div>

          </section>

        </div>

      )}

    </main>
  );
}

export default MembershipManagement;