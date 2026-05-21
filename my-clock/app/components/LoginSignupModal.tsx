"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { startRazorpayCheckout } from "@/app/utils/razorpayCheckout";
import { PaymentModal } from "@/app/components/PaymentModal";

interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginSignupModal({ isOpen, onClose }: LoginSignupModalProps) {
  const { signInWithGoogle, activateMonthlyPremium } = useAuth();
  const [loading, setLoading] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyPremium = async () => {
    setPremiumLoading(true);
    setError("");
    try {
      const signedInUser = await signInWithGoogle();
      const orderData = await startRazorpayCheckout({
        uid: signedInUser.uid,
        email: signedInUser.email || undefined,
      });
      setRazorpayOrder(orderData);
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err.message || "Unable to start Razorpay checkout");
    } finally {
      setPremiumLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, orderId: string) => {
    try {
      const response = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: "",
        }),
      });

      const data = await response.json();
      if (!data?.paid) {
        throw new Error(data?.error || "Payment verification failed.");
      }

      await activateMonthlyPremium();
      setShowPaymentModal(false);
      setRazorpayOrder(null);
      onClose();
    } catch (error: any) {
      setError(error?.message || "Payment verification failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="premium-panel w-full max-w-md mx-4 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-display title-glow text-[color:var(--foreground)] mb-2">
            Sign In to Your Account
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            Access your tasks and history with your Google account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[rgba(224,122,95,0.35)] bg-[rgba(224,122,95,0.12)] px-4 py-3 text-sm text-[color:var(--foreground)]">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || premiumLoading}
          className="btn btn-primary w-full py-3 text-[0.7rem] uppercase tracking-[0.28em]"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-xs text-[color:var(--muted)] text-center mt-6">
          ✓ Free 7-day trial • 7-task limit • Monthly premium available
        </p>

        <div className="card-surface mt-6 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Monthly Premium
              </p>
              <p className="text-lg font-semibold text-[color:var(--foreground)]">
                Unlimited tasks
              </p>
            </div>
            <span className="text-xs text-[color:var(--accent-strong)]">30 days</span>
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            Unlock unlimited tasks and full progress tracking for 30 days.
          </p>
          <button
            onClick={handleMonthlyPremium}
            disabled={loading || premiumLoading}
            className="btn btn-outline w-full py-2 text-[0.7rem] uppercase tracking-[0.26em]"
          >
            {premiumLoading ? "Processing..." : "Pay INR 299"}
          </button>
          <p className="text-[0.65rem] text-[color:var(--muted)]">
            Secure payment via Razorpay after Google sign-in.
          </p>
        </div>

        <div className="card-surface mt-6 px-4 py-3">
          <p className="text-xs text-[color:var(--muted)]">
            <strong className="text-[color:var(--foreground)]">Your Profile:</strong> Created automatically after Google sign-in. Your task history and progress will be saved during your 7-day trial.
          </p>
        </div>
      </div>
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRazorpayOrder(null);
          setError("");
        }}
        onPaymentSuccess={handlePaymentSuccess}
        loading={premiumLoading}
        error={error}
        orderId={razorpayOrder?.orderId}
        keyId={razorpayOrder?.keyId}
        userEmail={razorpayOrder?.userEmail}
        userName={razorpayOrder?.userName}
      />
    </div>
  );
}
