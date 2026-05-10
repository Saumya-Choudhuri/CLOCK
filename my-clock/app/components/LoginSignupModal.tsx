"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginSignupModal({ isOpen, onClose }: LoginSignupModalProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
          disabled={loading}
          className="btn btn-primary w-full py-3 text-[0.7rem] uppercase tracking-[0.28em]"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-xs text-[color:var(--muted)] text-center mt-6">
          ✓ Free 21-day trial • Secure login • Premium features available
        </p>

        <div className="card-surface mt-6 px-4 py-3">
          <p className="text-xs text-[color:var(--muted)]">
            <strong className="text-[color:var(--foreground)]">Your Profile:</strong> Created automatically after Google sign-in. Your task history and progress will be saved for 21 days.
          </p>
        </div>
      </div>
    </div>
  );
}
