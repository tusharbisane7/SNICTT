import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ArrowRight, UserRound, CreditCard, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import snictLogo from "../../assets/snict-logo.jpeg";
import "./MembershipPayment.css";

function MembershipPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [membershipId, setMembershipId] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const selectedPlan = useMemo(
    () =>
      plans.find(
        (plan) =>
          String(plan.id ?? plan.planId) === String(selectedPlanId)
      ),
    [plans, selectedPlanId]
  );

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, plansResponse, settingsResponse] =
          await Promise.all([
            api.get("/auth/profile"),
            api.get("/membership/plans"),
            api.get("/membership/payment-settings"),
          ]);

        if (!mounted) return;

        setProfile(
          profileResponse.data?.user ||
            profileResponse.data?.profile ||
            profileResponse.data ||
            null
        );

        setPlans(
          Array.isArray(plansResponse.data?.plans)
            ? plansResponse.data.plans.filter(
                (plan) =>
                  plan.isActive ??
                  plan.is_active ??
                  true
              )
            : []
        );

        setPaymentSettings(
          settingsResponse.data?.settings ||
            settingsResponse.data?.paymentSettings ||
            null
        );
      } catch (err) {
        console.error("Membership payment page error:", err);

        if (!mounted) return;

        if (err.response?.status === 401) {
          setError(
            "Your registration session has expired. Please register again or login after membership approval."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load membership payment details."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const getValue = (obj, ...keys) => {
    for (const key of keys) {
      if (
        obj?.[key] !== undefined &&
        obj?.[key] !== null &&
        obj?.[key] !== ""
      ) {
        return obj[key];
      }
    }
    return "—";
  };

  const handleCreateMembership = async (event) => {
    event.preventDefault();

    if (!selectedPlanId) {
      setError("Please select a membership plan.");
      return;
    }

    try {
      setSubmittingPlan(true);
      setError("");
      setSuccess("");

      const response = await api.post("/membership/apply", {
        planId: Number(selectedPlanId),
      });

      const membership = response.data?.membership;

      if (!membership?.id) {
        throw new Error(
          "Membership application was not created."
        );
      }

      setMembershipId(membership.id);

      if (
        response.data?.paymentSettings ||
        response.data?.settings
      ) {
        setPaymentSettings(
          response.data.paymentSettings ||
            response.data.settings
        );
      }

      setSuccess(
        "Membership selected. Complete the payment and enter your UTR."
      );
    } catch (err) {
      console.error("Membership application error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create membership application."
      );
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    const utr = utrNumber.trim();

    if (!membershipId) {
      setError("Please select a membership plan first.");
      return;
    }

    if (!utr || utr.length < 6 || utr.length > 50) {
      setError("Please enter a valid UTR / transaction number.");
      return;
    }

    try {
      setSubmittingPayment(true);
      setError("");

      const response = await api.post("/membership/payment", {
        membershipId,
        utrNumber: utr,
      });

      setSuccess(
        response.data?.message ||
          "Payment submitted successfully."
      );

      try {
        await api.post("/auth/logout");
      } catch (logoutError) {
        console.warn(
          "Temporary membership logout error:",
          logoutError
        );
      }

      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to submit payment details."
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  const goHome = () => {
    navigate("/", {
      replace: true,
      state: {
        membershipPaymentSuccess: true,
        message:
          "Payment submitted successfully. Thank you for registering. Please wait until verification. You will be notified when your membership is approved.",
      },
    });
  };

  if (loading) {
    return (
      <main className="membership-payment-page">
        <div className="membership-payment-loading">
          <Loader2 className="membership-spin" size={34} />
          <p>Loading your membership details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="membership-payment-page">
      <div className="membership-payment-background" />

      <section className="membership-payment-card">
        <header className="membership-payment-header">
          <div className="membership-payment-brand">
            <img
              src={snictLogo}
              alt="SNICT Logo"
            />
            <div>
              <strong>SNICT</strong>
              <span>
                Society of Neo Interventional
                <br />
                Cardiovascular Technologists
              </span>
            </div>
          </div>

          <div className="membership-payment-title">
            <span>MEMBERSHIP</span>
            <h1>Complete Your Registration</h1>
            <p>
              Review your registration details,
              select your membership and submit your
              payment information.
            </p>
          </div>
        </header>

        {error && (
          <div className="membership-alert membership-alert-error">
            {error}
          </div>
        )}

        {success && !showSuccessPopup && (
          <div className="membership-alert membership-alert-success">
            {success}
          </div>
        )}

        {profile && (
          <section className="member-details-card">
            <div className="section-heading">
              <div className="section-icon">
                <UserRound size={20} />
              </div>
              <div>
                <span>Your Details</span>
                <h2>Registration Information</h2>
              </div>
            </div>

            <div className="member-details-grid">
              <div className="member-detail">
                <span>Full Name</span>
                <strong>
                  {getValue(profile, "fullName", "full_name", "name")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Username</span>
                <strong>
                  {getValue(profile, "username")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Email</span>
                <strong>
                  {getValue(profile, "email")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Mobile</span>
                <strong>
                  {getValue(profile, "mobile", "phone")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Age</span>
                <strong>
                  {getValue(profile, "age")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Sex</span>
                <strong>
                  {getValue(profile, "sex", "gender")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Blood Group</span>
                <strong>
                  {getValue(profile, "bloodGroup", "blood_group")}
                </strong>
              </div>

              <div className="member-detail">
                <span>Designation</span>
                <strong>
                  {getValue(profile, "designation")}
                </strong>
              </div>

              <div className="member-detail member-detail-full">
                <span>Address</span>
                <strong>
                  {getValue(profile, "address")}
                </strong>
              </div>

              <div className="member-detail member-detail-full">
                <span>Professional Bio</span>
                <strong>
                  {getValue(profile, "bio")}
                </strong>
              </div>
            </div>
          </section>
        )}

        <section className="membership-selection-card">
          <div className="section-heading">
            <div className="section-icon">
              <CreditCard size={20} />
            </div>
            <div>
              <span>Membership Plan</span>
              <h2>Select Membership</h2>
            </div>
          </div>

          <form onSubmit={handleCreateMembership}>
            <label
              className="membership-select-label"
              htmlFor="membershipPlan"
            >
              Choose your membership
            </label>

            <select
              id="membershipPlan"
              value={selectedPlanId}
              onChange={(event) => {
                setSelectedPlanId(event.target.value);
                setMembershipId(null);
                setError("");
                setSuccess("");
              }}
              disabled={Boolean(membershipId)}
            >
              <option value="">
                Select membership plan
              </option>

              {plans.map((plan) => {
                const id = String(
                  plan.id ?? plan.planId
                );

                const duration =
                  plan.durationYears ??
                  plan.duration_years ??
                  1;

                const price = Number(
                  plan.price ??
                    plan.amount ??
                    0
                );

                const name =
                  plan.name ||
                  `${duration} Year Membership`;

                return (
                  <option key={id} value={id}>
                    {name} — ₹
                    {price.toLocaleString("en-IN")} —{" "}
                    {duration}{" "}
                    {Number(duration) === 1
                      ? "year"
                      : "years"}
                  </option>
                );
              })}
            </select>

            {selectedPlan && (
              <div className="selected-plan-summary">
                <div>
                  <span>Selected Plan</span>
                  <strong>
                    {selectedPlan.name ||
                      "Membership"}
                  </strong>
                </div>

                <strong>
                  ₹
                  {Number(
                    selectedPlan.price ??
                      selectedPlan.amount ??
                      0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            )}

            {!membershipId && (
              <button
                type="submit"
                className="membership-primary-button"
                disabled={submittingPlan}
              >
                {submittingPlan ? (
                  <>
                    <Loader2
                      size={18}
                      className="membership-spin"
                    />
                    Creating Membership...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </form>
        </section>

        {membershipId && (
          <section className="payment-card">
            <div className="section-heading">
              <div className="section-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span>PAYMENT</span>
                <h2>Submit Payment Details</h2>
              </div>
            </div>

            <p className="payment-instruction">
              Complete the membership payment using the
              official SNICT payment details below. Then
              enter the UTR / transaction number.
            </p>

            {paymentSettings?.qrCode ? (
              <div className="payment-qr-wrapper">
                <img
                  src={paymentSettings.qrCode}
                  alt="SNICT membership payment QR"
                />
              </div>
            ) : (
              <div className="payment-qr-empty">
                Payment QR is currently unavailable.
                Please contact the administrator.
              </div>
            )}

            <div className="payment-details">
              {paymentSettings?.accountName && (
                <div>
                  <span>Account Name</span>
                  <strong>
                    {paymentSettings.accountName}
                  </strong>
                </div>
              )}

              {paymentSettings?.upiId && (
                <div>
                  <span>UPI ID</span>
                  <strong>
                    {paymentSettings.upiId}
                  </strong>
                </div>
              )}
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <label htmlFor="utrNumber">
                UTR / Transaction Number
              </label>

              <input
                id="utrNumber"
                type="text"
                value={utrNumber}
                onChange={(event) =>
                  setUtrNumber(
                    event.target.value
                  )
                }
                placeholder="Enter UTR / transaction number"
                maxLength={50}
                autoComplete="off"
              />

              <small>
                Your membership will remain pending
                until an administrator verifies your
                payment.
              </small>

              <button
                type="submit"
                className="membership-primary-button"
                disabled={submittingPayment}
              >
                {submittingPayment ? (
                  <>
                    <Loader2
                      size={18}
                      className="membership-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Payment
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        <button
          type="button"
          className="membership-back-button"
          onClick={() => navigate("/")}
        >
          Return to Home
        </button>
      </section>

      {showSuccessPopup && (
        <div className="membership-success-overlay">
          <div className="membership-success-popup">
            <div className="membership-success-icon">
              <CheckCircle2 size={38} />
            </div>

            <h2>Payment Submitted Successfully</h2>

            <p>
              Thank you for registering with SNICT.
              Please wait until your membership is
              verified by the administrator.
            </p>

            <p>
              You will be notified when your membership
              is approved.
            </p>

            <button
              type="button"
              className="membership-primary-button"
              onClick={goHome}
            >
              Go to Home
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default MembershipPayment;