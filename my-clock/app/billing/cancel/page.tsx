"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen premium-bg text-[color:var(--foreground)]">
      <div className="ambient-orbs" aria-hidden="true" />
      <div className="app-shell py-16">
        <div className="max-w-xl mx-auto premium-panel p-8 text-center">
          <h1 className="text-3xl font-display title-glow mb-3">Payment Canceled</h1>
          <p className="text-sm text-[color:var(--muted)] mb-6">
            Your Stripe checkout was canceled. You can try again anytime.
          </p>
          <Link
            href="/"
            className="btn btn-outline inline-flex px-6 py-3 text-[0.7rem] uppercase tracking-[0.28em]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
