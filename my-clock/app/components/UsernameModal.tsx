"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function UsernameModal({ isOpen, onClose }: UsernameModalProps) {
  const { createUserProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const checkUsername = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      setAvailable(null);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscore, and dash");
      setAvailable(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if username is taken (from localStorage for now)
      const takenUsernames = JSON.parse(
        localStorage.getItem("taken_usernames") || "[]"
      );

      if (takenUsernames.includes(username.toLowerCase())) {
        setError("This username is already taken");
        setAvailable(false);
      } else {
        setError("");
        setAvailable(true);
      }
    } catch {
      setError("Error checking username availability");
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscore, and dash");
      return;
    }

    // If we haven't checked availability yet, check it first
    if (available !== true) {
      await checkUsername();
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Mark username as taken
      const takenUsernames = JSON.parse(
        localStorage.getItem("taken_usernames") || "[]"
      );
      takenUsernames.push(username.toLowerCase());
      localStorage.setItem("taken_usernames", JSON.stringify(takenUsernames));

      // Create user profile with username
      await createUserProfile({ username });
      onClose();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to create profile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="premium-panel w-full max-w-md mx-4 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-display title-glow text-[color:var(--foreground)] mb-2">
            Choose Your Username
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            Pick a unique username to identify your account. You can create multiple usernames under the same email.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.24em] text-[color:var(--muted)] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setAvailable(null);
              }}
              placeholder="my_username"
              className="input-premium w-full"
            />
          </div>

          {available === true && (
            <div className="rounded-xl border border-[rgba(124,196,196,0.35)] bg-[rgba(124,196,196,0.12)] px-4 py-3 text-xs text-[color:var(--foreground)]">
              ✅ Username available!
            </div>
          )}

          {available === false && error && (
            <div className="rounded-xl border border-[rgba(224,122,95,0.35)] bg-[rgba(224,122,95,0.12)] px-4 py-3 text-xs text-[color:var(--foreground)]">
              {error}
            </div>
          )}

          {error && available !== true && available !== false && (
            <div className="rounded-xl border border-[rgba(224,122,95,0.35)] bg-[rgba(224,122,95,0.12)] px-4 py-3 text-xs text-[color:var(--foreground)]">
              {error}
            </div>
          )}

          <div className="text-xs text-[color:var(--muted)]">
            <p>✓ 3-20 characters</p>
            <p>✓ Letters, numbers, underscore (-), dash (_)</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-outline flex-1 py-2 text-[0.7rem] uppercase tracking-[0.26em]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProfile}
            disabled={loading || !username.trim() || username.length < 3}
            className="btn btn-primary flex-1 py-3 text-[0.7rem] uppercase tracking-[0.26em]"
          >
            {loading ? "Creating..." : available === true ? "Create Profile" : "Check & Create"}
          </button>
        </div>

        <p className="text-xs text-[color:var(--muted)] text-center mt-4">
          ✓ Free 7-day trial • Multiple accounts • Same email
        </p>
      </div>
    </div>
  );
}
