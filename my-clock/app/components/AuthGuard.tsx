"use client";

import React, { useEffect, useState } from "react";
import { useIdleTimer } from "@/app/hooks/useIdleTimer";
import { useAuth } from "@/app/context/AuthContext";
import { AuthModalProvider } from "@/app/context/AuthModalContext";
import { LoginSignupModal } from "@/app/components/LoginSignupModal";
import { UsernameModal } from "@/app/components/UsernameModal";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isIdle } = useIdleTimer({ timeoutMs: 15 * 60 * 1000 }); // 15 minutes
  const { user, userData } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Show login modal when user becomes idle AND is not logged in
  useEffect(() => {
    if (isIdle && !user) {
      setShowLoginModal(true);
    }
  }, [isIdle, user]);

  // Show username modal if user is logged in but hasn't set username
  useEffect(() => {
    if (user && !userData?.username) {
      setShowUsernameModal(true);
    }
  }, [user, userData?.username]);

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleCloseUsernameModal = () => {
    setShowUsernameModal(false);
  };

  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
  };

  return (
    <AuthModalProvider openLogin={handleOpenLoginModal}>
      {children}
      <LoginSignupModal isOpen={showLoginModal} onClose={handleCloseLoginModal} />
      <UsernameModal isOpen={showUsernameModal} onClose={handleCloseUsernameModal} />
    </AuthModalProvider>
  );
}
