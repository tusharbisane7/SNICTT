import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  IndianRupee,
  Users,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  Phone,
  UserRound,
  CalendarDays,
  MapPin,
  Receipt,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import api from "../../../services/api";

import "./PaymentManagement.css";


function PaymentManagement() {

  // =========================================================
  // STATE
  // =========================================================

  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [processingId, setProcessingId] =
    useState(null);


  // =========================================================
  // LOAD PAYMENTS
  // =========================================================

  const loadPayments = async (
    isRefresh = false
  ) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // IMPORTANT:
      // Backend route is /api/payments/admin

      const response =
        await api.get(
          "/payments/admin"
        );

      if (
        response.data?.success
      ) {

        setPayments(
          Array.isArray(
            response.data.payments
          )
            ? response.data.payments
            : []
        );

      } else {

        setError(
          response.data?.message ||
            "Unable to load payments."
        );

      }

    } catch (error) {

      console.error(
        "Payment loading error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load payment data."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    loadPayments();

  }, []);


  // =========================================================
  // HELPERS
  // =========================================================

  const getStatus =
    (payment) => {

      return (
        payment?.payment_status ||
        "unknown"
      ).toLowerCase();

    };


  const formatAmount =
    (amount) => {

      const value =
        Number(amount || 0);

      return value.toLocaleString(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }
      );

    };


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
        return "—";
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


  // =========================================================
  // TODAY CHECK
  // =========================================================

  const isToday =
    (value) => {

      if (!value) {
        return false;
      }

      const date =
        new Date(value);

      const today =
        new Date();

      return (
        date.getDate() ===
          today.getDate() &&
        date.getMonth() ===
          today.getMonth() &&
        date.getFullYear() ===
          today.getFullYear()
      );

    };


  // =========================================================
  // TODAY PAYMENTS
  // =========================================================

  const todayPayments =
    useMemo(() => {

      return payments.filter(
        (payment) =>
          isToday(
            payment.payment_created_at ||
              payment.created_at
          )
      );

    }, [payments]);


  // =========================================================
  // TODAY SUCCESS
  // =========================================================

  const todaySuccessful =
    useMemo(() => {

      return todayPayments.filter(
        (payment) =>
          getStatus(payment) ===
          "verified"
      );

    }, [todayPayments]);


  // =========================================================
  // TODAY FAILED
  // =========================================================

  const todayFailed =
    useMemo(() => {

      return todayPayments.filter(
        (payment) =>
          getStatus(payment) ===
          "rejected"
      );

    }, [todayPayments]);


  // =========================================================
  // TODAY PENDING
  // =========================================================

  const todayPending =
    useMemo(() => {

      return todayPayments.filter(
        (payment) =>
          getStatus(payment) ===
            "submitted" ||
          getStatus(payment) ===
            "pending"
      );

    }, [todayPayments]);


  // =========================================================
  // TODAY AMOUNT
  // =========================================================

  const todayAmount =
    useMemo(() => {

      return todaySuccessful.reduce(
        (total, payment) =>
          total +
          Number(
            payment.payment_amount ||
              payment.amount ||
              0
          ),
        0
      );

    }, [todaySuccessful]);


  // =========================================================
  // FILTER PAYMENTS
  // =========================================================

  const filteredPayments =
    useMemo(() => {

      const keyword =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {

          const status =
            getStatus(payment);

          if (
            statusFilter !==
              "all" &&
            status !==
              statusFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchable =
            [
              payment.full_name,
              payment.username,
              payment.email,
              payment.mobile,
              payment.transaction_id,
              payment.booking_code,
              payment.event_title,
              payment.payment_method,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            keyword
          );

        }
      );

    }, [
      payments,
      search,
      statusFilter,
    ]);


  // =========================================================
  // PIE CHART
  // =========================================================

  const chartData =
    useMemo(() => {

      return [
        {
          name: "Successful",
          value:
            payments.filter(
              (payment) =>
                getStatus(payment) ===
                "verified"
            ).length,
        },

        {
          name: "Pending",
          value:
            payments.filter(
              (payment) =>
                getStatus(payment) ===
                  "submitted" ||
                getStatus(payment) ===
                  "pending"
            ).length,
        },

        {
          name: "Rejected",
          value:
            payments.filter(
              (payment) =>
                getStatus(payment) ===
                "rejected"
            ).length,
        },
      ].filter(
        (item) =>
          item.value > 0
      );

    }, [payments]);


  const chartColors = [
    "#16a34a",
    "#f59e0b",
    "#dc2626",
  ];


  // =========================================================
  // VERIFY / REJECT
  // =========================================================

  const handlePaymentAction =
    async (
      payment,
      status
    ) => {

      if (
        processingId ===
        payment.id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          status === "confirmed"
            ? "Confirm this payment?"
            : "Reject this payment?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setProcessingId(
          payment.id
        );

        setError("");

        const response =
          await api.put(
            `/payments/admin/${payment.id}/verify`,
            {
              status,
            }
          );

        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
              "Unable to process payment."
          );

        }

        setSelectedPayment(
          null
        );

        await loadPayments(
          true
        );

      } catch (error) {

        console.error(
          "Payment action error:",
          error
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to process payment."
        );

      } finally {

        setProcessingId(
          null
        );

      }

    };


  // =========================================================
  // STATUS BADGE
  // =========================================================

  const renderStatus =
    (status) => {

      const normalized =
        String(
          status || ""
        ).toLowerCase();

      if (
        normalized ===
        "verified"
      ) {

        return (
          <span className="payment-status payment-status-success">

            <CheckCircle2
              size={14}
            />

            Successful

          </span>
        );

      }

      if (
        normalized ===
          "submitted" ||
        normalized ===
          "pending"
      ) {

        return (
          <span className="payment-status payment-status-pending">

            <Clock3
              size={14}
            />

            Pending

          </span>
        );

      }

      if (
        normalized ===
        "rejected"
      ) {

        return (
          <span className="payment-status payment-status-failed">

            <XCircle
              size={14}
            />

            Failed

          </span>
        );

      }

      return (
        <span className="payment-status">
          {status || "Unknown"}
        </span>
      );

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <main className="payment-management-page">

        <div className="payment-management-container">

          <div className="payment-loading">

            <RefreshCw
              size={25}
              className="payment-spin"
            />

            <p>
              Loading payment data...
            </p>

          </div>

        </div>

      </main>
    );

  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="payment-management-page">

      <div className="payment-management-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="payment-page-header">

          <div>

            <span className="payment-page-eyebrow">
              SNICT ADMINISTRATION
            </span>

            <h1>
              Payment Management
            </h1>

            <p>
              Monitor payments, verify
              transactions and review
              member payment activity.
            </p>

          </div>


          <button
            type="button"
            className="payment-refresh-button"
            onClick={() =>
              loadPayments(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "payment-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </header>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="payment-error">

            <AlertCircle
              size={18}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            TODAY STATS
        ================================================= */}

        <section className="payment-stat-grid">


          <div className="payment-stat-card">

            <div className="payment-stat-icon total">
              <CreditCard
                size={21}
              />
            </div>

            <div>

              <span>
                Today's Payments
              </span>

              <strong>
                {todayPayments.length}
              </strong>

            </div>

          </div>


          <div className="payment-stat-card">

            <div className="payment-stat-icon success">
              <CheckCircle2
                size={21}
              />
            </div>

            <div>

              <span>
                Successful
              </span>

              <strong>
                {todaySuccessful.length}
              </strong>

            </div>

          </div>


          <div className="payment-stat-card">

            <div className="payment-stat-icon pending">
              <Clock3
                size={21}
              />
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {todayPending.length}
              </strong>

            </div>

          </div>


          <div className="payment-stat-card">

            <div className="payment-stat-icon failed">
              <XCircle
                size={21}
              />
            </div>

            <div>

              <span>
                Failed
              </span>

              <strong>
                {todayFailed.length}
              </strong>

            </div>

          </div>


          <div className="payment-stat-card payment-stat-card-wide">

            <div className="payment-stat-icon amount">
              <IndianRupee
                size={21}
              />
            </div>

            <div>

              <span>
                Today's Successful Amount
              </span>

              <strong>
                {formatAmount(
                  todayAmount
                )}
              </strong>

            </div>

          </div>


        </section>


        {/* =================================================
            ANALYTICS
        ================================================= */}

        <section className="payment-analytics-grid">


          <div className="payment-chart-card">

            <div className="payment-card-header">

              <div>

                <span>
                  PAYMENT ANALYTICS
                </span>

                <h2>
                  Payment Overview
                </h2>

              </div>

              <div className="payment-card-header-icon">
                <CreditCard
                  size={18}
                />
              </div>

            </div>


            {chartData.length > 0 ? (

              <div className="payment-chart">

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <PieChart>

                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                    >

                      {chartData.map(
                        (
                          entry,
                          index
                        ) => (

                          <Cell
                            key={
                              entry.name
                            }
                            fill={
                              chartColors[
                                index %
                                  chartColors.length
                              ]
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            ) : (

              <div className="payment-empty-chart">

                <CreditCard
                  size={40}
                />

                <p>
                  No payment data available.
                </p>

              </div>

            )}

          </div>


          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="payment-summary-card">

            <div className="payment-card-header">

              <div>

                <span>
                  PAYMENT SUMMARY
                </span>

                <h2>
                  Overall Activity
                </h2>

              </div>

            </div>


            <div className="payment-summary-list">

              <div>

                <span>
                  Total Transactions
                </span>

                <strong>
                  {payments.length}
                </strong>

              </div>


              <div>

                <span>
                  Successful
                </span>

                <strong className="text-success">
                  {
                    payments.filter(
                      (payment) =>
                        getStatus(
                          payment
                        ) ===
                        "verified"
                    ).length
                  }
                </strong>

              </div>


              <div>

                <span>
                  Pending Verification
                </span>

                <strong className="text-pending">
                  {
                    payments.filter(
                      (payment) =>
                        getStatus(
                          payment
                        ) ===
                          "submitted" ||
                        getStatus(
                          payment
                        ) ===
                          "pending"
                    ).length
                  }
                </strong>

              </div>


              <div>

                <span>
                  Rejected
                </span>

                <strong className="text-danger">
                  {
                    payments.filter(
                      (payment) =>
                        getStatus(
                          payment
                        ) ===
                        "rejected"
                    ).length
                  }
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            PAYMENT TABLE
        ================================================= */}

        <section className="payment-table-card">


          <div className="payment-table-header">

            <div>

              <span>
                TRANSACTION RECORDS
              </span>

              <h2>
                Payment Transactions
              </h2>

            </div>


            <div className="payment-table-controls">

              <div className="payment-search">

                <Search
                  size={16}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search member, UTR, event..."
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

                <option value="verified">
                  Successful
                </option>

                <option value="submitted">
                  Pending
                </option>

                <option value="rejected">
                  Failed
                </option>

              </select>

            </div>

          </div>


          {filteredPayments.length ===
          0 ? (

            <div className="payment-empty">

              <CreditCard
                size={40}
              />

              <h3>
                No payments found
              </h3>

              <p>
                No transactions match
                your current filters.
              </p>

            </div>

          ) : (

            <div className="payment-table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Member
                    </th>

                    <th>
                      Booking
                    </th>

                    <th>
                      Event
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Transaction ID
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

                  {filteredPayments.map(
                    (payment) => (

                      <tr
                        key={
                          payment.id
                        }
                      >

                        <td>

                          <div className="payment-member-cell">

                            <div className="payment-avatar">
                              {(
                                payment.full_name ||
                                payment.username ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  payment.full_name ||
                                  "Unknown User"
                                }
                              </strong>

                              <span>
                                {
                                  payment.email ||
                                  payment.username ||
                                  "—"
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <strong>
                            {
                              payment.booking_code ||
                              "—"
                            }
                          </strong>

                        </td>


                        <td>

                          <div className="payment-event-cell">

                            <strong>
                              {
                                payment.event_title ||
                                "—"
                              }
                            </strong>

                            <span>
                              {
                                payment.event_type ||
                                ""
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <strong className="payment-amount">
                            {formatAmount(
                              payment.payment_amount
                            )}
                          </strong>

                        </td>


                        <td>

                          <span className="payment-transaction">
                            {
                              payment.transaction_id ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <span className="payment-date">
                            {formatDateTime(
                              payment.payment_created_at ||
                                payment.created_at
                            )}
                          </span>

                        </td>


                        <td>

                          {renderStatus(
                            payment.payment_status
                          )}

                        </td>


                        <td>

                          <button
                            type="button"
                            className="payment-view-button"
                            onClick={() =>
                              setSelectedPayment(
                                payment
                              )
                            }
                          >

                            <Eye
                              size={15}
                            />

                            View

                          </button>

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
          PAYMENT DETAILS MODAL
      ===================================================== */}

      {selectedPayment && (

        <div
          className="payment-modal-overlay"
          onMouseDown={() =>
            setSelectedPayment(
              null
            )
          }
        >

          <section
            className="payment-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div>

                <span>
                  PAYMENT DETAILS
                </span>

                <h2>
                  Transaction Information
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(
                    null
                  )
                }
              >

                <X
                  size={19}
                />

              </button>

            </div>


            <div className="payment-modal-body">


              {/* =================================================
                  STATUS
              ================================================= */}

              <div className="payment-detail-status">

                {renderStatus(
                  selectedPayment.payment_status
                )}

                <strong>
                  {formatAmount(
                    selectedPayment.payment_amount
                  )}
                </strong>

              </div>


              {/* =================================================
                  MEMBER
              ================================================= */}

              <div className="payment-detail-section">

                <div className="payment-detail-title">

                  <UserRound
                    size={17}
                  />

                  <span>
                    MEMBER INFORMATION
                  </span>

                </div>


                <div className="payment-detail-grid">

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {
                        selectedPayment.full_name ||
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
                        selectedPayment.username
                          ? `@${selectedPayment.username}`
                          : "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {
                        selectedPayment.email ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Mobile
                    </span>

                    <strong>
                      {
                        selectedPayment.mobile ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* =================================================
                  PAYMENT
              ================================================= */}

              <div className="payment-detail-section">

                <div className="payment-detail-title">

                  <Receipt
                    size={17}
                  />

                  <span>
                    PAYMENT INFORMATION
                  </span>

                </div>


                <div className="payment-detail-grid">

                  <div>

                    <span>
                      Transaction ID / UTR
                    </span>

                    <strong>
                      {
                        selectedPayment.transaction_id ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Payment Method
                    </span>

                    <strong>
                      {
                        selectedPayment.payment_method ||
                        "UPI"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Amount
                    </span>

                    <strong>
                      {formatAmount(
                        selectedPayment.payment_amount
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Payment Date
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedPayment.payment_created_at
                      )}
                    </strong>

                  </div>

                </div>

              </div>


              {/* =================================================
                  EVENT
              ================================================= */}

              <div className="payment-detail-section">

                <div className="payment-detail-title">

                  <CalendarDays
                    size={17}
                  />

                  <span>
                    EVENT INFORMATION
                  </span>

                </div>


                <div className="payment-detail-grid">

                  <div>

                    <span>
                      Event
                    </span>

                    <strong>
                      {
                        selectedPayment.event_title ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Event Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedPayment.event_date
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Venue
                    </span>

                    <strong>
                      {
                        selectedPayment.venue ||
                        "—"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Event Mode
                    </span>

                    <strong>
                      {
                        selectedPayment.event_mode ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* =================================================
                  PAYMENT PROOF
              ================================================= */}

              {selectedPayment.payment_proof_url && (

                <div className="payment-proof-section">

                  <span>
                    PAYMENT PROOF
                  </span>

                  <a
                    href={
                      selectedPayment.payment_proof_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Payment Proof
                  </a>

                </div>

              )}


              {/* =================================================
                  ACTIONS
              ================================================= */}

              {
                (
                  selectedPayment.payment_status ===
                    "submitted" ||
                  selectedPayment.payment_status ===
                    "pending"
                ) && (

                  <div className="payment-modal-actions">

                    <button
                      type="button"
                      className="payment-confirm-button"
                      disabled={
                        processingId ===
                        selectedPayment.id
                      }
                      onClick={() =>
                        handlePaymentAction(
                          selectedPayment,
                          "confirmed"
                        )
                      }
                    >

                      <CheckCircle2
                        size={17}
                      />

                      Confirm Payment

                    </button>


                    <button
                      type="button"
                      className="payment-reject-button"
                      disabled={
                        processingId ===
                        selectedPayment.id
                      }
                      onClick={() =>
                        handlePaymentAction(
                          selectedPayment,
                          "rejected"
                        )
                      }
                    >

                      <XCircle
                        size={17}
                      />

                      Reject Payment

                    </button>

                  </div>

                )
              }

            </div>

          </section>

        </div>

      )}

    </main>
  );
}


export default PaymentManagement;