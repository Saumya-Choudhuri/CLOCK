"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthModal } from "@/app/context/AuthModalContext";

export function UserHeader() {
  const { user, userData, signOutUser } = useAuth();
  const { openLogin } = useAuthModal();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    setShowDropdown(false);
  };

  const userInitial =
    userData?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const displayName = userData?.username || user?.email || "User";
  const daysRemaining = userData
    ? Math.max(0, 21 - Math.floor((Date.now() - userData.signupDate) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialProgress = userData ? Math.min(100, (daysRemaining / 21) * 100) : 0;

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
                          Free Trial
                        </span>
                        <span className="text-xs font-semibold text-[color:var(--accent-strong)]">
                          {daysRemaining} days
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[rgba(217,180,111,0.15)]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[color:var(--accent-strong)] to-[color:var(--accent-2)]"
                          style={{ width: `${trialProgress}%` }}
                        />
                      </div>
                    </div>
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
    </div>
  );
}
