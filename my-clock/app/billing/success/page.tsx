"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

type VerificationStatus = "loading" | "success" | "error";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("order_id");
  const { user, loading, activateMonthlyPremium } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("Verifying your payment...");
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;

    if (!paymentId || !orderId) {
      setStatus("error");
      setMessage("Missing payment details. Please contact support.");
      return;
    }

    if (loading) return;

    if (!user) {
      setStatus("error");
      setMessage("Please sign in to apply your premium access.");
      return;
    }

    const verifyPayment = async () => {
      appliedRef.current = true;
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
        setStatus("success");
        setMessage("Payment confirmed. Monthly Premium is now active.");
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.message || "Payment verification failed.");
      }
    };

    verifyPayment();
  }, [paymentId, orderId, loading, user, activateMonthlyPremium]);

  return (
    <main className="min-h-screen premium-bg text-[color:var(--foreground)]">
      <div className="ambient-orbs" aria-hidden="true" />
      <div className="app-shell py-16">
        <div className="max-w-xl mx-auto premium-panel p-8 text-center">
          <h1 className="text-3xl font-display title-glow mb-3">Payment Status</h1>
          <p className="text-sm text-[color:var(--muted)] mb-6">{message}</p>

          {status === "success" ? (
            <Link
              href="/"
              className="btn btn-primary inline-flex px-6 py-3 text-[0.7rem] uppercase tracking-[0.28em]"
            >
              Back to Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="btn btn-outline inline-flex px-6 py-3 text-[0.7rem] uppercase tracking-[0.28em]"
            >
              Return Home
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
