"use client";

import React, { useEffect, useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string, orderId: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  orderId?: string;
  keyId?: string;
  userEmail?: string;
  userName?: string;
}

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  loading = false,
  error,
  orderId,
  keyId,
  userEmail,
  userName,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isOpen]);

  const handlePaymentClick = async () => {
    if (!orderId || !keyId) {
      return;
    }

    setProcessing(true);

    const options = {
      key: keyId,
      order_id: orderId,
      amount: 29900,
      currency: "INR",
      name: "Zoned",
      description: "Monthly Premium - INR 299 for 30 days",
      image: "https://www.example.com/logo.png",
      prefill: {
        email: userEmail || "",
        contact: "",
        name: userName || "User",
      },
      handler: async (response: RazorpayHandlerResponse) => {
        try {
          await onPaymentSuccess(response.razorpay_payment_id, orderId);
        } catch (error) {
          console.error("Payment success handler error:", error);
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="premium-panel w-full max-w-md mx-4 p-8">
        <div className="mb-5">
          <h2 className="text-2xl font-display title-glow text-[color:var(--foreground)] mb-2">
            Upgrade to Pro
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            Complete your payment via Razorpay to unlock Monthly Premium.
          </p>
        </div>

        <div className="card-surface px-4 py-4 mb-4">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Pricing
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-semibold text-[color:var(--foreground)]">
              INR 299
            </span>
            <span className="text-xs text-[color:var(--muted)]">30 days</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Merits
          </p>
          <ul className="text-xs text-[color:var(--muted)] space-y-2">
            <li>✓ Unlimited tasks for 30 days.</li>
            <li>✓ Full access to analytics and progress history.</li>
            <li>✓ Monthly premium status in your profile.</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[rgba(224,122,95,0.35)] bg-[rgba(224,122,95,0.12)] px-4 py-3 text-xs text-[color:var(--foreground)]">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading || processing}
            className="btn btn-outline flex-1 py-2 text-[0.7rem] uppercase tracking-[0.26em]"
          >
            Cancel
          </button>
          <button
            onClick={handlePaymentClick}
            disabled={loading || processing || !orderId}
            className="btn btn-primary flex-1 py-3 text-[0.7rem] uppercase tracking-[0.26em]"
          >
            {loading ? "Loading..." : processing ? "Processing..." : "Pay INR 299"}
          </button>
        </div>

        <p className="text-[0.65rem] text-[color:var(--muted)] text-center mt-4">
          Secure payment powered by Razorpay.
        </p>
      </div>
    </div>
  );
}
