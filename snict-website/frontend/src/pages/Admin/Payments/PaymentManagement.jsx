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
  Search,
  RefreshCw,
  Eye,
  X,
  UserRound,
  CalendarDays,
  Receipt,
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


// =========================================================
// PAYMENT MANAGEMENT
// =========================================================

function PaymentManagement() {

  // =======================================================
  // STATE
  // =======================================================

  const [payments, setPayments] = useState([]);

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

  const [paymentTypeFilter, setPaymentTypeFilter] =
    useState("all");

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [processingId, setProcessingId] =
    useState(null);


  // =======================================================
  // LOAD PAYMENTS
  // =======================================================

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


      // ===================================================
      // EVENT PAYMENTS
      // ===================================================

      const response =
        await api.get(
          "/payments/admin"
        );


      if (!response.data?.success) {

        setError(
          response.data?.message ||
          "Unable to load payments."
        );

        return;
      }


      const eventPayments =
        Array.isArray(
          response.data.payments
        )
          ? response.data.payments
          : [];


      // ===================================================
      // MEMBERSHIP PAYMENTS
      // ===================================================

      let membershipPayments = [];


      try {

        const membershipResponse =
          await api.get(
            "/membership/admin"
          );


        const memberships =
          Array.isArray(
            membershipResponse.data?.memberships
          )
            ? membershipResponse.data.memberships
            : [];


        membershipPayments =
          memberships
            .filter(
              (membership) => {

                const status =
                  String(
                    membership?.paymentStatus ||
                    membership?.payment_status ||
                    "not_submitted"
                  )
                    .toLowerCase()
                    .trim();


                return (
                  status !==
                  "not_submitted"
                );

              }
            )
            .map(
              (membership) => {

                const originalPaymentStatus =
                  String(
                    membership?.paymentStatus ||
                    membership?.payment_status ||
                    "submitted"
                  )
                    .toLowerCase()
                    .trim();


                let paymentStatus =
                  "submitted";


                if (
                  originalPaymentStatus ===
                    "received" ||
                  originalPaymentStatus ===
                    "approved" ||
                  originalPaymentStatus ===
                    "verified"
                ) {

                  paymentStatus =
                    "verified";

                } else if (
                  originalPaymentStatus ===
                    "not_received" ||
                  originalPaymentStatus ===
                    "rejected"
                ) {

                  paymentStatus =
                    "rejected";

                }


                return {

                  // ---------------------------------------
                  // UNIQUE PAYMENT ID
                  // ---------------------------------------

                  id:
                    `membership-payment-${membership.id}`,

                  membership_record_id:
                    membership.id,


                  source:
                    "membership",


                  payment_type:
                    "membership",


                  // ---------------------------------------
                  // USER
                  // ---------------------------------------

                  full_name:
                    membership?.user?.fullName ||
                    membership?.user?.full_name ||
                    membership?.fullName ||
                    membership?.full_name ||
                    membership?.user?.name ||
                    membership?.name ||
                    "Unknown User",


                  username:
                    membership?.user?.username ||
                    membership?.username ||
                    "",


                  email:
                    membership?.user?.email ||
                    membership?.email ||
                    "",


                  mobile:
                    membership?.user?.mobile ||
                    membership?.mobile ||
                    membership?.user?.phone ||
                    membership?.phone ||
                    "",


                  // ---------------------------------------
                  // PAYMENT
                  // ---------------------------------------

                  transaction_id:
                    membership?.utrNumber ||
                    membership?.utr_number ||
                    membership?.transaction_id ||
                    membership?.transactionId ||
                    "",


                  payment_amount:
                    membership?.amount ??
                    membership?.paymentAmount ??
                    membership?.payment_amount ??
                    membership?.plan?.price ??
                    membership?.plan?.amount ??
                    0,


                  payment_method:
                    membership?.paymentMethod ||
                    membership?.payment_method ||
                    "UPI",


                  payment_status:
                    paymentStatus,


                  membership_payment_status:
                    originalPaymentStatus,


                  payment_created_at:
                    membership?.paymentSubmittedAt ||
                    membership?.payment_submitted_at ||
                    membership?.paymentDate ||
                    membership?.payment_date ||
                    membership?.paidAt ||
                    membership?.paid_at ||
                    membership?.createdAt ||
                    membership?.created_at,


                  created_at:
                    membership?.createdAt ||
                    membership?.created_at,


                  payment_proof_url:
                    membership?.paymentProofUrl ||
                    membership?.payment_proof_url ||
                    membership?.paymentProof ||
                    membership?.payment_proof ||
                    membership?.proofUrl ||
                    membership?.proof_url ||
                    "",


                  // ---------------------------------------
                  // MEMBERSHIP
                  // ---------------------------------------

                  membership_id:
                    membership?.membershipNumber ||
                    membership?.membership_number ||
                    membership?.membershipId ||
                    membership?.membership_id ||
                    membership?.id ||
                    "—",


                  membership_plan:
                    membership?.planName ||
                    membership?.plan_name ||
                    membership?.plan?.name ||
                    membership?.membershipPlan ||
                    membership?.membership_plan ||
                    membership?.membershipType ||
                    membership?.membership_type ||
                    "Membership",


                  membership_type:
                    membership?.membershipType ||
                    membership?.membership_type ||
                    "",


                  membership_validity:

                    membership?.durationYears
                      ? `${membership.durationYears} Year${
                          Number(
                            membership.durationYears
                          ) === 1
                            ? ""
                            : "s"
                        }`

                      : membership?.plan?.durationYears
                        ? `${membership.plan.durationYears} Year${
                            Number(
                              membership.plan.durationYears
                            ) === 1
                              ? ""
                              : "s"
                          }`

                        : membership?.validity ||
                          membership?.membershipValidity ||
                          "",


                  membership_status:
                    membership?.status ||
                    membership?.membershipStatus ||
                    "pending",

                };

              }
            );

      } catch (
        membershipError
      ) {

        console.error(
          "Membership payment loading error:",
          membershipError
        );

      }


      // ===================================================
      // PREVENT DUPLICATE MEMBERSHIP PAYMENTS
      // ===================================================

      const existingMembershipKeys =
        new Set(

          eventPayments

            .filter(
              (payment) => {

                const type =
                  String(
                    payment?.payment_type ||
                    payment?.paymentType ||
                    payment?.type ||
                    ""
                  )
                    .toLowerCase()
                    .trim();


                return (
                  type.includes(
                    "membership"
                  ) ||
                  payment?.membership_id ||
                  payment?.membershipId
                );

              }
            )

            .map(
              (payment) =>

                String(
                  payment?.membership_id ||
                  payment?.membershipId ||
                  payment?.membership_record_id ||
                  ""
                )
            )

            .filter(Boolean)

        );


      const additionalMembershipPayments =
        membershipPayments.filter(
          (payment) =>

            !existingMembershipKeys.has(
              String(
                payment.membership_record_id
              )
            )
        );


      // ===================================================
      // FINAL PAYMENT LIST
      // ===================================================

      setPayments(
        [
          ...eventPayments,
          ...additionalMembershipPayments,
        ]
      );


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


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadPayments();

  }, []);


  // =======================================================
  // PAYMENT TYPE
  // =======================================================

  const getPaymentType = (
    payment
  ) => {

    const explicitType =
      String(
        payment?.source === "membership"
          ? "membership"
          : payment?.payment_type ||
            payment?.paymentType ||
            payment?.type ||
            payment?.category ||
            payment?.payment_category ||
            ""
      )
        .toLowerCase()
        .trim();


    if (
      explicitType.includes(
        "membership"
      ) ||
      explicitType.includes(
        "member"
      )
    ) {

      return "membership";

    }


    if (
      explicitType.includes(
        "event"
      ) ||
      explicitType.includes(
        "booking"
      )
    ) {

      return "event";

    }


    // ===================================================
    // FALLBACK MEMBERSHIP DETECTION
    // ===================================================

    const hasMembershipData =
      payment?.membership_id ||
      payment?.membershipId ||
      payment?.membership_record_id ||
      payment?.membership_plan ||
      payment?.membershipPlan ||
      payment?.plan_name ||
      payment?.planName ||
      payment?.membership_name ||
      payment?.membershipName;


    if (
      hasMembershipData
    ) {

      return "membership";

    }


    return "event";

  };


  const isMembershipPayment =
    (payment) =>
      getPaymentType(
        payment
      ) === "membership";


  const isEventPayment =
    (payment) =>
      getPaymentType(
        payment
      ) === "event";


  const getPaymentTypeLabel =
    (payment) =>

      isMembershipPayment(
        payment
      )
        ? "Membership"
        : "Event";


  // =======================================================
  // MEMBERSHIP HELPERS
  // =======================================================

  const getMembershipPlan =
    (payment) =>

      payment?.membership_plan ||
      payment?.membershipPlan ||
      payment?.plan_name ||
      payment?.planName ||
      payment?.membership_name ||
      payment?.membershipName ||
      payment?.plan ||
      "Membership";


  const getMembershipId =
    (payment) =>

      payment?.membership_id ||
      payment?.membershipId ||
      payment?.membership_code ||
      payment?.membershipCode ||
      payment?.membership_record_id ||
      "—";


  // =======================================================
  // STATUS
  // =======================================================

  const getStatus =
    (payment) => {

      return String(
        payment?.payment_status ||
        "unknown"
      )
        .toLowerCase()
        .trim();

    };


  // =======================================================
  // AMOUNT
  // =======================================================

  const formatAmount =
    (amount) => {

      const value =
        Number(
          amount || 0
        );


      return value.toLocaleString(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }
      );

    };


  // =======================================================
  // PAYMENT AMOUNT
  // =======================================================

  const getPaymentAmount = (
    payment
  ) => {

    const candidates = [
      payment?.payment_amount,
      payment?.amount,
      payment?.booking_amount,
      payment?.membership_amount,
      payment?.paymentAmount,
      payment?.plan_amount,
    ];

    for (const value of candidates) {

      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {

        const numericValue =
          Number(value);

        if (
          Number.isFinite(numericValue) &&
          numericValue > 0
        ) {
          return numericValue;
        }
      }
    }

    return 0;
  };


  // =======================================================
  // DATE
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


  // =======================================================
  // DATE TIME
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


  // =======================================================
  // TODAY
  // =======================================================

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


  // =======================================================
  // TODAY PAYMENTS
  // =======================================================

  const todayPayments =
    useMemo(
      () => {

        return payments.filter(
          (payment) =>

            isToday(
              payment.payment_created_at ||
              payment.created_at
            )

        );

      },
      [payments]
    );


  // =======================================================
  // TODAY SUCCESSFUL
  // =======================================================

  const todaySuccessful =
    useMemo(
      () => {

        return todayPayments.filter(
          (payment) =>

            getStatus(
              payment
            ) === "verified"

        );

      },
      [todayPayments]
    );


  // =======================================================
  // TODAY FAILED
  // =======================================================

  const todayFailed =
    useMemo(
      () => {

        return todayPayments.filter(
          (payment) =>

            getStatus(
              payment
            ) === "rejected"

        );

      },
      [todayPayments]
    );


  // =======================================================
  // TODAY PENDING
  // =======================================================

  const todayPending =
    useMemo(
      () => {

        return todayPayments.filter(
          (payment) => {

            const status =
              getStatus(
                payment
              );


            return (
              status ===
                "submitted" ||
              status ===
                "pending"
            );

          }
        );

      },
      [todayPayments]
    );


  // =======================================================
  // TODAY SUCCESSFUL AMOUNT
  // =======================================================

  const todayAmount =
    useMemo(
      () => {

        return todaySuccessful.reduce(
          (
            total,
            payment
          ) =>

            total +
            getPaymentAmount(
              payment
            ),

          0
        );

      },
      [todaySuccessful]
    );


  // =======================================================
  // FILTER PAYMENTS
  // =======================================================

  const filteredPayments =
    useMemo(
      () => {

        const keyword =
          search
            .trim()
            .toLowerCase();


        return payments.filter(
          (payment) => {

            const status =
              getStatus(
                payment
              );


            if (
              statusFilter !==
                "all" &&
              status !==
                statusFilter
            ) {

              return false;

            }


            if (
              paymentTypeFilter !==
                "all" &&
              getPaymentType(
                payment
              ) !==
                paymentTypeFilter
            ) {

              return false;

            }


            if (!keyword) {

              return true;

            }


            const searchable = [

              payment.full_name,

              payment.username,

              payment.email,

              payment.mobile,

              payment.transaction_id,

              payment.booking_code,

              payment.event_title,

              payment.event_type,

              payment.payment_method,

              payment.payment_type,

              payment.membership_id,

              payment.membershipId,

              payment.membership_record_id,

              payment.membership_plan,

              payment.membershipPlan,

              payment.plan_name,

              payment.planName,

              payment.membership_name,

              payment.membershipName,

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return searchable.includes(
              keyword
            );

          }
        );

      },
      [
        payments,
        search,
        statusFilter,
        paymentTypeFilter,
      ]
    );


  // =======================================================
  // CHART
  // =======================================================

  const chartData =
    useMemo(
      () => {

        return [

          {
            name:
              "Successful",

            value:
              payments.filter(
                (payment) =>
                  getStatus(
                    payment
                  ) ===
                  "verified"
              ).length,
          },

          {
            name:
              "Pending",

            value:
              payments.filter(
                (payment) => {

                  const status =
                    getStatus(
                      payment
                    );


                  return (
                    status ===
                      "submitted" ||
                    status ===
                      "pending"
                  );

                }
              ).length,
          },

          {
            name:
              "Rejected",

            value:
              payments.filter(
                (payment) =>
                  getStatus(
                    payment
                  ) ===
                  "rejected"
              ).length,
          },

        ].filter(
          (item) =>
            item.value > 0
        );

      },
      [payments]
    );


  const chartColors = [
    "#16a34a",
    "#f59e0b",
    "#dc2626",
  ];


  // =======================================================
  // VERIFY / REJECT PAYMENT
  // =======================================================

  const handlePaymentAction =
    async (
      payment,
      status
    ) => {

      // ===================================================
      // PREVENT DOUBLE CLICK
      // ===================================================

      if (
        processingId ===
        payment.id
      ) {

        return;

      }


      // ===================================================
      // CURRENT STATUS
      // ===================================================

      const currentStatus =
        getStatus(
          payment
        );


      if (
        currentStatus !==
          "submitted" &&
        currentStatus !==
          "pending"
      ) {

        setError(
          `This payment cannot be processed because its current status is "${currentStatus}". Only pending payments can be processed.`
        );

        return;

      }


      // ===================================================
      // CONFIRM
      // ===================================================

      const confirmed =
        window.confirm(

          isMembershipPayment(
            payment
          )

            ? status ===
              "confirmed"

              ? "Mark this membership payment as received?"

              : "Mark this membership payment as NOT received?"

            : status ===
              "confirmed"

              ? "Are you sure you want to confirm this payment?"

              : "Are you sure you want to reject this payment?"

        );


      if (!confirmed) {

        return;

      }


      try {

        setProcessingId(
          payment.id
        );

        setError("");


        let response;


        // =================================================
        // MEMBERSHIP PAYMENT
        // =================================================

        if (
          isMembershipPayment(
            payment
          )
        ) {

          const membershipId =
            payment?.membership_record_id ||
            payment?.membershipId;


          if (!membershipId) {

            throw new Error(
              "Membership payment record ID is missing."
            );

          }


          const endpoint =
            status ===
              "confirmed"

              ? `/membership/admin/${membershipId}/payment-received`

              : `/membership/admin/${membershipId}/payment-not-received`;


          response =
            await api.put(
              endpoint
            );


        } else {

          // ===============================================
          // EVENT PAYMENT
          // ===============================================

          // Backend uses `verified` for a successful event payment.
          // The UI action remains `confirmed` for readability.
          const backendStatus =
            status === "confirmed"
              ? "verified"
              : "rejected";

          response =
            await api.put(
              `/payments/admin/${payment.id}/verify`,
              {
                status:
                  backendStatus,
              }
            );

        }


        // =================================================
        // RESPONSE
        // =================================================

        if (
          response.data?.success ===
          false
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to process payment."
          );

        }


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

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


  // =======================================================
  // STATUS BADGE
  // =======================================================

  const renderStatus =
    (status) => {

      const normalized =
        String(
          status || ""
        )
          .toLowerCase()
          .trim();


      if (
        normalized ===
        "verified"
      ) {

        return (

          <span
            className="
              payment-status
              payment-status-success
            "
          >

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

          <span
            className="
              payment-status
              payment-status-pending
            "
          >

            <Clock3
              size={14}
            />

            Pending

          </span>

        );

      }


      if (
        normalized ===
          "rejected" ||
        normalized ===
          "failed"
      ) {

        return (

          <span
            className="
              payment-status
              payment-status-failed
            "
          >

            <XCircle
              size={14}
            />

            Failed

          </span>

        );

      }


      return (

        <span
          className="payment-status"
        >

          {status ||
            "Unknown"}

        </span>

      );

    };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <main
        className="
          payment-management-page
        "
      >

        <div
          className="
            payment-management-container
          "
        >

          <div
            className="
              payment-loading
            "
          >

            <RefreshCw
              size={25}
              className="
                payment-spin
              "
            />

            <p>
              Loading payment data...
            </p>

          </div>

        </div>

      </main>

    );

  }


  // =======================================================
  // UI
  // =======================================================

  return (

    <main
      className="
        payment-management-page
      "
    >

      <div
        className="
          payment-management-container
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className="
            payment-page-header
          "
        >

          <div>

            <span
              className="
                payment-page-eyebrow
              "
            >
              SNICT ADMINISTRATION
            </span>


            <h1>
              Payment Management
            </h1>


            <p>
              Monitor event and membership
              payments, verify transactions,
              confirm membership payments and
              review payment activity.
            </p>

          </div>


          <button
            type="button"
            className="
              payment-refresh-button
            "
            onClick={() =>
              loadPayments(
                true
              )
            }
            disabled={
              refreshing
            }
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

          <div
            className="
              payment-error
            "
          >

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

        <section
          className="
            payment-stat-grid
          "
        >

          <div
            className="
              payment-stat-card
            "
          >

            <div
              className="
                payment-stat-icon
                total
              "
            >

              <CreditCard
                size={21}
              />

            </div>


            <div>

              <span>
                Today's Payments
              </span>

              <strong>
                {
                  todayPayments.length
                }
              </strong>

            </div>

          </div>


          <div
            className="
              payment-stat-card
            "
          >

            <div
              className="
                payment-stat-icon
                success
              "
            >

              <CheckCircle2
                size={21}
              />

            </div>


            <div>

              <span>
                Successful
              </span>

              <strong>
                {
                  todaySuccessful.length
                }
              </strong>

            </div>

          </div>


          <div
            className="
              payment-stat-card
            "
          >

            <div
              className="
                payment-stat-icon
                pending
              "
            >

              <Clock3
                size={21}
              />

            </div>


            <div>

              <span>
                Pending
              </span>

              <strong>
                {
                  todayPending.length
                }
              </strong>

            </div>

          </div>


          <div
            className="
              payment-stat-card
            "
          >

            <div
              className="
                payment-stat-icon
                failed
              "
            >

              <XCircle
                size={21}
              />

            </div>


            <div>

              <span>
                Failed
              </span>

              <strong>
                {
                  todayFailed.length
                }
              </strong>

            </div>

          </div>


          <div
            className="
              payment-stat-card
              payment-stat-card-wide
            "
          >

            <div
              className="
                payment-stat-icon
                amount
              "
            >

              <IndianRupee
                size={21}
              />

            </div>


            <div>

              <span>
                Today's Successful Amount
              </span>

              <strong>
                {
                  formatAmount(
                    todayAmount
                  )
                }
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            ANALYTICS
        ================================================= */}

        <section
          className="
            payment-analytics-grid
          "
        >

          {/* =================================================
              CHART
          ================================================= */}

          <div
            className="
              payment-chart-card
            "
          >

            <div
              className="
                payment-card-header
              "
            >

              <div>

                <span>
                  PAYMENT ANALYTICS
                </span>

                <h2>
                  Payment Overview
                </h2>

              </div>


              <div
                className="
                  payment-card-header-icon
                "
              >

                <CreditCard
                  size={18}
                />

              </div>

            </div>


            {chartData.length >
            0 ? (

              <div
                className="
                  payment-chart
                "
              >

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <PieChart>

                    <Pie
                      data={
                        chartData
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={
                        75
                      }
                      outerRadius={
                        110
                      }
                      paddingAngle={
                        4
                      }
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

              <div
                className="
                  payment-empty-chart
                "
              >

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

          <div
            className="
              payment-summary-card
            "
          >

            <div
              className="
                payment-card-header
              "
            >

              <div>

                <span>
                  PAYMENT SUMMARY
                </span>

                <h2>
                  Overall Activity
                </h2>

              </div>

            </div>


            <div
              className="
                payment-summary-list
              "
            >

              <div>

                <span>
                  Total Transactions
                </span>

                <strong>
                  {
                    payments.length
                  }
                </strong>

              </div>


              <div>

                <span>
                  Successful
                </span>

                <strong
                  className="
                    text-success
                  "
                >

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

                <strong
                  className="
                    text-pending
                  "
                >

                  {
                    payments.filter(
                      (payment) => {

                        const status =
                          getStatus(
                            payment
                          );


                        return (
                          status ===
                            "submitted" ||
                          status ===
                            "pending"
                        );

                      }
                    ).length
                  }

                </strong>

              </div>


              <div>

                <span>
                  Rejected
                </span>

                <strong
                  className="
                    text-danger
                  "
                >

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

        <section
          className="
            payment-table-card
          "
        >

          <div
            className="
              payment-table-header
            "
          >

            <div>

              <span>
                TRANSACTION RECORDS
              </span>

              <h2>

                {
                  paymentTypeFilter ===
                  "event"

                    ? "Event Payments"

                    : paymentTypeFilter ===
                      "membership"

                      ? "Membership Payments"

                      : "All Payment Transactions"
                }

              </h2>

            </div>


            <div
              className="
                payment-table-controls
              "
            >

              {/* =========================================
                  SEARCH
              ========================================= */}

              <div
                className="
                  payment-search
                "
              >

                <Search
                  size={16}
                />

                <input
                  type="text"
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
                  placeholder="
                    Search member, UTR,
                    event, booking or membership...
                  "
                />

              </div>


              {/* =========================================
                  TYPE
              ========================================= */}

              <select
                value={
                  paymentTypeFilter
                }
                onChange={(
                  event
                ) =>
                  setPaymentTypeFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Payments
                </option>

                <option value="event">
                  Event Payments
                </option>

                <option value="membership">
                  Membership Payments
                </option>

              </select>


              {/* =========================================
                  STATUS
              ========================================= */}

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
                  All Status
                </option>

                <option value="verified">
                  Successful
                </option>

                <option value="submitted">
                  Pending
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="rejected">
                  Failed
                </option>

              </select>

            </div>

          </div>


          {/* =================================================
              EMPTY
          ================================================= */}

          {filteredPayments.length ===
          0 ? (

            <div
              className="
                payment-empty
              "
            >

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

            <div
              className="
                payment-table-wrapper
              "
            >

              <table>

                <thead>

                  <tr>

                    <th>
                      Member
                    </th>

                    <th>
                      Payment Type
                    </th>

                    <th>
                      Event / Membership
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Transaction ID / UTR
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
                    (
                      payment
                    ) => (

                      <tr
                        key={
                          payment.id
                        }
                      >

                        {/* =================================
                            MEMBER
                        ================================= */}

                        <td>

                          <div
                            className="
                              payment-member-cell
                            "
                          >

                            <div
                              className="
                                payment-avatar
                              "
                            >

                              {(
                                payment.full_name ||
                                payment.username ||
                                "U"
                              )
                                .charAt(
                                  0
                                )
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


                        {/* =================================
                            TYPE
                        ================================= */}

                        <td>

                          <span
                            className={`
                              payment-type-badge
                              payment-type-${getPaymentType(
                                payment
                              )}
                            `}
                          >

                            {
                              getPaymentTypeLabel(
                                payment
                              )
                            }

                          </span>

                        </td>


                        {/* =================================
                            EVENT / MEMBERSHIP
                        ================================= */}

                        <td>

                          {isMembershipPayment(
                            payment
                          ) ? (

                            <div
                              className="
                                payment-event-cell
                              "
                            >

                              <strong>
                                {
                                  getMembershipPlan(
                                    payment
                                  )
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  getMembershipId(
                                    payment
                                  )
                                }
                              </span>

                            </div>

                          ) : (

                            <div
                              className="
                                payment-event-cell
                              "
                            >

                              <strong>
                                {
                                  payment.event_title ||
                                  "—"
                                }
                              </strong>

                              <span>

                                {
                                  payment.booking_code
                                    ? `Booking: ${payment.booking_code}`
                                    : payment.event_type ||
                                      ""
                                }

                              </span>

                            </div>

                          )}

                        </td>


                        {/* =================================
                            AMOUNT
                        ================================= */}

                        <td>

                          <strong
                            className="
                              payment-amount
                            "
                          >

                            {
                              formatAmount(
                                getPaymentAmount(
                                  payment
                                )
                              )
                            }

                          </strong>

                        </td>


                        {/* =================================
                            UTR
                        ================================= */}

                        <td>

                          <span
                            className="
                              payment-transaction
                            "
                          >

                            {
                              payment.transaction_id ||
                              "—"
                            }

                          </span>

                        </td>


                        {/* =================================
                            DATE
                        ================================= */}

                        <td>

                          <span
                            className="
                              payment-date
                            "
                          >

                            {
                              formatDateTime(
                                payment.payment_created_at ||
                                payment.created_at
                              )
                            }

                          </span>

                        </td>


                        {/* =================================
                            STATUS
                        ================================= */}

                        <td>

                          {
                            renderStatus(
                              payment.payment_status
                            )
                          }

                        </td>


                        {/* =================================
                            ACTION
                        ================================= */}

                        <td>

                          <div
                            className="payment-table-actions"
                          >

                            {(
                              getStatus(
                                payment
                              ) === "submitted" ||
                              getStatus(
                                payment
                              ) === "pending"
                            ) && (
                              <button
                                type="button"
                                className="payment-confirm-button payment-confirm-table-button"
                                disabled={
                                  processingId ===
                                  payment.id
                                }
                                onClick={() =>
                                  handlePaymentAction(
                                    payment,
                                    "confirmed"
                                  )
                                }
                                title="Confirm payment"
                              >

                                <CheckCircle2
                                  size={15}
                                />

                                {
                                  processingId ===
                                  payment.id
                                    ? "Processing..."
                                    : "Confirm"
                                }

                              </button>
                            )}

                            <button
                              type="button"
                              className="
                                payment-view-button
                              "
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
          PAYMENT DETAILS MODAL
      ===================================================== */}

      {selectedPayment && (

        <div
          className="
            payment-modal-overlay
          "
          onMouseDown={() =>
            setSelectedPayment(
              null
            )
          }
        >

          <section
            className="
              payment-modal
            "
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {/* ===============================================
                MODAL HEADER
            =============================================== */}

            <div
              className="
                payment-modal-header
              "
            >

              <div>

                <span>
                  PAYMENT DETAILS
                </span>

                <h2>
                  {
                    getPaymentTypeLabel(
                      selectedPayment
                    )
                  }{" "}
                  Payment Information
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


            <div
              className="
                payment-modal-body
              "
            >

              {/* =============================================
                  STATUS
              ============================================= */}

              <div
                className="
                  payment-detail-status
                "
              >

                {
                  renderStatus(
                    selectedPayment.payment_status
                  )
                }


                <strong>
                  {
                    formatAmount(
                      getPaymentAmount(
                        selectedPayment
                      )
                    )
                  }
                </strong>

              </div>


              {/* =============================================
                  MEMBER INFORMATION
              ============================================= */}

              <div
                className="
                  payment-detail-section
                "
              >

                <div
                  className="
                    payment-detail-title
                  "
                >

                  <UserRound
                    size={17}
                  />

                  <span>
                    MEMBER INFORMATION
                  </span>

                </div>


                <div
                  className="
                    payment-detail-grid
                  "
                >

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


              {/* =============================================
                  PAYMENT INFORMATION
              ============================================= */}

              <div
                className="
                  payment-detail-section
                "
              >

                <div
                  className="
                    payment-detail-title
                  "
                >

                  <Receipt
                    size={17}
                  />

                  <span>
                    PAYMENT INFORMATION
                  </span>

                </div>


                <div
                  className="
                    payment-detail-grid
                  "
                >

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
                      Payment Type
                    </span>

                    <strong>
                      {
                        getPaymentTypeLabel(
                          selectedPayment
                        )
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
                      {
                        formatAmount(
                          getPaymentAmount(
                            selectedPayment
                          )
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Payment Date
                    </span>

                    <strong>
                      {
                        formatDateTime(
                          selectedPayment.payment_created_at ||
                          selectedPayment.created_at
                        )
                      }
                    </strong>

                  </div>


                  {/* =========================================
                      MEMBERSHIP PAYMENT STATUS
                  ========================================= */}

                  {isMembershipPayment(
                    selectedPayment
                  ) && (

                    <div>

                      <span>
                        Payment Status
                      </span>

                      <strong>
                        {
                          selectedPayment.membership_payment_status ||
                          selectedPayment.payment_status ||
                          "—"
                        }
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* =============================================
                  MEMBERSHIP INFORMATION
              ============================================= */}

              {isMembershipPayment(
                selectedPayment
              ) ? (

                <div
                  className="
                    payment-detail-section
                  "
                >

                  <div
                    className="
                      payment-detail-title
                    "
                  >

                    <CreditCard
                      size={17}
                    />

                    <span>
                      MEMBERSHIP INFORMATION
                    </span>

                  </div>


                  <div
                    className="
                      payment-detail-grid
                    "
                  >

                    <div>

                      <span>
                        Membership Plan
                      </span>

                      <strong>
                        {
                          getMembershipPlan(
                            selectedPayment
                          )
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Membership ID
                      </span>

                      <strong>
                        {
                          getMembershipId(
                            selectedPayment
                          )
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Membership Type
                      </span>

                      <strong>
                        {
                          selectedPayment.membership_type ||
                          selectedPayment.membershipType ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Validity
                      </span>

                      <strong>
                        {
                          selectedPayment.membership_validity ||
                          selectedPayment.membershipValidity ||
                          selectedPayment.validity ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Membership Status
                      </span>

                      <strong>
                        {
                          selectedPayment.membership_status ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>

                </div>

              ) : (

                /* =============================================
                    EVENT INFORMATION
                ============================================= */

                <div
                  className="
                    payment-detail-section
                  "
                >

                  <div
                    className="
                      payment-detail-title
                    "
                  >

                    <CalendarDays
                      size={17}
                    />

                    <span>
                      EVENT INFORMATION
                    </span>

                  </div>


                  <div
                    className="
                      payment-detail-grid
                    "
                  >

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
                        Booking ID
                      </span>

                      <strong>
                        {
                          selectedPayment.booking_code ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Event Date
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedPayment.event_date
                          )
                        }
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

              )}


              {/* =============================================
                  PAYMENT PROOF
              ============================================= */}

              {selectedPayment.payment_proof_url && (

                <div
                  className="
                    payment-proof-section
                  "
                >

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


              {/* =============================================
                  MEMBERSHIP ACTIONS
              ============================================= */}

              {isMembershipPayment(
                selectedPayment
              ) &&

                (
                  selectedPayment.payment_status ===
                    "submitted" ||
                  selectedPayment.payment_status ===
                    "pending"
                ) && (

                  <div
                    className="
                      payment-modal-actions
                    "
                  >

                    <button
                      type="button"
                      className="
                        payment-confirm-button
                      "
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

                      {
                        processingId ===
                        selectedPayment.id

                          ? "Processing..."

                          : "Payment Received"
                      }

                    </button>


                    <button
                      type="button"
                      className="
                        payment-reject-button
                      "
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

                      {
                        processingId ===
                        selectedPayment.id

                          ? "Processing..."

                          : "Payment Not Received"
                      }

                    </button>

                  </div>

                )}


              {/* =============================================
                  EVENT ACTIONS
              ============================================= */}

              {!isMembershipPayment(
                selectedPayment
              ) &&

                (
                  selectedPayment.payment_status ===
                    "submitted" ||
                  selectedPayment.payment_status ===
                    "pending"
                ) && (

                  <div
                    className="
                      payment-modal-actions
                    "
                  >

                    <button
                      type="button"
                      className="
                        payment-confirm-button
                      "
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

                      {
                        processingId ===
                        selectedPayment.id

                          ? "Processing..."

                          : "Confirm Payment"
                      }

                    </button>


                    <button
                      type="button"
                      className="
                        payment-reject-button
                      "
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

                      {
                        processingId ===
                        selectedPayment.id

                          ? "Processing..."

                          : "Reject Payment"
                      }

                    </button>

                  </div>

                )}


              {/* =============================================
                  VERIFIED MESSAGE
              ============================================= */}

              {selectedPayment.payment_status ===
                "verified" && (

                <div
                  className="
                    payment-success-message
                  "
                >

                  <CheckCircle2
                    size={18}
                  />

                  <span>
                    This payment has already
                    been verified.
                  </span>

                </div>

              )}


              {/* =============================================
                  REJECTED MESSAGE
              ============================================= */}

              {selectedPayment.payment_status ===
                "rejected" && (

                <div
                  className="
                    payment-error
                  "
                >

                  <XCircle
                    size={18}
                  />

                  <span>
                    This payment has been
                    rejected / marked as not received.
                  </span>

                </div>

              )}

            </div>

          </section>

        </div>

      )}

    </main>

  );

}


export default PaymentManagement;