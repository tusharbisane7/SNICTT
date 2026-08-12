import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  IndianRupee,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

import api from "../../../services/api";

import "./MembershipManagement.css";

// =========================================================
// HELPERS
// =========================================================

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

const getMembershipStatus = (membership) => {
  const status = String(
    membership?.status || ""
  ).toLowerCase();

  if (
    status === "approved" &&
    membership?.expiryDate
  ) {
    const expiry = new Date(
      membership.expiryDate
    );

    if (
      !Number.isNaN(expiry.getTime()) &&
      expiry < new Date()
    ) {
      return "expired";
    }
  }

  return status || "pending";
};

const getPaymentStatus = (membership) => {
  return String(
    membership?.paymentStatus ||
      membership?.payment_status ||
      "not_submitted"
  ).toLowerCase();
};

const getUserName = (membership) => {
  return (
    membership?.user?.fullName ||
    membership?.fullName ||
    membership?.user?.name ||
    "Unknown User"
  );
};

const getUsername = (membership) => {
  return (
    membership?.user?.username ||
    membership?.username ||
    "—"
  );
};

const getEmail = (membership) => {
  return (
    membership?.user?.email ||
    membership?.email ||
    "—"
  );
};

const getMobile = (membership) => {
  return (
    membership?.user?.mobile ||
    membership?.mobile ||
    "—"
  );
};

const getPlanName = (membership) => {
  return (
    membership?.planName ||
    membership?.plan?.name ||
    membership?.membershipType ||
    "Regular Membership"
  );
};

const getAmount = (membership) => {
  return Number(
    membership?.amount ??
      membership?.plan?.price ??
      0
  );
};

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({
  status,
  type = "membership",
}) => {
  const normalized =
    String(status || "")
      .toLowerCase();

  let label = normalized;
  let className = normalized;

  if (type === "payment") {
    if (
      normalized ===
      "not_submitted"
    ) {
      label = "Not Submitted";
    } else if (
      normalized ===
      "submitted"
    ) {
      label = "Payment Submitted";
    } else if (
      normalized ===
      "approved"
    ) {
      label = "Paid";
    } else if (
      normalized ===
      "received"
    ) {
      label = "Payment Received";
    } else if (
      normalized ===
      "not_received"
    ) {
      label = "Payment Not Received";
    } else if (
      normalized ===
      "rejected"
    ) {
      label = "Payment Rejected";
    }
  } else {
    if (
      normalized ===
      "pending"
    ) {
      label = "Pending";
    } else if (
      normalized ===
      "approved"
    ) {
      label = "Active";
    } else if (
      normalized ===
      "rejected"
    ) {
      label = "Rejected";
    } else if (
      normalized ===
      "expired"
    ) {
      label = "Expired";
    }
  }

  return (
    <span
      className={`mm-status-badge mm-status-${className}`}
    >
      {type === "payment" &&
        normalized ===
          "approved" && (
          <CheckCircle2 size={14} />
        )}

      {type === "payment" &&
        (normalized === "submitted" ||
          normalized === "not_received") && (
          <Clock3 size={14} />
        )}

      {type === "payment" &&
        (normalized === "received" ||
          normalized === "approved") && (
          <CheckCircle2 size={14} />
        )}

      {type === "payment" &&
        normalized ===
          "rejected" && (
          <XCircle size={14} />
        )}

      {type === "membership" &&
        normalized ===
          "approved" && (
          <CheckCircle2 size={14} />
        )}

      {type === "membership" &&
        normalized ===
          "pending" && (
          <Clock3 size={14} />
        )}

      {type === "membership" &&
        normalized ===
          "rejected" && (
          <XCircle size={14} />
        )}

      {type === "membership" &&
        normalized ===
          "expired" && (
          <Clock3 size={14} />
        )}

      {label}
    </span>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const MembershipManagement =
  () => {
    // =======================================================
    // MEMBERSHIPS
    // =======================================================

    const [
      memberships,
      setMemberships,
    ] = useState([]);

    const [
      selectedMembership,
      setSelectedMembership,
    ] = useState(null);

    // =======================================================
    // PLANS
    // =======================================================

    const [
      plans,
      setPlans,
    ] = useState([]);

    // =======================================================
    // PAYMENT SETTINGS
    // =======================================================

    const [
      paymentSettings,
      setPaymentSettings,
    ] = useState({
      upiId: "",
      accountName: "",
      qrCode: "",
    });

    // =======================================================
    // UI
    // =======================================================

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      plansLoading,
      setPlansLoading,
    ] = useState(false);

    const [
      paymentLoading,
      setPaymentLoading,
    ] = useState(false);

    const [
      actionLoading,
      setActionLoading,
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
      activeTab,
      setActiveTab,
    ] = useState("applications");

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      statusFilter,
      setStatusFilter,
    ] = useState("all");

    // =======================================================
    // MODALS
    // =======================================================

    const [
      showDetails,
      setShowDetails,
    ] = useState(false);

    const [
      showPaymentVerification,
      setShowPaymentVerification,
    ] = useState(false);

    const [
      showReject,
      setShowReject,
    ] = useState(false);

    const [
      showPlanModal,
      setShowPlanModal,
    ] = useState(false);

    const [
      showPaymentModal,
      setShowPaymentModal,
    ] = useState(false);

    // =======================================================
    // FORM
    // =======================================================

    const [
      rejectionReason,
      setRejectionReason,
    ] = useState("");

    const [
      editingPlan,
      setEditingPlan,
    ] = useState(null);

    const [
      planForm,
      setPlanForm,
    ] = useState({
      name: "",
      durationYears: 1,
      price: "",
      isActive: true,
    });

    // =======================================================
    // LOAD MEMBERSHIPS
    // =======================================================

    const loadMemberships =
      useCallback(
        async () => {
          try {
            setError("");

            const response =
              await api.get(
                "/membership/admin"
              );

            const data =
              response.data;

            setMemberships(
              Array.isArray(
                data?.memberships
              )
                ? data.memberships
                : []
            );
          } catch (err) {
            console.error(
              "Load memberships error:",
              err
            );

            setError(
              err.response?.data
                ?.message ||
                "Unable to load memberships."
            );
          } finally {
            setLoading(false);
          }
        },
        []
      );

    // =======================================================
    // LOAD PLANS
    // =======================================================

    const loadPlans =
      useCallback(
        async () => {
          try {
            setPlansLoading(true);

            const response =
              await api.get(
                "/membership/admin/plans"
              );

            const data =
              response.data;

            setPlans(
              Array.isArray(
                data?.plans
              )
                ? data.plans
                : []
            );
          } catch (err) {
            console.error(
              "Load membership plans error:",
              err
            );

            setError(
              err.response?.data
                ?.message ||
                "Unable to load membership plans."
            );
          } finally {
            setPlansLoading(false);
          }
        },
        []
      );

    // =======================================================
    // LOAD PAYMENT SETTINGS
    // =======================================================

    const loadPaymentSettings =
      useCallback(
        async () => {
          try {
            setPaymentLoading(true);

            const response =
              await api.get(
                "/membership/admin/payment-settings"
              );

            const data =
              response.data;

            const settings =
              data?.settings ||
              data?.paymentSettings ||
              {};

            setPaymentSettings({
              upiId:
                settings?.upiId ||
                settings?.upi_id ||
                "",

              accountName:
                settings?.accountName ||
                settings?.account_name ||
                "",

              qrCode:
                settings?.qrCode ||
                settings?.qr_code ||
                "",
            });
          } catch (err) {
            console.error(
              "Load payment settings error:",
              err
            );

            setError(
              err.response?.data
                ?.message ||
                "Unable to load payment settings."
            );
          } finally {
            setPaymentLoading(false);
          }
        },
        []
      );

    // =======================================================
    // INITIAL LOAD
    // =======================================================

    useEffect(() => {
      loadMemberships();
      loadPlans();
      loadPaymentSettings();
    }, [
      loadMemberships,
      loadPlans,
      loadPaymentSettings,
    ]);

    // =======================================================
    // AUTO CLEAR MESSAGES
    // =======================================================

    useEffect(() => {
      if (!success) {
        return undefined;
      }

      const timer =
        setTimeout(() => {
          setSuccess("");
        }, 4000);

      return () =>
        clearTimeout(timer);
    }, [success]);

    // =======================================================
    // FILTERED MEMBERSHIPS
    // =======================================================

    const filteredMemberships =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        return memberships.filter(
          (membership) => {
            const status =
              getMembershipStatus(
                membership
              );

            if (
              statusFilter !==
                "all" &&
              status !==
                statusFilter
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            const searchable = [
              getUserName(
                membership
              ),
              getUsername(
                membership
              ),
              getEmail(
                membership
              ),
              getMobile(
                membership
              ),
              membership?.utrNumber,
              membership?.utr_number,
              membership?.membershipNumber,
              membership?.membership_number,
              getPlanName(
                membership
              ),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchable.includes(
              query
            );
          }
        );
      }, [
        memberships,
        search,
        statusFilter,
      ]);

    // =======================================================
    // STATISTICS
    // =======================================================

    const stats =
      useMemo(() => {
        let pending = 0;
        let active = 0;
        let rejected = 0;
        let expired = 0;

        let submittedPayments =
          0;

        let paidAmount = 0;

        memberships.forEach(
          (membership) => {
            const status =
              getMembershipStatus(
                membership
              );

            const paymentStatus =
              getPaymentStatus(
                membership
              );

            if (
              status ===
              "pending"
            ) {
              pending++;
            }

            if (
              status ===
              "approved"
            ) {
              active++;
            }

            if (
              status ===
              "rejected"
            ) {
              rejected++;
            }

            if (
              status ===
              "expired"
            ) {
              expired++;
            }

            if (
              paymentStatus ===
              "submitted"
            ) {
              submittedPayments++;
            }

            if (
              paymentStatus ===
              "approved"
            ) {
              paidAmount +=
                getAmount(
                  membership
                );
            }
          }
        );

        return {
          total:
            memberships.length,
          pending,
          active,
          rejected,
          expired,
          submittedPayments,
          paidAmount,
        };
      }, [
        memberships,
      ]);

    // =======================================================
    // SELECT MEMBERSHIP
    // =======================================================

    const openDetails = (
      membership
    ) => {
      setSelectedMembership(
        membership
      );

      setShowDetails(true);
    };

    // =======================================================
    // OPEN PAYMENT VERIFICATION
    // =======================================================

    const openPaymentVerification = (
      membership
    ) => {
      if (!membership?.id) {
        return;
      }

      setSelectedMembership(
        membership
      );

      setShowPaymentVerification(
        true
      );

      setError("");
      setSuccess("");
    };


    // =======================================================
    // MARK PAYMENT RECEIVED
    // =======================================================

    const markPaymentReceived =
      async (
        membership
      ) => {
        if (!membership?.id) {
          return;
        }

        const confirmed =
          window.confirm(
            `Confirm that payment has been received from ${getUserName(
              membership
            )}?`
          );

        if (!confirmed) {
          return;
        }

        try {
          setActionLoading(
            `payment-received-${membership.id}`
          );

          setError("");
          setSuccess("");

          const response =
            await api.put(
              `/membership/admin/${membership.id}/payment-received`
            );

          const updatedMembership =
            response.data?.membership ||
            response.data?.data ||
            membership;

          setSelectedMembership(
            updatedMembership
          );

          setSuccess(
            response.data?.message ||
              "Payment marked as received successfully."
          );

          await loadMemberships();
        } catch (err) {
          console.error(
            "Mark payment received error:",
            err
          );

          setError(
            err.response?.data?.message ||
              "Unable to mark payment as received."
          );
        } finally {
          setActionLoading(null);
        }
      };

    // =======================================================
    // MARK PAYMENT NOT RECEIVED
    // =======================================================

    const markPaymentNotReceived =
      async (
        membership
      ) => {
        if (!membership?.id) {
          return;
        }

        const confirmed =
          window.confirm(
            `Mark payment as NOT received for ${getUserName(
              membership
            )}?`
          );

        if (!confirmed) {
          return;
        }

        try {
          setActionLoading(
            `payment-not-received-${membership.id}`
          );

          setError("");
          setSuccess("");

          const response =
            await api.put(
              `/membership/admin/${membership.id}/payment-not-received`
            );

          const updatedMembership =
            response.data?.membership ||
            response.data?.data ||
            membership;

          setSelectedMembership(
            updatedMembership
          );

          setSuccess(
            response.data?.message ||
              "Payment marked as not received."
          );

          await loadMemberships();
        } catch (err) {
          console.error(
            "Mark payment not received error:",
            err
          );

          setError(
            err.response?.data?.message ||
              "Unable to mark payment as not received."
          );
        } finally {
          setActionLoading(null);
        }
      };

    // =======================================================
    // APPROVE
    // =======================================================

    const approveMembership =
      async (
        membership
      ) => {
        if (!membership?.id) {
          return;
        }

        const paymentStatus =
          getPaymentStatus(
            membership
          );

        if (
          paymentStatus !== "received" &&
          paymentStatus !== "approved"
        ) {
          setError(
            "Payment must be marked as received before approving the membership."
          );

          return;
        }

        const confirmed =
          window.confirm(
            `Approve membership for ${getUserName(
              membership
            )}?`
          );

        if (!confirmed) {
          return;
        }

        try {
          setActionLoading(
            `approve-${membership.id}`
          );

          setError("");

          const response =
            await api.put(
              `/membership/admin/${membership.id}/approve`
            );

          setSuccess(
            response.data?.message ||
              "Membership approved successfully."
          );

          setSelectedMembership(
            response.data
              ?.membership ||
              membership
          );

          await loadMemberships();
        } catch (err) {
          console.error(
            "Approve membership error:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Unable to approve membership."
          );
        } finally {
          setActionLoading(
            null
          );
        }
      };

    // =======================================================
    // OPEN REJECT
    // =======================================================

    const openReject =
      (membership) => {
        setSelectedMembership(
          membership
        );

        setRejectionReason("");

        setShowReject(true);
      };

    // =======================================================
    // REJECT
    // =======================================================

    const rejectSelected =
      async () => {
        if (
          !selectedMembership?.id
        ) {
          return;
        }

        const reason =
          rejectionReason.trim();

        if (!reason) {
          setError(
            "Please enter a rejection reason."
          );

          return;
        }

        try {
          setActionLoading(
            `reject-${selectedMembership.id}`
          );

          setError("");

          const response =
            await api.put(
              `/membership/admin/${selectedMembership.id}/reject`,
              {
                reason,
              }
            );

          setSuccess(
            response.data?.message ||
              "Membership rejected successfully."
          );

          setShowReject(false);

          setSelectedMembership(
            null
          );

          setRejectionReason("");

          await loadMemberships();
        } catch (err) {
          console.error(
            "Reject membership error:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Unable to reject membership."
          );
        } finally {
          setActionLoading(
            null
          );
        }
      };

    // =======================================================
    // PLAN FORM
    // =======================================================

    const resetPlanForm =
      () => {
        setEditingPlan(null);

        setPlanForm({
          name: "",
          durationYears: 1,
          price: "",
          isActive: true,
        });
      };

    const openCreatePlan =
      () => {
        resetPlanForm();

        setShowPlanModal(
          true
        );
      };

    const openEditPlan =
      (plan) => {
        setEditingPlan(
          plan
        );

        setPlanForm({
          name:
            plan?.name ||
            "",

          durationYears:
            Number(
              plan?.durationYears ??
                plan?.duration_years ??
                1
            ),

          price:
            plan?.price ??
            "",

          isActive:
            plan?.isActive ??
            plan?.is_active ??
            true,
        });

        setShowPlanModal(
          true
        );
      };

    // =======================================================
    // SAVE PLAN
    // =======================================================

    const savePlan =
      async (
        event
      ) => {
        event.preventDefault();

        const name =
          planForm.name.trim();

        const durationYears =
          Number(
            planForm.durationYears
          );

        const price =
          Number(
            planForm.price
          );

        if (!name) {
          setError(
            "Plan name is required."
          );

          return;
        }

        if (
          !Number.isInteger(
            durationYears
          ) ||
          durationYears < 1 ||
          durationYears > 20
        ) {
          setError(
            "Duration must be between 1 and 20 years."
          );

          return;
        }

        if (
          !Number.isFinite(
            price
          ) ||
          price <= 0
        ) {
          setError(
            "Please enter a valid plan price."
          );

          return;
        }

        try {
          setPlansLoading(
            true
          );

          setError("");

          const payload = {
            name,
            durationYears,
            price,
            isActive:
              Boolean(
                planForm.isActive
              ),
          };

          let response;

          if (
            editingPlan?.id
          ) {
            response =
              await api.put(
                `/membership/admin/plans/${editingPlan.id}`,
                payload
              );
          } else {
            response =
              await api.post(
                "/membership/admin/plans",
                payload
              );
          }

          setSuccess(
            response.data?.message ||
              "Membership plan saved successfully."
          );

          setShowPlanModal(
            false
          );

          resetPlanForm();

          await loadPlans();
        } catch (err) {
          console.error(
            "Save membership plan error:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Unable to save membership plan."
          );
        } finally {
          setPlansLoading(
            false
          );
        }
      };

    // =======================================================
    // DISABLE PLAN
    // =======================================================

    const disablePlan =
      async (
        plan
      ) => {
        if (!plan?.id) {
          return;
        }

        const confirmed =
          window.confirm(
            `Disable "${plan.name}" membership plan?`
          );

        if (!confirmed) {
          return;
        }

        try {
          setActionLoading(
            `plan-${plan.id}`
          );

          setError("");

          const response =
            await api.delete(
              `/membership/admin/plans/${plan.id}`
            );

          setSuccess(
            response.data?.message ||
              "Membership plan disabled successfully."
          );

          await loadPlans();
        } catch (err) {
          console.error(
            "Disable plan error:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Unable to disable membership plan."
          );
        } finally {
          setActionLoading(
            null
          );
        }
      };

    // =======================================================
    // PAYMENT SETTINGS FORM
    // =======================================================

    const updatePaymentField =
      (
        field,
        value
      ) => {
        setPaymentSettings(
          (previous) => ({
            ...previous,
            [field]:
              value,
          })
        );
      };

    // =======================================================
    // SAVE PAYMENT SETTINGS
    // =======================================================

    const savePaymentSettings =
      async (
        event
      ) => {
        event.preventDefault();

        if (
          !paymentSettings.accountName.trim()
        ) {
          setError(
            "Account name is required."
          );

          return;
        }

        if (
          !paymentSettings.upiId.trim()
        ) {
          setError(
            "UPI ID is required."
          );

          return;
        }

        if (
          !paymentSettings.qrCode.trim()
        ) {
          setError(
            "Payment QR URL is required."
          );

          return;
        }

        try {
          setPaymentLoading(
            true
          );

          setError("");

          const response =
            await api.put(
              "/membership/admin/payment-settings",
              {
                accountName:
                  paymentSettings.accountName.trim(),

                upiId:
                  paymentSettings.upiId.trim(),

                qrCode:
                  paymentSettings.qrCode.trim(),
              }
            );

          setSuccess(
            response.data?.message ||
              "Payment settings updated successfully."
          );

          await loadPaymentSettings();
        } catch (err) {
          console.error(
            "Update payment settings error:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Unable to update payment settings."
          );
        } finally {
          setPaymentLoading(
            false
          );
        }
      };

    // =======================================================
    // REFRESH
    // =======================================================

    const refreshAll =
      async () => {
        setError("");

        await Promise.all([
          loadMemberships(),
          loadPlans(),
          loadPaymentSettings(),
        ]);

        setSuccess(
          "Membership data refreshed."
        );
      };

    // =======================================================
    // RENDER
    // =======================================================

    return (
      <div className="membership-management">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mm-header">
          <div className="mm-header-left">
            <div className="mm-header-icon">
              <BadgeCheck
                size={28}
              />
            </div>

            <div>
              <span className="mm-eyebrow">
                ADMIN PANEL
              </span>

              <h1>
                Membership Management
              </h1>

              <p>
                Manage membership plans,
                payments, applications and
                active memberships.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="mm-refresh-button"
            onClick={
              refreshAll
            }
            disabled={
              loading ||
              plansLoading ||
              paymentLoading
            }
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "mm-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </header>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="mm-alert mm-alert-error">
            <XCircle
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
          <div className="mm-alert mm-alert-success">
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

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="mm-stats">
          <div className="mm-stat-card">
            <div className="mm-stat-icon">
              <Users
                size={21}
              />
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

          <div className="mm-stat-card mm-stat-pending">
            <div className="mm-stat-icon">
              <Clock3
                size={21}
              />
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

          <div className="mm-stat-card mm-stat-active">
            <div className="mm-stat-icon">
              <ShieldCheck
                size={21}
              />
            </div>

            <div>
              <span>
                Active Members
              </span>

              <strong>
                {stats.active}
              </strong>
            </div>
          </div>

          <div className="mm-stat-card">
            <div className="mm-stat-icon">
              <CreditCard
                size={21}
              />
            </div>

            <div>
              <span>
                Payments Submitted
              </span>

              <strong>
                {stats.submittedPayments}
              </strong>
            </div>
          </div>

          <div className="mm-stat-card">
            <div className="mm-stat-icon">
              <IndianRupee
                size={21}
              />
            </div>

            <div>
              <span>
                Approved Amount
              </span>

              <strong>
                {formatAmount(
                  stats.paidAmount
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* ===================================================
            TABS
        =================================================== */}

        <div className="mm-tabs">
          <button
            type="button"
            className={
              activeTab ===
              "applications"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "applications"
              )
            }
          >
            <Users
              size={17}
            />

            Applications
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "plans"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "plans"
              )
            }
          >
            <BadgeCheck
              size={17}
            />

            Membership Plans
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "payment"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "payment"
              )
            }
          >
            <QrCode
              size={17}
            />

            Payment Settings
          </button>
        </div>

        {/* ===================================================
            APPLICATIONS
        =================================================== */}

        {activeTab ===
          "applications" && (
          <section className="mm-section">
            <div className="mm-section-header">
              <div>
                <span className="mm-section-label">
                  MEMBERSHIP APPLICATIONS
                </span>

                <h2>
                  Review Members
                </h2>
              </div>

              <div className="mm-section-count">
                {filteredMemberships.length}{" "}
                results
              </div>
            </div>

            {/* SEARCH / FILTER */}

            <div className="mm-toolbar">
              <div className="mm-search">
                <Search
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search name, username, email, UTR..."
                />
              </div>

              <div className="mm-filter">
                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event.target
                        .value
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
                    Active
                  </option>

                  <option value="expired">
                    Expired
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>

                <ChevronDown
                  size={16}
                />
              </div>
            </div>

            {/* TABLE */}

            {loading ? (
              <div className="mm-loading">
                <Loader2
                  size={30}
                  className="mm-spin"
                />

                <span>
                  Loading memberships...
                </span>
              </div>
            ) : filteredMemberships.length ===
              0 ? (
              <div className="mm-empty">
                <Users
                  size={42}
                />

                <h3>
                  No memberships found
                </h3>

                <p>
                  There are no membership
                  applications matching
                  your current filters.
                </p>
              </div>
            ) : (
              <div className="mm-table-wrapper">
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th>
                        Member
                      </th>

                      <th>
                        Plan
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        UTR
                      </th>

                      <th>
                        Payment
                      </th>

                      <th>
                        Membership
                      </th>

                      <th>
                        Applied
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMemberships.map(
                      (
                        membership
                      ) => {
                        const status =
                          getMembershipStatus(
                            membership
                          );

                        const paymentStatus =
                          getPaymentStatus(
                            membership
                          );

                        const utr =
                          membership?.utrNumber ||
                          membership?.utr_number ||
                          "";

                        return (
                          <tr
                            key={
                              membership.id
                            }
                          >
                            <td>
                              <div className="mm-member-cell">
                                <div className="mm-avatar">
                                  {getUserName(
                                    membership
                                  )
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <strong>
                                    {getUserName(
                                      membership
                                    )}
                                  </strong>

                                  <span>
                                    @
                                    {getUsername(
                                      membership
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="mm-plan-cell">
                                <strong>
                                  {getPlanName(
                                    membership
                                  )}
                                </strong>

                                {membership?.durationYears && (
                                  <span>
                                    {
                                      membership.durationYears
                                    }{" "}
                                    year
                                    {Number(
                                      membership.durationYears
                                    ) !==
                                    1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <strong className="mm-amount">
                                {formatAmount(
                                  getAmount(
                                    membership
                                  )
                                )}
                              </strong>
                            </td>

                            <td>
                              <span className="mm-utr">
                                {utr ||
                                  "Not submitted"}
                              </span>
                            </td>

                            <td>
                              <StatusBadge
                                status={
                                  paymentStatus
                                }
                                type="payment"
                              />
                            </td>

                            <td>
                              <StatusBadge
                                status={
                                  status
                                }
                                type="membership"
                              />
                            </td>

                            <td>
                              <span className="mm-date">
                                {formatDate(
                                  membership?.appliedAt ||
                                    membership?.applied_at
                                )}
                              </span>
                            </td>

                            <td>
                              <div className="mm-actions">
                                <button
                                  type="button"
                                  className="mm-icon-button"
                                  title="View details"
                                  onClick={() =>
                                    openDetails(
                                      membership
                                    )
                                  }
                                >
                                  <Eye
                                    size={16}
                                  />
                                </button>

                                {status ===
                                  "pending" && (
                                    <>
                                      {(paymentStatus ===
                                        "submitted" ||
                                        paymentStatus ===
                                          "received" ||
                                        paymentStatus ===
                                          "approved") && (
                                        <button
                                          type="button"
                                          className="mm-action-verify"
                                          onClick={() =>
                                            openPaymentVerification(
                                              membership
                                            )
                                          }
                                        >
                                          <CreditCard
                                            size={15}
                                          />
                                          Verify Payment
                                        </button>
                                      )}

                                      {paymentStatus ===
                                        "submitted" && (
                                        <>
                                          <button
                                            type="button"
                                            className="mm-action-approve"
                                            disabled={
                                              actionLoading ===
                                              `payment-received-${membership.id}`
                                            }
                                            onClick={() =>
                                              markPaymentReceived(
                                                membership
                                              )
                                            }
                                          >
                                            {actionLoading ===
                                            `payment-received-${membership.id}` ? (
                                              <Loader2
                                                size={15}
                                                className="mm-spin"
                                              />
                                            ) : (
                                              <CheckCircle2
                                                size={15}
                                              />
                                            )}

                                            Payment Received
                                          </button>

                                          <button
                                            type="button"
                                            className="mm-action-reject"
                                            disabled={
                                              actionLoading ===
                                              `payment-not-received-${membership.id}`
                                            }
                                            onClick={() =>
                                              markPaymentNotReceived(
                                                membership
                                              )
                                            }
                                          >
                                            {actionLoading ===
                                            `payment-not-received-${membership.id}` ? (
                                              <Loader2
                                                size={15}
                                                className="mm-spin"
                                              />
                                            ) : (
                                              <XCircle
                                                size={15}
                                              />
                                            )}

                                            Not Received
                                          </button>
                                        </>
                                      )}

                                      {(paymentStatus ===
                                        "received" ||
                                        paymentStatus ===
                                          "approved") && (
                                        <button
                                          type="button"
                                          className="mm-action-approve"
                                          disabled={
                                            actionLoading ===
                                            `approve-${membership.id}`
                                          }
                                          onClick={() =>
                                            approveMembership(
                                              membership
                                            )
                                          }
                                        >
                                          {actionLoading ===
                                          `approve-${membership.id}` ? (
                                            <Loader2
                                              size={15}
                                              className="mm-spin"
                                            />
                                          ) : (
                                            <Check
                                              size={15}
                                            />
                                          )}

                                          Approve Membership
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        className="mm-action-reject"
                                        disabled={
                                          actionLoading ===
                                          `reject-${membership.id}`
                                        }
                                        onClick={() =>
                                          openReject(
                                            membership
                                          )
                                        }
                                      >
                                        <X
                                          size={15}
                                        />

                                        Reject
                                      </button>
                                    </>
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
          </section>
        )}

        {/* ===================================================
            PLANS
        =================================================== */}

        {activeTab ===
          "plans" && (
          <section className="mm-section">
            <div className="mm-section-header">
              <div>
                <span className="mm-section-label">
                  MEMBERSHIP CONFIGURATION
                </span>

                <h2>
                  Membership Plans
                </h2>

                <p>
                  Create and manage membership
                  tenure and pricing.
                </p>
              </div>

              <button
                type="button"
                className="mm-primary-button"
                onClick={
                  openCreatePlan
                }
              >
                <Plus
                  size={17}
                />

                Add Plan
              </button>
            </div>

            {plansLoading &&
            plans.length ===
              0 ? (
              <div className="mm-loading">
                <Loader2
                  size={30}
                  className="mm-spin"
                />

                <span>
                  Loading plans...
                </span>
              </div>
            ) : (
              <div className="mm-plans-grid">
                {plans.map(
                  (plan) => {
                    const active =
                      plan?.isActive ??
                      plan?.is_active ??
                      true;

                    const duration =
                      plan?.durationYears ??
                      plan?.duration_years ??
                      1;

                    return (
                      <div
                        className={`mm-plan-card ${
                          active
                            ? "active"
                            : "disabled"
                        }`}
                        key={
                          plan.id
                        }
                      >
                        <div className="mm-plan-card-top">
                          <div className="mm-plan-card-icon">
                            <BadgeCheck
                              size={24}
                            />
                          </div>

                          <span
                            className={
                              active
                                ? "mm-plan-active"
                                : "mm-plan-disabled"
                            }
                          >
                            {active
                              ? "ACTIVE"
                              : "DISABLED"}
                          </span>
                        </div>

                        <div className="mm-plan-card-content">
                          <span>
                            {duration}{" "}
                            year
                            {Number(
                              duration
                            ) !==
                            1
                              ? "s"
                              : ""}
                          </span>

                          <h3>
                            {plan?.name ||
                              "Membership"}
                          </h3>

                          <strong>
                            {formatAmount(
                              plan?.price
                            )}
                          </strong>
                        </div>

                        <div className="mm-plan-card-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditPlan(
                                plan
                              )
                            }
                          >
                            <Edit3
                              size={15}
                            />

                            Edit
                          </button>

                          {active && (
                            <button
                              type="button"
                              className="danger"
                              disabled={
                                actionLoading ===
                                `plan-${plan.id}`
                              }
                              onClick={() =>
                                disablePlan(
                                  plan
                                )
                              }
                            >
                              {actionLoading ===
                              `plan-${plan.id}` ? (
                                <Loader2
                                  size={15}
                                  className="mm-spin"
                                />
                              ) : (
                                <Trash2
                                  size={15}
                                />
                              )}

                              Disable
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                {plans.length ===
                  0 && (
                  <div className="mm-empty">
                    <BadgeCheck
                      size={42}
                    />

                    <h3>
                      No plans created
                    </h3>

                    <p>
                      Create your first
                      membership plan.
                    </p>

                    <button
                      type="button"
                      className="mm-primary-button"
                      onClick={
                        openCreatePlan
                      }
                    >
                      <Plus
                        size={17}
                      />

                      Create Plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ===================================================
            PAYMENT SETTINGS
        =================================================== */}

        {activeTab ===
          "payment" && (
          <section className="mm-section">
            <div className="mm-section-header">
              <div>
                <span className="mm-section-label">
                  PAYMENT CONFIGURATION
                </span>

                <h2>
                  UPI Payment Settings
                </h2>

                <p>
                  These details and QR code
                  are shown to users when
                  they make membership
                  payment.
                </p>
              </div>
            </div>

            <form
              className="mm-payment-layout"
              onSubmit={
                savePaymentSettings
              }
            >
              <div className="mm-payment-form-card">
                <div className="mm-form-field">
                  <label>
                    Account Name
                  </label>

                  <input
                    type="text"
                    value={
                      paymentSettings.accountName
                    }
                    onChange={(
                      event
                    ) =>
                      updatePaymentField(
                        "accountName",
                        event.target
                          .value
                      )
                    }
                    placeholder="SNICT"
                  />
                </div>

                <div className="mm-form-field">
                  <label>
                    UPI ID
                  </label>

                  <input
                    type="text"
                    value={
                      paymentSettings.upiId
                    }
                    onChange={(
                      event
                    ) =>
                      updatePaymentField(
                        "upiId",
                        event.target
                          .value
                      )
                    }
                    placeholder="example@upi"
                  />
                </div>

                <div className="mm-form-field">
                  <label>
                    Payment QR URL
                  </label>

                  <input
                    type="url"
                    value={
                      paymentSettings.qrCode
                    }
                    onChange={(
                      event
                    ) =>
                      updatePaymentField(
                        "qrCode",
                        event.target
                          .value
                      )
                    }
                    placeholder="https://example.com/payment-qr.png"
                  />

                  <small>
                    Upload the QR to your
                    image hosting service
                    and paste the public
                    image URL here.
                  </small>
                </div>

                <button
                  type="submit"
                  className="mm-primary-button"
                  disabled={
                    paymentLoading
                  }
                >
                  {paymentLoading ? (
                    <Loader2
                      size={17}
                      className="mm-spin"
                    />
                  ) : (
                    <Settings
                      size={17}
                    />
                  )}

                  Update Payment Settings
                </button>
              </div>

              <div className="mm-payment-preview">
                <div className="mm-payment-preview-header">
                  <QrCode
                    size={20}
                  />

                  <span>
                    PAYMENT QR PREVIEW
                  </span>
                </div>

                <div className="mm-qr-preview">
                  {paymentSettings.qrCode ? (
                    <img
                      src={
                        paymentSettings.qrCode
                      }
                      alt="Membership payment QR"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";

                        const parent =
                          event.currentTarget
                            .parentElement;

                        if (
                          parent &&
                          !parent.querySelector(
                            ".mm-qr-error"
                          )
                        ) {
                          const message =
                            document.createElement(
                              "div"
                            );

                          message.className =
                            "mm-qr-error";

                          message.innerText =
                            "QR image could not be loaded";

                          parent.appendChild(
                            message
                          );
                        }
                      }}
                    />
                  ) : (
                    <div className="mm-qr-empty">
                      <QrCode
                        size={45}
                      />

                      <span>
                        No QR configured
                      </span>
                    </div>
                  )}
                </div>

                <div className="mm-payment-preview-details">
                  <div>
                    <span>
                      Account Name
                    </span>

                    <strong>
                      {paymentSettings.accountName ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      UPI ID
                    </span>

                    <strong>
                      {paymentSettings.upiId ||
                        "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* ===================================================
            DETAILS MODAL
        =================================================== */}

        {showDetails &&
          selectedMembership && (
            <div
              className="mm-modal-overlay"
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setShowDetails(
                    false
                  );
                }
              }}
            >
              <div className="mm-modal mm-details-modal">
                <div className="mm-modal-header">
                  <div>
                    <span>
                      MEMBERSHIP DETAILS
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
                      setShowDetails(
                        false
                      )
                    }
                  >
                    <X />
                  </button>
                </div>

                <div className="mm-detail-grid">
                  <div className="mm-detail-card">
                    <span>
                      Full Name
                    </span>

                    <strong>
                      {getUserName(
                        selectedMembership
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Username
                    </span>

                    <strong>
                      @
                      {getUsername(
                        selectedMembership
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Email
                    </span>

                    <strong>
                      {getEmail(
                        selectedMembership
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Mobile
                    </span>

                    <strong>
                      {getMobile(
                        selectedMembership
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Membership Plan
                    </span>

                    <strong>
                      {getPlanName(
                        selectedMembership
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Amount
                    </span>

                    <strong>
                      {formatAmount(
                        getAmount(
                          selectedMembership
                        )
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      UTR Number
                    </span>

                    <strong>
                      {selectedMembership?.utrNumber ||
                        selectedMembership?.utr_number ||
                        "Not submitted"}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Payment Status
                    </span>

                    <StatusBadge
                      status={getPaymentStatus(
                        selectedMembership
                      )}
                      type="payment"
                    />
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Payment Submitted At
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedMembership?.paymentSubmittedAt ||
                          selectedMembership?.payment_submitted_at
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Membership Status
                    </span>

                    <StatusBadge
                      status={getMembershipStatus(
                        selectedMembership
                      )}
                      type="membership"
                    />
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Membership Number
                    </span>

                    <strong>
                      {selectedMembership?.membershipNumber ||
                        selectedMembership?.membership_number ||
                        "Not generated"}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Start Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedMembership?.startDate ||
                          selectedMembership?.start_date
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Expiry Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedMembership?.expiryDate ||
                          selectedMembership?.expiry_date
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Applied At
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedMembership?.appliedAt ||
                          selectedMembership?.applied_at
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>
                      Approved At
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedMembership?.approvedAt ||
                          selectedMembership?.approved_at
                      )}
                    </strong>
                  </div>

                  {selectedMembership?.rejectionReason ||
                    selectedMembership?.rejection_reason ? (
                    <div className="mm-detail-card mm-detail-full">
                      <span>
                        Rejection Reason
                      </span>

                      <strong>
                        {selectedMembership?.rejectionReason ||
                          selectedMembership?.rejection_reason}
                      </strong>
                    </div>
                  ) : null}
                </div>

                <div className="mm-modal-footer">
                  {getMembershipStatus(
                    selectedMembership
                  ) ===
                    "pending" && (
                      <>
                        {getPaymentStatus(
                          selectedMembership
                        ) !== "not_submitted" && (
                          <button
                            type="button"
                            className="mm-action-verify large"
                            onClick={() =>
                              openPaymentVerification(
                                selectedMembership
                              )
                            }
                          >
                            <CreditCard
                              size={17}
                            />
                            Verify Payment
                          </button>
                        )}

                        {getPaymentStatus(
                          selectedMembership
                        ) === "submitted" && (
                          <>
                            <button
                              type="button"
                              className="mm-action-approve large"
                              disabled={
                                actionLoading ===
                                `payment-received-${selectedMembership.id}`
                              }
                              onClick={() =>
                                markPaymentReceived(
                                  selectedMembership
                                )
                              }
                            >
                              {actionLoading ===
                              `payment-received-${selectedMembership.id}` ? (
                                <Loader2
                                  size={17}
                                  className="mm-spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={17}
                                />
                              )}

                              Payment Received
                            </button>

                            <button
                              type="button"
                              className="mm-action-reject large"
                              disabled={
                                actionLoading ===
                                `payment-not-received-${selectedMembership.id}`
                              }
                              onClick={() =>
                                markPaymentNotReceived(
                                  selectedMembership
                                )
                              }
                            >
                              {actionLoading ===
                              `payment-not-received-${selectedMembership.id}` ? (
                                <Loader2
                                  size={17}
                                  className="mm-spin"
                                />
                              ) : (
                                <XCircle
                                  size={17}
                                />
                              )}

                              Payment Not Received
                            </button>
                          </>
                        )}

                        {(getPaymentStatus(
                          selectedMembership
                        ) === "received" ||
                          getPaymentStatus(
                            selectedMembership
                          ) === "approved") && (
                          <button
                            type="button"
                            className="mm-action-approve large"
                            disabled={
                              actionLoading ===
                              `approve-${selectedMembership.id}`
                            }
                            onClick={() =>
                              approveMembership(
                                selectedMembership
                              )
                            }
                          >
                            {actionLoading ===
                            `approve-${selectedMembership.id}` ? (
                              <Loader2
                                size={17}
                                className="mm-spin"
                              />
                            ) : (
                              <Check
                                size={17}
                              />
                            )}

                            Approve Membership
                          </button>
                        )}

                        <button
                          type="button"
                          className="mm-action-reject large"
                          onClick={() => {
                            setShowDetails(
                              false
                            );

                            openReject(
                              selectedMembership
                            );
                          }}
                        >
                          <X
                            size={17}
                          />

                          Reject
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            PAYMENT VERIFICATION MODAL
        =================================================== */}

        {showPaymentVerification &&
          selectedMembership && (
            <div
              className="mm-modal-overlay"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setShowPaymentVerification(
                    false
                  );
                }
              }}
            >
              <div className="mm-modal mm-payment-verification-modal">

                <div className="mm-modal-header">
                  <div>
                    <span>
                      PAYMENT VERIFICATION
                    </span>

                    <h2>
                      Verify Payment
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPaymentVerification(
                        false
                      )
                    }
                  >
                    <X />
                  </button>
                </div>

                <div className="mm-payment-check-banner">
                  <CreditCard size={22} />

                  <div>
                    <strong>
                      Check this payment before approving
                    </strong>

                    <p>
                      Compare the UTR number and amount below
                      with your bank / UPI transaction statement.
                    </p>
                  </div>
                </div>

                <div className="mm-payment-verification-grid">

                  <div className="mm-detail-card">
                    <span>Member</span>
                    <strong>
                      {getUserName(selectedMembership)}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>Membership Plan</span>
                    <strong>
                      {getPlanName(selectedMembership)}
                    </strong>
                  </div>

                  <div className="mm-detail-card mm-payment-highlight">
                    <span>Amount to Verify</span>
                    <strong>
                      {formatAmount(
                        getAmount(selectedMembership)
                      )}
                    </strong>
                  </div>

                  <div className="mm-detail-card mm-payment-highlight">
                    <span>UTR Number</span>
                    <strong className="mm-utr-large">
                      {selectedMembership?.utrNumber ||
                        selectedMembership?.utr_number ||
                        "Not submitted"}
                    </strong>
                  </div>

                  <div className="mm-detail-card">
                    <span>Payment Status</span>
                    <StatusBadge
                      status={getPaymentStatus(
                        selectedMembership
                      )}
                      type="payment"
                    />
                  </div>

                  <div className="mm-detail-card">
                    <span>Submitted At</span>
                    <strong>
                      {formatDateTime(
                        selectedMembership?.paymentSubmittedAt ||
                          selectedMembership?.payment_submitted_at
                      )}
                    </strong>
                  </div>

                </div>

                <div className="mm-payment-verification-note">
                  <ShieldCheck size={17} />

                  <span>
                    Only approve if the UTR exists in your
                    bank/UPI statement and the received amount
                    matches the membership amount.
                  </span>
                </div>

                <div className="mm-modal-footer">

                  <button
                    type="button"
                    className="mm-secondary-button"
                    onClick={() =>
                      setShowPaymentVerification(
                        false
                      )
                    }
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="mm-action-reject large"
                    disabled={
                      actionLoading ===
                      `payment-not-received-${selectedMembership.id}`
                    }
                    onClick={async () => {
                      await markPaymentNotReceived(
                        selectedMembership
                      );

                      setShowPaymentVerification(
                        false
                      );
                    }}
                  >
                    {actionLoading ===
                    `payment-not-received-${selectedMembership.id}` ? (
                      <Loader2
                        size={17}
                        className="mm-spin"
                      />
                    ) : (
                      <XCircle
                        size={17}
                      />
                    )}

                    Payment Not Received
                  </button>

                  {getPaymentStatus(
                    selectedMembership
                  ) === "submitted" && (
                    <button
                      type="button"
                      className="mm-action-approve large"
                      disabled={
                        actionLoading ===
                        `payment-received-${selectedMembership.id}`
                      }
                      onClick={async () => {
                        await markPaymentReceived(
                          selectedMembership
                        );

                        setShowPaymentVerification(
                          false
                        );
                      }}
                    >
                      {actionLoading ===
                      `payment-received-${selectedMembership.id}` ? (
                        <Loader2
                          size={17}
                          className="mm-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={17}
                        />
                      )}

                      Payment Received
                    </button>
                  )}

                  {(getPaymentStatus(
                    selectedMembership
                  ) === "received" ||
                    getPaymentStatus(
                      selectedMembership
                    ) === "approved") && (
                    <button
                      type="button"
                      className="mm-action-approve large"
                      disabled={
                        actionLoading ===
                        `approve-${selectedMembership.id}`
                      }
                      onClick={() => {
                        setShowPaymentVerification(
                          false
                        );

                        approveMembership(
                          selectedMembership
                        );
                      }}
                    >
                      {actionLoading ===
                      `approve-${selectedMembership.id}` ? (
                        <Loader2
                          size={17}
                          className="mm-spin"
                        />
                      ) : (
                        <Check
                          size={17}
                        />
                      )}

                      Approve Membership
                    </button>
                  )}

                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            REJECT MODAL
        =================================================== */}

        {showReject &&
          selectedMembership && (
            <div
              className="mm-modal-overlay"
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setShowReject(
                    false
                  );
                }
              }}
            >
              <div className="mm-modal mm-small-modal">
                <div className="mm-modal-header">
                  <div>
                    <span>
                      REJECT APPLICATION
                    </span>

                    <h2>
                      Reject Membership
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowReject(
                        false
                      )
                    }
                  >
                    <X />
                  </button>
                </div>

                <p className="mm-modal-description">
                  You are rejecting the
                  membership application
                  for{" "}
                  <strong>
                    {getUserName(
                      selectedMembership
                    )}
                  </strong>
                  .
                </p>

                <div className="mm-form-field">
                  <label>
                    Rejection Reason
                  </label>

                  <textarea
                    value={
                      rejectionReason
                    }
                    onChange={(
                      event
                    ) =>
                      setRejectionReason(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter reason for rejecting this membership..."
                    rows={5}
                  />
                </div>

                <div className="mm-modal-footer">
                  <button
                    type="button"
                    className="mm-secondary-button"
                    onClick={() =>
                      setShowReject(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="mm-action-reject large"
                    disabled={
                      actionLoading ===
                      `reject-${selectedMembership.id}`
                    }
                    onClick={
                      rejectSelected
                    }
                  >
                    {actionLoading ===
                    `reject-${selectedMembership.id}` ? (
                      <Loader2
                        size={17}
                        className="mm-spin"
                      />
                    ) : (
                      <X
                        size={17}
                      />
                    )}

                    Reject Membership
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            PLAN MODAL
        =================================================== */}

        {showPlanModal && (
          <div
            className="mm-modal-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowPlanModal(
                  false
                );
              }
            }}
          >
            <form
              className="mm-modal mm-small-modal"
              onSubmit={
                savePlan
              }
            >
              <div className="mm-modal-header">
                <div>
                  <span>
                    MEMBERSHIP PLAN
                  </span>

                  <h2>
                    {editingPlan
                      ? "Edit Plan"
                      : "Create Plan"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowPlanModal(
                      false
                    )
                  }
                >
                  <X />
                </button>
              </div>

              <div className="mm-form-field">
                <label>
                  Plan Name
                </label>

                <input
                  type="text"
                  value={
                    planForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setPlanForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="1 Year Membership"
                />
              </div>

              <div className="mm-form-row">
                <div className="mm-form-field">
                  <label>
                    Duration
                  </label>

                  <select
                    value={
                      planForm.durationYears
                    }
                    onChange={(
                      event
                    ) =>
                      setPlanForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          durationYears:
                            Number(
                              event.target
                                .value
                            ),
                        })
                      )
                    }
                  >
                    {Array.from(
                      {
                        length: 10,
                      },
                      (
                        _,
                        index
                      ) =>
                        index + 1
                    ).map(
                      (
                        year
                      ) => (
                        <option
                          key={
                            year
                          }
                          value={
                            year
                          }
                        >
                          {year} Year
                          {year !==
                          1
                            ? "s"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="mm-form-field">
                  <label>
                    Price
                  </label>

                  <div className="mm-input-with-icon">
                    <IndianRupee
                      size={16}
                    />

                    <input
                      type="number"
                      min="1"
                      value={
                        planForm.price
                      }
                      onChange={(
                        event
                      ) =>
                        setPlanForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            price:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>

              <label className="mm-checkbox">
                <input
                  type="checkbox"
                  checked={
                    planForm.isActive
                  }
                  onChange={(
                    event
                  ) =>
                    setPlanForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        isActive:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  Plan is active and
                  available to users
                </span>
              </label>

              <div className="mm-modal-footer">
                <button
                  type="button"
                  className="mm-secondary-button"
                  onClick={() =>
                    setShowPlanModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mm-primary-button"
                  disabled={
                    plansLoading
                  }
                >
                  {plansLoading ? (
                    <Loader2
                      size={17}
                      className="mm-spin"
                    />
                  ) : (
                    <Check
                      size={17}
                    />
                  )}

                  {editingPlan
                    ? "Update Plan"
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

export default MembershipManagement;