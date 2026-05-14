"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthModal } from "@/app/context/AuthModalContext";
import { PaymentModal } from "@/app/components/PaymentModal";
import { startRazorpayCheckout } from "@/app/utils/razorpayCheckout";

export function UserHeader() {
  const { user, userData, signOutUser, activateMonthlyPremium } = useAuth();
  const { openLogin } = useAuthModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const TRIAL_DAYS = 7;
  const PREMIUM_MONTH_DAYS = 30;

  const handleSignOut = async () => {
    await signOutUser();
    setShowDropdown(false);
  };

  const handlePaymentSuccess = async (paymentId: string, orderId: string) => {
    try {
      const response = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: "", // Will be calculated on client/verified on server
        }),
      });

      const data = await response.json();
      if (!data?.paid) {
        throw new Error(data?.error || "Payment verification failed.");
      }

      await activateMonthlyPremium();
      setShowPaymentModal(false);
      setRazorpayOrder(null);
    } catch (error: any) {
      setUpgradeError(error?.message || "Payment verification failed.");
    }
  };

  const handleOpenPaymentModal = async () => {
    if (!user) {
      setUpgradeError("Please sign in to continue.");
      return;
    }

    setUpgradeError("");
    setShowDropdown(false);
    setUpgradeLoading(true);

    try {
      const orderData = await startRazorpayCheckout({
        uid: user.uid,
        email: user.email || undefined,
        username: userData?.username || undefined,
      });
      setRazorpayOrder(orderData);
      setShowPaymentModal(true);
    } catch (error: any) {
      setUpgradeError(error?.message || "Unable to start checkout.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const userInitial =
    userData?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const displayName = userData?.username || user?.email || "User";
  const premiumUntil = userData?.premiumUntil;
  const isPremiumActive = Boolean(
    userData?.isPremium && premiumUntil && premiumUntil > Date.now()
  );
  const premiumDaysRemaining = premiumUntil
    ? Math.max(0, Math.ceil((premiumUntil - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const daysRemaining = userData
    ? Math.max(
        0,
        TRIAL_DAYS -
          Math.floor((Date.now() - userData.signupDate) / (1000 * 60 * 60 * 24))
      )
    : 0;
  const trialProgress = userData ? Math.min(100, (daysRemaining / TRIAL_DAYS) * 100) : 0;
  const subscriptionLabel = isPremiumActive ? "Monthly Premium" : "Free Trial";
  const subscriptionDays = isPremiumActive ? premiumDaysRemaining : daysRemaining;
  const subscriptionProgress = isPremiumActive
    ? Math.min(100, (premiumDaysRemaining / PREMIUM_MONTH_DAYS) * 100)
    : trialProgress;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center h-10 w-10 rounded-full border border-[color:var(--border)] bg-[rgba(15,23,42,0.7)] text-[color:var(--accent-strong)] font-semibold text-sm shadow-[0_8px_22px_rgba(2,6,23,0.45)] transition-colors hover:border-[color:rgba(240,201,135,0.7)]"
        title={displayName}
      >
        {userInitial}
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 mt-3 w-64 panel-surface bg-[rgba(9,13,23,1)] shadow-[0_22px_60px_rgba(2,6,23,0.6)] z-50 overflow-hidden"
          style={{ background: "rgba(9, 13, 23, 1)" }}
        >
          {user ? (
            <>
              <div className="px-4 py-3 border-b border-[color:var(--border)]">
                {userData?.username && (
                  <div className="mb-2">
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Profile
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--accent-strong)]">
                      @{userData.username}
                    </p>
                  </div>
                )}
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Signed in as
                </p>
                <p className="text-sm text-[color:var(--foreground)] break-words">
                  {user.email}
                </p>
                {userData?.phone && (
                  <p className="text-xs text-[color:var(--muted)] mt-2">
                    Phone: {userData.phone}
                  </p>
                )}
              </div>
              <div className="px-4 py-3">
                {userData && (
                  <>
                    <p className="text-xs text-[color:var(--muted)] mb-3">
                      Signup: {new Date(userData.signupDate).toLocaleDateString()}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                          {subscriptionLabel}
                        </span>
                        <span className="text-xs font-semibold text-[color:var(--accent-strong)]">
                          {subscriptionDays} days
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[rgba(217,180,111,0.15)]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[color:var(--accent-strong)] to-[color:var(--accent-2)]"
                          style={{ width: `${subscriptionProgress}%` }}
                        />
                      </div>
                    </div>
                    {!isPremiumActive && (
                      <div className="mt-4 card-surface px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                            Upgrade to Pro
                          </span>
                          <span className="text-xs text-[color:var(--accent-strong)]">
                            Monthly
                          </span>
                        </div>
                        <p className="text-[0.7rem] text-[color:var(--muted)]">
                          Unlock unlimited tasks for 30 days for INR 299.
                        </p>
                        <button
                          onClick={handleOpenPaymentModal}
                          disabled={upgradeLoading}
                          className="btn btn-outline w-full py-2 text-[0.7rem] uppercase tracking-[0.26em]"
                        >
                          Upgrade to Pro
                        </button>
                        {upgradeError && (
                          <p className="text-[0.7rem] text-[color:var(--muted)]">
                            {upgradeError}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="px-4 py-3 border-t border-[color:var(--border)]">
                <button
                  onClick={handleSignOut}
                  className="btn btn-danger w-full py-2 text-[0.7rem] uppercase tracking-[0.28em]"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)] mb-3">
                  No account yet?
                </p>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    openLogin();
                  }}
                  className="btn btn-primary w-full py-3 text-[0.7rem] uppercase tracking-[0.28em]"
                >
                  Sign In
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRazorpayOrder(null);
          setUpgradeError("");
        }}
        onPaymentSuccess={handlePaymentSuccess}
        loading={upgradeLoading}
        error={upgradeError}
        orderId={razorpayOrder?.orderId}
        keyId={razorpayOrder?.keyId}
        userEmail={razorpayOrder?.userEmail}
        userName={razorpayOrder?.userName}
      />
    </div>
  );
}
